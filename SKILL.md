---
name: context-police
description: |
  Use when the installed skills/agents catalog has grown large (hundreds+ standalone ~/.claude/skills/,
  e.g. from a claudeception/auto-skill-minting loop) and is driving token cost or breaking subagents.
  Symptoms: (1) the available-skills list is huge and re-appears in context every turn and inside every
  subagent; (2) a subagent dispatch fails with "Prompt is too long" at 0 tokens; (3) you want to cut the
  per-turn/per-subagent overhead WITHOUT deleting skills, ideally scoped to one project. Covers the verified
  fix (`skillOverrides`), the settings-precedence gotcha (project OVERRIDES user, so `enabledPlugins`
  per-project is the wrong tool), the VERIFIED global lever (`disable-model-invocation: true` drops a skill's
  NAME from the catalog while keeping it /name-invocable + rg-reachable), how to build a wide per-project
  denylist SAFELY (anchored startswith not substring; PROTECT allowlist; review-panel because allow-by-default
  makes false-hides the only harm), how to measure the overhead, how to verify Claude Code mechanics when
  the `claude-code-guide` agent itself overflows, how to emit an INTERACTIVE HTML recap of the treatment
  (`scripts/render_treatment_report.py` — a clickable, searchable drill-down of every skill by decision), and
  the DURABLE root-cause fix when most of the catalog is claudeception lesson/traps: stop storing episodic
  lessons as force-loaded skills — route them to a two-trigger retrieval hook (measure with a shadow-mode
  recall@K replay before flipping `disable-model-invocation`).
author: Claude Code
version: 1.5.0
date: 2026-06-04
---

# context-police — Skills-Catalog Context Cost + the skillOverrides Fix

*(formerly `skills-catalog-context-cost-skilloverrides-scoping`; renamed S10 2026-06-04. It polices the
context budget: measure the catalog cost, trim it per-project, and report it.)*

## Problem
Claude Code injects the catalog of available skills/agents into context **every turn and into every
subagent's base context**. A claudeception-style loop that mints a new skill most sessions grows
`~/.claude/skills/` unboundedly (800+), and every one is force-loaded forever. Two real effects: (a) large
per-turn and per-subagent token cost (a trivial `general-purpose` subagent was observed carrying ~30k tokens
of base context for a one-word reply — paid N× across a fan-out run); (b) small-context agent types can
overflow on launch.

## Context / Trigger Conditions
- `~/.claude/skills/` has hundreds of standalone skills; the injected list is huge.
- A subagent fails immediately with **"Prompt is too long" (0 tokens, 0 tool_uses)** — especially a
  small-context agent type like `claude-code-guide`.
- You want to reduce overhead for a focused project but keep all skills installed (and keep heavily-used
  plugins like a voltagent/agent-review-panel set fully enabled elsewhere).

## Solution (verified against code.claude.com/docs/en/settings, 2026-06-03)
1. **Diagnose precisely — don't overstate.** Catalog injection is a real *cost* that multiplies per subagent,
   but it does NOT universally break launches. Probe empirically: dispatch a one-word-prompt `general-purpose`
   subagent (works → general subagents have room) vs the failing agent type. If only one type overflows, the
   cause is **that agent type's smaller context window**, not a universal catalog overflow. State it that way.
2. **The lever for standalone skills is `skillOverrides`** (NOT `enabledPlugins` — that only governs plugins).
   `skillOverrides` is a settings.json map keyed by skill name; value `"on" | "name-only" |
   "user-invocable-only" | "off"`. `"off"` removes the skill from the model-invocable catalog (drops its
   context cost) without editing/deleting its SKILL.md; `"name-only"` keeps it discoverable but drops the
   description. Example: `{"alphafold-database":"off","scanpy":"off"}`.
3. **Scope it per-project — and mind the precedence.** Settings precedence is Managed > CLI > Local >
   **Project > User**, and same-key project settings **OVERRIDE (replace)** user settings (only *permissions*
   merge). So:
   - **`skillOverrides` in the project's `.claude/settings.json` is the right tool** — scope the noise cut to
     this project; other projects keep their full catalog. Set domain-irrelevant skills to `"off"` (e.g. for a
     static-SPA project, turn off bio/science DBs + cloud-infra one-offs that can never match the work — zero
     discoverability loss).
   - **`enabledPlugins` per-project is the WRONG tool** — replace-semantics means a project-local value
     disables every plugin you didn't re-list. Keep plugin enable/disable global.
4. **`enabledPlugins` (global) is still the lever for plugin-provided agents/skills** if you genuinely don't
   use a plugin anywhere (`{"plugin@marketplace": false}`). Don't disable plugins you actually use elsewhere.
5. **The VERIFIED global lever is `disable-model-invocation: true`** (SKILL.md frontmatter), NOT `"name-only"`.
   Empirically (2026-06-04): every skill carrying the flag is ABSENT from the injected catalog (verified 16
   flagged → all gone; a normal loaded skill lacks it), while the skill stays on disk → still `/name`-invocable
   and `rg`-reachable (so claudeception's mint-time dedup still finds it). It **drops the name** (reclaims the
   full per-skill cost) and **strictly dominates physical archive** (global, no per-project replication, no path
   juggling). Use it to bound the catalog at the source (mint new niche lesson/traps WITH the flag) + a one-time
   sweep of the existing backlog.
6. **Two CORRECTIONS to the naive durable plan:**
   - **`"name-only"` is a NO-OP for standalone skills** — they already inject as bare names (no description in
     the catalog). Only `"off"` (or `disable-model-invocation`/archive) reclaims their tokens.
   - **`find-skills`/`search-skill` search EXTERNAL marketplaces only** (`npx skills` / `site:`-scoped web
     search) — NEITHER reads `~/.claude/skills/` on disk. So they are NOT a local re-discovery path for hidden
     skills. Local re-surfacing is via claudeception's mint-time `rg` (dedup) + manual `/name` only. Don't sell
     "archive + find-skills will resurface it" — it won't.
   - Caveat: the policy of hiding all lesson/trap skills rests on the (docs-derived, **unmeasured**) premise that
     bare-name auto-recall is already marginal at scale — present it to the user as a tradeoff, not a slam dunk.

## Building a WIDE per-project denylist safely (when 211-conservative isn't enough)
Going past the obvious bio/infra one-offs into the claudeception lesson/trap bulk needs care. It is
**allow-by-default**, so the ONLY harm is hiding a skill that's actually relevant to *this* project; a missed
cut is just unrealized savings. Method that worked (211 → ~48% cut):
1. **Match ANCHORED (`name.startswith(prefix)`), NEVER substring (`prefix in name`).** Substring re-introduces
   classic traps: `"ml-"` matches `html-...`, `"react"` matches `reactome-database`, `"sql"` matches a relevant
   skill, etc. (The original conservative generator used `p in n` and got away with it only because its prefixes
   were long/unique.)
2. **Add an explicit PROTECT allowlist** (also anchored) for THIS project's real stack — it overrides the
   denylist. Err toward over-protecting.
3. **Vet the candidate ADD set with a review panel** (3 diverse-lens reviewers — e.g. app-stack / workflow / a
   skeptic doing false-positive-confirm + false-negative-scan). Take the **conservative UNION of their PULLs**
   (keep ON anything ANY reviewer flags). Because false-hide is the only harm, union-not-intersection is correct.
4. **Final guard:** scan the resulting OFF-set for protect-marker substrings and eyeball the hits (they'll be
   mostly false substring matches like `gcloud-WORKFLOWs` ≠ CC workflow, `in-memory` matched "memory") — but
   catch the real one (e.g. `dashboard-redesign-gated-…` named our pending redesign → pull it).
   Keep `gen_*` + the review JSON + a decision record for provenance and easy revert.

## Optional: emit an interactive recap report (`scripts/render_treatment_report.py`)
After applying a treatment, render a **self-contained, interactive HTML recap** — useful to show a human what
got hidden and why, and as a durable, reversible record. It's data-driven (reads the project's
`.claude/settings.json` + the skills dir), computes the counts + the bare-name token estimate, and produces an
arcade-styled page whose tiles / before-after bars / panel boxes are **clickable → a searchable, filterable
explorer of every skill by decision** (off / on / — if you pass a decisions file — kept / added / override, each
with the reviewer's reason). All data is inlined, so it opens straight from `file://` (no server, no build).

```bash
python3 ~/.claude/skills/context-police/scripts/render_treatment_report.py \
  --settings .claude/settings.json \
  [--skills-dir ~/.claude/skills] \
  [--decisions panel-decisions.json] \
  [--title "My Project"] [--out skill-treatment.html]
```
- `panel-decisions.json` (optional): `{"pulls":[{"n":"skill","r":"why kept ON"}],"adds":[…],"override":[…]}`.
  Omit it and the report is just the off/on drill-down; pass it and the panel boxes + reason-annotated views appear.
- **Verify the render WITHOUT a screenshot** (the Playwright-MCP screenshot subsystem wedges after "fonts loaded"):
  serve on a fresh port (`python3 -m http.server <port>` in the output dir — `file://` is blocked in the MCP
  browser), navigate, and use `browser_evaluate` to assert the filter buttons + row counts (skill
  `playwright-screenshot-timeout-verify-via-evaluate`). On macOS, `open <file.html>` launches it in the user's browser.
- The numbers are honest-by-construction: token estimate = `Σ(len(name)+3)/4` over the universe (bare names +
  "- " + newline ≈ 4 chars/token); "saved" = same over the OFF set; paid **every turn + per subagent** → the page
  notes the `×N` fan-out multiplier. (First built for a static-SPA project — 866→421 off, ~7.5k→~3.1k tok, panel 22/7/1.)

## The DURABLE root-cause fix: lessons-as-skills → a retrieval hook (S10)
`skillOverrides` is a per-project SYMPTOM fix. The real growth driver is that a claudeception loop mints ~1 skill
per session and force-loads all of them forever — and most of those are **episodic lesson/traps** (single-incident
gotchas like `flask-flash-silently-dropped-without-base-render`). Those aren't skills; they're **lessons**, and
lessons belong in a searchable archive surfaced on demand — **not** the always-loaded catalog. The bloat is a
knowledge base in the wrong substrate.

**Triage by reusability, not topic:** reusable PROCEDURE (multi-step, trigger generalizes — driven-development,
worktrees, handoff harnesses) → stays an auto-surfaced skill; single-incident TRAP → routes to the archive.

**Don't just delete/`off` the traps — that loses recall** (a trap's trigger situation rarely shares words with its
kebab name; the agent can't grep for a trap it doesn't see coming). The intended fix is a **two-trigger retrieval
hook**: `UserPromptSubmit` (keys on the prompt) + `PostToolUse` (keys on the tool command / edited file — the
gap-closer, since most traps surface mid-session from an action), indexing the existing `SKILL.md` corpus in place
(BM25 v1), injecting top-K relevant traps as `additionalContext`.

**⚠️ CORRECTION (S11, empirical): the "inject only the relevant trap, above a score floor — zero on unrelated
turns" promise is UNMET by an absolute (or relative) BM25 floor.** Measured, the hook fires on **~99.6% of ALL
turns** at any floor (even `git status` → 19.4, editing any `.py` → 20.9, "thanks continue" → 9.1 all clear it
with *irrelevant* traps). BM25 magnitude tracks token-overlap-with-*some*-trap across a ~460-trap pool, not
relevance to *this* context. Good recall (~51%) and near-100% injection are **the same under-discriminating
score**: v1 surfaces ~half the genuine traps *only by injecting on nearly every turn*. So **v1 is fine in SHADOW
(log-only, zero behavior change) but NOT live-ready** — going live needs a **specificity gate** (e.g. require ≥2
*distinctive*/high-IDF matched tokens, or a semantic margin), which is open v2 work. **floor/K tuning canNOT fix
this — the gate, not the threshold, is the problem** (max-IDF alone also fails to separate benign from real). The
shadow log is the dataset for designing the gate.

**MANDATORY gate — never flip blind:** there is no counterfactual (every transcript had force-load on). Before
turning episodic traps to `disable-model-invocation: true`, **TWO prerequisites must clear, not just recall:**
(1) the hook must be LIVE-READY — a working precision gate (the absolute floor above is *not* it); (2) the
trap/procedure classifier must be FIXED — S11 found a hyphen-count heuristic mislabeled **68% of measured "trap"
events** as traps when they were reusable PROCEDURES that fire by *name* (incl. the single highest-frequency
skill), so flipping those = pure recall loss. Run a **shadow-mode recall@K replay** AND check the injection rate;
require `recall@5 ≥ status-quo` AND a gate that injects ~zero on unrelated turns. Only then flip. Fully reversible
(delete the hook lines + un-flip the frontmatter). **Do NOT flip the poorly-recalled 1× trap tail "because it
doesn't recall anyway" — that only disturbs the unmeasured passive-recognition channel, the exact fear.**

**Measured (claude-retrospectives, S10 build + S11 deepened, 2026-06-04):** keyword v1 → **trap-weighted
recall@5 ≈ 51%** over *genuine* traps (robust after the classifier correction), but at a **~99.6% injection rate**
(no working relevance gate → NOT live-ready). Three S11 corrections to the optimistic S10 read: (a) **68% of
measured "trap" events were misclassified PROCEDURES** (the high-frequency, well-recalled ones) — de-skewed
genuine-trap recall is ~51%; the event-weighted "65%" was procedure-inflated; (b) the **subagent leg has no viable
fix** — subagent trap-firing is rare (0.9%, 22/2151 transcripts) and concentrates in `general-purpose`
(un-bundleable), so a fixed per-`agent_type` bundle doesn't pay; (c) **embeddings DEFERRED** — poorly-recalled
genuine traps miss from *no-signal* (invoked from reasoning, no matching trigger text), not paraphrase. Reference
impl + replay/measurement harness: that repo's `tools/lesson-retrieval-pilot/` +
`docs/research/2026-06-04-episodic-lesson-recall-substrate-research.md` (project-specific paths — verify before
citing; pilot code is project-agnostic, promotable into this skill's `scripts/`). The source-level fix (change
claudeception's mint default so new traps land archived) is sound *in principle* but **BLOCKED on a live-ready
retrieval substrate** — don't ship it until the gate works. "Fix the classifier" is itself judgment-laden curation
over ~487 candidates (description-intent, not hyphen-count), a real cost on the path to any flip — not a quick swap.

## Measuring the overhead (if you want the number)
The fixed scaffolding re-read each turn ≈ `min(nonzero cache_read_input_tokens across the session's turns)`
(the stable cached prefix = system prompt + tool/skill catalog + earliest conversation). The naive
"first-turn cache_write+cache_read = catalog" identity is unreliable (resumed/--continue sessions read a
pre-warmed cache on turn 1) — calibrate, don't assume. Subagent transcripts
(`~/.claude/projects/**/subagents/**/agent-*.jsonl`) carry their own per-dispatch floor → that's the N× story.

## Verification
- After adding project `skillOverrides`, restart Claude Code and confirm the injected skills list shrank.
- `git check-ignore` / a dry-run generator can quantify how many skills a denylist would turn off before you
  apply it. Reversible: delete an entry or set `"on"`.

## Notes
- **When `claude-code-guide` overflows, you can't use it to answer Claude Code questions** — verify mechanics
  by `WebFetch`-ing `code.claude.com/docs/...` directly (note `docs.claude.com/en/docs/claude-code/*` 301-
  redirects to `code.claude.com/docs/en/*`), or ask from a session where the catalog is already trimmed.
- Managed-only knobs exist for org control: `strictPluginOnlyCustomization` (block user/project skills),
  `blockedMarketplaces`, `strictKnownMarketplaces` — not needed for a personal per-project trim.
- See also: `concurrent-session-curating-shared-global-dir` (the shared skills dir grows live across sessions),
  `claude-code-subagent-agenttype-overrides-session-model` (a different subagent-context gotcha).
