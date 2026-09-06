"""PPO-Clip on CartPole-v1 with GAE.

Proximal Policy Optimization (Schulman et al., 2017) with the clipped surrogate
objective and an optional fixed-coefficient KL penalty. Each iteration: collect rollout under pi_old, compute GAE, then K
minibatch epochs of SGD on the joint policy + value loss.
"""

import math

import gymnasium as gym
import matplotlib.pyplot as plt
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


class PolicyNet(nn.Module):
    """Categorical actor pi_theta(a | s) via tanh-MLP returning logits."""

    def __init__(self, state_dim: int, hidden_dim: int, n_actions: int) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, n_actions),
        )

    def forward(self, states: torch.Tensor) -> torch.Tensor:
        """Forward pass: state -> action logits."""
        return self.net(states)


class ValueNet(nn.Module):
    """State-value critic V_phi(s) via tanh-MLP."""

    def __init__(self, state_dim: int, hidden_dim: int) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 1),
        )

    def forward(self, states: torch.Tensor) -> torch.Tensor:
        """Forward pass: state -> scalar V(s)."""
        return self.net(states).squeeze(-1)


def compute_gae(
    rewards: np.ndarray,
    values: np.ndarray,
    next_values: np.ndarray,
    bootstrap_mask: np.ndarray,
    episode_mask: np.ndarray,
    gamma: float,
    lam: float,
) -> tuple[np.ndarray, np.ndarray]:
    """Truncated GAE(gamma, lambda) backward through one rollout; returns (A, V_target)."""
    T = len(rewards)
    advantages = np.zeros(T, dtype=np.float32)
    gae = 0.0
    for t in reversed(range(T)):
        delta = rewards[t] + gamma * next_values[t] * bootstrap_mask[t] - values[t]
        gae = delta + gamma * lam * episode_mask[t] * gae
        advantages[t] = gae
    returns = advantages + values
    return advantages, returns


class PPO:
    """PPO-Clip with a categorical policy and a separate value head."""

    def __init__(
        self,
        state_dim: int,
        n_actions: int,
        hidden_dim: int,
        lr: float,
        clip_eps: float,
        value_coef: float,
        entropy_coef: float,
        max_grad_norm: float,
        n_epochs: int,
        minibatch_size: int,
        kl_coef: float = 0.0,
    ) -> None:
        if not math.isfinite(kl_coef) or kl_coef < 0:
            raise ValueError("kl_coef must be finite and non-negative")
        self.policy = PolicyNet(state_dim, hidden_dim, n_actions)
        self.value = ValueNet(state_dim, hidden_dim)
        params = list(self.policy.parameters()) + list(self.value.parameters())
        self.optimizer = torch.optim.Adam(params, lr=lr)

        self.clip_eps = clip_eps
        self.value_coef = value_coef
        self.entropy_coef = entropy_coef
        self.max_grad_norm = max_grad_norm
        self.n_epochs = n_epochs
        self.minibatch_size = minibatch_size
        self.kl_coef = kl_coef

    @torch.no_grad()
    def take_action(self, state: np.ndarray) -> tuple[int, float, float]:
        """Sample a ~ pi_theta(. | s) and snapshot log_prob and V(s)."""
        s = torch.as_tensor(state, dtype=torch.float32).unsqueeze(0)
        logits = self.policy(s)
        dist = torch.distributions.Categorical(logits=logits)
        action = dist.sample()
        return int(action.item()), float(dist.log_prob(action).item()), float(self.value(s).item())

    @torch.no_grad()
    def value_of(self, state: np.ndarray) -> float:
        """Return V_phi(state) as a Python float."""
        s = torch.as_tensor(state, dtype=torch.float32).unsqueeze(0)
        return float(self.value(s).item())

    def update(self, transition_dict: dict) -> dict[str, float]:
        """Update immediately after collection, before any other policy changes.

        The synchronous training loop lets us snapshot pi_old on rollout states
        here. Keep this snapshot fixed across every minibatch and epoch.
        """
        states = transition_dict["states"]
        actions = transition_dict["actions"]
        old_log_probs = transition_dict["old_log_probs"]
        returns = transition_dict["returns"]
        advantages = transition_dict["advantages"]
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
        with torch.no_grad():
            old_logits = self.policy(states).detach().clone()

        n = states.size(0)
        idx = np.arange(n)
        stats = {"policy_loss": 0.0, "value_loss": 0.0, "entropy": 0.0, "kl": 0.0}
        n_updates = 0

        for _ in range(self.n_epochs):
            np.random.shuffle(idx)
            for start in range(0, n, self.minibatch_size):
                mb = torch.as_tensor(idx[start : start + self.minibatch_size], dtype=torch.long)

                logits = self.policy(states[mb])
                dist = torch.distributions.Categorical(logits=logits)
                new_log_probs = dist.log_prob(actions[mb])
                entropy = dist.entropy().mean()
                old_dist = torch.distributions.Categorical(logits=old_logits[mb])
                kl = torch.distributions.kl_divergence(old_dist, dist).mean()

                ratio = torch.exp(new_log_probs - old_log_probs[mb])
                adv_mb = advantages[mb]
                surr1 = ratio * adv_mb
                surr2 = torch.clamp(ratio, 1.0 - self.clip_eps, 1.0 + self.clip_eps) * adv_mb
                policy_loss = -torch.min(surr1, surr2).mean()

                values_pred = self.value(states[mb])
                value_loss = F.mse_loss(values_pred, returns[mb])

                loss = (policy_loss + self.value_coef * value_loss
                        - self.entropy_coef * entropy + self.kl_coef * kl)
                self.optimizer.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(
                    list(self.policy.parameters()) + list(self.value.parameters()),
                    self.max_grad_norm,
                )
                self.optimizer.step()

                stats["policy_loss"] += float(policy_loss.item())
                stats["value_loss"] += float(value_loss.item())
                stats["entropy"] += float(entropy.item())
                stats["kl"] += float(kl.item())
                n_updates += 1

        for k in stats:
            stats[k] /= max(n_updates, 1)
        return stats


def collect_rollout(
    env: gym.Env, agent: PPO, state: np.ndarray, n_steps: int,
) -> tuple[dict, np.ndarray, list[float]]:
    """Collect n_steps transitions under pi_old, possibly across episodes."""
    state_dim = env.observation_space.shape[0]
    states = np.zeros((n_steps, state_dim), dtype=np.float32)
    actions = np.zeros(n_steps, dtype=np.int64)
    rewards = np.zeros(n_steps, dtype=np.float32)
    log_probs = np.zeros(n_steps, dtype=np.float32)
    values = np.zeros(n_steps, dtype=np.float32)
    next_values = np.zeros(n_steps, dtype=np.float32)
    bootstrap_mask = np.zeros(n_steps, dtype=np.float32)
    episode_mask = np.zeros(n_steps, dtype=np.float32)

    episode_returns: list[float] = []
    ep_return = 0.0

    for t in range(n_steps):
        action, log_prob, value = agent.take_action(state)
        next_state, reward, terminated, truncated, _ = env.step(action)

        states[t] = state
        actions[t] = action
        rewards[t] = float(reward)
        log_probs[t] = log_prob
        values[t] = value
        next_values[t] = agent.value_of(next_state)
        bootstrap_mask[t] = 0.0 if terminated else 1.0
        episode_mask[t] = 0.0 if (terminated or truncated) else 1.0
        ep_return += float(reward)

        if terminated or truncated:
            episode_returns.append(ep_return)
            ep_return = 0.0
            state, _ = env.reset()
        else:
            state = next_state

    rollout = {
        "states": states,
        "actions": actions,
        "rewards": rewards,
        "old_log_probs": log_probs,
        "values": values,
        "next_values": next_values,
        "bootstrap_mask": bootstrap_mask,
        "episode_mask": episode_mask,
    }
    return rollout, state, episode_returns


def train(
    env: gym.Env,
    agent: PPO,
    n_iterations: int,
    rollout_steps: int,
    gamma: float,
    gae_lambda: float,
    seed: int,
) -> list[float]:
    """Run PPO and return the list of completed-episode returns, in order."""
    state, _ = env.reset(seed=seed)
    all_returns: list[float] = []

    for it in range(n_iterations):
        rollout, state, ep_returns = collect_rollout(env, agent, state, rollout_steps)
        advantages, returns = compute_gae(
            rollout["rewards"],
            rollout["values"],
            rollout["next_values"],
            rollout["bootstrap_mask"],
            rollout["episode_mask"],
            gamma,
            gae_lambda,
        )
        transition_dict = {
            "states": torch.as_tensor(rollout["states"], dtype=torch.float32),
            "actions": torch.as_tensor(rollout["actions"], dtype=torch.int64),
            "old_log_probs": torch.as_tensor(rollout["old_log_probs"], dtype=torch.float32),
            "advantages": torch.as_tensor(advantages, dtype=torch.float32),
            "returns": torch.as_tensor(returns, dtype=torch.float32),
        }
        agent.update(transition_dict)

        all_returns.extend(ep_returns)
        mean_ret = float(np.mean(ep_returns)) if ep_returns else float("nan")
        print(
            f"iter {it + 1:3d}/{n_iterations}  episodes={len(ep_returns):3d}  "
            f"mean_return={mean_ret:6.1f}"
        )

    return all_returns


def moving_average(values: list[float], window: int = 10) -> np.ndarray:
    """Simple moving average for smoothing learning curves."""
    arr = np.asarray(values, dtype=np.float32)
    if len(arr) < window:
        return arr
    kernel = np.ones(window, dtype=np.float32) / window
    return np.convolve(arr, kernel, mode="valid")


def plot_returns(
    returns: list[float], title: str = "PPO-Clip on CartPole-v1", window: int = 10,
) -> None:
    """Plot episode returns with a moving-average overlay."""
    plt.figure(figsize=(7, 4))
    plt.plot(returns, alpha=0.4, label="episode return")
    if len(returns) >= window:
        smoothed = moving_average(returns, window)
        plt.plot(np.arange(window - 1, len(returns)), smoothed, label=f"{window}-episode average")
    plt.xlabel("Episode")
    plt.ylabel("Return")
    plt.title(title)
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    seed = 0
    np.random.seed(seed)
    torch.manual_seed(seed)

    # Hyperparameters
    env_id = "CartPole-v1"
    hidden_dim = 64
    n_iterations = 50
    rollout_steps = 2048
    n_epochs = 10
    minibatch_size = 64
    gamma = 0.99
    gae_lambda = 0.95
    clip_eps = 0.2
    value_coef = 0.5
    entropy_coef = 0.0
    kl_coef = 0.1  # Illustrative fixed beta, not a tuned or adaptive coefficient.
    max_grad_norm = 0.5
    lr = 3e-4

    env = gym.make(env_id)
    env.action_space.seed(seed)
    state_dim = int(env.observation_space.shape[0])
    n_actions = int(env.action_space.n)

    agent = PPO(
        state_dim, n_actions,
        hidden_dim=hidden_dim,
        lr=lr,
        clip_eps=clip_eps,
        value_coef=value_coef,
        entropy_coef=entropy_coef,
        max_grad_norm=max_grad_norm,
        n_epochs=n_epochs,
        minibatch_size=minibatch_size,
        kl_coef=kl_coef,
    )

    print(f"Training PPO on {env_id} for {n_iterations} iterations "
          f"x {rollout_steps} steps = {n_iterations * rollout_steps} env steps...")
    returns = train(
        env, agent,
        n_iterations=n_iterations,
        rollout_steps=rollout_steps,
        gamma=gamma,
        gae_lambda=gae_lambda,
        seed=seed,
    )
    env.close()

    if returns:
        final_avg = float(np.mean(returns[-10:]))
        print(f"Last 10-episode average return: {final_avg:.1f}")

    plot_returns(returns)
