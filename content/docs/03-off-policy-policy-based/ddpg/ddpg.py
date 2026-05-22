"""DDPG on Pendulum-v1.

Deep Deterministic Policy Gradient with a replay buffer, deterministic actor,
Q-critic, Gaussian action noise, and Polyak target updates.
"""

from collections import deque

import gymnasium as gym
import matplotlib.pyplot as plt
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


class PolicyNet(nn.Module):
    """Deterministic actor mu_theta(s) with tanh-bounded continuous actions."""

    def __init__(self, state_dim: int, hidden_dim: int, action_dim: int, action_limit: float) -> None:
        super().__init__()
        self.action_limit = action_limit
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim),
            nn.Tanh(),
        )

    def forward(self, states: torch.Tensor) -> torch.Tensor:
        """Forward pass: state -> action in [-action_limit, action_limit]."""
        return self.action_limit * self.net(states)


class QValueNet(nn.Module):
    """Action-value critic Q_w(s, a) for continuous actions."""

    def __init__(self, state_dim: int, hidden_dim: int, action_dim: int) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim + action_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1),
        )

    def forward(self, states: torch.Tensor, actions: torch.Tensor) -> torch.Tensor:
        """Forward pass: (state, action) -> scalar Q-value."""
        return self.net(torch.cat([states, actions], dim=1))


class ReplayBuffer:
    """FIFO replay buffer with uniform minibatch sampling."""

    def __init__(self, capacity: int) -> None:
        self.buffer: deque = deque(maxlen=capacity)

    def add(
        self,
        state: np.ndarray,
        action: np.ndarray,
        reward: float,
        next_state: np.ndarray,
        done: bool,
    ) -> None:
        """Append one transition to the buffer."""
        self.buffer.append((state, action, reward, next_state, float(done)))

    def sample(self, batch_size: int, rng: np.random.Generator) -> dict:
        """Sample a uniform random batch as a transition dict of NumPy arrays."""
        indexes = rng.choice(len(self.buffer), size=batch_size, replace=False)
        states, actions, rewards, next_states, dones = zip(
            *(self.buffer[int(i)] for i in indexes)
        )
        return {
            "states": np.array(states, dtype=np.float32),
            "actions": np.array(actions, dtype=np.float32),
            "rewards": np.array(rewards, dtype=np.float32).reshape(-1, 1),
            "next_states": np.array(next_states, dtype=np.float32),
            "dones": np.array(dones, dtype=np.float32).reshape(-1, 1),
        }

    def __len__(self) -> int:
        return len(self.buffer)


class DDPG:
    """DDPG agent with deterministic actor, Q-critic, and Polyak target nets."""

    def __init__(
        self,
        state_dim: int,
        hidden_dim: int,
        action_dim: int,
        action_limit: float,
        sigma: float,
        actor_lr: float,
        critic_lr: float,
        tau: float,
        gamma: float,
        rng: np.random.Generator,
    ) -> None:
        self.actor = PolicyNet(state_dim, hidden_dim, action_dim, action_limit)
        self.critic = QValueNet(state_dim, hidden_dim, action_dim)
        self.target_actor = PolicyNet(state_dim, hidden_dim, action_dim, action_limit)
        self.target_critic = QValueNet(state_dim, hidden_dim, action_dim)
        self.target_actor.load_state_dict(self.actor.state_dict())
        self.target_critic.load_state_dict(self.critic.state_dict())

        self.actor_optimizer = torch.optim.Adam(self.actor.parameters(), lr=actor_lr)
        self.critic_optimizer = torch.optim.Adam(self.critic.parameters(), lr=critic_lr)

        self.action_limit = action_limit
        self.sigma = sigma
        self.tau = tau
        self.gamma = gamma
        self.rng = rng

    def take_action(self, state: np.ndarray) -> np.ndarray:
        """Return mu(state) + Gaussian exploration noise, clipped to action limits."""
        s = torch.as_tensor(state, dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            action = self.actor(s).squeeze(0).numpy()
        noise = self.rng.normal(0.0, self.sigma, size=action.shape)
        return np.clip(action + noise, -self.action_limit, self.action_limit).astype(np.float32)

    def update(self, transition_dict: dict) -> tuple[float, float]:
        """One DDPG gradient step: critic MSE then deterministic policy gradient."""
        states = torch.as_tensor(transition_dict["states"], dtype=torch.float32)
        actions = torch.as_tensor(transition_dict["actions"], dtype=torch.float32)
        rewards = torch.as_tensor(transition_dict["rewards"], dtype=torch.float32)
        next_states = torch.as_tensor(transition_dict["next_states"], dtype=torch.float32)
        dones = torch.as_tensor(transition_dict["dones"], dtype=torch.float32)

        with torch.no_grad():
            next_actions = self.target_actor(next_states)
            next_Q = self.target_critic(next_states, next_actions)
            y = rewards + self.gamma * (1.0 - dones) * next_Q

        Q = self.critic(states, actions)
        critic_loss = F.mse_loss(Q, y)
        self.critic_optimizer.zero_grad()
        critic_loss.backward()
        self.critic_optimizer.step()

        actor_loss = -self.critic(states, self.actor(states)).mean()
        self.actor_optimizer.zero_grad()
        actor_loss.backward()
        self.actor_optimizer.step()

        self.soft_update(self.actor, self.target_actor)
        self.soft_update(self.critic, self.target_critic)
        return float(actor_loss.item()), float(critic_loss.item())

    def soft_update(self, net: nn.Module, target_net: nn.Module) -> None:
        """Polyak averaging: target <- tau * net + (1 - tau) * target."""
        with torch.no_grad():
            for target_param, param in zip(target_net.parameters(), net.parameters()):
                target_param.mul_(1.0 - self.tau).add_(param, alpha=self.tau)


def run_episode(
    env: gym.Env,
    agent: DDPG,
    replay_buffer: ReplayBuffer,
    rng: np.random.Generator,
    batch_size: int,
    min_buffer_size: int,
    seed: "int | None" = None,
) -> float:
    """Run one episode, store transitions, and update once per environment step."""
    state, _ = env.reset(seed=seed)
    episode_return = 0.0
    done = False

    while not done:
        action = agent.take_action(state)
        next_state, reward, terminated, truncated, _ = env.step(action)
        done = terminated or truncated
        replay_buffer.add(state, action, float(reward), next_state, done)
        state = next_state
        episode_return += float(reward)

        if len(replay_buffer) >= min_buffer_size:
            transition_dict = replay_buffer.sample(batch_size, rng)
            agent.update(transition_dict)

    return episode_return


def train(
    env: gym.Env,
    agent: DDPG,
    replay_buffer: ReplayBuffer,
    num_episodes: int,
    batch_size: int,
    min_buffer_size: int,
    seed: int,
) -> list[float]:
    """Train DDPG and return per-episode returns."""
    returns: list[float] = []
    for episode in range(num_episodes):
        episode_seed = seed if episode == 0 else None
        episode_return = run_episode(
            env, agent, replay_buffer, agent.rng, batch_size, min_buffer_size, seed=episode_seed,
        )
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
    returns: list[float], title: str = "DDPG on Pendulum-v1", window: int = 10,
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
    rng = np.random.default_rng(seed)

    # Hyperparameters
    env_id = "Pendulum-v1"
    hidden_dim = 64
    num_episodes = 200
    gamma = 0.98
    tau = 0.005
    sigma = 0.01
    actor_lr = 3e-4
    critic_lr = 3e-3
    batch_size = 64
    buffer_capacity = 10_000
    min_buffer_size = 1_000

    env = gym.make(env_id)
    env.action_space.seed(seed)
    state_dim = int(env.observation_space.shape[0])
    action_dim = int(env.action_space.shape[0])
    action_limit = float(env.action_space.high[0])

    agent = DDPG(
        state_dim=state_dim,
        hidden_dim=hidden_dim,
        action_dim=action_dim,
        action_limit=action_limit,
        sigma=sigma,
        actor_lr=actor_lr,
        critic_lr=critic_lr,
        tau=tau,
        gamma=gamma,
        rng=rng,
    )
    replay_buffer = ReplayBuffer(capacity=buffer_capacity)

    print(f"Training DDPG on {env_id} for {num_episodes} episodes...")
    returns = train(
        env, agent, replay_buffer,
        num_episodes=num_episodes,
        batch_size=batch_size,
        min_buffer_size=min_buffer_size,
        seed=seed,
    )
    env.close()

    final_avg = float(np.mean(returns[-10:]))
    print(f"Last 10-episode average return: {final_avg:.1f}")

    plot_returns(returns)
