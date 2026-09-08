// @ts-check

/** @typedef {{ action: number, probability: number, reward: number, nextState: number, nextValue: number, q: number, contribution: number }} BackupTerm */
/** @typedef {{ state: number, oldValue: number, newValue: number, terms: BackupTerm[] }} BackupRecord */
/** @typedef {{ gamma: number, values: number[], policy: number[][], snapshot: number[], records: Array<BackupRecord | null>, cursor: number, sweeps: number, improvements: number, delta: number | null, converged: boolean, stable: boolean }} State */

export const START = 12;
export const GOAL = 15;
export const CLIFF = Object.freeze([13, 14]);
export const ACTIVE_STATES = Object.freeze(Array.from({ length: 13 }, (_, state) => state));
export const THETA = 0.001;
const ACTIONS = 4;
const GRID_WIDTH = 4;
const TERMINAL_STATES = new Set([GOAL, ...CLIFF]);

/** @param {number} gamma */
function assertGamma(gamma) {
  if (!Number.isFinite(gamma) || gamma < 0 || gamma > 0.99) {
    throw new RangeError('gamma must be finite and in the range [0, 0.99]');
  }
}

/** @param {number} state @param {number} action */
function assertStateAction(state, action) {
  if (!Number.isInteger(state) || state < 0 || state > 15) throw new RangeError('state must be an integer from 0 to 15');
  if (!Number.isInteger(action) || action < 0 || action >= ACTIONS) throw new RangeError('action must be an integer from 0 to 3');
}

/** @param {number} state @param {number} action */
export function transition(state, action) {
  assertStateAction(state, action);
  if (TERMINAL_STATES.has(state)) return { nextState: state, reward: 0 };

  const row = Math.floor(state / GRID_WIDTH);
  const col = state % GRID_WIDTH;
  let nextRow = row;
  let nextCol = col;
  if (action === 0) nextRow -= 1;
  else if (action === 1) nextCol += 1;
  else if (action === 2) nextRow += 1;
  else nextCol -= 1;

  if (nextRow < 0 || nextRow >= GRID_WIDTH || nextCol < 0 || nextCol >= GRID_WIDTH) {
    return { nextState: state, reward: -1 };
  }
  const nextState = nextRow * GRID_WIDTH + nextCol;
  if (CLIFF.includes(nextState)) return { nextState: START, reward: -100 };
  return { nextState, reward: -1 };
}

/** @param {number[]} values @param {number[][]} policy */
function validateBackupInputs(values, policy) {
  if (!Array.isArray(values) || values.length < 16) throw new TypeError('values must contain 16 entries');
  if (!Array.isArray(policy) || policy.length < 16) throw new TypeError('policy must contain 16 rows');
}

/**
 * Inspect the fixed-policy Bellman expectation backup without changing either
 * input. Terminal and cliff cells have no backup terms and value zero.
 * @param {number} stateIndex
 * @param {number[]} values
 * @param {number[][]} policy
 * @param {number} gamma
 * @returns {BackupRecord}
 */
export function inspectBackup(stateIndex, values, policy, gamma) {
  assertGamma(gamma);
  validateBackupInputs(values, policy);
  if (!Number.isInteger(stateIndex) || stateIndex < 0 || stateIndex > 15) throw new RangeError('state must be an integer from 0 to 15');
  const oldValue = Number(values[stateIndex]);
  if (TERMINAL_STATES.has(stateIndex)) return { state: stateIndex, oldValue, newValue: 0, terms: [] };

  const row = policy[stateIndex];
  if (!Array.isArray(row) || row.length < ACTIONS) throw new TypeError('each policy row must contain 4 probabilities');
  const terms = [];
  let newValue = 0;
  for (let action = 0; action < ACTIONS; action += 1) {
    const probability = Number(row[action]);
    const { nextState, reward } = transition(stateIndex, action);
    const nextValue = TERMINAL_STATES.has(nextState) ? 0 : Number(values[nextState]);
    const q = reward + gamma * nextValue;
    const contribution = probability * q;
    terms.push({ action, probability, reward, nextState, nextValue, q, contribution });
    newValue += contribution;
  }
  return { state: stateIndex, oldValue, newValue, terms };
}

/** @param {State} state @returns {State} */
function cloneState(state) {
  return {
    gamma: state.gamma,
    values: state.values.slice(),
    policy: state.policy.map((row) => row.slice()),
    snapshot: state.snapshot.slice(),
    records: state.records.map((record) => record ? { ...record, terms: record.terms.map((term) => ({ ...term })) } : null),
    cursor: state.cursor,
    sweeps: state.sweeps,
    improvements: state.improvements,
    delta: state.delta,
    converged: state.converged,
    stable: state.stable,
  };
}

/** @param {number} gamma @returns {State} */
export function createState(gamma = 0.9) {
  assertGamma(gamma);
  return {
    gamma,
    values: Array(16).fill(0),
    policy: Array.from({ length: 16 }, () => Array(ACTIONS).fill(1 / ACTIONS)),
    snapshot: Array(16).fill(0),
    records: Array(16).fill(null),
    cursor: 0,
    sweeps: 0,
    improvements: 0,
    delta: null,
    converged: false,
    stable: false,
  };
}

/** @param {State} state @returns {State} */
export function stepBackup(state) {
  const next = cloneState(state);
  if (next.converged || next.stable) return next;
  if (next.cursor === 0) {
    next.snapshot = next.values.slice();
    next.records = Array(16).fill(null);
    next.delta = null;
  }

  const stateIndex = ACTIVE_STATES[next.cursor];
  const record = inspectBackup(stateIndex, next.snapshot, next.policy, next.gamma);
  next.values[stateIndex] = record.newValue;
  next.records[stateIndex] = record;
  next.cursor += 1;
  if (next.cursor === ACTIVE_STATES.length) {
    next.cursor = 0;
    next.sweeps += 1;
    next.delta = ACTIVE_STATES.reduce((maximum, index) => Math.max(maximum, Math.abs(next.values[index] - next.snapshot[index])), 0);
    next.converged = next.delta < THETA;
  }
  return next;
}

/** @param {State} state @returns {State} */
export function evaluateSweep(state) {
  let next = cloneState(state);
  if (next.converged || next.stable) return next;
  const count = next.cursor === 0 ? ACTIVE_STATES.length : ACTIVE_STATES.length - next.cursor;
  for (let index = 0; index < count; index += 1) next = stepBackup(next);
  return next;
}

/**
 * Sweep until the value function stops moving. gamma is capped at 0.99, so the
 * Bellman expectation operator is a contraction and this terminates: the worst
 * case on this grid is 552 sweeps at gamma = 0.99.
 * @param {State} state
 * @returns {State}
 */
export function evaluateToConvergence(state) {
  let next = cloneState(state);
  while (!next.converged && !next.stable) next = evaluateSweep(next);
  return next;
}

/** @param {State} state @returns {State} */
export function improvePolicy(state) {
  const next = cloneState(state);
  if (!next.converged) return next;

  const policy = next.policy.map((row) => row.slice());
  for (const stateIndex of ACTIVE_STATES) {
    const qValues = Array.from({ length: ACTIONS }, (_, action) => {
      const { nextState, reward } = transition(stateIndex, action);
      const nextValue = TERMINAL_STATES.has(nextState) ? 0 : next.values[nextState];
      return reward + next.gamma * nextValue;
    });
    const best = Math.max(...qValues);
    const tied = qValues.map((value) => Math.abs(value - best) <= 1e-8 + 1e-5 * Math.abs(best));
    const tieCount = tied.filter(Boolean).length;
    policy[stateIndex] = tied.map((isTied) => isTied ? 1 / tieCount : 0);
  }

  const changed = policy.some((row, rowIndex) => row.some((value, action) => value !== next.policy[rowIndex][action]));
  next.improvements += 1;
  if (changed) {
    next.policy = policy;
    next.records = Array(16).fill(null);
    next.delta = null;
    next.converged = false;
    next.cursor = 0;
    next.stable = false;
  } else {
    next.stable = true;
    next.converged = true;
  }
  return next;
}
