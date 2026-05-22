// Copies content/docs/**/figures/* into public/docs-assets/<...>/
// so Next.js can serve chapter assets that live next to their MDX source.
//
// Layout: content/docs/<section>/<chapter>/figures/<file>
//   ->    public/docs-assets/<section>/<chapter>/<file>
// The "figures" path segment is stripped so MDX uses short paths like
//   src="/docs-assets/01-value-based/dqn/architecture.png"
//
// Wired into package.json as predev/prebuild. The destination is rebuilt
// from scratch on every run, so stale files don't accumulate.

import {
  readdirSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  rmSync,
} from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';

const SRC = 'content/docs';
const DST = 'public/docs-assets';

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

if (existsSync(DST)) rmSync(DST, { recursive: true });

let count = 0;
for (const file of walk(SRC)) {
  const rel = relative(SRC, file);
  const parts = rel.split(sep);
  const figIdx = parts.indexOf('figures');
  if (figIdx === -1) continue;
  const outRel = [...parts.slice(0, figIdx), ...parts.slice(figIdx + 1)].join(sep);
  const out = join(DST, outRel);
  mkdirSync(dirname(out), { recursive: true });
  copyFileSync(file, out);
  count += 1;
}

console.log(`sync-figures: copied ${count} file(s) into ${DST}`);
