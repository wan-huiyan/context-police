// Plugin-install path resolution for render_treatment_report.py.
//
// A skill installed as a PLUGIN lives at
//   ~/.claude/plugins/cache/<marketplace>/context-police/<version>/skills/context-police/...
// and NOT at ~/.claude/skills/context-police/. An instruction that reaches the
// script through the ~/.claude/skills/ root alone misses on every plugin
// install, and the usual "log it and continue" response makes the recap step do
// nothing while the run still reads clean.
//
// These tests extract the resolver verbatim out of SKILL.md / README.md and
// execute it, so the documented snippet is the thing under test — not a copy of
// it that could drift.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = 'render_treatment_report.py';

/** Pull the three-root resolver out of a doc: the `S=` chain, nothing else. */
function extractResolver(file) {
  const lines = readFileSync(join(root, file), 'utf8').split('\n');
  const start = lines.findIndex((l) => l.startsWith('S="${CLAUDE_PLUGIN_ROOT'));
  assert.notEqual(start, -1, `${file}: no resolver found (expected an S="\${CLAUDE_PLUGIN_ROOT...} line)`);
  const end = lines.findIndex((l, i) => i >= start && l.includes('cut -f2-)"'));
  assert.notEqual(end, -1, `${file}: resolver has no plugin-cache fallback (expected a cut -f2-)" line)`);
  return lines.slice(start, end + 1).join('\n');
}

/** Run the resolver with a fake HOME; return { path, stderr }. */
function resolve(snippet, home, env = {}) {
  const r = spawnSync('bash', ['-c', `${snippet}\nprintf '%s' "$S"`], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOME: home, ...env },
  });
  assert.equal(r.status, 0, `resolver exited ${r.status}: ${r.stderr}`);
  return { path: r.stdout, stderr: r.stderr };
}

/** Build a fake plugin cache: [marketplace, version] pairs, all carrying the script. */
function fakeHome(entries) {
  const home = mkdtempSync(join(tmpdir(), 'cp-home-'));
  for (const [marketplace, version] of entries) {
    const dir = join(home, '.claude', 'plugins', 'cache', marketplace,
      'context-police', version, 'skills', 'context-police', 'scripts');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, SCRIPT), '#!/usr/bin/env python3\n');
  }
  return home;
}

const resolvers = ['SKILL.md', 'README.md'].map((f) => [f, extractResolver(f)]);

test('SKILL.md and README.md ship the identical resolver', () => {
  assert.equal(resolvers[1][1], resolvers[0][1],
    'the resolver drifted between SKILL.md and README.md — both are rendered surfaces, fix both');
});

for (const [file, snippet] of resolvers) {
  test(`${file}: resolves a plugin-cache install (no ~/.claude/skills/ dir at all)`, () => {
    const home = fakeHome([['wan-huiyan-context-police', '2.3.0']]);
    try {
      const { path } = resolve(snippet, home);
      assert.equal(path, join(home, '.claude/plugins/cache/wan-huiyan-context-police',
        'context-police/2.3.0/skills/context-police/scripts', SCRIPT));
    } finally { rmSync(home, { recursive: true, force: true }); }
  });

  test(`${file}: ranks on the VERSION segment, not the marketplace name`, () => {
    // The marketplace segment PRECEDES the version in the path, so a plain
    // `sort -V` over whole paths ranks by marketplace name and lets
    // aaa-mkt/2.5.0 lose to zzz-mkt/1.0.0.
    const home = fakeHome([['aaa-marketplace', '2.5.0'], ['zzz-marketplace', '1.0.0']]);
    try {
      const { path } = resolve(snippet, home);
      assert.match(path, /aaa-marketplace\/context-police\/2\.5\.0\//,
        'picked the alphabetically-last marketplace instead of the highest version');
    } finally { rmSync(home, { recursive: true, force: true }); }
  });

  test(`${file}: orders versions numerically (2.10.0 beats 2.9.0)`, () => {
    const home = fakeHome([['mkt', '2.9.0'], ['mkt', '2.10.0']]);
    try {
      assert.match(resolve(snippet, home).path, /\/2\.10\.0\//);
    } finally { rmSync(home, { recursive: true, force: true }); }
  });

  test(`${file}: prefers ~/.claude/skills/ over the plugin cache`, () => {
    const home = fakeHome([['mkt', '9.9.9']]);
    const dir = join(home, '.claude/skills/context-police/scripts');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, SCRIPT), '#!/usr/bin/env python3\n');
    try {
      assert.equal(resolve(snippet, home).path, join(dir, SCRIPT));
    } finally { rmSync(home, { recursive: true, force: true }); }
  });

  test(`${file}: CLAUDE_PLUGIN_ROOT wins when it actually holds the script`, () => {
    const home = fakeHome([['mkt', '9.9.9']]);
    const pluginRoot = join(home, 'somewhere', 'context-police');
    const dir = join(pluginRoot, 'skills/context-police/scripts');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, SCRIPT), '#!/usr/bin/env python3\n');
    try {
      const { path } = resolve(snippet, home, { CLAUDE_PLUGIN_ROOT: pluginRoot });
      assert.equal(path, join(dir, SCRIPT));
    } finally { rmSync(home, { recursive: true, force: true }); }
  });

  test(`${file}: an unset CLAUDE_PLUGIN_ROOT is not treated as a path`, () => {
    // "${VAR:+...}" must collapse to the empty string, not to "/skills/...".
    const home = fakeHome([['mkt', '1.0.0']]);
    try {
      assert.match(resolve(snippet, home, { CLAUDE_PLUGIN_ROOT: '' }).path, /\/1\.0\.0\//);
    } finally { rmSync(home, { recursive: true, force: true }); }
  });

  test(`${file}: a missing plugin cache fails quietly, with nothing on stderr`, () => {
    // A shell glob would blow up here before 2>/dev/null could apply; find does not.
    const home = mkdtempSync(join(tmpdir(), 'cp-home-'));
    try {
      const { path, stderr } = resolve(snippet, home);
      assert.equal(path, '', 'resolved to something in a home with no install at all');
      assert.equal(stderr, '', `resolver leaked to stderr: ${stderr}`);
    } finally { rmSync(home, { recursive: true, force: true }); }
  });
}

for (const file of ['SKILL.md', 'README.md']) {
  test(`${file}: never invokes a script through the ~/.claude/skills/ root alone`, () => {
    const offenders = readFileSync(join(root, file), 'utf8')
      .split('\n')
      .filter((l) => /^\s*(python3?|bash|sh)\s+["']?~\/\.claude\/skills\//.test(l));
    assert.deepEqual(offenders, [],
      `${file} invokes a script via a single hardcoded root — a plugin install misses it entirely`);
  });

  test(`${file}: the not-found message names the paths it tried`, () => {
    const text = readFileSync(join(root, file), 'utf8');
    assert.match(text, /not found - tried .*CLAUDE_PLUGIN_ROOT.*claude\/skills.*plugin cache/,
      `${file} must say "not found - tried <paths>" — a failed lookup is not evidence about install state`);
  });
}
