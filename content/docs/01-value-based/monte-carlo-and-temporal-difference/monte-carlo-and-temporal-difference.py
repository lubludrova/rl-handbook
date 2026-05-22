"""Model-free prediction on Blackjack.

Estimates the state-value function of a fixed Blackjack policy using first-visit
Monte Carlo prediction and TD(0) prediction. Prediction only: the policy is not improved.
"""

import matplotlib.pyplot as plt
import numpy as np
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401 - registers 3D projection


State = tuple[int, int, bool]
Transition = tuple[State, int, float, "State | None"]


def draw_card(rng: np.random.Generator) -> int:
    """Draw one card from the infinite Blackjack deck used in Sutton-Barto."""
    card = int(rng.integers(1, 14))
    return min(card, 10)


def draw_hand(rng: np.random.Generator) -> list[int]:
    """Draw an initial two-card hand."""
    return [draw_card(rng), draw_card(rng)]


def usable_ace(hand: list[int]) -> bool:
    """Return whether the hand has an ace that can be counted as 11."""
    return 1 in hand and sum(hand) + 10 <= 21


def hand_value(hand: list[int]) -> int:
    """Compute the Blackjack value of a hand."""
    value = sum(hand)
    if usable_ace(hand):
        value += 10
    return value


def is_bust(hand: list[int]) -> bool:
    """Return whether a hand is over 21."""
    return hand_value(hand) > 21


def score(hand: list[int]) -> int:
    """Return a terminal score: zero for bust, otherwise hand value."""
    return 0 if is_bust(hand) else hand_value(hand)


def observation(player: list[int], dealer: list[int]) -> State:
    """Return the tabular Blackjack state used for prediction."""
    return (hand_value(player), dealer[0], usable_ace(player))


def fixed_policy(state: State, stick_threshold: int = 20) -> int:
    """Stick on high sums and hit otherwise. 0 = stick, 1 = hit."""
    player_sum, _, _ = state
    return 0 if player_sum >= stick_threshold else 1


def play_episode(rng: np.random.Generator, stick_threshold: int) -> list[Transition]:
    """Generate one Blackjack episode under the fixed policy."""
    player = draw_hand(rng)
    dealer = draw_hand(rng)

    while hand_value(player) < 12:
        player.append(draw_card(rng))

    episode: list[Transition] = []
    while True:
        state = observation(player, dealer)
        action = fixed_policy(state, stick_threshold)

        if action == 1:
            player.append(draw_card(rng))
            if is_bust(player):
                episode.append((state, action, -1.0, None))
                return episode
            next_state = observation(player, dealer)
            episode.append((state, action, 0.0, next_state))
            continue

        while hand_value(dealer) < 17:
            dealer.append(draw_card(rng))

        reward = float(np.sign(score(player) - score(dealer)))
        episode.append((state, action, reward, None))
        return episode


def all_blackjack_states() -> list[State]:
    """List the states displayed in Sutton-Barto's Blackjack plots."""
    return [
        (player_sum, dealer_card, usable)
        for player_sum in range(12, 22)
        for dealer_card in range(1, 11)
        for usable in (False, True)
    ]


def first_visit_mc_prediction(
    episodes: int, gamma: float, stick_threshold: int, seed: int,
) -> dict[State, float]:
    """Estimate v_pi with first-visit Monte Carlo prediction."""
    rng = np.random.default_rng(seed)
    values = {state: 0.0 for state in all_blackjack_states()}
    counts = {state: 0 for state in all_blackjack_states()}

    for _ in range(episodes):
        episode = play_episode(rng, stick_threshold)
        returns = 0.0
        visited: set[State] = set()
        for state, _, reward, _ in reversed(episode):
            returns = reward + gamma * returns
            if state in values and state not in visited:
                counts[state] += 1
                values[state] += (returns - values[state]) / counts[state]
                visited.add(state)

    return values


def td0_prediction(
    episodes: int, gamma: float, alpha: float, stick_threshold: int, seed: int,
) -> dict[State, float]:
    """Estimate v_pi with one-step temporal-difference prediction."""
    rng = np.random.default_rng(seed)
    values = {state: 0.0 for state in all_blackjack_states()}

    for _ in range(episodes):
        episode = play_episode(rng, stick_threshold)
        for state, _, reward, next_state in episode:
            next_value = 0.0 if next_state is None else values.get(next_state, 0.0)
            target = reward + gamma * next_value
            values[state] += alpha * (target - values[state])

    return values


def value_grid(values: dict, usable: bool) -> np.ndarray:
    """Convert a value dictionary into a (player-sum x dealer-card) grid."""
    grid = np.zeros((10, 10))
    for row, player_sum in enumerate(range(12, 22)):
        for col, dealer_card in enumerate(range(1, 11)):
            grid[row, col] = values[(player_sum, dealer_card, usable)]
    return grid


def plot_blackjack_values(mc_values: dict, td_values: dict) -> None:
    """Display MC and TD value estimates for usable and non-usable ace states."""
    dealer_cards = np.arange(1, 11)
    player_sums = np.arange(12, 22)
    x_grid, y_grid = np.meshgrid(dealer_cards, player_sums)

    fig = plt.figure(figsize=(12, 9))
    panels = [
        (mc_values, False, "Monte Carlo: no usable ace"),
        (mc_values, True, "Monte Carlo: usable ace"),
        (td_values, False, "TD(0): no usable ace"),
        (td_values, True, "TD(0): usable ace"),
    ]
    for index, (values, usable, title) in enumerate(panels, start=1):
        ax = fig.add_subplot(2, 2, index, projection="3d")
        z_grid = value_grid(values, usable)
        ax.plot_surface(x_grid, y_grid, z_grid, cmap="Greys", edgecolor="none")
        ax.set_title(title)
        ax.set_xlabel("Dealer showing")
        ax.set_ylabel("Player sum")
        ax.set_zlabel("V(s)")
        ax.view_init(elev=25, azim=-135)

    fig.tight_layout()
    plt.show()


if __name__ == "__main__":
    seed = 7

    # Hyperparameters
    num_episodes = 200_000
    gamma = 1.0
    alpha = 0.01
    stick_threshold = 20

    print(f"Running MC and TD(0) prediction on Blackjack "
          f"(stick on {stick_threshold}+) for {num_episodes:,} episodes...")
    mc_values = first_visit_mc_prediction(num_episodes, gamma, stick_threshold, seed=seed)
    td_values = td0_prediction(num_episodes, gamma, alpha, stick_threshold, seed=seed)

    sample_states = [(20, 10, False), (20, 10, True), (13, 2, False), (18, 6, True)]
    print("\nState (player sum, dealer showing, usable ace): MC value | TD(0) value")
    for state in sample_states:
        print(f"  {str(state):<24s} {mc_values[state]: .3f} | {td_values[state]: .3f}")

    plot_blackjack_values(mc_values, td_values)
