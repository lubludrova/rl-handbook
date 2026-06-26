export type NodeKind = 'algorithm' | 'concept';

export type FamilyId = 'foundations' | 'value' | 'policy' | 'planning' | 'background';

/**
 * Where the method roughly stands in current practice. Encoded visually as
 * node size, so the map reads as a snapshot of relevance, not just history.
 */
export type NodeStatus = 'workhorse' | 'active' | 'classic' | 'research' | 'foundation';

export interface MapNode {
  id: string;
  label: string;
  year?: string;
  x: number;
  y: number;
  kind: NodeKind;
  family: FamilyId;
  status: NodeStatus;
  blurb: string;
  href?: string;
  comingSoon?: boolean;
  tags?: string[];
  /** Visual map attributes. */
  model?: 'free' | 'exact' | 'learned';
  actions?: 'discrete' | 'continuous' | 'both';
  policy?: 'on' | 'off' | 'na';
  /** Label placement tweaks, in viewBox units. */
  labelDx?: number;
  labelDy?: number;
}

export interface MapEdge {
  from: string;
  to: string;
}

export interface MapContinuation {
  from: string;
  toX: number;
  toY: number;
}

export interface FamilyMeta {
  label: string;
  blurb: string;
  href?: string;
  comingSoon?: boolean;
}

export const familyMeta: Record<FamilyId, FamilyMeta> = {
  foundations: {
    label: 'Foundations',
    blurb:
      'The ideas everything else stands on: bandit exploration, the MDP formalism, Bellman planning, and learning values from raw experience.',
    href: '/docs/01-value-based/multi-armed-bandits',
  },
  value: {
    label: 'Value-Based',
    blurb:
      'Learn how good each action is, then act greedily. From tabular TD control to the deep Q-network line that cracked Atari.',
    href: '/docs/01-value-based/sarsa-and-q-learning',
  },
  policy: {
    label: 'Policy-Based',
    blurb:
      'Optimize a parameterized policy directly: REINFORCE, actor-critic, trust regions, and continuous-control variants.',
    href: '/docs/02-on-policy-policy-based/policy-gradient-and-reinforce',
  },
  planning: {
    label: 'Decision-Time Planning',
    blurb:
      'Use a model while choosing the next action: simulate possible futures from the current state, run search or optimization, then act on the best plan.',
    comingSoon: true,
  },
  background: {
    label: 'Background Training',
    blurb:
      'Use a learned model away from the environment to create synthetic experience, then train a value function or actor-critic on those imagined transitions.',
    comingSoon: true,
  },
};

export const VIEW_W = 1600;
export const VIEW_H = 1000;

export interface MapRegion {
  label: string;
  family: FamilyId;
  x: number;
  y: number;
  rotate?: number;
  size?: number;
}

export const regions: MapRegion[] = [
  { label: 'VALUE-BASED', family: 'value', x: 600, y: 42 },
  { label: 'FOUNDATIONS', family: 'foundations', x: 815, y: 608, size: 18 },
  { label: 'POLICY-BASED', family: 'policy', x: 1175, y: 430, size: 20 },
  { label: 'DECISION-TIME PLANNING', family: 'planning', x: 955, y: 725, size: 15 },
  { label: 'BACKGROUND TRAINING', family: 'background', x: 565, y: 925, size: 15 },
];

export const nodes: MapNode[] = [
  // ===== Foundations (concepts — never filtered out) =====
  {
    id: 'bandits',
    label: 'Bandits',
    year: '1952',
    x: 615,
    y: 575,
    kind: 'concept',
    family: 'foundations',
    status: 'foundation',
    tags: ['foundation', 'tabular'],
    blurb:
      'One state, many arms: the exploration–exploitation dilemma in its purest form. Where the handbook begins.',
    href: '/docs/01-value-based/multi-armed-bandits',
  },
  {
    id: 'mdp',
    label: 'MDP',
    year: '1957',
    x: 755,
    y: 510,
    kind: 'concept',
    family: 'foundations',
    status: 'foundation',
    tags: ['foundation'],
    blurb:
      'States, actions, rewards, transitions: the formalism every RL algorithm lives inside. The center of the map.',
    href: '/docs/01-value-based/mdp',
  },
  {
    id: 'dp',
    label: 'Dynamic Programming',
    year: '1957',
    x: 690,
    y: 655,
    kind: 'concept',
    family: 'foundations',
    status: 'foundation',
    tags: ['foundation', 'model-based', 'tabular'],
    blurb:
      'Exact planning with a known model. Policy iteration and value iteration introduce the Bellman backup that everything downstream approximates.',
    href: '/docs/01-value-based/dynamic-programming',
  },
  {
    id: 'mc-td',
    label: 'MC & TD',
    year: '1988',
    x: 640,
    y: 455,
    kind: 'concept',
    family: 'foundations',
    status: 'foundation',
    tags: ['foundation', 'model-free', 'tabular', 'temporal-difference', 'monte-carlo-return'],
    blurb:
      'Drop the model: estimate values from sampled experience. Monte Carlo waits for full returns; temporal difference bootstraps from one step.',
    href: '/docs/01-value-based/monte-carlo-and-temporal-difference',
    labelDx: -54,
    labelDy: 4,
  },

  // ===== Value-based =====
  {
    id: 'sarsa',
    label: 'Sarsa',
    year: '1994',
    x: 540,
    y: 400,
    kind: 'algorithm',
    family: 'value',
    status: 'classic',
    tags: ['value-based', 'model-free', 'on-policy', 'tabular', 'discrete-actions', 'deterministic-policy', 'temporal-difference'],
    model: 'free',
    actions: 'discrete',
    policy: 'on',
    blurb:
      'On-policy one-step TD control: bootstrap from the next action actually sampled, so the learned values include the cost of exploration.',
    href: '/docs/01-value-based/sarsa-and-q-learning',
  },
  {
    id: 'q-learning',
    label: 'Q-Learning',
    year: '1989',
    x: 690,
    y: 355,
    kind: 'algorithm',
    family: 'value',
    status: 'classic',
    tags: ['value-based', 'model-free', 'off-policy', 'tabular', 'discrete-actions', 'deterministic-policy', 'temporal-difference'],
    model: 'free',
    actions: 'discrete',
    policy: 'off',
    blurb:
      'Off-policy one-step TD control: bootstrap from the greedy next action while the behavior policy can remain exploratory.',
    href: '/docs/01-value-based/sarsa-and-q-learning',
    labelDx: 62,
    labelDy: 4,
  },
  {
    id: 'dqn',
    label: 'DQN',
    year: '2015',
    x: 610,
    y: 270,
    kind: 'algorithm',
    family: 'value',
    status: 'active',
    tags: ['value-based', 'model-free', 'off-policy', 'discrete-actions', 'deterministic-policy', 'temporal-difference'],
    model: 'free',
    actions: 'discrete',
    policy: 'off',
    blurb:
      'Replaces the Q-table with a neural network and stabilizes off-policy bootstrapping with experience replay and a target network.',
    href: '/docs/01-value-based/dqn',
  },
  {
    id: 'double-dqn',
    label: 'Double DQN',
    year: '2015',
    x: 520,
    y: 180,
    kind: 'algorithm',
    family: 'value',
    status: 'classic',
    tags: ['value-based', 'model-free', 'off-policy', 'discrete-actions', 'deterministic-policy', 'temporal-difference'],
    model: 'free',
    actions: 'discrete',
    policy: 'off',
    blurb:
      'Uses the online network to select the next greedy action and the target network to evaluate it, reducing max-over-noise overestimation.',
    href: '/docs/01-value-based/dqn-improvements',
    labelDy: -26,
  },
  {
    id: 'dueling',
    label: 'Dueling DQN',
    year: '2016',
    x: 595,
    y: 105,
    kind: 'algorithm',
    family: 'value',
    status: 'classic',
    tags: ['value-based', 'model-free', 'off-policy', 'discrete-actions', 'deterministic-policy', 'temporal-difference'],
    model: 'free',
    actions: 'discrete',
    policy: 'off',
    blurb:
      'Splits Q-values into a shared state-value stream and an action-advantage stream, so the network can learn state quality separately from action differences.',
    href: '/docs/01-value-based/dqn-improvements',
  },
  {
    id: 'c51',
    label: 'C51',
    year: '2017',
    x: 730,
    y: 200,
    kind: 'algorithm',
    family: 'value',
    status: 'classic',
    tags: ['value-based', 'model-free', 'off-policy', 'discrete-actions', 'deterministic-policy', 'temporal-difference'],
    model: 'free',
    actions: 'discrete',
    policy: 'off',
    blurb:
      'Predicts a categorical return distribution instead of only expected Q-value, giving the Bellman target richer uncertainty structure.',
    href: '/docs/01-value-based/dqn-improvements',
    labelDy: -26,
  },
  {
    id: 'rainbow',
    label: 'Rainbow',
    year: '2017',
    x: 440,
    y: 80,
    kind: 'algorithm',
    family: 'value',
    status: 'active',
    tags: ['value-based', 'model-free', 'off-policy', 'discrete-actions', 'deterministic-policy', 'temporal-difference'],
    model: 'free',
    actions: 'discrete',
    policy: 'off',
    blurb:
      'Combines Double DQN, prioritized replay, dueling heads, multi-step targets, Noisy Nets, and C51; its ablation is the main lesson.',
    href: '/docs/01-value-based/dqn-improvements',
  },

  // ===== Policy gradient =====
  {
    id: 'reinforce',
    label: 'REINFORCE',
    year: '1992',
    x: 985,
    y: 425,
    kind: 'algorithm',
    family: 'policy',
    status: 'classic',
    tags: ['policy-based', 'model-free', 'on-policy', 'discrete-actions', 'continuous-actions', 'stochastic-policy', 'monte-carlo-return'],
    model: 'free',
    actions: 'both',
    policy: 'on',
    blurb:
      'The basic Monte Carlo policy-gradient algorithm: increase log-probability of sampled actions in proportion to their episode return.',
    href: '/docs/02-on-policy-policy-based/policy-gradient-and-reinforce',
  },
  {
    id: 'a2c',
    label: 'A2C / A3C',
    year: '2016',
    x: 1085,
    y: 330,
    kind: 'algorithm',
    family: 'policy',
    status: 'classic',
    tags: ['policy-based', 'actor-critic', 'model-free', 'on-policy', 'discrete-actions', 'continuous-actions', 'stochastic-policy', 'temporal-difference'],
    model: 'free',
    actions: 'both',
    policy: 'on',
    blurb:
      'Adds a learned value critic to estimate bootstrapped advantages, reducing policy-gradient variance; A3C collects them asynchronously.',
    href: '/docs/02-on-policy-policy-based/actor-critic-a2c-a3c',
    labelDy: -26,
  },
  {
    id: 'trpo',
    label: 'TRPO',
    year: '2015',
    x: 1000,
    y: 220,
    kind: 'algorithm',
    family: 'policy',
    status: 'classic',
    tags: ['policy-based', 'actor-critic', 'model-free', 'on-policy', 'discrete-actions', 'continuous-actions', 'stochastic-policy', 'gae'],
    model: 'free',
    actions: 'both',
    policy: 'on',
    blurb:
      'Constrains policy improvement with a KL trust region so a single update cannot move the data-collecting policy too far.',
    href: '/docs/02-on-policy-policy-based/trpo',
  },
  {
    id: 'ppo',
    label: 'PPO',
    year: '2017',
    x: 1145,
    y: 145,
    kind: 'algorithm',
    family: 'policy',
    status: 'workhorse',
    tags: ['policy-based', 'actor-critic', 'model-free', 'on-policy', 'discrete-actions', 'continuous-actions', 'stochastic-policy', 'gae'],
    model: 'free',
    actions: 'both',
    policy: 'on',
    blurb:
      'Approximates trust-region behavior with a clipped surrogate objective, keeping policy updates simple, stable, and reusable.',
    href: '/docs/02-on-policy-policy-based/ppo',
    labelDy: -28,
  },

  // ===== Continuous-control actor-critic =====
  {
    id: 'ddpg',
    label: 'DDPG',
    year: '2015',
    x: 1120,
    y: 555,
    kind: 'algorithm',
    family: 'policy',
    status: 'classic',
    tags: ['policy-based', 'actor-critic', 'model-free', 'off-policy', 'continuous-actions', 'deterministic-policy', 'temporal-difference'],
    model: 'free',
    actions: 'continuous',
    policy: 'off',
    blurb:
      'Off-policy actor-critic for continuous actions: a deterministic actor follows the gradient of a learned Q-critic trained from replay.',
    href: '/docs/03-off-policy-policy-based/ddpg',
    labelDx: -42,
    labelDy: -4,
  },
  {
    id: 'td3',
    label: 'TD3',
    year: '2018',
    x: 1235,
    y: 645,
    kind: 'algorithm',
    family: 'policy',
    status: 'active',
    tags: ['policy-based', 'actor-critic', 'model-free', 'off-policy', 'continuous-actions', 'deterministic-policy', 'temporal-difference'],
    model: 'free',
    actions: 'continuous',
    policy: 'off',
    blurb:
      'Keeps DDPG deterministic but stabilizes it with twin critics, delayed actor updates, and target policy smoothing.',
    href: '/docs/03-off-policy-policy-based/td3-and-sac',
  },
  {
    id: 'sac',
    label: 'SAC',
    year: '2018',
    x: 1290,
    y: 525,
    kind: 'algorithm',
    family: 'policy',
    status: 'workhorse',
    tags: ['policy-based', 'actor-critic', 'model-free', 'off-policy', 'continuous-actions', 'stochastic-policy', 'temporal-difference'],
    model: 'free',
    actions: 'continuous',
    policy: 'off',
    blurb:
      'Trains a stochastic off-policy actor under a maximum-entropy objective: succeed while keeping useful action randomness.',
    href: '/docs/03-off-policy-policy-based/td3-and-sac',
    labelDy: -28,
  },

  // ===== Model-based =====
  {
    id: 'dyna',
    label: 'Dyna-Q',
    year: '1990',
    x: 500,
    y: 775,
    kind: 'algorithm',
    family: 'background',
    status: 'classic',
    comingSoon: true,
    tags: ['model-based'],
    model: 'learned',
    actions: 'discrete',
    policy: 'off',
    blurb:
      'Learns a model from real transitions, then trains Q-learning on simulated updates in the background. Planning and learning share one value function.',
    labelDx: -40,
    labelDy: -4,
  },
  {
    id: 'mpc',
    label: 'MPC',
    year: '1970s',
    x: 790,
    y: 740,
    kind: 'algorithm',
    family: 'planning',
    status: 'active',
    comingSoon: true,
    tags: ['model-based'],
    model: 'exact',
    actions: 'continuous',
    policy: 'na',
    blurb:
      'Optimizes a short action sequence inside a model, executes only the first action, then replans from the new state. This is decision-time planning for continuous control.',
  },
  {
    id: 'mcts',
    label: 'MCTS',
    year: '2006',
    x: 950,
    y: 705,
    kind: 'algorithm',
    family: 'planning',
    status: 'active',
    comingSoon: true,
    tags: ['model-based'],
    model: 'exact',
    actions: 'discrete',
    policy: 'na',
    blurb:
      'Builds a search tree from the current state by simulating futures with a model, then chooses the action supported by the tree statistics.',
  },
  {
    id: 'alphazero',
    label: 'AlphaZero',
    year: '2017',
    x: 1085,
    y: 795,
    kind: 'algorithm',
    family: 'planning',
    status: 'active',
    comingSoon: true,
    tags: ['model-based'],
    model: 'exact',
    actions: 'discrete',
    policy: 'na',
    blurb:
      'Uses exact game rules for MCTS at decision time, guided by a policy/value network trained from self-play search targets.',
  },
  {
    id: 'muzero',
    label: 'MuZero',
    year: '2019',
    x: 1220,
    y: 875,
    kind: 'algorithm',
    family: 'planning',
    status: 'active',
    comingSoon: true,
    tags: ['model-based'],
    model: 'learned',
    actions: 'discrete',
    policy: 'na',
    blurb:
      'Keeps the AlphaZero search loop but replaces known rules with a learned latent dynamics model used for planning.',
  },
  {
    id: 'mbpo',
    label: 'MBPO',
    year: '2019',
    x: 650,
    y: 835,
    kind: 'algorithm',
    family: 'background',
    status: 'active',
    comingSoon: true,
    tags: ['model-based'],
    model: 'learned',
    actions: 'continuous',
    policy: 'off',
    blurb:
      'Branches short model-generated rollouts from real replay states and feeds them to SAC, gaining sample efficiency while limiting model bias.',
  },
  {
    id: 'dreamer',
    label: 'Dreamer',
    year: '2020',
    x: 520,
    y: 910,
    kind: 'algorithm',
    family: 'background',
    status: 'active',
    comingSoon: true,
    tags: ['model-based'],
    model: 'learned',
    actions: 'both',
    policy: 'off',
    blurb:
      'Learns a compact latent world model and trains actor-critic behavior inside imagined futures, using the model as a training environment.',
  },

];

export const continuations: MapContinuation[] = [
  { from: 'ppo', toX: 1325, toY: 122 },
  { from: 'sac', toX: 1455, toY: 510 },
  { from: 'muzero', toX: 1310, toY: 910 },
];

export const edges: MapEdge[] = [
  // foundations spine
  { from: 'bandits', to: 'mdp' },
  { from: 'mdp', to: 'dp' },
  { from: 'dp', to: 'mc-td' },
  { from: 'mc-td', to: 'sarsa' },
  { from: 'mc-td', to: 'q-learning' },
  // DQN line
  { from: 'q-learning', to: 'dqn' },
  { from: 'dqn', to: 'double-dqn' },
  { from: 'dqn', to: 'dueling' },
  { from: 'dqn', to: 'c51' },
  { from: 'double-dqn', to: 'rainbow' },
  { from: 'dueling', to: 'rainbow' },
  { from: 'c51', to: 'rainbow' },
  // policy gradient line
  { from: 'mdp', to: 'reinforce' },
  { from: 'reinforce', to: 'a2c' },
  { from: 'a2c', to: 'trpo' },
  { from: 'trpo', to: 'ppo' },
  // off-policy actor-critic
  { from: 'dqn', to: 'ddpg' },
  { from: 'a2c', to: 'ddpg' },
  { from: 'ddpg', to: 'td3' },
  { from: 'ddpg', to: 'sac' },
  // model-based
  { from: 'q-learning', to: 'dyna' },
  { from: 'dyna', to: 'mbpo' },
  { from: 'sac', to: 'mbpo' },
  { from: 'dyna', to: 'dreamer' },
  { from: 'dp', to: 'mpc' },
  { from: 'dp', to: 'mcts' },
  { from: 'mcts', to: 'alphazero' },
  { from: 'alphazero', to: 'muzero' },
];

