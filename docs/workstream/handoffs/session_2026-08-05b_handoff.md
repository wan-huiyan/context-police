---
label-audit-skipped: >
  The flagged rows are §7's review-findings table. Its "labels" are P0/P1/P2/P3 SEVERITIES that I
  assigned myself while triaging the fact-verifier's output — they are not codes decoded from any
  external system, so there is no authoritative source to cite and [verified:] would be meaningless.
  They are also not guesses about a system's semantics, so [HYPOTHESIS] would misdescribe them.
  The load-bearing, externally-checkable half of each row is the DISPOSITION, and every one of those
  cites a real PR or commit that a reader can resolve (gh pr view / git show).
  Treat the severity column as one engineer's triage, not as a decoded enum.
---

# Session handoff — description-cap workstream, rounds 3 / 3b / 3c

**Date:** 2026-08-05 (second session of the day) · **Owner:** wan-huiyan
**Session id:** `aa1fa53d-0cdd-41ab-8f92-4381333da3b2`
**Scope:** executed the description-cap workstream handoff left by the previous session (then at
`~/Documents/docs/handoffs/`; now canonical at `docs/workstream/` in this repo).

> **Canonical state doc is [`description-cap-workstream-handoff.md`](./description-cap-workstream-handoff.md)**
> — §8 (rounds 3 / 3b / 3c) and §9 (next-session prompt) were rewritten this session and are current.
> This file is the session-scoped record: what happened, what the review caught, what remains.
> Do not duplicate state here; cross-link it.

> **No repo at `~/Documents`.** This directory is not a git repository — it is a container for the
> seven repos the work landed in. So: no git log / branch status / PR for the docs themselves, and
> the docs in `docs/` are **uncommitted and unbacked-up by design**. Per-repo git history is cited
> inline below.

---

## 1. What was completed

**17 PRs across 7 repositories, all squash-merged. 11 carried a version bump and reached the
installed copies.** Live install measured after every stage.

| Repo | PRs (mine) | End version |
|---|---|---|
| `context-police` | #7, #8 | 2.3.0 |
| `claude-ecosystem-hygiene` | #16, #17, #18 | 1.10.3 · ecosystem-audit 1.2.3 · placement-scan 1.0.1 |
| `agent-review-panel` | #66, #67 | 3.8.3 |
| `overnight-workflows` | #22, #23, #24 | obs-analysis-rigor 1.2.2 · multi-issue 1.2.2 · review-panel-blocked 1.0.1 |
| `agent-traffic-control` | #9, #11, #12 | 1.9.1 → (parallel session took it to 1.11.0) |
| `publish-skill` | #10, #11 | 2.4.2 |
| `skill-portfolio-existence-review` | #2, #3 | 1.1.2 |

**Round 3 — the handoff's own task list.** Re-vendored the gate at v2.2.1 into all six downstream
repos with a uniform machine-strippable provenance note; worked every still-live finding from
`description-cap-open-findings.md`; corrected the coverage tables that did not reproduce; trimmed
`context-police`'s own description (1,533 → 1,483, cap−3 → 53 headroom).

**Round 3b — the gate's own guarantees** (`context-police` v2.3.0, then re-vendored ×6). Four gaps
closed, each with a negative control. See [ADR-0001](../decisions/0001-wrap-corruption-covers-disabled-skills.md),
[ADR-0002](../decisions/0002-pin-vendored-copies-by-digest.md).

**Round 3c — a delivery bug this session committed itself.** Caught by the fact-verifier on the
explainer, *after* the session had been reported as delivered. See §3 and
[ADR-0004](../decisions/0004-version-bump-required-for-any-shipped-file.md).

**Deliverable:** a plain-English explainer of the whole workstream —
[`deliverables/description-cap-session-explainer.html`](../deliverables/description-cap-session-explainer.html).

---

## 2. What remains (prioritised)

1. **Build a repo-vs-install parity check.** A CI rule that any commit touching `plugins/**` also
   touches that plugin's version. This session merged two changes that never reached an installed
   user and **nothing caught it** — not CI, not the live-install gate, which measures cap and
   corruption but never repo-vs-install parity. Highest-value item left. → [#9](https://github.com/wan-huiyan/context-police/issues/9)
2. **Headroom pass** on the 5 skills reporting `NO HEADROOM` (<40 chars): `funnel-lever-…` (23),
   `agent-review-panel` (31), `publish-skill` (33), `cross-worktree-…` (35),
   `skill-portfolio-existence-review` (39). The v2.3.0 gate now lists them for you. → [#10](https://github.com/wan-huiyan/context-police/issues/10)
3. **The ~11 remaining dangling `See also` refs. DO NOT AUTOMATE.** A regex sweep deleted references
   to a repo, a Cloud Run service and a session label, and was thrown away. The residue includes
   real external pointers carrying GitHub URLs and `~/.claude/skills/…` paths. → [#11](https://github.com/wan-huiyan/context-police/issues/11)
4. ~~**`docs/` at `~/Documents` is untracked.**~~ **RESOLVED** — relocated into `context-police`
   at `docs/workstream/`, versioned and pushed. Treat that copy as canonical.

---

## 3. Blockers & open issues

- **None blocking.** Every repo's `main` is CI-green, gate exit 0, working tree clean.
- **Two changes were merged-but-not-installed for part of this session** — `overnight-workflows` #22
  (6 shipped `SKILL.md` files, no bump) and a dead NOT-for target in `claude-ecosystem-hygiene`.
  Both are now shipped and verified byte-identical against the installed copies. The *class* of
  failure remains unguarded — item 1 above.
- **`~/.claude/usage-tracking/` is in active use** (18 prior session records) but has **no
  `README.md`** — the schema/methodology doc the skill expects. Separately, the **cctime fork is not
  installed** at `~/.claude/tools/cctime-fork/`, so session metrics fell back to the bundled
  `session_metrics.py`: tokens only, **no cost figures**. Both are one-time setup.
- ~~**`~/Documents` is not a git repo**, so this handoff cannot be committed or PR'd.~~ **RESOLVED** —
  these docs now live in `context-police/docs/workstream/` and ship with that repo.

---

## 4. Key decisions

| Decision | Resolution | Rationale |
|---|---|---|
| The handoff's headline instruction said a v2.2.1 off-by-one made every published char figure one too low | **Rejected as false** before acting | `git diff 4dc1a62 eedad0f` touches only `find_wrap_corruption()`; `(cap-1)` was already in v2.2.0 and in every vendored copy. Acting on it would have corrupted correct figures across 6 repos → [ADR-0003](../decisions/0003-re-derive-handoff-claims-before-acting.md) |
| Should wrap-corruption fail the build for `disable-model-invocation` skills? | **Yes — scored over every skill** | 74 of 94 skills disabled in one repo meant CI was blind to most of it; that is why 4 real corruptions were found via `--json` not CI → [ADR-0001](../decisions/0001-wrap-corruption-covers-disabled-skills.md) |
| How should a vendored copy be guarded against drift? | **Pinned sha256, note stripped** — not feature greps | A "not a stale fork" test built from 3 substring greps stayed green on a genuinely stale fork → [ADR-0002](../decisions/0002-pin-vendored-copies-by-digest.md) |
| Strip all ~45 dangling cross-references? | **No — 32 vetted only, by hand** | The regex sweep deleted a repo name, a service name and a session label. Scoped to an explicit allowlist + xref sections only → [ADR-0005](../decisions/0005-do-not-automate-dangling-reference-removal.md) |
| Does a docs-only change need a version bump? | **If the file ships, yes** | `overnight-workflows` #22 changed 6 shipped `SKILL.md` files with no bump; 12 fixes stayed live-broken → [ADR-0004](../decisions/0004-version-bump-required-for-any-shipped-file.md) |
| Fix the `agent-traffic-control` README count drift I did not cause? | **Yes, as its own PR** | 94/95 vs actual 96, traceable to two parallel-session releases. Exactly the defect class the workstream targets |

---

## 5. Files modified

Per-repo diffs are in the PRs cited in §1. Docs written this session:

| File | Bucket |
|---|---|
| `docs/workstream/handoffs/description-cap-workstream-handoff.md` | handoffs — §8 rounds 3/3b/3c added, §4b false claim struck, §9 prompt rewritten |
| `docs/workstream/handoffs/description-cap-open-findings.md` | handoffs — bannered HISTORICAL |
| `docs/workstream/handoffs/session_2026-08-05b_handoff.md` | handoffs — this file |
| `docs/workstream/handoffs/session_next_prompt.md` | handoffs — paste-ready next-session prompt |
| `docs/workstream/decisions/0001…0005` | decisions — 5 ADRs |
| `docs/workstream/analysis/analysis_skill-listing-constants-2.1.222.md` | analysis — binary re-verification |
| `docs/workstream/reviews/review_session-explainer-factcheck.md` | reviews — fact-verifier, 2 rounds |
| `docs/workstream/deliverables/description-cap-session-explainer.html` + `.provenance.md` | deliverables |
| `docs/workstream/plans/future_sessions_plan.md` | plans |
| `~/.claude/projects/-Users-huiyan-Documents/memory/*` | memory — 2 new files, 2 updated, index updated |

---

## 6. Branch status

All seven repos: on `main`, clean, synced with `origin`, CI green. No open branches from this
session — every PR was squash-merged with `--delete-branch`.

`~/Documents` itself: **not a git repository**; `docs/` is untracked.

---

## 7. Review findings

A fact-verifier subagent ran **twice** against the plain-English explainer (the `show-and-tell`
skill's mandatory honesty gate), given the freshly re-measured ground truth plus the workstream
handoff. It was given read-only access and re-derived claims independently rather than matching text.

**Both passes returned `FIX-THEN-SHIP`.** Every finding below was verified by me before acting —
two of the verifier's own numbers were wrong and are noted as such.

| Severity | Finding | Caught by (persona · speciality) | Disposition |
|---|---|---|---|
| P0 | `overnight-workflows` #22 changed 6 **shipped** `SKILL.md` files with no version bump — 12 of 32 cross-ref removals never reached the install; commit body asserted the opposite | Adversarial fact-checker · `general-purpose` | **Fixed** — `overnight-workflows` #24, verified byte-identical after install |
| P0 | A dead NOT-for target (`skill-portfolio-audit`) live in a shipped description; the dangling-ref sweep only scanned bullets, never descriptions | Adversarial fact-checker · `general-purpose` | **Fixed** — `claude-ecosystem-hygiene` #18 (1,304 → 1,278 chars, 0 dropped/narrowed) |
| P1 | Negative control stated as "495 pass / 4 fail vs 499 green" spliced two different fixture edits | Adversarial fact-checker · `general-purpose` | **Fixed** — re-ran it; honest figure is **498/1**, golden test the sole failure |
| P1 | "corrected in all fifteen commit messages" — verifiably false | Adversarial fact-checker · `general-purpose` | **Fixed** — it is **six**; verifier's own count of 10 was also wrong (looser grep) |
| P1 | "15 shipped **& installed**" — only 9 of 15 carried a version bump | Adversarial fact-checker · `general-purpose` | **Fixed** — now 17 merged / 11 installed |
| P1 | The `--compare` backtick blind spot — one of the four v2.3.0 findings — was **absent from the report entirely**, and undercut a "nothing was lost" claim elsewhere in it | Adversarial fact-checker · `general-purpose` | **Fixed** — added as its own callout, adjacent claim softened |
| P2 | "dozens of already-correct figures" — inherited from the handoff, never counted, and left unqualified in the most-read sentence while disowned 100 lines below | Adversarial fact-checker · `general-purpose` | **Fixed** — count dropped, meta-note added |
| P2 | Figcaption implied over-cap text is "paid for"; source says it costs no tokens | Adversarial fact-checker · `general-purpose` | **Fixed** — now names the shared-budget cost instead |
| P2 | "Every skill's description is injected every turn" — it is every **model-invocable** skill (89 of 192 are disabled) | Adversarial fact-checker · `general-purpose` | **Fixed** |
| P2 | Honesty box omitted: constants are *settings* not laws; word-overlap scoring is blind to trigger **restructuring**; 24 more skills above 75% | Adversarial fact-checker · `general-purpose` | **Fixed** — three bullets added |
| P2 | "ship a second check" for backticked literals — it is a **hand-run** recipe; nothing automated catches them | Adversarial fact-checker · `general-purpose` | **Fixed** |
| P3 | "two releases from someone else" — same author, parallel session | Adversarial fact-checker · `general-purpose` | **Fixed** |
| P3 | Six lower-severity binding/scope nits (74-of-94 present tense, "a section below" vs two, tile denominator, "entire file" vs note-stripped, "log entry" vs session label, cap covers description+whenToUse pair) | Adversarial fact-checker · `general-purpose` | **Fixed** — all six |

**The panel earned its keep decisively.** It found a **live production defect** (P0 ×2) that the
session had already declared delivered, and that no automated check in the ecosystem could see. Full
report: [`docs/reviews/review_session-explainer-factcheck.md`](../reviews/review_session-explainer-factcheck.md).

**Counter-lesson worth carrying:** the verifier was itself wrong twice (the 495/4 control it proposed
was also mis-derived; its "10 commit messages" was a looser grep than the claim warranted). Re-deriving
its findings before acting was necessary, not ceremonial.

---

## 8. Stale docs to review

**Nothing flagged.** `doc-freshness-reverse-lint` over the four memory files touched this session:
no negation rules extracted, zero candidates. `skill_freshness_audit`: 59 skills scanned, **all
fresh**, none past the 90-day window.

Caught separately by the docs review on PR #12 and fixed before merge: §5 step 6 of the workstream
handoff still published the retracted `13 / 25 / 1` coverage figure — the third surface to carry it,
inside the very procedure the plan sends readers to. Corrected to `12 / 27 / 0`.
