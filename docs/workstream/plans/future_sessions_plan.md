# Future sessions plan — SKILL.md description-cap workstream

**Last updated:** 2026-08-05 (end of rounds 3 / 3b / 3c)
**Single source of truth for what's left.** State lives in
[`../handoffs/description-cap-workstream-handoff.md`](../handoffs/description-cap-workstream-handoff.md) §8;
this file is the prioritised backlog.

## Current state

| | |
|---|---|
| Repos | 7, all `main`, all CI-green, all clean |
| PRs this session | 17 merged · 11 carried a version bump and reached the install |
| Gate | `context-police` v2.3.0, re-vendored into all 6 downstream repos (all hash-match canon) |
| Live install | 192 SKILL.md · 103 model-invocable · **0** over cap · **0** wrap corruption · **0** lost triggers · **5** under 40 chars headroom · exit 0 |

Rounds 1, 2, 3, 3b, 3c: **DONE and delivered.**

## Priority actions

### P1 — Repo-vs-install parity check — [#9](https://github.com/wan-huiyan/context-police/issues/9)
**What:** CI rule that any commit touching `plugins/**` also touches that plugin's version.
**Why:** this session merged two changes that never reached an installed user and nothing caught it.
The live-install gate measures cap/corruption, never repo-vs-install parity. Found only by a
fact-checking subagent reviewing a *report* about the session. See
[ADR-0004](../decisions/0004-version-bump-required-for-any-shipped-file.md).
**Where:** `context-police` (already the vendoring upstream, so it ships the same way).
**Fixtures ready:** `overnight-workflows@40b2460`, `claude-ecosystem-hygiene@0dd72c5` — both real
violations. Write the negative control first.
**Dependencies:** none.

### P2 — Headroom pass on the 5 `NO HEADROOM` skills — [#10](https://github.com/wan-huiyan/context-police/issues/10)
**What:** trim 5 descriptions currently 23–39 chars under the cap.
**Why:** each is one edit from silently truncating trigger text. The v2.3.0 gate now names them.
**Method:** §5 of the workstream handoff (9-step procedure); `context-police` PR #7 is a worked example.
**Watch for:** `--compare` is blind to backticked literals; word-overlap is blind to trigger
restructuring. Bump every plugin whose SKILL.md you touch.
**Dependencies:** none. Independent per skill — parallelisable across 5 repos, zero file overlap.

### P3 — The ~11 remaining dangling `See also` refs — [#11](https://github.com/wan-huiyan/context-police/issues/11)
**What:** vet and remove (or keep) by hand.
**Why:** **DO NOT AUTOMATE.** A regex sweep deleted a repo name, a service name and a session label
and was discarded. See [ADR-0005](../decisions/0005-do-not-automate-dangling-reference-removal.md).
**Dependencies:** none. Low value, nonzero risk — fine to leave indefinitely.

### P4 — ~~Back up `~/Documents/docs/`~~ **RESOLVED 2026-08-05**
Relocated into this repo at `docs/workstream/` — versioned, pushed and backed up with everything else.
The copy under `~/Documents/docs/` is now a working scratch copy; treat `docs/workstream/` as canonical.

## Decision queue

All decisions from this session are **RESOLVED** and recorded as ADRs 0001–0005. No open decisions.

~~Should the wrap-corruption exit code cover disabled skills?~~ **RESOLVED** — yes, ADR-0001.
~~Feature-grep or digest for vendored-copy drift?~~ **RESOLVED** — digest, ADR-0002.
~~Act on the handoff's off-by-one instruction?~~ **RESOLVED** — rejected as false, ADR-0003.
~~Do docs-only changes need a version bump?~~ **RESOLVED** — if the file ships, yes, ADR-0004.
~~Automate dangling-reference removal?~~ **RESOLVED** — no, ADR-0005.

## Branch cleanup

None outstanding — every PR this session was squash-merged with `--delete-branch`.

## Deferred / accepted, not planned

- **The `--compare` backtick blind spot stays hand-run.** Documented with a recipe rather than
  automated. Automating it means parsing backticked spans and distinguishing trigger literals from
  file paths and flags — high false-positive risk, low payoff.
- **Word-overlap scoring stays blind to trigger restructuring.** No tool catches it; the procedure
  tells a human to read the `REWORDED` rows.
- **24 skills sit above 75% of cap** with >40 chars headroom. Not at risk; the gate lists them.
