import test from 'node:test';
import assert from 'node:assert/strict';
import { CUE, TARGET, REAL, APPROX, findShot, simulate } from './model.mjs';

test('a stationary shot does not invent motion or a collision', () => {
  const r = simulate(0, 0, REAL);
  assert.equal(r.contact, false);
  assert.equal(r.pocket, false);
  assert.deepEqual(r.frames.at(-1).map(({ x, y }) => ({ x, y })), [CUE, TARGET]);
});
test('accurate-model search collides with and pockets the target without a scratch', () => {
  const shot = findShot(REAL);
  assert.ok(shot);
  const predicted = simulate(shot.angle, shot.power, REAL);
  const actual = simulate(shot.angle, shot.power, REAL);
  assert.ok(actual.contact && actual.pocket && !actual.scratch);
  assert.deepEqual(actual.frames, predicted.frames);
});
test('biased-model success is not substituted for the actual physics result', () => {
  const shot = findShot(APPROX);
  assert.ok(shot);
  assert.equal(simulate(shot.angle, shot.power, APPROX).pocket, true);
  assert.equal(simulate(shot.angle, shot.power, REAL).pocket, false);
});
test('sampled wall shots keep finite states inside the table and eventually stop', () => {
  for (const angle of [-180, -90, -20, 0, 90, 180]) {
    const r = simulate(angle, 100, REAL);
    assert.ok(r.frames.length < 900);
    for (const frame of r.frames) for (const b of frame) {
      assert.ok(Number.isFinite(b.x) && Number.isFinite(b.y));
      assert.ok(b.x >= 29 && b.x <= 691 && b.y >= 29 && b.y <= 371);
    }
  }
});
