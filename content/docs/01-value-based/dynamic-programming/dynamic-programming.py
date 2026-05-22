"""Dynamic programming on a known finite MDP: Cliff Walking.

Implements policy iteration and value iteration, then compares their results.
"""

import numpy as np


def build_cliff_walking() -> tuple[np.ndarray, np.ndarray, int, int, tuple[int, ...]]:
    """Build the 4x12 Cliff Walking MDP with known dynamics."""
    n_rows, n_cols = 4, 12
    n_states = n_rows * n_cols
    n_actions = 4
    start = (n_rows - 1) * n_cols
    goal = n_rows * n_cols - 1
    cliff = tuple(range(start + 1, goal))

    transitions = np.zeros((n_states, n_actions, n_states))
    rewards = np.zeros((n_states, n_actions, n_states))
    action_deltas = [(-1, 0), (0, 1), (1, 0), (0, -1)]  # up, right, down, left

    for state in range(n_states):
        row, col = divmod(state, n_cols)
        for action, (d_row, d_col) in enumerate(action_deltas):
            if state == goal:
                next_state = goal
                reward = 0.0
            elif state in cliff:
                next_state = state
                reward = 0.0
            else:
                next_row = min(max(row + d_row, 0), n_rows - 1)
                next_col = min(max(col + d_col, 0), n_cols - 1)
                next_state = next_row * n_cols + next_col
                reward = -100.0 if next_state in cliff else -1.0
                if next_state in cliff:
                    next_state = start

            transitions[state, action, next_state] = 1.0
            rewards[state, action, next_state] = reward

    return transitions, rewards, start, goal, cliff


def one_step_lookahead(
    state: int,
    values: np.ndarray,
    transitions: np.ndarray,
    rewards: np.ndarray,
    gamma: float,
) -> np.ndarray:
    """Compute action values from one Bellman backup in a single state."""
    return np.sum(transitions[state] * (rewards[state] + gamma * values), axis=1)


def policy_evaluation(
    policy: np.ndarray,
    transitions: np.ndarray,
    rewards: np.ndarray,
    gamma: float,
    theta: float,
    max_sweeps: int = 10_000,
) -> tuple[np.ndarray, int]:
    """Iteratively evaluate a policy with Bellman expectation updates."""
    values = np.zeros(policy.shape[0])
    for sweep in range(max_sweeps):
        old_values = values.copy()
        for state in range(policy.shape[0]):
            action_values = one_step_lookahead(state, old_values, transitions, rewards, gamma)
            values[state] = policy[state] @ action_values
        if np.max(np.abs(values - old_values)) < theta:
            return values, sweep + 1
    return values, max_sweeps


def policy_improvement(
    values: np.ndarray,
    transitions: np.ndarray,
    rewards: np.ndarray,
    gamma: float,
) -> np.ndarray:
    """Return a greedy policy, splitting probability uniformly across ties."""
    n_states, n_actions, _ = transitions.shape
    q_values = np.zeros((n_states, n_actions))
    policy = np.zeros((n_states, n_actions))
    for state in range(n_states):
        q_values[state] = one_step_lookahead(state, values, transitions, rewards, gamma)
        best_value = q_values[state].max()
        best_actions = np.flatnonzero(np.isclose(q_values[state], best_value))
        policy[state, best_actions] = 1.0 / len(best_actions)
    return policy


def policy_iteration(
    transitions: np.ndarray,
    rewards: np.ndarray,
    gamma: float,
    theta: float,
    max_iterations: int = 100,
) -> tuple[np.ndarray, np.ndarray, int, int]:
    """Alternate policy evaluation and greedy policy improvement."""
    n_states, n_actions, _ = transitions.shape
    policy = np.full((n_states, n_actions), 1.0 / n_actions)
    total_eval_sweeps = 0
    for iteration in range(max_iterations):
        values, eval_sweeps = policy_evaluation(policy, transitions, rewards, gamma, theta)
        total_eval_sweeps += eval_sweeps
        improved_policy = policy_improvement(values, transitions, rewards, gamma)
        if np.array_equal(policy, improved_policy):
            return values, policy, iteration + 1, total_eval_sweeps
        policy = improved_policy
    return values, policy, max_iterations, total_eval_sweeps


def value_iteration(
    transitions: np.ndarray,
    rewards: np.ndarray,
    gamma: float,
    theta: float,
    max_sweeps: int = 10_000,
) -> tuple[np.ndarray, np.ndarray, int]:
    """Iterate Bellman optimality updates, then extract a greedy policy."""
    n_states = transitions.shape[0]
    values = np.zeros(n_states)
    for sweep in range(max_sweeps):
        old_values = values.copy()
        for state in range(n_states):
            action_values = one_step_lookahead(state, old_values, transitions, rewards, gamma)
            values[state] = np.max(action_values)
        if np.max(np.abs(values - old_values)) < theta:
            policy = policy_improvement(values, transitions, rewards, gamma)
            return values, policy, sweep + 1
    policy = policy_improvement(values, transitions, rewards, gamma)
    return values, policy, max_sweeps


def print_policy(policy: np.ndarray, start: int, goal: int, cliff: tuple[int, ...]) -> None:
    """Print one greedy action per grid cell in the Cliff Walking layout."""
    symbols = np.array(["^", ">", "v", "<"])
    n_cols = 12
    for state in range(policy.shape[0]):
        if state == start:
            cell = "S"
        elif state == goal:
            cell = "G"
        elif state in cliff:
            cell = "C"
        else:
            cell = str(symbols[np.argmax(policy[state])])
        end = "\n" if (state + 1) % n_cols == 0 else " "
        print(cell, end=end)


def print_values(values: np.ndarray, goal: int, cliff: tuple[int, ...]) -> None:
    """Print state values as a 4x12 grid."""
    n_cols = 12
    for state, value in enumerate(values):
        if state == goal:
            cell = "   G  "
        elif state in cliff:
            cell = "   C  "
        else:
            cell = f"{value:6.1f}"
        end = "\n" if (state + 1) % n_cols == 0 else " "
        print(cell, end=end)


def values_agree(values_a: np.ndarray, values_b: np.ndarray) -> bool:
    """Check whether two value functions agree up to numerical tolerance."""
    return bool(np.allclose(values_a, values_b, atol=1e-3))


if __name__ == "__main__":
    # Hyperparameters
    gamma = 0.9
    theta = 1e-3

    transitions, rewards, start, goal, cliff = build_cliff_walking()

    print("Running policy iteration and value iteration on Cliff Walking...")
    values_pi, policy_pi, pi_iterations, pi_eval_sweeps = policy_iteration(
        transitions, rewards, gamma=gamma, theta=theta,
    )
    values_vi, policy_vi, vi_sweeps = value_iteration(
        transitions, rewards, gamma=gamma, theta=theta,
    )

    print("\nPlanning summary")
    print(f"{'Method':<18} {'rounds':>8} {'Bellman sweeps':>16} {'start value':>13}")
    print(f"{'Policy iteration':<18} {pi_iterations:>8} {pi_eval_sweeps:>16} {values_pi[start]:>13.1f}")
    print(f"{'Value iteration':<18} {vi_sweeps:>8} {vi_sweeps:>16} {values_vi[start]:>13.1f}")
    print(f"Values agree:   {'yes' if values_agree(values_pi, values_vi) else 'no'}")
    print(f"Policies agree: {'yes' if np.allclose(policy_pi, policy_vi) else 'no'}")
    print("Legend: ^ up, > right, v down, < left.")

    print("\nFinal value function:")
    print_values(values_vi, goal, cliff)

    print("\nPolicy from policy iteration:")
    print_policy(policy_pi, start, goal, cliff)

    print("\nPolicy from value iteration:")
    print_policy(policy_vi, start, goal, cliff)
