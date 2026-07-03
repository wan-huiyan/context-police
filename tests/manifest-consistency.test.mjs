// Manifest consistency: marketplace.json, plugin.json, VERSION (if present),
// and SKILL.md frontmatter must agree. Zero deps — node --test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const marketplace = readJson('.claude-plugin/marketplace.json');
const plugin = readJson('plugins/context-police/.claude-plugin/plugin.json');
const marketplaceEntry = marketplace.plugins?.find((p) => p.name === plugin.name);

test('marketplace.json lists the plugin by name', () => {
  assert.ok(
    marketplaceEntry,
    `no entry named "${plugin.name}" in .claude-plugin/marketplace.json plugins[]`,
  );
});

test('marketplace.json and plugin.json agree on version', () => {
  assert.equal(
    marketplaceEntry?.version,
    plugin.version,
    'marketplace.json plugin version must match plugin.json version',
  );
});

test('VERSION file (if present) matches plugin.json version', (t) => {
  const versionFile = join(root, 'VERSION');
  if (!existsSync(versionFile)) {
    t.skip('no VERSION file in repo root');
    return;
  }
  const version = readFileSync(versionFile, 'utf8').trim();
  assert.equal(version, plugin.version, 'VERSION file must match plugin.json version');
});

test('SKILL.md frontmatter name matches plugin.json name', () => {
  const skill = readFileSync(join(root, 'SKILL.md'), 'utf8');
  const fm = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(fm, 'SKILL.md must start with a YAML frontmatter block');
  const name = fm[1].match(/^name:\s*(\S+)\s*$/m)?.[1];
  assert.equal(name, plugin.name, 'SKILL.md frontmatter name must match plugin.json name');
});
