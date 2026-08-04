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
