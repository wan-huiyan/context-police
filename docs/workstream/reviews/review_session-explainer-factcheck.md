# Review — adversarial fact-check of the session explainer (2 rounds)

**Date:** 2026-08-05 · **Reviewer:** adversarial fact-checker subagent (`general-purpose`), fresh eyes, not the author
**Artifact under review:** `docs/deliverables/description-cap-session-explainer.html`
**Protocol:** the `show-and-tell` skill's mandatory honesty gate (`references/fact-verifier.md`)
**Sources given:** freshly re-measured ground truth (gate output, binary extraction, per-repo diffs) +
the workstream handoff. Reviewer had read-only shell access and **re-derived claims independently**
rather than matching text.

**Both rounds returned `FIX-THEN-SHIP`.** All findings were re-verified by me before acting — twice
the reviewer's own numbers were wrong, noted below.

---

## Round 1 — 23 findings

Headline catches:

| Sev | Finding | Disposition |
|---|---|---|
| P1 | Negative control stated as "495 pass / 4 fail vs 499 green" **spliced two different fixture edits** | Fixed — re-ran it; honest figure is **498/1**, golden test the sole failure |
| P1 | "corrected in **all fifteen** commit messages" — verifiably false | Fixed — it is **six**. The reviewer's own "it's ten" was also wrong (looser grep) |
| P1 | "15 shipped **& installed**" — only 9 of 15 carried a version bump | Fixed |
| P1 | One of the four v2.3.0 findings (`--compare` blind to backticked literals) was **absent from the report entirely**, and undercut a "nothing was lost" claim elsewhere in it | Fixed — added as its own callout |
| P2 | "dozens of already-correct figures" — inherited, never counted | Fixed — count dropped, meta-note added |
| P2 | Figcaption implied over-cap text is "paid for"; source says it costs **no tokens** | Fixed |
| P2 | "Every skill's description is injected every turn" — it is every **model-invocable** skill | Fixed |
| P2 | "in those words" attributed a quote to a file that did not contain it | Fixed |
| P2 | Honesty box omitted the measured budget figure (~42% survive) | Fixed |
| P3 | 8 lower-severity binding/scope nits | All fixed |

Confirmed faithful on independent re-derivation: the four binary constants, the live-install counts,
"5 boards under 40 chars", "2 descriptions altered of 103", the 284/284-on-a-stale-fork control, the
12/27/0 coverage correction, and "not caused by my changes" for the `agent-traffic-control` count drift.

---

## Round 2 — the one that mattered

Asked to be adversarial about whether any **fix** introduced a new inaccuracy. It found a **live
production defect neither the report nor the handoff disclosed**:

> The tile said "**6 are CI/docs-only by design**". Five are. The sixth is not. `overnight-workflows`
> #22 changed **six `SKILL.md` files under `plugins/`** — shipped files — with **no version bump**.
> Its own commit body claims "nothing under a plugin source dir changed". I diffed the installed
> copies: `observational-analysis-rigor@1.2.1` still carries the `## See also` blocks […]
> **12 of the 32 cross-reference removals never reached the install.**

I verified this myself — installed copies still carried the removed refs; `diff` of repo vs cache
confirmed. Chasing it surfaced a **second** instance: a dead NOT-for target
(`skill-portfolio-audit`) live in a shipped description, missed because the dangling-ref sweep only
scanned bullets, never descriptions.

Both fixed and shipped: `overnight-workflows` #24, `claude-ecosystem-hygiene` #18. Verified after:
repo and installed copies byte-identical for all six files; scoped re-scan finds **0** stranded
removals.

Also in round 2:

| Sev | Finding | Disposition |
|---|---|---|
| P1 | "§4 sank a *previous* round" — past tense implied it was closed; it recurred here, undetected | Fixed — now points at the limits box |
| P2 | "dozens" survived in the **one-paragraph version** (the most-read sentence) while §3 disowned it | Fixed |
| P2 | "ship a second check" for backticked literals — it is a **hand-run** recipe; nothing automated catches them | Fixed |
| P2 | Honesty box still missing: constants are *settings* not laws; word-overlap blind to trigger **restructuring**; 24 more above 75% | Fixed — three bullets added |
| — | Verified my three flagged numbers (6 commit messages / 9 installed / 42% budget) were each **exactly right** | No change |
| — | Independently confirmed "32 removed, 32 dead, 0 false positives" against all 461 skill names on the machine | No change |

---

## Assessment: did the gate earn its keep?

**Decisively.** It found a live defect (P0 ×2) in work already declared delivered, that no automated
check in the ecosystem can see — the live-install gate measures cap and corruption, never
repo-vs-install parity.

**Counter-lesson, equally important:** the reviewer was wrong twice. Its proposed 495/4 replacement was
itself mis-derived, and its "ten commit messages" came from a looser pattern than the claim warranted.
Re-deriving each finding before acting was necessary, not ceremonial — the same discipline
[ADR-0003](../decisions/0003-re-derive-handoff-claims-before-acting.md) prescribes for handoffs
applies to review output.

**Method note for reuse:** giving the reviewer *freshly re-measured* ground truth (not the session's
own prose) plus shell access to re-derive is what made it useful. A reviewer handed only the report
and the handoff would have matched text and found nothing.
