"""Small deterministic Dyna-Q example; Python standard library only.

Run from the repository root:
    python content/docs/04-model-based/dyna-and-learned-models/dyna_q.py

The fixed-budget comparison illustrates this corridor, not a general benchmark.
"""

import math
import random
from statistics import mean


def backup(q, state, action, reward, next_state, terminated, alpha, gamma):
    next_value = 0.0 if terminated else max(q[next_state])
    target = reward + gamma * next_value
    q[state][action] += alpha * (target - q[state][action])


def corridor_step(state, action, terminal=5):
    next_state = max(0, state - 1) if action == 0 else state + 1
    terminated = next_state == terminal
    return float(terminated), next_state, terminated


def run(seed, planning_steps, budget=200):
    behavior_rng = random.Random(seed)
    planning_rng = random.Random(seed + 10_000)
    q = [[0.0, 0.0] for _ in range(6)]
    model = {}
    state = 0
    completed = 0
    first_goal = None
    for real_step in range(1, budget + 1):
        if behavior_rng.random() < 0.2:
            action = behavior_rng.randrange(2)
        else:
            best = max(q[state])
            action = behavior_rng.choice(
                [a for a in range(2) if q[state][a] == best]
            )
        reward, next_state, terminated = corridor_step(state, action)
        backup(q, state, action, reward, next_state, terminated, 0.5, 0.95)
        model[state, action] = reward, next_state, terminated

        # Only observed pairs exist in this deterministic model.
        for _ in range(planning_steps):
            simulated_state, simulated_action = planning_rng.choice(list(model))
            outcome = model[simulated_state, simulated_action]
            backup(q, simulated_state, simulated_action, *outcome, 0.5, 0.95)

        if terminated:
            completed += 1
            if first_goal is None:
                first_goal = real_step
            state = 0
        else:
            state = next_state
    return completed, first_goal, q[0][1]


def check_examples():
    # The chapter's chain: forward experience, then two backward model backups.
    q = [[0.0] for _ in range(4)]
    model = {}
    for state in range(3):
        outcome = (float(state == 2), state + 1, state == 2)
        backup(q, state, 0, *outcome, 1.0, 0.9)
        model[state, 0] = outcome
    assert q == [[0.0], [0.0], [1.0], [0.0]]
    for state in (1, 0):
        backup(q, state, 0, *model[state, 0], 1.0, 0.9)
    for actual, expected in zip(q, (0.81, 0.9, 1.0, 0.0)):
        assert math.isclose(actual[0], expected)

    # Terminal bootstrap must be masked even if the terminal row is corrupted.
    q = [[0.0], [123.0]]
    backup(q, 0, 0, 2.0, 1, True, 1.0, 0.9)
    assert q[0][0] == 2.0
    backup(q, 0, 0, 2.0, 1, False, 1.0, 0.9)
    assert math.isclose(q[0][0], 112.7)

    # With every deterministic transition known, repeated model backups agree
    # with the analytic optimal values for both actions in the corridor.
    q = [[0.0, 0.0] for _ in range(6)]
    for _ in range(200):
        for state in range(5):
            for action in range(2):
                backup(q, state, action, *corridor_step(state, action), 1.0, 0.95)
    for state in range(5):
        assert math.isclose(q[state][1], 0.95 ** (4 - state))
        next_state = max(0, state - 1)
        assert math.isclose(q[state][0], 0.95 ** (5 - next_state))
    assert run(7, 10) == run(7, 10)
    return [0.81, 0.9, 1.0]


if __name__ == "__main__":
    print("Checks passed. Chain values:", check_examples())
    print("200 real transitions per run; seeds 0..4; gamma=0.95, alpha=0.5.")
    print("Planning updates/step | Mean completed episodes | Mean Q(0, right)")
    for planning_steps in (0, 10):
        results = [run(seed, planning_steps) for seed in range(5)]
        print(
            f"{planning_steps:21d} | "
            f"{mean(row[0] for row in results):23.1f} | "
            f"{mean(row[2] for row in results):16.4f}"
        )
    print("Planning consumes extra computation; real transitions are held fixed.")
