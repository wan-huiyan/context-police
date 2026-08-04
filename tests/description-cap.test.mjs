// The per-skill description cap gate (scripts/check_skill_descriptions.py).
//
// Two things are worth locking down here:
//   1. the gate's own arithmetic and exit codes, and
//   2. that THIS repo's SKILL.md passes it — a skill that polices catalog cost
//      shipping an over-cap description would be self-refuting.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gate = join(root, 'scripts', 'check_skill_descriptions.py');

// The cap the harness applies (skillListingMaxDescChars, default 1536).
const CAP = 1536;

function run(args) {
  return spawnSync('python3', [gate, ...args, '--no-color'], { encoding: 'utf8' });
}

function withSkill(frontmatter, body = 'body\n') {
  const dir = mkdtempSync(join(tmpdir(), 'cp-desc-'));
  const skillDir = join(dir, 'a-skill');
  mkdirSync(skillDir);
  writeFileSync(join(skillDir, 'SKILL.md'), `---\n${frontmatter}\n---\n\n${body}`);
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test('this repo\'s own SKILL.md is within the cap', () => {
  const r = run([join(root, 'SKILL.md')]);
  assert.equal(r.status, 0,
    `context-police's own description is over the cap it enforces:\n${r.stdout}`);
});

test('a description over the cap fails with exit 1', () => {
  const { dir, cleanup } = withSkill(`name: too-long\ndescription: ${'x'.repeat(CAP + 1)}`);
  try {
    const r = run([dir]);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /OVER CAP \(1\)/);
  } finally { cleanup(); }
});

test('a description exactly at the cap passes', () => {
  const { dir, cleanup } = withSkill(`name: exact\ndescription: ${'x'.repeat(CAP)}`);
  try {
    assert.equal(run([dir]).status, 0);
  } finally { cleanup(); }
});

test('whenToUse shares the cap with description', () => {
  // The harness joins them as `${description} - ${whenToUse}` and caps the pair,
  // so two individually-legal fields can still bust the limit together.
  const half = 'y'.repeat(CAP - 100);
  const { dir, cleanup } = withSkill(
    `name: pair\ndescription: ${half}\nwhenToUse: ${'z'.repeat(200)}`);
  try {
    const r = run([dir]);
    assert.equal(r.status, 1, 'description + whenToUse must be measured together');
  } finally { cleanup(); }
});

test('disable-model-invocation skills are exempt', () => {
  // They never enter the listing, so their description costs nothing.
  const { dir, cleanup } = withSkill(
    `name: hidden\ndescription: ${'x'.repeat(CAP * 2)}\ndisable-model-invocation: true`);
  try {
    assert.equal(run([dir]).status, 0);
  } finally { cleanup(); }
});

test('trigger phrases past the cut are reported as lost', () => {
  // A quoted phrase pushed beyond char 1535 is invisible to the model.
  const filler = 'w'.repeat(CAP);
  const { dir, cleanup } = withSkill(
    `name: trig\ndescription: Use when the user says "early trigger". ${filler} "late trigger"`);
  try {
    const r = run([dir, '--triggers']);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /invisible: late trigger/);
    assert.doesNotMatch(r.stdout, /invisible: early trigger/,
      'a trigger inside the cap must not be reported as lost');
  } finally { cleanup(); }
});

test('block-scalar descriptions are parsed, not skipped', () => {
  // `description: |` is common; a naive line parser reads it as empty and the
  // gate silently passes everything.
  const lines = Array.from({ length: 30 }, () => `  ${'q'.repeat(70)}`).join('\n');
  const { dir, cleanup } = withSkill(`name: block\ndescription: |\n${lines}`);
  try {
    const r = run([dir]);
    assert.equal(r.status, 1, 'block scalar over the cap must be caught');
  } finally { cleanup(); }
});

test('a nonexistent path exits 2 rather than passing silently', () => {
  assert.equal(run([join(root, 'no', 'such', 'path')]).status, 2);
});

test('--json reports counts and validates as JSON', () => {
  const { dir, cleanup } = withSkill(`name: j\ndescription: ${'x'.repeat(CAP + 1)}`);
  try {
    const r = run([dir, '--json']);
    const parsed = JSON.parse(r.stdout);
    assert.equal(parsed.counts.over_cap, 1);
    assert.equal(parsed.cap, CAP);
  } finally { cleanup(); }
});

test('a hyphen wrapped across folded-scalar lines is caught', () => {
  // `description: >` joins lines with a SPACE and textwrap.wrap() breaks on hyphens by
  // default, so a machine re-wrap silently injects "token- efficient review". The char
  // count is unchanged, so only a structural check can see it.
  const dir = mkdtempSync(join(tmpdir(), 'cp-wrap-'));
  const skillDir = join(dir, 'wrapped');
  mkdirSync(skillDir);
  writeFileSync(join(skillDir, 'SKILL.md'),
    '---\nname: wrapped\ndescription: >\n  Use when the user asks for a token-\n' +
    '  efficient review of the thing.\n---\n\nbody\n');
  try {
    const r = run([dir]);
    assert.equal(r.status, 1, 'a mid-token wrap must fail the gate');
    assert.match(r.stdout, /BROKEN BY LINE-WRAP/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a clean hyphenated description is not flagged', () => {
  // Guard against the wrap check firing on legitimate end-of-line hyphens.
  const { dir, cleanup } = withSkill(
    'name: clean\ndescription: >\n  Use for a token-efficient review.\n  Second line here.');
  try {
    assert.equal(run([dir]).status, 0);
  } finally { cleanup(); }
});

test('the dead tail is counted from cap-1, not cap', () => {
  // The harness keeps full[:cap-1] + an ellipsis, so an over-cap description loses
  // desc - (cap-1) chars. Reporting desc - cap undercounts every offender by one.
  const { dir, cleanup } = withSkill(`name: tail\ndescription: ${'x'.repeat(CAP + 100)}`);
  try {
    const r = run([dir, '--json']);
    const s = JSON.parse(r.stdout).skills.find((x) => x.name === 'tail');
    assert.equal(s.desc_chars, CAP + 100);
    // 100 over the cap means 101 characters past the truncation point.
    assert.match(r.stdout, /"over": true/);
  } finally { cleanup(); }
});

test('--compare flags a trigger narrowed by a new precondition', () => {
  // Word-overlap scoring is blind to this: the word set is identical.
  const dir = mkdtempSync(join(tmpdir(), 'cp-cmp-'));
  const a = join(dir, 'a.md'), b = join(dir, 'b.md');
  writeFileSync(a, '---\nname: s\ndescription: >\n  Use when "verifying a claim" -- and separately, if the SQL has no join.\n---\n\nx\n');
  writeFileSync(b, '---\nname: s\ndescription: >\n  Use when "verifying a claim" whose SQL has no join.\n---\n\nx\n');
  try {
    const r = spawnSync('python3', [gate, '--compare', a, b, '--no-color'], { encoding: 'utf8' });
    assert.equal(r.status, 1, 'a narrowed trigger must be reported');
    assert.match(r.stdout, /NARROWED/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
