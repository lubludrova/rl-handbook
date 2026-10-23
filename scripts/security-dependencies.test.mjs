import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

// Next's ESLint plugin only uses globSync(..., { onlyDirectories: true }).
// The scoped tinyglobby override removes the unpatched braces dependency
// (GHSA-vfj7-8cjw-p6xm). Recheck this API when updating the plugin version.
const require = createRequire(import.meta.url);
const requireFromConfig = createRequire(require.resolve('eslint-config-next'));
const { getRootDirs } = requireFromConfig('@next/eslint-plugin-next/dist/utils/get-root-dirs');

test('Next ESLint root discovery preserves directory glob behavior', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'rlh-eslint-roots-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const name of ['web', 'docs']) mkdirSync(join(root, name));
  writeFileSync(join(root, 'not-a-directory.txt'), '');
  const context = (rootDir) => ({ cwd: root, settings: { next: { rootDir } } });
  // tinyglobby may return relative paths. The rule uses filesystem operations,
  // so verify that both forms resolve to the same directories.
  const normalize = (paths) => paths.map((path) => resolve(path)).sort();
  const expected = ['docs', 'web'].map((name) => join(root, name));

  assert.deepEqual(getRootDirs({ cwd: root, settings: {} }), [root]);
  assert.deepEqual(normalize(getRootDirs(context(`${root}/*`))), expected);
  assert.deepEqual(normalize(getRootDirs(context(`${root}/{web,docs}`))), expected);
  assert.deepEqual(normalize(getRootDirs(context([`${root}/web`, `${root}/docs`]))), expected);
  assert.deepEqual(normalize(getRootDirs(context(`${root}/*`.replace(/\//g, '\\')))), expected);
  assert.deepEqual(getRootDirs(context(`${root}/missing-*`)), []);
});
