# Provenance — description-cap-session-explainer.html

**Artifact:** `description-cap-session-explainer.html` (self-contained, opens from `file://`, no build)
**Generated:** 2026-08-05 · **Session:** `aa1fa53d-0cdd-41ab-8f92-4381333da3b2`
**Generator:** `show-and-tell` skill v2.2.0 (`wan-huiyan/show-and-tell`), from `assets/template.html`

## What it is

A plain-English explainer of the description-cap workstream (rounds 3 / 3b / 3c) for a reader who is
not deep in the codebase. Dual-audience: plain claims + real numbers, with muted "engineer's note"
asides. Metaphor: **a menu board outside a shop** — the board fits 1,536 characters and anything past
the edge is invisible to customers, however good the kitchen is.

Reader-switchable theme (arcade / paper for printing / midnight); print forces a clean light theme.

## Source inputs

- Live-install gate output (`check_skill_descriptions.py` v2.3.0 against active `installPath`s)
- Binary extraction from `~/.local/share/claude/versions/2.1.222` — see
  [`../analysis/analysis_skill-listing-constants-2.1.222.md`](../analysis/analysis_skill-listing-constants-2.1.222.md)
- Per-repo `git diff` / `gh pr view` across the 7 repos
- [`../handoffs/description-cap-workstream-handoff.md`](../handoffs/description-cap-workstream-handoff.md) §8

## Verification

- **Static render check:** `show-and-tell/scripts/check_html.py` → tags balanced · all 41 CSS vars
  defined · paper+midnight theme parity · self-contained (no render-time fetches) · figure labelled ·
  no hardcoded colours · no unfilled placeholders.
- **Fact-check:** 2 adversarial rounds, both `FIX-THEN-SHIP`, 23 + 6 findings, all fixed. Round 2 found
  a **live production defect** the session had not disclosed. Full report:
  [`../reviews/review_session-explainer-factcheck.md`](../reviews/review_session-explainer-factcheck.md).

## Regeneration

Not mechanically regenerable — it is authored prose over measured inputs. To rebuild: re-run the gate
against the live install for current counts, then re-run the fact-verifier against the edited HTML.
**Do not update a figure without re-running its source command**; several figures in the first draft
were inherited rather than measured, and the honesty box now names which remain so.

## Known limits (carried in the artifact itself)

- Several figures are inherited from the previous session's write-up, not re-measured — named in the
  limits box.
- The constants are *settings*; a release or `settings.json` can change them.
- An LLM checking an LLM reduces drift, it does not eliminate it.
