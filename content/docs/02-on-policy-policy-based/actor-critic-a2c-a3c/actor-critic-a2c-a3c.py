"""Synchronous rollout A2C on CartPole-v1.

Uses short on-policy rollouts to form bootstrapped n-step returns and advantages.
No replay buffer, no target network, no PPO clipping. A3C is discussed in the
chapter; the runnable example uses its synchronous descendant A2C.
"""

import gymnasium as gym
import matplotlib.pyplot as plt
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


class PolicyNet(nn.Module):
    """Categorical actor pi_theta(a | s)."""

    def __init__(self, state_dim: int, hidden_dim: int, n_actions: int) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, n_actions),
        )

    def forward(self, states: torch.Tensor) -> torch.Tensor:
        """Forward pass: state -> action logits."""
        return self.net(states)


class ValueNet(nn.Module):
    """State-value critic V_w(s)."""

    def __init__(self, state_dim: int, hidden_dim: int) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 1),
        )

    def forward(self, states: torch.Tensor) -> torch.Tensor:
        """Forward pass: state -> scalar V(s)."""
        return self.net(states).squeeze(-1)


class A2C:
    """Synchronous Advantage Actor-Critic with shared rollout updates."""

    def __init__(
        self,
        state_dim: int,
        n_actions: int,
        hidden_dim: int,
        actor_lr: float,
        critic_lr: float,
        gamma: float,
        value_coef: float,
        entropy_coef: float,
    ) -> None:
        self.actor = PolicyNet(state_dim, hidden_dim, n_actions)
        self.critic = ValueNet(state_dim, hidden_dim)
        self.actor_optimizer = torch.optim.Adam(self.actor.parameters(), lr=actor_lr)
        self.critic_optimizer = torch.optim.Adam(self.critic.parameters(), lr=critic_lr)
        self.gamma = gamma
        self.value_coef = value_coef
        self.entropy_coef = entropy_coef

    def take_action(self, state: np.ndarray) -> int:
        """Sample an action from pi_theta(. | state)."""
        s = torch.as_tensor(state, dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            dist = torch.distributions.Categorical(logits=self.actor(s))
            action = dist.sample()
        return int(action.item())

    def update(self, transition_dict: dict) -> float:
        """One A2C gradient step on a batch of rollout transitions."""
        rollout_steps = int(transition_dict["rollout_steps"])
        n_envs = int(transition_dict["n_envs"])

        states = torch.as_tensor(np.array(transition_dict["states"]), dtype=torch.float32)
        actions = torch.as_tensor(transition_dict["actions"], dtype=torch.int64)
        rewards = torch.as_tensor(transition_dict["rewards"], dtype=torch.float32).view(
            rollout_steps, n_envs,
        )
        next_states = torch.as_tensor(np.array(transition_dict["next_states"]), dtype=torch.float32).view(
            rollout_steps, n_envs, -1,
        )
        dones = torch.as_tensor(transition_dict["dones"], dtype=torch.float32).view(
            rollout_steps, n_envs,
        )

        logits = self.actor(states)
        dist = torch.distributions.Categorical(logits=logits)
        log_probs = dist.log_prob(actions).view(rollout_steps, n_envs)
        entropy = dist.entropy().mean()

        values = self.critic(states).view(rollout_steps, n_envs)
        with torch.no_grad():
            bootstrap = self.critic(next_states[-1]) * (1.0 - dones[-1])
            returns: list[torch.Tensor] = []
            for t in reversed(range(rollout_steps)):
                bootstrap = rewards[t] + self.gamma * bootstrap * (1.0 - dones[t])
                returns.append(bootstrap)
            targets = torch.stack(list(reversed(returns)))
            advantages = targets - values

        actor_loss = -(log_probs * advantages.detach()).mean()
        critic_loss = F.mse_loss(values, targets)
        loss = actor_loss + self.value_coef * critic_loss - self.entropy_coef * entropy

        self.actor_optimizer.zero_grad()
        self.critic_optimizer.zero_grad()
        loss.backward()
        self.actor_optimizer.step()
        self.critic_optimizer.step()

        return float(loss.item())


def collect_rollout(
    envs: list[gym.Env],
    agent: A2C,
    states: list[np.ndarray],
    running_returns: list[float],
    rollout_steps: int,
) -> tuple[dict, list[np.ndarray], list[float], list[float]]:
    """Collect rollout_steps transitions across all parallel envs."""
    transition_dict = {
        "states": [],
        "actions": [],
        "rewards": [],
        "next_states": [],
        "dones": [],
        "rollout_steps": rollout_steps,
        "n_envs": len(envs),
    }
    completed_returns: list[float] = []

    for _ in range(rollout_steps):
        for i, env in enumerate(envs):
            state = states[i]
            action = agent.take_action(state)
            next_state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated

            transition_dict["states"].append(state)
            transition_dict["actions"].append(action)
            transition_dict["rewards"].append(float(reward))
            transition_dict["next_states"].append(next_state)
            transition_dict["dones"].append(float(done))

            running_returns[i] += float(reward)
            if done:
                completed_returns.append(running_returns[i])
                running_returns[i] = 0.0
                states[i], _ = env.reset()
            else:
                states[i] = next_state

    return transition_dict, states, running_returns, completed_returns


def train(
    envs: list[gym.Env],
    agent: A2C,
    n_iterations: int,
    rollout_steps: int,
    seed: int,
) -> list[float]:
    """Train synchronous A2C and return completed-episode returns."""
    states: list[np.ndarray] = []
    for i, env in enumerate(envs):
        state, _ = env.reset(seed=seed + i)
        states.append(state)

    running_returns = [0.0 for _ in envs]
    returns: list[float] = []

    for _ in range(n_iterations):
        transition_dict, states, running_returns, completed = collect_rollout(
            envs, agent, states, running_returns, rollout_steps
        )
        agent.update(transition_dict)
        returns.extend(completed)

    return returns


def moving_average(values: list[float], window: int = 10) -> np.ndarray:
    """Simple moving average for smoothing learning curves."""
    arr = np.asarray(values, dtype=np.float32)
    if len(arr) < window:
        return arr
    kernel = np.ones(window, dtype=np.float32) / window
    return np.convolve(arr, kernel, mode="valid")


def plot_returns(
    returns: list[float], title: str = "Synchronous A2C on CartPole-v1", window: int = 10,
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
    n_envs = 4
    hidden_dim = 64
    n_iterations = 200
    rollout_steps = 128
    gamma = 0.99
    actor_lr = 1e-3
    critic_lr = 1e-3
    value_coef = 0.5
    entropy_coef = 0.01

    envs: list[gym.Env] = []
    for i in range(n_envs):
        env = gym.make(env_id)
        env.action_space.seed(seed + i)
        envs.append(env)

    state_dim = int(envs[0].observation_space.shape[0])
    n_actions = int(envs[0].action_space.n)

    agent = A2C(
        state_dim, n_actions,
        hidden_dim=hidden_dim,
        actor_lr=actor_lr,
        critic_lr=critic_lr,
        gamma=gamma,
        value_coef=value_coef,
        entropy_coef=entropy_coef,
    )

    print(f"Training synchronous A2C on {env_id} for {n_iterations} iterations "
          f"x {rollout_steps} steps x {n_envs} envs...")
    returns = train(envs, agent, n_iterations=n_iterations, rollout_steps=rollout_steps, seed=seed)
    for env in envs:
        env.close()

    if returns:
        final_avg = float(np.mean(returns[-10:]))
        print(f"Last 10-episode average return: {final_avg:.1f}")
    else:
        print("No complete episodes finished during the short A2C demo.")

    plot_returns(returns)
