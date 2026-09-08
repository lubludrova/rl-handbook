import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVE_STATES,
  CLIFF,
  GOAL,
  START,
  THETA,
  createState,
  evaluateSweep,
  evaluateToConvergence,
  improvePolicy,
  inspectBackup,
  stepBackup,
  transition,
} from './model.mjs';

const close = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not close to ${expected}`);

test('exports the fixed 4x4 layout and transition edge cases', () => {
  assert.equal(START, 12);
  assert.equal(GOAL, 15);
  assert.deepEqual(CLIFF, [13, 14]);
  assert.deepEqual(ACTIVE_STATES, Array.from({ length: 13 }, (_, index) => index));
  assert.deepEqual(transition(0, 0), { nextState: 0, reward: -1 });
  assert.deepEqual(transition(11, 2), { nextState: 15, reward: -1 });
  assert.deepEqual(transition(12, 1), { nextState: 12, reward: -100 });
  assert.deepEqual(transition(13, 0), { nextState: 13, reward: 0 });
  assert.deepEqual(transition(15, 2), { nextState: 15, reward: 0 });
});

test('the first backups use a frozen zero snapshot', () => {
  const initial = createState();
  const first = stepBackup(initial);
  assert.equal(first.records[0].newValue, -1);
  assert.equal(first.values[0], -1);
  assert.deepEqual(first.snapshot, Array(16).fill(0));
  const allZero = createState();
  const afterSweep = evaluateSweep(allZero);
  close(afterSweep.values[START], -25.75);
  assert.equal(afterSweep.sweeps, 1);
  assert.equal(afterSweep.cursor, 0);
});

test('inspectBackup reports the hand-checkable start terms', () => {
  const state = createState();
  const record = inspectBackup(START, state.values, state.policy, state.gamma);
  close(record.newValue, -25.75);
  assert.deepEqual(record.terms.map(({ action, probability, reward, nextState }) => ({ action, probability, reward, nextState })), [
    { action: 0, probability: 0.25, reward: -1, nextState: 8 },
    { action: 1, probability: 0.25, reward: -100, nextState: START },
    { action: 2, probability: 0.25, reward: -1, nextState: START },
    { action: 3, probability: 0.25, reward: -1, nextState: START },
  ]);
  assert.deepEqual(inspectBackup(GOAL, state.values, state.policy, state.gamma).terms, []);
  assert.deepEqual(inspectBackup(CLIFF[0], state.values, state.policy, state.gamma).terms, []);
});

test('stepBackup completes exactly thirteen active states', () => {
  let state = createState();
  for (let count = 1; count <= 12; count += 1) {
    state = stepBackup(state);
    assert.equal(state.cursor, count);
    assert.equal(state.sweeps, 0);
  }
  state = stepBackup(state);
  assert.equal(state.cursor, 0);
  assert.equal(state.sweeps, 1);
  assert.equal(state.records.filter(Boolean).length, 13);
  assert.equal(state.records[GOAL], null);
});

test('a partial sweep and a full sweep have identical results', () => {
  let partial = createState();
  for (let index = 0; index < 5; index += 1) partial = stepBackup(partial);
  const resumed = evaluateSweep(partial);
  const direct = evaluateSweep(createState());
  assert.deepEqual(resumed.values, direct.values);
  assert.deepEqual(resumed.policy, direct.policy);
  assert.equal(resumed.sweeps, direct.sweeps);
  assert.equal(resumed.delta, direct.delta);
});

test('all operations leave their input state and backup inputs untouched', () => {
  const state = createState();
  const stateBefore = structuredClone(state);
  const values = state.values.slice();
  const policy = state.policy.map((row) => row.slice());
  inspectBackup(0, values, policy, state.gamma);
  assert.deepEqual(values, state.values);
  assert.deepEqual(policy, state.policy);
  stepBackup(state);
  evaluateSweep(state);
  evaluateToConvergence(state);
  improvePolicy(state);
  assert.deepEqual(state, stateBefore);
});

test('evaluation does not change policy and policy improvement does not change values', () => {
  const evaluated = evaluateToConvergence(createState());
  assert.equal(evaluated.converged, true);
  const policyBefore = structuredClone(evaluated.policy);
  const valuesBefore = evaluated.values.slice();
  const improved = improvePolicy(evaluated);
  assert.deepEqual(evaluated.policy, policyBefore);
  assert.deepEqual(improved.values, valuesBefore);
});

test('policy improvement gates on convergence and resets evaluation after a change', () => {
  const initial = createState();
  assert.deepEqual(improvePolicy(initial), initial);
  const midSweep = stepBackup(initial);
  assert.deepEqual(improvePolicy(midSweep), midSweep);
  const converged = evaluateToConvergence(initial);
  const improved = improvePolicy(converged);
  assert.equal(improved.improvements, 1);
  assert.equal(improved.cursor, 0);
  assert.equal(improved.converged, false);
  assert.equal(improved.stable, false);
  assert.equal(improved.delta, null);
  assert.deepEqual(improved.records, Array(16).fill(null));
});

test('greedy ties are split uniformly, including np.isclose-scale ties', () => {
  const state = createState();
  state.values[0] = 10;
  state.converged = true;
  const changed = improvePolicy(state);
  assert.deepEqual(changed.policy[0], [0.5, 0, 0, 0.5]);
  const exactTie = createState();
  exactTie.values[0] = 0;
  exactTie.values[1] = 1e-9;
  exactTie.converged = true;
  const tied = improvePolicy(exactTie);
  assert.deepEqual(tied.policy[0], [0.25, 0.25, 0.25, 0.25]);
});

test('gamma validates its inclusive endpoints', () => {
  assert.equal(createState(0).gamma, 0);
  assert.equal(createState(0.99).gamma, 0.99);
  for (const gamma of [-0.01, 1, Infinity, NaN]) assert.throws(() => createState(gamma), RangeError);
});

test('convergence and stability are explicit and evaluation becomes a no-op', () => {
  const converged = evaluateToConvergence(createState());
  assert.equal(converged.converged, true);
  assert.equal(converged.delta < THETA, true);
  const noOp = evaluateToConvergence(converged);
  assert.deepEqual(noOp, converged);
  let stable = converged;
  do stable = improvePolicy(evaluateToConvergence(stable));
  while (!stable.stable);
  assert.equal(stable.stable, true);
  assert.equal(stable.converged, true);
  assert.deepEqual(evaluateSweep(stable), stable);
});

test('evaluation terminates for every gamma the UI can select', () => {
  // gamma <= 0.99 makes the backup a contraction, so this cannot spin forever.
  for (const gamma of [0, 0.5, 0.9, 0.95, 0.99]) {
    const converged = evaluateToConvergence(createState(gamma));
    assert.equal(converged.converged, true);
    assert.ok(converged.delta < THETA);
    assert.ok(converged.sweeps > 0 && converged.sweeps <= 600, `gamma ${gamma}: ${converged.sweeps} sweeps`);
  }
});
