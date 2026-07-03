// Plugin-copy sync: the repo root is the source of truth; the plugin ships a
// byte-identical copy of SKILL.md and scripts/ under
// plugins/context-police/skills/context-police/. Drift fails CI.
// (scripts/dev/ is dev tooling, deliberately excluded from the plugin copy.)
// To fix a failure: scripts/dev/sync_plugin_copy.sh
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pluginRoot = join(root, 'plugins', 'context-police', 'skills', 'context-police');

const EXCLUDED_DIRS = new Set(['dev', '__pycache__']);

function walk(dir, base = dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      files.push(...walk(join(dir, entry.name), base));
    } else {
      files.push(relative(base, join(dir, entry.name)));
    }
  }
  return files.sort();
}

test('root SKILL.md is identical to the plugin copy', () => {
  const rootSkill = readFileSync(join(root, 'SKILL.md'), 'utf8');
  const pluginSkill = readFileSync(join(pluginRoot, 'SKILL.md'), 'utf8');
  assert.equal(
    pluginSkill,
    rootSkill,
    'SKILL.md drifted — run scripts/dev/sync_plugin_copy.sh (root is source of truth)',
  );
});

test('root scripts/ and plugin scripts/ contain the same files', () => {
  const rootFiles = walk(join(root, 'scripts'));
  const pluginFiles = walk(join(pluginRoot, 'scripts'));
  assert.deepEqual(
    pluginFiles,
    rootFiles,
    'scripts/ file sets drifted — run scripts/dev/sync_plugin_copy.sh (root is source of truth)',
  );
});

test('every scripts/ file is byte-identical in the plugin copy', () => {
  for (const file of walk(join(root, 'scripts'))) {
    const a = readFileSync(join(root, 'scripts', file));
    const b = readFileSync(join(pluginRoot, 'scripts', file));
    assert.ok(
      a.equals(b),
      `scripts/${file} drifted — run scripts/dev/sync_plugin_copy.sh (root is source of truth)`,
    );
  }
});
