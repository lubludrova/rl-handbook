"""Compare tabular Sarsa and Q-learning on Gymnasium CliffWalking-v1.

Both algorithms collect experience with the same epsilon-greedy behavior policy;
Sarsa bootstraps from the next action actually sampled, Q-learning from the greedy one.
"""

from dataclasses import dataclass
from typing import Any, Callable

import gymnasium as gym
import matplotlib.pyplot as plt
import numpy as np


@dataclass(frozen=True)
class CliffWalkingConfig:
    """Hyperparameters for tabular control on CliffWalking-v1."""

    episodes: int = 500
    alpha: float = 0.5
    gamma: float = 1.0
    epsilon: float = 0.1
    seed: int = 7
    max_steps: int = 10_000


EpisodeRunner = Callable[
    [gym.Env[Any, Any], np.ndarray, CliffWalkingConfig, np.random.Generator],
    tuple[float, int],
]


def epsilon_greedy(
    q: np.ndarray, state: int, epsilon: float, rng: np.random.Generator,
) -> int:
    """Sample from the epsilon-greedy policy induced by q[state]."""
    if rng.random() < epsilon:
        return int(rng.integers(q.shape[1]))
    best_actions = np.flatnonzero(q[state] == q[state].max())
    return int(rng.choice(best_actions))


def sarsa_update(
    q: np.ndarray,
    state: int,
    action: int,
    reward: float,
    next_state: int,
    next_action: int,
    done: bool,
    alpha: float,
    gamma: float,
) -> None:
    """Apply the on-policy one-step Sarsa update in place."""
    next_value = 0.0 if done else q[next_state, next_action]
    target = reward + gamma * next_value
    q[state, action] += alpha * (target - q[state, action])


def q_learning_update(
    q: np.ndarray,
    state: int,
    action: int,
    reward: float,
    next_state: int,
    done: bool,
    alpha: float,
    gamma: float,
) -> None:
    """Apply the off-policy one-step Q-learning update in place."""
    next_value = 0.0 if done else np.max(q[next_state])
    target = reward + gamma * next_value
    q[state, action] += alpha * (target - q[state, action])


def run_sarsa_episode(
    env: gym.Env[Any, Any],
    q: np.ndarray,
    config: CliffWalkingConfig,
    rng: np.random.Generator,
) -> tuple[float, int]:
    """Run one episode of on-policy Sarsa control."""
    state, _ = env.reset()
    state = int(state)
    action = epsilon_greedy(q, state, config.epsilon, rng)
    total_reward = 0.0

    for step_count in range(1, config.max_steps + 1):
        next_state, reward, terminated, truncated, _ = env.step(action)
        next_state = int(next_state)
        reward = float(reward)
        done = terminated or truncated

        next_action = epsilon_greedy(q, next_state, config.epsilon, rng)
        sarsa_update(
            q=q,
            state=state,
            action=action,
            reward=reward,
            next_state=next_state,
            next_action=next_action,
            done=done,
            alpha=config.alpha,
            gamma=config.gamma,
        )

        total_reward += reward
        if done:
            return total_reward, step_count
        state, action = next_state, next_action

    return total_reward, config.max_steps


def run_q_learning_episode(
    env: gym.Env[Any, Any],
    q: np.ndarray,
    config: CliffWalkingConfig,
    rng: np.random.Generator,
) -> tuple[float, int]:
    """Run one episode of off-policy Q-learning control."""
    state, _ = env.reset()
    state = int(state)
    total_reward = 0.0

    for step_count in range(1, config.max_steps + 1):
        action = epsilon_greedy(q, state, config.epsilon, rng)
        next_state, reward, terminated, truncated, _ = env.step(action)
        next_state = int(next_state)
        reward = float(reward)
        done = terminated or truncated

        q_learning_update(
            q=q,
            state=state,
            action=action,
            reward=reward,
            next_state=next_state,
            done=done,
            alpha=config.alpha,
            gamma=config.gamma,
        )

        total_reward += reward
        if done:
            return total_reward, step_count
        state = next_state

    return total_reward, config.max_steps


def train_method(
    run_episode: EpisodeRunner,
    config: CliffWalkingConfig,
    seed_offset: int = 0,
) -> dict[str, np.ndarray]:
    """Train one tabular control method on CliffWalking-v1."""
    env = gym.make("CliffWalking-v1")
    env.action_space.seed(config.seed + seed_offset)

    n_states = int(env.observation_space.n)
    n_actions = int(env.action_space.n)
    q = np.zeros((n_states, n_actions))
    returns = np.zeros(config.episodes)
    steps = np.zeros(config.episodes, dtype=int)
    rng = np.random.default_rng(config.seed + seed_offset)

    for episode in range(config.episodes):
        env.reset(seed=config.seed + seed_offset + episode)
        returns[episode], steps[episode] = run_episode(env, q, config, rng)

    env.close()
    return {"q": q, "returns": returns, "steps": steps}


def train(config: CliffWalkingConfig) -> dict[str, dict[str, np.ndarray]]:
    """Train Sarsa and Q-learning with the same hyperparameters."""
    return {
        "Sarsa": train_method(run_sarsa_episode, config, seed_offset=0),
        "Q-learning": train_method(run_q_learning_episode, config, seed_offset=10_000),
    }


def greedy_policy_grid(q: np.ndarray) -> list[str]:
    """Format the greedy policy for the standard 4 x 12 Cliff Walking grid."""
    n_rows, n_cols = 4, 12
    start = 36
    goal = 47
    cliff = set(range(37, 47))
    action_symbols = np.array(["^", ">", "v", "<"])
    rows: list[str] = []

    for row in range(n_rows):
        cells = []
        for col in range(n_cols):
            state = row * n_cols + col
            if state == start:
                cells.append("S")
            elif state == goal:
                cells.append("G")
            elif state in cliff:
                cells.append("C")
            else:
                cells.append(str(action_symbols[np.argmax(q[state])]))
        rows.append(" ".join(cells))

    return rows


def moving_average(values: np.ndarray, window: int = 10) -> np.ndarray:
    """Simple moving average for smoothing learning curves."""
    arr = np.asarray(values, dtype=np.float32)
    if len(arr) < window:
        return arr
    kernel = np.ones(window, dtype=np.float32) / window
    return np.convolve(arr, kernel, mode="valid")


def plot_returns(
    results: dict[str, dict[str, np.ndarray]],
    title: str = "CliffWalking-v1: Sarsa vs Q-learning",
    window: int = 10,
) -> None:
    """Plot moving-average episode returns for several control methods."""
    plt.figure(figsize=(7, 4))
    for name, data in results.items():
        smoothed = moving_average(data["returns"], window)
        plt.plot(smoothed, label=f"{name} ({window}-ep avg)")
    plt.xlabel("Episode")
    plt.ylabel("Return")
    plt.title(title)
    plt.ylim(-200, 0)
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    config = CliffWalkingConfig()
    print(f"Training Sarsa and Q-learning on CliffWalking-v1 for {config.episodes} episodes "
          f"(alpha={config.alpha}, gamma={config.gamma}, epsilon={config.epsilon})...")
    results = train(config)

    for name, data in results.items():
        final_avg = float(np.mean(data["returns"][-10:]))
        print(f"\n{name}: last 10-episode average return: {final_avg:.1f}")
        print(f"{name} greedy policy after training:")
        for row in greedy_policy_grid(data["q"]):
            print(row)

    plot_returns(results)
