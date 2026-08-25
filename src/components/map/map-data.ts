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

// ===========================================================================
// Localization
// ---------------------------------------------------------------------------
// The primary data above is English. These per-entity overrides provide the
// Chinese labels/blurbs; `localize(lang)` merges them into a fully-localized
// snapshot. Adding a new language means adding another override table and a
// branch in `localize`.
// ===========================================================================

import type { UILang } from '@/lib/ui';

const nodeZh: Record<string, { label?: string; blurb?: string }> = {
  bandits: {
    label: 'Bandits',
    blurb:
      '一个状态、多只手臂：探索–利用困境最纯粹的形式，也是本手册的起点。',
  },
  mdp: {
    label: 'MDP',
    blurb:
      '状态、动作、奖励、转移：所有强化学习算法所处的形式化框架，也是图谱的中心。',
  },
  dp: {
    label: 'DP',
    blurb:
      '在已知模型下进行精确规划。策略迭代和值迭代引入贝尔曼备份，其后的所有方法都对其近似。',
  },
  'mc-td': {
    label: 'MC & TD',
    blurb:
      '去掉模型：从采样经验中估计价值。蒙特卡洛等待完整回报；时序差分从单步进行引导。',
  },
  sarsa: {
    label: 'Sarsa',
    blurb:
      '同策略单步 TD 控制：从实际采样的下一个动作进行引导，因此学到的价值包含探索代价。',
  },
  'q-learning': {
    label: 'Q-Learning',
    blurb:
      '异策略单步 TD 控制：从贪婪的下一动作引导，而行为策略仍可保持探索性。',
  },
  dqn: {
    label: 'DQN',
    blurb:
      '用神经网络替代 Q 表，并通过经验回放与目标网络稳定异策略引导。',
  },
  'double-dqn': {
    label: 'Double DQN',
    blurb:
      '用在线网络选择下一个贪婪动作、用目标网络评估它，减少噪声最大化的过高估计。',
  },
  dueling: {
    label: 'Dueling DQN',
    blurb:
      '将 Q 值拆分为共享状态值流和动作优势流，使网络能分别学习状态质量与动作差异。',
  },
  c51: {
    label: 'C51',
    blurb:
      '预测类别化的回报分布而非仅期望 Q 值，为贝尔曼目标提供更丰富的结构。',
  },
  rainbow: {
    label: 'Rainbow',
    blurb:
      '组合 Double DQN、优先级回放、决斗头、多步目标、Noisy Nets 与 C51；其消融实验是主要教训。',
  },
  reinforce: {
    label: 'REINFORCE',
    blurb:
      '基本的蒙特卡洛策略梯度算法：按采样动作的回合回报成比例地提高其对数概率。',
  },
  a2c: {
    label: 'A2C / A3C',
    blurb:
      '加入学习到的价值评论家来估计引导优势，降低策略梯度方差；A3C 异步收集。',
  },
  trpo: {
    label: 'TRPO',
    blurb:
      '用 KL 信任区域约束策略改进，使单次更新不会把收集数据的策略推得太远。',
  },
  ppo: {
    label: 'PPO',
    blurb:
      '用裁剪的代理目标近似信任区域行为，让策略更新简单、稳定且可复用。',
  },
  ddpg: {
    label: 'DDPG',
    blurb:
      '针对连续动作的异策略 Actor-Critic：确定性 actor 沿学习到的 Q 评论家的梯度行动，从回放中训练。',
  },
  td3: {
    label: 'TD3',
    blurb:
      '保持 DDPG 的确定性但加以稳定：双评论家、延迟 actor 更新、目标策略平滑。',
  },
  sac: {
    label: 'SAC',
    blurb:
      '在最大熵目标下训练随机异策略 actor：在成功的同时保留有用的动作随机性。',
  },
  dyna: {
    label: 'Dyna-Q',
    blurb:
      '从真实转移学习模型，再在后台模拟更新上训练 Q 学习。规划与学习共享同一个值函数。',
  },
  mpc: {
    label: 'MPC',
    blurb:
      '在模型内优化短动作序列，只执行第一个动作，然后从新状态重新规划。这是连续控制的决策时规划。',
  },
  mcts: {
    label: 'MCTS',
    blurb:
      '用模型模拟未来、从当前状态构建搜索树，再根据树统计选择动作。',
  },
  alphazero: {
    label: 'AlphaZero',
    blurb:
      '决策时用精确游戏规则做 MCTS，由从自博弈搜索目标训练的策略/值网络引导。',
  },
  muzero: {
    label: 'MuZero',
    blurb:
      '保留 AlphaZero 搜索循环，但用学习到的潜在动力学模型替代已知规则用于规划。',
  },
  mbpo: {
    label: 'MBPO',
    blurb:
      '从真实回放状态分支短模型生成的 rollout 并喂给 SAC，在限制模型偏差的同时提升样本效率。',
  },
  dreamer: {
    label: 'Dreamer',
    blurb:
      '学习紧凑的潜在世界模型，并在想象未来中训练 actor-critic 行为，把模型当作训练环境。',
  },
};

const nodeRu: Record<string, { label?: string; blurb?: string }> = {
  bandits: {
    label: 'Бандиты',
    blurb:
      'Одно состояние и множество ручек: дилемма exploration–exploitation в чистом виде. С этого начинается хэндбук.',
  },
  mdp: {
    blurb:
      'Состояния, действия, награды и переходы: формализм, в котором описывается любой алгоритм RL. Центр карты.',
  },
  dp: {
    label: 'Динамическое программирование',
    blurb:
      'Точное планирование при известной модели. Policy iteration и value iteration вводят обновление Беллмана, которое приближённо воспроизводят последующие методы.',
  },
  'mc-td': {
    blurb:
      'Отказываемся от модели и оцениваем ценности по собранному опыту. Monte Carlo ждёт полный return, а TD использует одношаговый bootstrap.',
  },
  sarsa: {
    blurb:
      'Одношаговый on-policy TD-контроль: bootstrap выполняется по следующему фактически выбранному действию, поэтому оценка учитывает цену exploration.',
  },
  'q-learning': {
    blurb:
      'Одношаговый off-policy TD-контроль: bootstrap выполняется по жадному следующему действию, хотя поведенческая политика может продолжать исследовать среду.',
  },
  dqn: {
    blurb:
      'Заменяет Q-таблицу нейросетью и стабилизирует off-policy bootstrap с помощью replay buffer и target network.',
  },
  'double-dqn': {
    blurb:
      'Online network выбирает следующее жадное действие, а target network оценивает его — это уменьшает завышение оценок из-за максимизации по шуму.',
  },
  dueling: {
    blurb:
      'Разделяет Q-значение на поток ценности состояния и поток преимущества действия, чтобы сеть отдельно учила качество состояния и различия между действиями.',
  },
  c51: {
    blurb:
      'Предсказывает категориальное распределение return вместо одного ожидаемого Q-значения и тем самым сохраняет больше информации в цели Беллмана.',
  },
  rainbow: {
    blurb:
      'Объединяет Double DQN, prioritized replay, dueling-архитектуру, многошаговые цели, Noisy Nets и C51. Главный вывод даёт абляция компонентов.',
  },
  reinforce: {
    blurb:
      'Базовый алгоритм градиента политики по Monte Carlo: логарифмическая вероятность выбранного действия увеличивается пропорционально return эпизода.',
  },
  a2c: {
    blurb:
      'Обучаемый critic оценивает bootstrap advantage и снижает дисперсию градиента политики; A3C собирает опыт асинхронно.',
  },
  trpo: {
    blurb:
      'Ограничивает обновление политики доверительной областью по KL-дивергенции, чтобы новая политика не уходила слишком далеко от собравшей данные.',
  },
  ppo: {
    blurb:
      'Приближает поведение trust region с помощью clipped surrogate objective, делая обновления политики простыми, устойчивыми и пригодными для нескольких эпох.',
  },
  ddpg: {
    blurb:
      'Off-policy actor-critic для непрерывных действий: детерминированный actor обучается по градиенту Q-функции critic на данных из replay buffer.',
  },
  td3: {
    blurb:
      'Сохраняет детерминированную политику DDPG, но добавляет два critic, отложенные обновления actor и сглаживание целевой политики.',
  },
  sac: {
    blurb:
      'Обучает стохастический off-policy actor с maximum-entropy objective: политика одновременно максимизирует награду и сохраняет полезную случайность действий.',
  },
  dyna: {
    blurb:
      'Учит модель по реальным переходам, а затем обновляет Q-learning на синтетическом опыте. Планирование и обучение используют одну функцию ценности.',
  },
  mpc: {
    blurb:
      'Оптимизирует в модели короткую последовательность действий, выполняет только первое и строит новый план из следующего состояния.',
  },
  mcts: {
    blurb:
      'Моделирует будущие переходы, строит дерево поиска из текущего состояния и выбирает действие по накопленной статистике дерева.',
  },
  alphazero: {
    blurb:
      'Запускает MCTS по точным правилам игры, направляя поиск сетью политики и ценности, обученной по результатам self-play.',
  },
  muzero: {
    blurb:
      'Сохраняет поисковый цикл AlphaZero, но заменяет известные правила обучаемой латентной моделью динамики.',
  },
  mbpo: {
    blurb:
      'Запускает короткие model rollouts из состояний replay buffer и передаёт их SAC, повышая sample efficiency при ограниченном model bias.',
  },
  dreamer: {
    blurb:
      'Учит компактную латентную world model и тренирует actor-critic на воображаемых траекториях, используя модель как среду обучения.',
  },
};

const familyZh: Record<FamilyId, { label?: string; blurb?: string }> = {
  foundations: {
    label: '基础',
    blurb:
      '一切方法所依赖的思想：赌博机探索、MDP 形式化、贝尔曼规划，以及从原始经验中学习价值。',
  },
  value: {
    label: '基于值',
    blurb:
      '学习每个动作有多好，然后贪婪地行动。从表格型 TD 控制到攻克雅达利的深度 Q 网络。',
  },
  policy: {
    label: '基于策略',
    blurb:
      '直接优化参数化策略：REINFORCE、Actor-Critic、信任区域以及连续控制变体。',
  },
  planning: {
    label: '决策时规划',
    blurb:
      '在选择下一步动作时使用模型：从当前状态模拟可能的未来，运行搜索或优化，然后按最佳方案行动。',
  },
  background: {
    label: '后台训练',
    blurb:
      '在环境之外使用学习到的模型生成合成经验，再在这些想象转移上训练值函数或 Actor-Critic。',
  },
};

const familyRu: Record<FamilyId, { label?: string; blurb?: string }> = {
  foundations: {
    label: 'Основы',
    blurb:
      'Идеи, на которых строятся остальные методы: exploration в бандитах, формализм MDP, планирование Беллмана и обучение ценностей по опыту.',
  },
  value: {
    label: 'Value-based',
    blurb:
      'Оценить каждое действие, а затем выбирать лучшее: от табличного TD-контроля до глубоких Q-сетей, научившихся играть в Atari.',
  },
  policy: {
    label: 'Policy-based',
    blurb:
      'Непосредственно оптимизировать параметризованную политику: REINFORCE, actor-critic, trust region и методы непрерывного управления.',
  },
  planning: {
    label: 'Планирование при выборе действия',
    blurb:
      'Использовать модель при выборе следующего действия: смоделировать возможные будущие состояния, выполнить поиск или оптимизацию и следовать лучшему плану.',
  },
  background: {
    label: 'Фоновое обучение',
    blurb:
      'Создавать синтетический опыт с помощью обучаемой модели и тренировать на воображаемых переходах функцию ценности или actor-critic.',
  },
};

const regionZh: Record<string, string> = {
  'VALUE-BASED': 'VALUE-BASED',
  FOUNDATIONS: 'FOUNDATIONS',
  'POLICY-BASED': 'POLICY-BASED',
  'DECISION-TIME PLANNING': 'DECISION-TIME PLANNING',
  'BACKGROUND TRAINING': 'BACKGROUND TRAINING',
};

const regionRu: Record<string, string> = {
  'VALUE-BASED': 'VALUE-BASED МЕТОДЫ',
  FOUNDATIONS: 'ОСНОВЫ',
  'POLICY-BASED': 'POLICY-BASED МЕТОДЫ',
  'DECISION-TIME PLANNING': 'ПЛАНИРОВАНИЕ ПРИ ВЫБОРЕ ДЕЙСТВИЯ',
  'BACKGROUND TRAINING': 'ФОНОВОЕ ОБУЧЕНИЕ',
};

/**
 * Return a fully-localized snapshot of the map data for the given language.
 * English is the base; for other languages the per-entity overrides are merged
 * in, falling back to English for any entry that has not been translated yet.
 */
export function localize(lang: UILang) {
  if (lang === 'en') {
    return {
      nodes,
      familyMeta,
      regions,
      nodeById: new Map(nodes.map((n) => [n.id, n])),
    };
  }
  const nodeLocale = lang === 'ru' ? nodeRu : nodeZh;
  const familyLocale = lang === 'ru' ? familyRu : familyZh;
  const regionLocale = lang === 'ru' ? regionRu : regionZh;
  const lNodes = nodes.map((n) => ({
    ...n,
    label: nodeLocale[n.id]?.label ?? n.label,
    blurb: nodeLocale[n.id]?.blurb ?? n.blurb,
  }));
  const lNodeById = new Map(lNodes.map((n) => [n.id, n]));
  const lFamilyMeta = Object.fromEntries(
    (Object.keys(familyMeta) as FamilyId[]).map((k) => [
      k,
      {
        ...familyMeta[k],
        label: familyLocale[k]?.label ?? familyMeta[k].label,
        blurb: familyLocale[k]?.blurb ?? familyMeta[k].blurb,
      },
    ]),
  ) as Record<FamilyId, FamilyMeta>;
  const lRegions = regions.map((r) => ({
    ...r,
    label: regionLocale[r.label] ?? r.label,
  }));
  return { nodes: lNodes, familyMeta: lFamilyMeta, regions: lRegions, nodeById: lNodeById };
}
