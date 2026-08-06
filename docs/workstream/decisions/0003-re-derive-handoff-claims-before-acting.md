# 0003 — Re-derive a handoff's causal claims before acting on them

**Status:** Accepted · **Date:** 2026-08-05 · **Origin:** rejected instruction, `description-cap-workstream-handoff.md` §4b

## Context

The handoff this session executed opened its remaining-work list with:

> Re-vendor the gate at v2.2.1. This matters because v2.2.1 fixes an off-by-one — the dead tail is
> `desc − (cap−1)`, not `desc − cap` — so every "N chars discarded" figure now on main is one too low.

Two commands falsified it:

```
git diff 4dc1a62 eedad0f -- scripts/check_skill_descriptions.py   # touches only find_wrap_corruption()
grep -c 'MAX_DESC_CHARS - 1' <every vendored copy>                # 4, everywhere, already
```

`desc_chars - (MAX_DESC_CHARS - 1)` was already in v2.2.0. **No published figure was wrong.**
Following the instruction as written would have "corrected" correct figures across six repositories —
introducing exactly the error class the workstream exists to eliminate.

Two further handoff claims were also stale by execution time: `context-police#6` had merged (so every
"the fix is on an open PR / uncommitted upstream" narrative was resolved by a plain re-vendor), and
the "unreproducible coverage tables" item was true for `agent-review-panel` but **false** for
`claude-ecosystem-hygiene`, whose figures reproduce to four decimals once the harness's two stopword
variants are both read instead of only the tail.

## Decision

Before executing any handoff step that asserts a **causal** claim ("X changed, therefore recompute
Y"), spend one command re-deriving it. `git diff OLD NEW -- <file>` for a code claim; `gh pr view` for
a merge-state claim. Then state the correction in the commit body of the work that supersedes it, so
the wrong version does not propagate into the next handoff.

## Consequences

- Costs one command per load-bearing claim. Cheap.
- **Why this class of error survives:** a handoff is written by the session that did the work, from
  memory of *why* a change was made, not from the diff. It is also the one document nobody re-audits,
  because it reads as the authority. Its own advice — *"verify nothing you have not run a command to
  confirm"* — applied to itself and was not applied.
- The false claim is struck in place in §4b with the disproving command, rather than deleted, so the
  next reader sees the correction and its evidence.
