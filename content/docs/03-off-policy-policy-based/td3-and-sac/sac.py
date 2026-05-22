"""Soft Actor-Critic (SAC) on Pendulum-v1.

Modern SAC: twin soft Q-functions with target nets, a squashed Gaussian actor,
and automatic temperature tuning. Polyak target updates and uniform replay.
"""

from collections import deque

import gymnasium as gym
import matplotlib.pyplot as plt
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


LOG_STD_MIN = -20.0
LOG_STD_MAX = 2.0


class SquashedGaussianPolicy(nn.Module):
    """Stochastic actor pi_theta(a | s) with tanh-bounded actions."""

    def __init__(self, state_dim: int, hidden_dim: int, action_dim: int, action_limit: float) -> None:
        super().__init__()
        self.action_limit = action_limit
        self.backbone = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
        )
        self.mu = nn.Linear(hidden_dim, action_dim)
        self.log_std = nn.Linear(hidden_dim, action_dim)

    def forward(self, states: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        """Forward pass: state -> (mean, log-std) of pre-squash Gaussian."""
        x = self.backbone(states)
        return self.mu(x), self.log_std(x).clamp(LOG_STD_MIN, LOG_STD_MAX)

    def sample(self, states: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        """Sample a differentiable action and its tanh-corrected log-probability."""
        mu, log_std = self(states)
        std = log_std.exp()
        normal = torch.distributions.Normal(mu, std)
        raw_action = normal.rsample()
        squashed_action = torch.tanh(raw_action)
        action = self.action_limit * squashed_action

        log_prob = normal.log_prob(raw_action)
        log_prob -= torch.log(1.0 - squashed_action.pow(2) + 1e-6)
        log_prob = log_prob.sum(dim=-1, keepdim=True)
        return action, log_prob

    def deterministic(self, states: torch.Tensor) -> torch.Tensor:
        """Return action_limit * tanh(mu) for evaluation without exploration noise."""
        mu, _ = self(states)
        return self.action_limit * torch.tanh(mu)


class QValueNet(nn.Module):
    """Soft action-value critic Q_w(s, a) for continuous actions."""

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


class SAC:
    """Soft Actor-Critic with twin critics and learned temperature alpha."""

    def __init__(
        self,
        state_dim: int,
        hidden_dim: int,
        action_dim: int,
        action_limit: float,
        actor_lr: float,
        critic_lr: float,
        alpha_lr: float,
        initial_alpha: float,
        target_entropy: float,
        tau: float,
        gamma: float,
    ) -> None:
        self.actor = SquashedGaussianPolicy(state_dim, hidden_dim, action_dim, action_limit)
        self.critic_1 = QValueNet(state_dim, hidden_dim, action_dim)
        self.critic_2 = QValueNet(state_dim, hidden_dim, action_dim)
        self.target_critic_1 = QValueNet(state_dim, hidden_dim, action_dim)
        self.target_critic_2 = QValueNet(state_dim, hidden_dim, action_dim)
        self.target_critic_1.load_state_dict(self.critic_1.state_dict())
        self.target_critic_2.load_state_dict(self.critic_2.state_dict())

        self.actor_optimizer = torch.optim.Adam(self.actor.parameters(), lr=actor_lr)
        self.critic_1_optimizer = torch.optim.Adam(self.critic_1.parameters(), lr=critic_lr)
        self.critic_2_optimizer = torch.optim.Adam(self.critic_2.parameters(), lr=critic_lr)

        self.log_alpha = torch.tensor(np.log(initial_alpha), dtype=torch.float32)
        self.log_alpha.requires_grad = True
        self.alpha_optimizer = torch.optim.Adam([self.log_alpha], lr=alpha_lr)

        self.target_entropy = target_entropy
        self.tau = tau
        self.gamma = gamma

    @property
    def alpha(self) -> torch.Tensor:
        """Current entropy temperature alpha = exp(log_alpha)."""
        return self.log_alpha.exp()

    def take_action(self, state: np.ndarray) -> np.ndarray:
        """Sample a stochastic action from the squashed Gaussian policy."""
        s = torch.as_tensor(state, dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            action, _ = self.actor.sample(s)
        return action.squeeze(0).numpy().astype(np.float32)

    def evaluate_action(self, state: np.ndarray) -> np.ndarray:
        """Return the deterministic action (tanh of mean) for evaluation."""
        s = torch.as_tensor(state, dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            action = self.actor.deterministic(s)
        return action.squeeze(0).numpy().astype(np.float32)

    def update(self, transition_dict: dict) -> dict[str, float]:
        """One SAC gradient step: twin critics, actor, then temperature; Polyak update."""
        states = torch.as_tensor(transition_dict["states"], dtype=torch.float32)
        actions = torch.as_tensor(transition_dict["actions"], dtype=torch.float32)
        rewards = torch.as_tensor(transition_dict["rewards"], dtype=torch.float32)
        next_states = torch.as_tensor(transition_dict["next_states"], dtype=torch.float32)
        dones = torch.as_tensor(transition_dict["dones"], dtype=torch.float32)

        with torch.no_grad():
            next_actions, next_log_probs = self.actor.sample(next_states)
            target_q1 = self.target_critic_1(next_states, next_actions)
            target_q2 = self.target_critic_2(next_states, next_actions)
            target_q = torch.minimum(target_q1, target_q2) - self.alpha * next_log_probs
            y = rewards + self.gamma * (1.0 - dones) * target_q

        q1 = self.critic_1(states, actions)
        q2 = self.critic_2(states, actions)
        critic_1_loss = F.mse_loss(q1, y)
        critic_2_loss = F.mse_loss(q2, y)

        self.critic_1_optimizer.zero_grad()
        critic_1_loss.backward()
        self.critic_1_optimizer.step()
        self.critic_2_optimizer.zero_grad()
        critic_2_loss.backward()
        self.critic_2_optimizer.step()

        self.set_critics_requires_grad(False)
        new_actions, log_probs = self.actor.sample(states)
        q1_new = self.critic_1(states, new_actions)
        q2_new = self.critic_2(states, new_actions)
        actor_loss = (self.alpha.detach() * log_probs - torch.minimum(q1_new, q2_new)).mean()
        self.actor_optimizer.zero_grad()
        actor_loss.backward()
        self.actor_optimizer.step()
        self.set_critics_requires_grad(True)

        alpha_loss = -(self.log_alpha * (log_probs + self.target_entropy).detach()).mean()
        self.alpha_optimizer.zero_grad()
        alpha_loss.backward()
        self.alpha_optimizer.step()

        self.soft_update(self.critic_1, self.target_critic_1)
        self.soft_update(self.critic_2, self.target_critic_2)
        return {
            "actor_loss": float(actor_loss.item()),
            "critic_loss": float((critic_1_loss + critic_2_loss).item()),
            "alpha": float(self.alpha.item()),
        }

    def set_critics_requires_grad(self, requires_grad: bool) -> None:
        """Toggle gradient tracking on both critics during the actor step."""
        for net in (self.critic_1, self.critic_2):
            for param in net.parameters():
                param.requires_grad = requires_grad

    def soft_update(self, net: nn.Module, target_net: nn.Module) -> None:
        """Polyak averaging: target <- tau * net + (1 - tau) * target."""
        with torch.no_grad():
            for target_param, param in zip(target_net.parameters(), net.parameters()):
                target_param.mul_(1.0 - self.tau).add_(param, alpha=self.tau)


def scale_reward(reward: float, shift: float, scale: float) -> float:
    """Affine reward scaling to keep critic targets in a small range."""
    return (reward + shift) / scale


def run_episode(
    env: gym.Env,
    agent: SAC,
    replay_buffer: ReplayBuffer,
    rng: np.random.Generator,
    batch_size: int,
    min_buffer_size: int,
    start_steps: int,
    reward_shift: float,
    reward_scale: float,
    total_steps: int,
    seed: "int | None" = None,
) -> tuple[float, int]:
    """Run one episode and update once per environment step."""
    state, _ = env.reset(seed=seed)
    episode_return = 0.0
    done = False

    while not done:
        if total_steps < start_steps:
            action = env.action_space.sample()
        else:
            action = agent.take_action(state)
        next_state, reward, terminated, truncated, _ = env.step(action)
        done = terminated or truncated
        replay_buffer.add(
            state, action, scale_reward(float(reward), reward_shift, reward_scale),
            next_state, done,
        )
        state = next_state
        episode_return += float(reward)
        total_steps += 1

        if len(replay_buffer) >= min_buffer_size:
            transition_dict = replay_buffer.sample(batch_size, rng)
            agent.update(transition_dict)

    return episode_return, total_steps


def train(
    env: gym.Env,
    agent: SAC,
    replay_buffer: ReplayBuffer,
    num_episodes: int,
    batch_size: int,
    min_buffer_size: int,
    start_steps: int,
    reward_shift: float,
    reward_scale: float,
    seed: int,
) -> list[float]:
    """Train SAC and return per-episode returns."""
    rng = np.random.default_rng(seed)
    returns: list[float] = []
    total_steps = 0
    for episode in range(num_episodes):
        episode_seed = seed if episode == 0 else None
        episode_return, total_steps = run_episode(
            env, agent, replay_buffer, rng,
            batch_size=batch_size,
            min_buffer_size=min_buffer_size,
            start_steps=start_steps,
            reward_shift=reward_shift,
            reward_scale=reward_scale,
            total_steps=total_steps,
            seed=episode_seed,
        )
        returns.append(episode_return)
    return returns


def evaluate(agent: SAC, env_id: str, num_episodes: int, seed: int) -> list[float]:
    """Run num_episodes evaluation episodes with the deterministic policy."""
    env = gym.make(env_id)
    env.action_space.seed(seed + 10_000)
    returns: list[float] = []
    for episode in range(num_episodes):
        state, _ = env.reset(seed=seed + 10_000 + episode)
        done = False
        episode_return = 0.0
        while not done:
            action = agent.evaluate_action(state)
            next_state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated
            state = next_state
            episode_return += float(reward)
        returns.append(episode_return)
    env.close()
    return returns


def moving_average(values: list[float], window: int = 10) -> np.ndarray:
    """Simple moving average for smoothing learning curves."""
    arr = np.asarray(values, dtype=np.float32)
    if len(arr) < window:
        return arr
    kernel = np.ones(window, dtype=np.float32) / window
    return np.convolve(arr, kernel, mode="valid")


def plot_returns(
    returns: list[float], title: str = "SAC on Pendulum-v1", window: int = 10,
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
    env_id = "Pendulum-v1"
    hidden_dim = 128
    num_episodes = 200
    gamma = 0.99
    tau = 0.005
    actor_lr = 3e-4
    critic_lr = 3e-3
    alpha_lr = 3e-4
    initial_alpha = 0.2
    batch_size = 64
    buffer_capacity = 50_000
    min_buffer_size = 1_000
    start_steps = 1_000
    reward_shift = 8.0
    reward_scale = 8.0

    env = gym.make(env_id)
    env.action_space.seed(seed)
    state_dim = int(env.observation_space.shape[0])
    action_dim = int(env.action_space.shape[0])
    action_limit = float(env.action_space.high[0])

    agent = SAC(
        state_dim=state_dim,
        hidden_dim=hidden_dim,
        action_dim=action_dim,
        action_limit=action_limit,
        actor_lr=actor_lr,
        critic_lr=critic_lr,
        alpha_lr=alpha_lr,
        initial_alpha=initial_alpha,
        target_entropy=-float(action_dim),
        tau=tau,
        gamma=gamma,
    )
    replay_buffer = ReplayBuffer(capacity=buffer_capacity)

    print(f"Training SAC on {env_id} for {num_episodes} episodes...")
    returns = train(
        env, agent, replay_buffer,
        num_episodes=num_episodes,
        batch_size=batch_size,
        min_buffer_size=min_buffer_size,
        start_steps=start_steps,
        reward_shift=reward_shift,
        reward_scale=reward_scale,
        seed=seed,
    )
    env.close()

    final_avg = float(np.mean(returns[-10:]))
    print(f"Last 10-episode average return: {final_avg:.1f}")

    eval_returns = evaluate(agent, env_id, num_episodes=10, seed=seed)
    print(f"Deterministic evaluation mean over 10 episodes: {np.mean(eval_returns):.1f}")

    plot_returns(returns)
