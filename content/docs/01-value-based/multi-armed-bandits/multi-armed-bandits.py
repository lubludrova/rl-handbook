"""Stationary k-armed Bernoulli bandits: regret comparison of classic action rules.

One function per concept so that chapter snippets can reuse the same code directly.
"""

import matplotlib.pyplot as plt
import numpy as np


def select_epsilon_greedy(q_values: np.ndarray, epsilon: float, rng: np.random.Generator) -> int:
    """Random action with probability epsilon, otherwise act greedily."""
    if rng.random() < epsilon:
        return int(rng.integers(len(q_values)))
    return int(rng.choice(np.flatnonzero(q_values == q_values.max())))


def select_ucb(q_values: np.ndarray, counts: np.ndarray, step: int, c: float) -> int:
    """Upper-confidence-bound action selection for stationary bandits."""
    untried_actions = np.flatnonzero(counts == 0)
    if len(untried_actions) > 0:
        return int(untried_actions[0])
    bonus = c * np.sqrt(np.log(step + 1) / counts)
    return int(np.argmax(q_values + bonus))


def select_thompson(alpha: np.ndarray, beta: np.ndarray, rng: np.random.Generator) -> int:
    """Sample from Beta posteriors and pick the arm with the best sample."""
    samples = rng.beta(alpha, beta)
    return int(np.argmax(samples))


def update_sample_average(old_value: float, count: int, reward: float) -> float:
    """Incremental sample-average update Q_n = Q_{n-1} + (R_n - Q_{n-1}) / n."""
    return old_value + (reward - old_value) / count


def make_bernoulli_bandit(k: int, rng: np.random.Generator) -> np.ndarray:
    """Sample fixed reward probabilities for a stationary Bernoulli bandit."""
    return rng.uniform(0.05, 0.95, size=k)


def pull_arm(probabilities: np.ndarray, action: int, rng: np.random.Generator) -> float:
    """Return reward 1 with the selected arm's probability, otherwise 0."""
    return float(rng.random() < probabilities[action])


def epsilon_schedule(step: int, c: float = 1.0) -> float:
    """Decaying epsilon schedule: epsilon_t = min(1, c / (t + 1))."""
    return min(1.0, c / (step + 1))


def run_bandit(
    probabilities: np.ndarray,
    method: str,
    steps: int,
    rng: np.random.Generator,
    epsilon: float = 0.1,
    ucb_c: float = 0.6,
) -> np.ndarray:
    """Run one bandit algorithm and return cumulative regret per step."""
    k = len(probabilities)
    best_mean_reward = float(probabilities.max())

    q_values = np.zeros(k)
    counts = np.zeros(k, dtype=int)
    alpha = np.ones(k)
    beta = np.ones(k)
    cumulative_regret = np.zeros(steps)

    regret = 0.0
    for step in range(steps):
        if method == "epsilon_greedy":
            action = select_epsilon_greedy(q_values, epsilon, rng)
        elif method == "decaying_epsilon_greedy":
            action = select_epsilon_greedy(q_values, epsilon_schedule(step, c=k), rng)
        elif method == "ucb":
            action = select_ucb(q_values, counts, step + 1, ucb_c)
        elif method == "thompson":
            action = select_thompson(alpha, beta, rng)
        else:
            raise ValueError(f"Unknown method: {method}")

        reward = pull_arm(probabilities, action, rng)
        counts[action] += 1
        q_values[action] = update_sample_average(q_values[action], counts[action], reward)

        if method == "thompson":
            alpha[action] += reward
            beta[action] += 1.0 - reward

        regret += best_mean_reward - probabilities[action]
        cumulative_regret[step] = regret

    return cumulative_regret


def average_regret(
    method: str,
    runs: int,
    steps: int,
    k: int,
    seed: int,
) -> np.ndarray:
    """Average cumulative regret across independently sampled bandit problems."""
    rng = np.random.default_rng(seed)
    regrets = np.zeros((runs, steps))
    for run in range(runs):
        probabilities = make_bernoulli_bandit(k, rng)
        regrets[run] = run_bandit(probabilities, method, steps, rng)
    return regrets.mean(axis=0)


def plot_regret(results: dict, title: str = "Stationary 10-armed Bernoulli bandit") -> None:
    """Plot cumulative regret curves for several methods on one figure."""
    plt.figure(figsize=(7, 4))
    for label, regret in results.items():
        plt.plot(regret, label=label)
    plt.xlabel("Step")
    plt.ylabel("Average cumulative regret")
    plt.title(title)
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    seed = 7

    # Hyperparameters
    runs = 100
    steps = 1_000
    k = 10

    methods = {
        "epsilon-greedy": "epsilon_greedy",
        "decaying epsilon-greedy": "decaying_epsilon_greedy",
        "UCB": "ucb",
        "Thompson sampling": "thompson",
    }

    print(f"Running {len(methods)} bandit methods on {k}-armed Bernoulli bandit "
          f"for {steps} steps, averaged over {runs} runs...")
    results = {
        label: average_regret(method, runs=runs, steps=steps, k=k, seed=seed)
        for label, method in methods.items()
    }

    print("\nFinal cumulative regret per method:")
    for label, regret in results.items():
        print(f"  {label:<26s} {regret[-1]:7.2f}")

    plot_regret(results)
