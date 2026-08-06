# 0005 — Dangling cross-reference removal stays manual and allowlisted

**Status:** Accepted · **Date:** 2026-08-05 · **Shipped:** `agent-traffic-control` #9, `overnight-workflows` #22, `claude-ecosystem-hygiene` #16

## Context

Skills carry `See also` / `References` / `Sister skills` bullets pointing at other skills. A sweep
found ~45 identifiers that resolve nowhere — references to siblings that were never published.

The obvious fix is a regex sweep. It was written, run, and **thrown away**: keyed on "looks like a
skill name", it deleted bullets naming `the-project-repo` (a git repository), `the-dashboard-service`
(a Cloud Run service) and `scan-bugs-parallel` (a session label). None is a skill.

The residue also contains genuine external pointers — entries carrying GitHub URLs
(`interactive-feedback-report`) and explicit paths (`~/.claude/skills/claude-code-delayed-execution/`)
— which resolve for a reader even though no local `SKILL.md` declares that name.

## Decision

Remove only identifiers on an **explicitly vetted allowlist**, each re-confirmed to resolve nowhere
immediately before deletion, and only inside cross-reference sections. Specifically:

- **Scope to xref headings** (`See also`, `References`, `Sister skills`, `Relationship to other
  skills`). In `## Notes` / `## Worked example` the bullet is substantive prose that happens to name a
  skill; deleting it removes content, not a pointer.
- **Mixed bullets** naming both a live and a dead skill keep the bullet, lose only the dead name.
- **Never touch frontmatter** — 0 descriptions changed by the strip, so no version bump implied.

Result: 32 identifiers removed (42 bullets deleted, 3 mixed-bullet edits, 3 emptied headings), ~11
left deliberately.

## Consequences

- The remaining ~11 need a human eye and may be legitimate. Documented as "do not automate" in the
  handoff's next-session prompt.
- **Second-order lesson, learned the hard way:** the sweep was scoped to *bullets*, which meant it
  could never find a dead name inside a **description**. One existed
  (`skill-portfolio-audit`, fixed in `claude-ecosystem-hygiene` #18) and was found later by accident.
  **When you scope a sweep for safety, write down what the scope excludes — the exclusion is where
  the next defect lives.**
