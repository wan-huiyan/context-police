# 🚓 context-police

> A Claude Code skill that **patrols your context budget** — measure the token cost of a runaway skills/agents catalog, trim it per-project, emit an interactive HTML recap, and fix the root cause.

[![GitHub release](https://img.shields.io/github/v/release/wan-huiyan/context-police)](https://github.com/wan-huiyan/context-police/releases)
[![license](https://img.shields.io/github/license/wan-huiyan/context-police)](LICENSE)
[![last commit](https://img.shields.io/github/last-commit/wan-huiyan/context-police)](https://github.com/wan-huiyan/context-police/commits)
[![python](https://img.shields.io/badge/python-3.8+-yellow)](https://www.python.org/)
[![Claude Code](https://img.shields.io/badge/Claude_Code-skill-orange)](https://claude.com/claude-code)

<p align="center">
  <img src="docs/context-police-banner.svg" alt="context-police — patrolling the skills-catalog token budget" width="640"/>
</p>

```
   ╔═══════════════════════════════════════════════╗
   ║  🚓  C O N T E X T   P O L I C E   🚨          ║
   ║  ▛▀▀▀▜  pull over — that catalog's over budget ║
   ║  ▙▄☆▄▟  -48%  🪙 saved/turn · ×N on fan-out    ║
   ╚═══════════════════════════════════════════════╝
```

---

## 🪙 What it is

Claude Code injects the **whole catalog of installed skills + agents into context on every turn** — and into **every subagent** you spin up. That's fine with a handful of skills. But if you run a [claudeception](https://github.com/anthropics/claude-code)-style learning loop that mints ~1 new skill per session, your `~/.claude/skills/` quietly balloons to **800+** entries... and *every single one* is force-loaded, forever, paid again on every fan-out.

The bill (measured on a real ~925-skill catalog): **~248k tokens** of skill descriptions per full injection — **~24× over a 1% context budget** — re-read every turn and multiplied across concurrent subagents. Small-context agent types (like `claude-code-guide`) can even overflow on launch with *"Prompt is too long" at 0 tokens.*

**context-police is the toolkit to handle it, honestly:**

1. 📏 **Measure** the real per-turn / per-subagent cost (from the cached-prefix token floor).
2. ✂️ **Trim** it — per-project with the verified `skillOverrides` lever, or globally with `disable-model-invocation: true` — **without deleting a single skill** (everything stays on disk + `/name`-invocable).
3. 📊 **Report** it — emit a self-contained, clickable **HTML recap** of exactly what got hidden and why.
4. 🧠 **Fix the root cause** — recognize that most of the bloat is *episodic lessons mis-stored as force-loaded skills*, and route them to an on-demand **retrieval hook** instead — gated on a measured **recall@K** bar before anything is hidden.

It's **allow-by-default** the whole way down: a skill is only ever hidden when it's clearly irrelevant to your current work, and every move is reversible.

---

## 🕹️ Quick Start

Just describe the symptom and Claude reaches for the skill:

```
You: my subagents are dying with "Prompt is too long" and I have like 800 skills installed.

Claude: [reads context-police] That's the force-loaded catalog. Let me first probe whether it's a
        universal overflow or just one small-context agent type, then I'll measure the cost and draft
        a per-project skillOverrides denylist (allow-by-default, fully reversible) you can review.

You: do it for this project.

Claude: [picks domain-irrelevant skills — bio DBs, cloud one-offs, single-incident traps that can
        never match this stack — sets them "off" in .claude/settings.json, protects your real stack,
        then renders an interactive HTML recap of every decision] Restart CC and the catalog shrinks.
```

The lever is a plain map in your **project's** `.claude/settings.json`:

```jsonc
{
  "skillOverrides": {
    "alphafold-database": "off",      // bio DB — irrelevant to a web app
    "scanpy": "off",                  // single-cell genomics — irrelevant
    "some-one-off-flask-trap": "off", // single-incident lesson, not a reusable skill
    "react-router-v7-migration": "on" // PROTECT: this is your real stack
  }
}
```

`"off"` drops the skill from the model-invocable catalog (reclaims its tokens) — the `SKILL.md` is untouched and still `/name`-invocable. Set it back to `"on"` (or delete the entry) to undo. **Takes effect on the next Claude Code restart.**

---

## 📦 Installation

**Git clone (always works):**

```bash
git clone https://github.com/wan-huiyan/context-police.git ~/.claude/skills/context-police
```

**Claude Code plugin (marketplace):**

```bash
/plugin marketplace add wan-huiyan/context-police
/plugin install context-police@wan-huiyan-context-police
```

Either way, restart Claude Code so the skill is picked up.

---

## ✨ Without vs With

| | 🙀 Without context-police | 😺 With context-police |
|---|---|---|
| **Catalog cost** | ~248k tokens of descriptions re-injected every turn, ×N per subagent — unmeasured, unbudgeted | Measured to a number; trimmed ~48% per-project; the `×N` fan-out multiplier made explicit |
| **Small subagents** | `claude-code-guide` overflows: *"Prompt is too long" at 0 tokens* | Probe → it's *that agent type's* window, not a universal break; trim the noise |
| **Cutting noise** | Delete skills (lossy, irreversible) or `enabledPlugins` per-project (footgun — replace-semantics nukes everything you didn't relist) | `skillOverrides` per-project (scoped, reversible) — nothing deleted, all still `/name`-invocable |
| **Knowing what changed** | A diff of a settings file nobody reads | A clickable, searchable **HTML recap** of every skill by decision + reviewer reason |
| **The real problem** | Catalog keeps growing ~1 skill/session, forever | Recognized: most bloat is *lessons*, not *skills* → route to a retrieval hook (recall-gated) |

The "Without" column isn't a strawman — `enabledPlugins` per-project and bulk-deleting really are the obvious-but-wrong moves; this skill documents *why* and what to do instead.

---

## 🛠️ What you get

- **The verified levers, with the gotchas spelled out:**
  - `skillOverrides` (per-project, in `.claude/settings.json`) — the right tool for scoping noise to one project. **Not** `enabledPlugins` per-project (settings precedence: project *replaces* user, so it would disable every plugin you didn't relist).
  - `disable-model-invocation: true` (SKILL.md frontmatter) — the verified **global** lever: drops a skill's *name* from the catalog (reclaims the full per-skill cost) while keeping it `/name`-invocable + `rg`-reachable.
  - Two corrections to the naive plan: `"name-only"` is a **no-op** for standalone skills (they already inject as bare names); and `find-skills`/`search-skill` search **external** marketplaces only — they do **not** re-surface your hidden local skills.
- **A safe wide-denylist method** (the conservative cut → ~48%): anchored `startswith` matching (never substring — `"ml-"` would eat `html-...`), an explicit PROTECT allowlist for your real stack, a review-panel vetting that keeps **ON** anything *any* reviewer flags (union, not intersection — because a wrongly-hidden relevant skill is the only harm).
- **An interactive HTML recap** (`scripts/render_treatment_report.py`) — arcade-styled, self-contained, opens from `file://`, with clickable tiles → a searchable explorer of every skill by decision (off / on / kept / added / override + reason).
- **The durable root-cause analysis** — why the bloat is a knowledge base in the wrong substrate, and the recall-gated retrieval-hook plan to fix it at the source.

---

## 📊 The interactive recap

After you apply a treatment, render a clickable HTML report of exactly what happened:

```bash
python3 ~/.claude/skills/context-police/scripts/render_treatment_report.py \
  --settings .claude/settings.json \
  --skills-dir ~/.claude/skills \
  --decisions panel-decisions.json \
  --title "My Project" \
  --out skill-treatment.html
```

- Data-driven & honest-by-construction: it reads the OFF set straight from your `settings.json`, enumerates the skills universe, and computes the bare-name token estimate (`Σ(len(name)+3)/4`, paid every turn + per subagent).
- The `--decisions` file is optional (`{"pulls":[…],"adds":[…],"override":[…]}`); omit it for a plain off/on drill-down, pass it to surface the review-panel reasons.
- All data is inlined — no server, no build. On macOS, `open skill-treatment.html`.

---

## 🧠 The durable fix (and why it's not live yet)

`skillOverrides` is a per-project **symptom** fix. The real growth driver is that the mint loop adds ~1 skill/session and force-loads them all forever — and **most of those are episodic lessons** (single-incident gotchas like `flask-flash-silently-dropped-without-base-render`). Those aren't skills; they're **lessons**, and lessons belong in a *searchable archive surfaced on demand* — not the always-loaded catalog.

The intended fix is a **two-trigger retrieval hook** (`UserPromptSubmit` + `PostToolUse`) that indexes the existing `SKILL.md` corpus in place and injects only the top-K relevant traps as `additionalContext`. **But it is shadow-tested, not live-ready** (see Limitations) — so this skill ships the *measurement harness and the decision framework*, and is loud about the gate you must clear before flipping anything.

---

## ⚖️ Limitations & honesty

This skill leans **cautious**, on purpose. The honest caveats:

- **Allow-by-default → the only failure mode is a wrongly-hidden *relevant* skill.** A missed cut is just unrealized savings (harmless); an over-eager cut hides something you wanted. That asymmetry is why the wide-denylist method uses a PROTECT allowlist and a union-not-intersection review panel. It still isn't zero-risk — review the OFF set.
- **The global `disable-model-invocation` lever rests on an *unmeasured* premise.** Hiding a skill's name assumes bare-name auto-recall is *already marginal at scale* — that's docs-derived reasoning, **not** a measured counterfactual (every transcript ever recorded had force-load ON). Treat the global mass-hide as a tradeoff, not a slam dunk.
- **The retrieval-hook replacement is NOT live-ready.** Shadow-mode replay measured keyword-v1 at **trap-weighted recall@5 ≈ 51%** — but at a **~99.6% injection rate** (it fires on nearly every turn, because BM25 magnitude tracks token-overlap-with-*some*-trap, not relevance to *this* turn). Good recall and near-100% injection are the *same* under-discriminating score. So v1 is fine in **shadow (log-only, zero behavior change)** but going live needs a **specificity gate** that's still open work. Do **not** flip episodic traps to hidden until (a) the hook has a working precision gate and (b) the trap/procedure classifier is fixed — a shadow run found a naive heuristic mislabeled ~68% of "trap" events that were actually reusable procedures.
- **`"name-only"` does nothing for standalone skills**, and `find-skills`/`search-skill` won't resurface your hidden local skills. Don't rely on either as a safety net.
- **It can't read minds about *your* stack.** The denylist is a draft for *you* to review, not an auto-apply.
- **Takes effect on restart** — the catalog is injected at session start.

No overclaiming: the symptom fix (`skillOverrides`) is solid and reversible; the root-cause fix is a measured, in-progress plan, not a shipped feature.

---

## 🔧 Dependencies

| Dependency | Required? | Without it |
|---|---|---|
| Claude Code | ✅ required | n/a — this is a CC skill |
| `python3` (3.8+) | optional | the levers + method still work by hand; you just can't render the HTML recap |
| `rg` / standard CLI | optional | used for verifying a hidden skill is still reachable |

No third-party Python packages — the recap script is stdlib-only.

<details>
<summary><b>✅ Quality checklist — what this skill guarantees</b></summary>

- Every lever is **verified** against `code.claude.com/docs` (the settings-precedence + `disable-model-invocation` behavior was empirically confirmed, not assumed).
- The denylist method is **allow-by-default and reversible** — nothing is deleted; entries flip back to `"on"`.
- The HTML recap is **honest-by-construction** — numbers are computed from your actual `settings.json` + skills dir, not hand-entered.
- The root-cause fix is gated on a **measured recall@K bar** + a precision gate — the skill refuses to recommend flipping blind.
- Tradeoffs (unmeasured global-hide premise, not-live-ready hook) are stated up front, not buried.
</details>

---

## 🤝 Related skills

- **`concurrent-session-curating-shared-global-dir`** — the shared `~/.claude/skills/` dir grows *live* across parallel sessions.
- **`claude-code-subagent-agenttype-overrides-session-model`** — a different subagent-context gotcha (a workflow `agentType` silently pins a cheap model).
- **[claudeception](https://claude.com/claude-code)** — the skill-minting loop that *causes* the bloat in the first place (this skill is its cleanup crew).

---

## 📜 Version history

- **v1.5.0** — root-cause arc: lessons-as-skills → recall-gated retrieval hook; shadow-mode recall@K findings (51% recall / 99.6% injection → not live-ready); S11 corrections (classifier mislabel, subagent leg, embeddings deferred).
- **v1.4.0** — renamed `skills-catalog-context-cost-skilloverrides-scoping` → `context-police`; added the interactive `render_treatment_report.py` recap.
- **v1.x** — the verified `skillOverrides` + `disable-model-invocation` levers, the precedence gotcha, the safe wide-denylist method, and the overhead-measurement recipe.

---

## 📄 License

[MIT](LICENSE) © Huiyan Wan

<sub>Built with 🪙 and a tiny pixel siren. Meow meow ~^.^~</sub>
