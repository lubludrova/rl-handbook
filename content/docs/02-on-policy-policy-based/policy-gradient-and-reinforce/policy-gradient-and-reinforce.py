"""REINFORCE with advantage on CartPole-v1.

Monte Carlo policy gradient (Williams, 1992) with a learned value-function baseline
V_phi(s). The advantage A_t = G_t - V_phi(s_t) replaces the raw return for variance reduction.
"""

import gymnasium as gym
import matplotlib.pyplot as plt
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


class PolicyNet(nn.Module):
    """Categorical actor pi_theta(a | s) via two-hidden-layer MLP + softmax."""

    def __init__(self, state_dim: int, hidden_dim: int, n_actions: int) -> None:
        super().__init__()
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.out = nn.Linear(hidden_dim, n_actions)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass: state -> action probabilities."""
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return F.softmax(self.out(x), dim=-1)


class ValueNet(nn.Module):
    """State-value baseline V_phi(s) via two-hidden-layer MLP."""

    def __init__(self, state_dim: int, hidden_dim: int) -> None:
        super().__init__()
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.out = nn.Linear(hidden_dim, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass: state -> scalar V(s)."""
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return self.out(x).squeeze(-1)


def compute_returns(rewards: list[float], gamma: float) -> list[float]:
    """Compute discounted returns G_t = R_{t+1} + gamma R_{t+2} + ... backward."""
    G = 0.0
    returns: list[float] = []
    for r in reversed(rewards):
        G = r + gamma * G
        returns.append(G)
    return list(reversed(returns))


class REINFORCE:
    """REINFORCE with a learned value-function baseline (advantage)."""

    def __init__(self, state_dim: int, n_actions: int, hidden_dim: int, lr: float, gamma: float) -> None:
        self.gamma = gamma
        self.policy = PolicyNet(state_dim, hidden_dim, n_actions)
        self.value = ValueNet(state_dim, hidden_dim)
        self.policy_optimizer = torch.optim.Adam(self.policy.parameters(), lr=lr)
        self.value_optimizer = torch.optim.Adam(self.value.parameters(), lr=lr)

    def take_action(self, state: np.ndarray) -> int:
        """Sample an action from pi_theta(. | state)."""
        s = torch.as_tensor(state, dtype=torch.float32).unsqueeze(0)
        probs = self.policy(s)
        dist = torch.distributions.Categorical(probs)
        return int(dist.sample().item())

    def update(self, transition_dict: dict) -> float:
        """One REINFORCE-with-advantage gradient step on a complete episode."""
        states = torch.as_tensor(np.array(transition_dict["states"]), dtype=torch.float32)
        actions = torch.as_tensor(transition_dict["actions"], dtype=torch.int64)
        returns = torch.as_tensor(
            compute_returns(transition_dict["rewards"], self.gamma), dtype=torch.float32,
        )

        values = self.value(states)
        value_loss = F.mse_loss(values, returns)
        self.value_optimizer.zero_grad()
        value_loss.backward()
        self.value_optimizer.step()

        with torch.no_grad():
            advantages = returns - self.value(states)

        probs = self.policy(states)
        log_probs = torch.log(probs.gather(1, actions.unsqueeze(1)).squeeze(1) + 1e-8)
        policy_loss = -(log_probs * advantages).mean()

        self.policy_optimizer.zero_grad()
        policy_loss.backward()
        self.policy_optimizer.step()

        return float(policy_loss.item())


def run_episode(env: gym.Env, agent: REINFORCE, seed: "int | None" = None) -> tuple[dict, float]:
    """Run one episode and return (transition_dict, episode_return)."""
    state, _ = env.reset(seed=seed)
    transition_dict = {"states": [], "actions": [], "rewards": []}
    episode_return = 0.0
    done = False

    while not done:
        action = agent.take_action(state)
        next_state, reward, terminated, truncated, _ = env.step(action)
        done = terminated or truncated
        transition_dict["states"].append(state)
        transition_dict["actions"].append(action)
        transition_dict["rewards"].append(float(reward))
        episode_return += float(reward)
        state = next_state

    return transition_dict, episode_return


def train(env: gym.Env, agent: REINFORCE, num_episodes: int, seed: int) -> list[float]:
    """Train REINFORCE and return per-episode returns."""
    returns: list[float] = []
    for episode in range(num_episodes):
        ep_seed = seed if episode == 0 else None
        transition_dict, episode_return = run_episode(env, agent, seed=ep_seed)
        agent.update(transition_dict)
        returns.append(episode_return)
    return returns


def moving_average(values: list[float], window: int = 10) -> np.ndarray:
    """Simple moving average for smoothing learning curves."""
    arr = np.asarray(values, dtype=np.float32)
    if len(arr) < window:
        return arr
    kernel = np.ones(window, dtype=np.float32) / window
    return np.convolve(arr, kernel, mode="valid")


def plot_returns(
    returns: list[float],
    title: str = "REINFORCE with advantage on CartPole-v1",
    window: int = 10,
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
    seed = 7
    np.random.seed(seed)
    torch.manual_seed(seed)

    # Hyperparameters
    env_id = "CartPole-v1"
    hidden_dim = 128
    num_episodes = 500
    gamma = 0.99
    lr = 1e-3

    env = gym.make(env_id)
    env.action_space.seed(seed)
    state_dim = int(env.observation_space.shape[0])
    n_actions = int(env.action_space.n)

    agent = REINFORCE(state_dim, n_actions, hidden_dim=hidden_dim, lr=lr, gamma=gamma)

    print(f"Training REINFORCE on {env_id} for {num_episodes} episodes...")
    returns = train(env, agent, num_episodes=num_episodes, seed=seed)
    env.close()

    final_avg = float(np.mean(returns[-10:]))
    print(f"Last 10-episode average return: {final_avg:.1f}")

    plot_returns(returns)
