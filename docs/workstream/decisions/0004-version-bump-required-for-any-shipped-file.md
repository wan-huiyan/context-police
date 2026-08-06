# 0004 — Any commit touching a shipped file needs a version bump, even docs-only

**Status:** Accepted · **Date:** 2026-08-05 · **Shipped:** `overnight-workflows` #24, `claude-ecosystem-hygiene` #18

## Context

The workstream's own §4 records *"THE LESSON THAT ALMOST COST THE WHOLE THING: a description fix with
no version bump is undeliverable."* This session committed that failure anyway.

`overnight-workflows` #22 removed 12 dead cross-references from **six `SKILL.md` files under
`plugins/`** — shipped files — and bumped nothing. Its commit body asserted the opposite:

> The gate here is CI-only (not under a plugin source dir), so no version bump.

True of the gate; false of the commit, which also touched six shipped skills. `claude plugin update`
compares versions, saw them equal, and did nothing. **12 of the session's 32 cross-reference removals
were fixed on `main` and still live for an installed user.**

The reasoning error was scoping the bump question to *"did a description change?"* rather than
*"did a shipped file change?"*.

## Decision

The bump test is **"does this file ship to an installed user?"** — not "is it a description?", not "is
it code?". Resolve it from `marketplace.json`'s `source` field: anything under a plugin's source root
ships. A repo whose `source` is `./` ships everything, including `CHANGELOG.md` and `README.md`.

## Consequences

- Docs-only commits inside a plugin source dir now require a bump. Slightly more version churn;
  correct delivery.
- **Nothing automated catches a violation.** The live-install gate measures cap, corruption and
  triggers — never repo-vs-install parity. This was found by a fact-checking subagent reviewing a
  *report about* the session, after the session had been declared delivered.
- Follow-up filed: a CI rule that any commit touching `plugins/**` must also touch that plugin's
  version. That is the only thing that would have caught it.

## Confirmation

After bumping and installing: repo and installed copies **byte-identical** for all six files, and a
scoped re-scan finds **0** stranded removals in the three repos that were stripped.
