"""DQN on CartPole-v1.

Vanilla Deep Q-Network: a neural Q-function trained with experience replay
and a target network. Saves a GIF of one greedy episode (used in the chapter).
"""

import pathlib

import gymnasium as gym
import matplotlib.pyplot as plt
import numpy as np
import torch
from PIL import Image
from torch import nn
from torch.nn import functional as F


GIF_PATH = pathlib.Path(__file__).parent.parent / "public" / "figures" / "chapter-1.6-dqn-cartpole-balance-demo.gif"


class QNetwork(nn.Module):
    """Two-hidden-layer MLP: state -> Q-value for each discrete action."""

    def __init__(self, state_dim: int, hidden_dim: int, n_actions: int) -> None:
        super().__init__()
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.out = nn.Linear(hidden_dim, n_actions)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass: state -> Q-values over actions."""
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return self.out(x)


class ReplayBuffer:
    """Fixed-capacity FIFO buffer backed by pre-allocated NumPy arrays."""

    def __init__(self, capacity: int, state_dim: int) -> None:
        self.capacity = capacity
        self.states = np.zeros((capacity, state_dim), dtype=np.float32)
        self.actions = np.zeros(capacity, dtype=np.int64)
        self.rewards = np.zeros(capacity, dtype=np.float32)
        self.next_states = np.zeros((capacity, state_dim), dtype=np.float32)
        self.dones = np.zeros(capacity, dtype=np.float32)
        self.pos = 0
        self.size = 0

    def add(
        self,
        state: np.ndarray,
        action: int,
        reward: float,
        next_state: np.ndarray,
        done: bool,
    ) -> None:
        """Append one transition; overwrite oldest entry when full."""
        self.states[self.pos] = state
        self.actions[self.pos] = action
        self.rewards[self.pos] = reward
        self.next_states[self.pos] = next_state
        self.dones[self.pos] = float(done)
        self.pos = (self.pos + 1) % self.capacity
        self.size = min(self.size + 1, self.capacity)

    def sample(self, batch_size: int, rng: np.random.Generator) -> tuple[torch.Tensor, ...]:
        """Sample a uniform random batch as PyTorch tensors."""
        idx = rng.integers(self.size, size=batch_size)
        return (
            torch.as_tensor(self.states[idx]),
            torch.as_tensor(self.actions[idx]),
            torch.as_tensor(self.rewards[idx]),
            torch.as_tensor(self.next_states[idx]),
            torch.as_tensor(self.dones[idx]),
        )

    def __len__(self) -> int:
        return self.size


def linear_epsilon(step: int, eps_start: float, eps_end: float, decay_steps: int) -> float:
    """Linearly decay epsilon from eps_start to eps_end over decay_steps."""
    t = min(step / decay_steps, 1.0)
    return eps_start + t * (eps_end - eps_start)


def epsilon_greedy(
    q_net: QNetwork,
    state: np.ndarray,
    epsilon: float,
    n_actions: int,
    rng: np.random.Generator,
) -> int:
    """Random action with probability epsilon, otherwise argmax Q."""
    if rng.random() < epsilon:
        return int(rng.integers(n_actions))
    with torch.no_grad():
        s = torch.as_tensor(state, dtype=torch.float32).unsqueeze(0)
        return int(q_net(s).argmax(dim=1).item())


def compute_td_loss(
    q_net: QNetwork,
    target_net: QNetwork,
    states: torch.Tensor,
    actions: torch.Tensor,
    rewards: torch.Tensor,
    next_states: torch.Tensor,
    dones: torch.Tensor,
    gamma: float,
) -> torch.Tensor:
    """One-step DQN squared TD-error loss."""
    q_values = q_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)
    with torch.no_grad():
        next_q = target_net(next_states).max(dim=1).values
        targets = rewards + gamma * (1.0 - dones) * next_q
    return F.mse_loss(q_values, targets)


def sync_target(q_net: QNetwork, target_net: QNetwork) -> None:
    """Hard copy: online-network weights into the target network."""
    target_net.load_state_dict(q_net.state_dict())


def train(
    env: gym.Env,
    q_net: QNetwork,
    target_net: QNetwork,
    optimizer: torch.optim.Optimizer,
    buffer: ReplayBuffer,
    rng: np.random.Generator,
    num_episodes: int,
    gamma: float,
    batch_size: int,
    min_buffer_size: int,
    target_update_freq: int,
    eps_start: float,
    eps_end: float,
    eps_decay_steps: int,
    seed: int,
) -> list[float]:
    """Train DQN and return per-episode returns."""
    n_actions = int(env.action_space.n)
    returns: list[float] = []
    total_steps = 0
    update_count = 0

    for episode in range(num_episodes):
        state, _ = env.reset(seed=seed + episode)
        episode_return = 0.0
        done = False

        while not done:
            eps = linear_epsilon(total_steps, eps_start, eps_end, eps_decay_steps)
            action = epsilon_greedy(q_net, state, eps, n_actions, rng)
            next_state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated
            buffer.add(state, action, float(reward), next_state, done)
            state = next_state
            episode_return += float(reward)
            total_steps += 1

            if len(buffer) >= min_buffer_size:
                batch = buffer.sample(batch_size, rng)
                loss = compute_td_loss(q_net, target_net, *batch, gamma)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                update_count += 1
                if update_count % target_update_freq == 0:
                    sync_target(q_net, target_net)

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
    returns: list[float], title: str = "DQN on CartPole-v1", window: int = 10,
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


def record_greedy_episode(q_net: QNetwork, env_id: str, seed: int) -> list[np.ndarray]:
    """Run one greedy episode and return the rendered RGB frames."""
    env = gym.make(env_id, render_mode="rgb_array")
    state, _ = env.reset(seed=seed)
    frames: list[np.ndarray] = [env.render()]
    done = False
    with torch.no_grad():
        while not done:
            s = torch.as_tensor(state, dtype=torch.float32).unsqueeze(0)
            action = int(q_net(s).argmax(dim=1).item())
            state, _, terminated, truncated, _ = env.step(action)
            done = terminated or truncated
            frames.append(env.render())
    env.close()
    return frames


def save_gif(frames: list[np.ndarray], path: pathlib.Path, fps: int = 30) -> None:
    """Save a list of RGB frames as an animated GIF."""
    duration_ms = int(1000 / fps)
    imgs = [Image.fromarray(f) for f in frames]
    imgs[0].save(path, save_all=True, append_images=imgs[1:], duration=duration_ms, loop=0)


if __name__ == "__main__":
    seed = 7
    np.random.seed(seed)
    torch.manual_seed(seed)
    rng = np.random.default_rng(seed)

    # Hyperparameters
    env_id = "CartPole-v1"
    hidden_dim = 128
    num_episodes = 600
    gamma = 0.99
    lr = 2e-3
    batch_size = 64
    buffer_capacity = 10_000
    min_buffer_size = 500
    target_update_freq = 50
    eps_start = 1.0
    eps_end = 0.05
    eps_decay_steps = 5_000

    env = gym.make(env_id)
    env.action_space.seed(seed)
    state_dim = int(env.observation_space.shape[0])
    n_actions = int(env.action_space.n)

    q_net = QNetwork(state_dim, hidden_dim, n_actions)
    target_net = QNetwork(state_dim, hidden_dim, n_actions)
    sync_target(q_net, target_net)
    optimizer = torch.optim.Adam(q_net.parameters(), lr=lr)
    buffer = ReplayBuffer(buffer_capacity, state_dim)

    print(f"Training DQN on {env_id} for {num_episodes} episodes...")
    returns = train(
        env, q_net, target_net, optimizer, buffer, rng,
        num_episodes=num_episodes,
        gamma=gamma,
        batch_size=batch_size,
        min_buffer_size=min_buffer_size,
        target_update_freq=target_update_freq,
        eps_start=eps_start,
        eps_end=eps_end,
        eps_decay_steps=eps_decay_steps,
        seed=seed,
    )
    env.close()

    final_avg = float(np.mean(returns[-10:]))
    print(f"Last 10-episode average return: {final_avg:.1f}")

    print("Recording greedy episode for the chapter GIF...")
    frames = record_greedy_episode(q_net, env_id, seed=seed)
    save_gif(frames, GIF_PATH)
    print(f"GIF saved to {GIF_PATH} ({len(frames)} frames)")

    plot_returns(returns)
