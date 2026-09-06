"""CPU regression tests: python -m unittest discover -s <this directory>."""

import importlib.util
import math
from pathlib import Path
import unittest
from unittest.mock import patch

import numpy as np
import torch


spec = importlib.util.spec_from_file_location("handbook_ppo", Path(__file__).with_name("ppo.py"))
ppo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ppo)


class KLPenaltyTests(unittest.TestCase):
    def agent(self, coefficient=0.0):
        torch.manual_seed(7)
        return ppo.PPO(4, 2, 8, 0.02, 0.2, 0.5, 0.0, 100.0, 3, 4,
                       kl_coef=coefficient)

    def batch(self, agent):
        states = torch.randn(8, 4)
        actions = torch.arange(8) % 2
        with torch.no_grad():
            logs = torch.distributions.Categorical(logits=agent.policy(states)).log_prob(actions)
        return dict(states=states, actions=actions, old_log_probs=logs,
                    returns=torch.arange(8).float(), advantages=torch.arange(8).float())

    def test_exact_forward_kl_and_frozen_reference(self):
        agent = self.agent(0.1)
        batch = self.batch(agent)
        with torch.no_grad():
            reference = agent.policy(batch['states']).log_softmax(-1)
        calls = []
        original = torch.distributions.kl_divergence

        def checked(old, new):
            self.assertFalse(old.logits.requires_grad)
            self.assertTrue(new.logits.requires_grad)
            # No shuffling below: the same two minibatches repeat each epoch.
            offset = (len(calls) % 2) * 4
            torch.testing.assert_close(old.logits, reference[offset:offset + 4])
            actual = original(old, new)
            expected = (old.probs * (old.logits - new.logits)).sum(-1)
            torch.testing.assert_close(actual, expected)
            calls.append(actual.detach())
            return actual

        with patch.object(np.random, 'shuffle'), patch.object(
            torch.distributions, 'kl_divergence', side_effect=checked
        ):
            stats = agent.update(batch)
        self.assertEqual(len(calls), 6)
        torch.testing.assert_close(calls[0], torch.zeros(4))
        self.assertGreater(stats['kl'], 0)
        self.assertTrue(all(math.isfinite(v) for v in stats.values()))

    def test_penalty_changes_update_and_zero_disables_it(self):
        def run(coefficient, suppress=False):
            agent = self.agent(coefficient)
            batch = self.batch(agent)
            original = torch.distributions.kl_divergence
            with patch.object(np.random, 'shuffle'), patch.object(
                torch.distributions, 'kl_divergence',
                side_effect=lambda p, q: original(p, q) * (0 if suppress else 1)
            ):
                agent.update(batch)
            return torch.cat([p.detach().flatten() for p in agent.policy.parameters()])

        baseline = run(0.0)
        torch.testing.assert_close(baseline, run(0.0, suppress=True))
        self.assertFalse(torch.allclose(baseline, run(10.0)))

    def test_invalid_coefficients(self):
        for value in [-1.0, float('nan'), float('inf')]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.agent(value)

    def test_cartpole_smoke(self):
        agent = self.agent(0.1)
        env = ppo.gym.make('CartPole-v1')
        try:
            ppo.train(env, agent, n_iterations=2, rollout_steps=16,
                      gamma=0.99, gae_lambda=0.95, seed=7)
            self.assertTrue(all(torch.isfinite(p).all() for p in agent.policy.parameters()))
        finally:
            env.close()


if __name__ == '__main__':
    unittest.main()
