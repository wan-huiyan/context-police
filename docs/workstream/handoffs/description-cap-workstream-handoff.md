# Handoff — SKILL.md description-cap workstream

**Date:** 2026-08-05 (round 3 same day) · **Owner:** wan-huiyan · **Status:** ALL MERGED and delivered — live install passes the gate

> **Round 3 is done — see [§8](#8-round-3--executed-and-delivered-2026-08-05).** §4b's headline claim about a v2.2.1 off-by-one is **false** and is struck there; acting on it would have corrupted dozens of correct figures.

Read this top to bottom before touching anything. The companion file
[`description-cap-open-findings.md`](./description-cap-open-findings.md) holds the verbatim
auditor output; those findings are now docs-only defects on `main`.

---

## 1. What this workstream is

Claude Code injects every model-invocable skill's **name + description** into context on every
turn and into every subagent. Two independent limits govern it, both read out of the
**v2.1.221 binary** (not from docs):

| constant | default | effect |
|---|---|---|
| `skillListingMaxDescChars` | `1536` | per-skill cap on `description` (+ `" - "` + `whenToUse`, capped as a **pair**); longer is truncated |
| `skillListingBudgetFraction` | `0.01` | listing budget = `contextWindow × 4 × 0.01` **characters** |
| `bytesPerToken` | `4` | used to size that budget |

Truncation is **not intelligent**: the harness keeps `full[:1535]` and appends an ellipsis,
cutting mid-word. A description **is trigger text**, so any `when the user says "…"` phrase past
char 1535 **is already dead** — the skill cannot fire on it and nothing reports the loss.

**The finding that started it:** across an 18-plugin install, 12 skills were over cap and
**30 trigger phrases were invisible**. `agent-review-panel` had lost all 11 budget-mode triggers,
so a fully-documented feature could not be invoked by any of its own trigger phrases.

> ⚠️ **The `1536` / `0.01` / `4` constants are the load-bearing assumption of this entire
> workstream and every character figure in every PR inherits from them.** They were read from the
> binary by string-extraction. No agent could independently verify them. If you need certainty,
> re-extract from the current binary before publishing new numbers, and note that they are
> *settings* — a release or a user's `settings.json` can change them.

---

## 3. All PRs merged and DELIVERED

| Repo | PR | Result |
|---|---|---|
| `context-police` | #6 | v2.2.1 — the gate, trimming procedure, `--compare`, wrap detection |
| `claude-ecosystem-hygiene` | #14 | sync workflows now gate before push |
| `agent-review-panel` | #65 | 25 triggers recovered |
| `overnight-workflows` | #19, **#20**, **#21** | 5 skills; #20/#21 were needed to actually ship it |
| `agent-traffic-control` | #7 | 2 skills |
| `publish-skill` | #9 | gate ships inside the plugin tree |
| `skill-portfolio-existence-review` | #1 | |

**Verified end state:** every repo's `main` is CI-green and exits the gate 0, and the **live
install** (`~/.claude/plugins/cache` active versions + `~/.claude/skills`) exits the gate **0** —
0 skills over cap, 0 wrap corruptions, down from 12 over cap and 30 invisible trigger phrases.

---

## 4. THE LESSON THAT ALMOST COST THE WHOLE THING

**A description fix with no version bump is undeliverable.**

After merging all seven PRs and refreshing every marketplace and plugin, the live install was
*still broken*: five `overnight-workflows` skills remained over cap and one wrap corruption
remained live. `main` was correct; `plugin.json` still said `1.2.0`, matching what was installed,
so `claude plugin update` compared equal and did nothing.

Three review passes ran over that PR — a trim, a defect round, and a consistency audit. **Every
one verified the repository. None verified the delivery.** Fixed by PRs #20 and #21.

> Always finish by measuring the **live install**, not the repo:
> ```bash
> python3 -c "import json;d=json.load(open('$HOME/.claude/plugins/installed_plugins.json'))['plugins'];print(' '.join(e['installPath'] for v in d.values() for e in v if e.get('installPath')))" > /tmp/active.txt
> python3 context-police/scripts/check_skill_descriptions.py $(cat /tmp/active.txt) ~/.claude/skills --triggers
> ```
> Note this scans **active versions only**. Scanning the whole `plugins/cache` tree double-counts
> superseded version directories, which are left on disk after an update.

---

## 4b. Remaining work — ⚠️ SUPERSEDED 2026-08-05, see §8

Round 3 executed everything below. **Read §8 before acting on this section**, which contains a
false claim about the off-by-one that would have corrupted dozens of correct published figures.

**Re-vendor the gate at v2.2.1.** Every vendored copy is behind by 4–34 lines. ~~This matters
because v2.2.1 fixes an off-by-one — the dead tail is `desc − (cap−1)`, not `desc − cap` — so
every "N chars discarded" figure now on main is one too low.~~

> ❌ **FALSE, verified 2026-08-05.** `git diff 4dc1a62 HEAD -- scripts/check_skill_descriptions.py`
> touches **only** `find_wrap_corruption()`. `desc_chars - (MAX_DESC_CHARS - 1)` was already in
> v2.2.0, and `grep -c 'MAX_DESC_CHARS - 1'` returned 4 in **every** vendored copy before
> re-vendoring. **No "N chars discarded" figure anywhere was wrong.** The only behavioural delta
> is that v2.2.0 reports a bogus `BROKEN BY LINE-WRAP` on `description: >-` skills (11 → 7 hits
> across `~/.claude/plugins/cache`; all 4 dropped are false positives).

**Accuracy defects now on `main`, not in PR bodies.** The merges baked the known inaccuracies into
READMEs, CHANGELOGs and commit messages: a stoplist called 60 words that is 72, a plugin called
29 skills that has 31, a misquoted eval prompt, a reference to a nonexistent
`~/Documents/skill-test-templates/`. See `description-cap-open-findings.md`. These are docs-only.

**Unreproducible coverage tables** still sit in merged CHANGELOGs where the harness was never
committed. Either commit it or strike the numbers.

**29 skills sit above 75% of the cap** — one edit from breaking. Worth a headroom pass.

---

## 5. Domain knowledge worth keeping

### The trimming procedure (validated end-to-end)

1. Run `--triggers` **first** — see what is already dead before changing anything.
2. **Compress synonym runs; never delete concepts.** The model generalizes from `"cheap review"`
   to `"frugal review"` — but not from a phrase it never sees.
3. Cut prose, not trigger vocabulary. Implementation detail belongs in the body.
4. Keep the NOT-for list — that is precision, and it stops false firing.
5. **Score against `old[:1535]`**, what the model *actually saw* — not the full oversized source.
   The wrong baseline makes every honest trim look like a regression.
6. **Expect the first attempt to regress.** Measured: 11 better / 18 same / **10 worse**. Diagnose
   by set-differencing dropped words, restore exactly those, re-cut → 13 / 25 / 1.
7. Track **separation** (positive mean − negative mean), not just recall.
8. Leave 30–50 chars of headroom.
9. Re-wrap with **`break_on_hyphens=False`** (see below).

### Three traps that cost real time

**Line-wrap corruption.** `description: >` joins lines with a **space**, and `textwrap.wrap()`
breaks on hyphens **by default** — so a machine re-wrap silently injects `"token- efficient
review"`. Character count is unchanged, so no length check sees it. Found in two repos including
the reference fix. The gate now detects it and fails.

**Word-overlap scoring is blind to restructuring.** Rewriting `trigger on X — separately, watch
for Y` into `trigger on X WHOSE Y` keeps the identical word set and scores **identically**, while
the trigger now only fires for users who already diagnosed Y. Use
`check_skill_descriptions.py --compare OLD NEW` and read the `NARROWED` rows **by hand**.

**The cap is necessary, not sufficient.** Under the cap only means *no longer truncated*.
`skillListingBudgetFraction` can still collapse a description to a bare name — **usage-ranked,
not length-ranked**. Only ~41% of descriptions survive on this install at 1M context. Never
headline "restored N triggers" without that caveat.

### Operational gotchas

- **`gh pr edit --body-file` silently fails** on repos with classic projects enabled — prints a
  GraphQL deprecation error and leaves the body unchanged. Use
  `gh api -X PATCH repos/OWNER/REPO/pulls/N --input body.json`, then **re-read the body and grep
  for your text** to prove it landed.
- **Never reserialize JSON** for a version bump — `json.dumps` default `ensure_ascii` escapes
  em-dashes to `—` and turns a 1-line change into a 90-line diff. Use a targeted regex.
- **Check `git status` before every commit** — `npm install` and test runs generate
  `package-lock.json` and golden files that must not enter the diff.
- **Local pass ≠ CI pass.** Node's TTY reporter prints `ℹ tests N` while CI prints `# tests N`; a
  release-check grepping for one silently skips locally and fails in CI.
- `schliff score` measures SKILL.md **body** size — orthogonal to this. A body-size pass left one
  description at 1,501 chars (35 under cap); the next commit blew past it and schliff never
  complained.

---

## 6. Tooling

| Tool | Location | Purpose |
|---|---|---|
| `check_skill_descriptions.py` | `context-police/scripts/` (v2.2.1, on main) | the gate: cap, triggers, wrap corruption, `--compare` |
| `score_trigger_coverage.py` | `agent-review-panel/scripts/` | reproducible coverage scoring vs an eval suite |

```bash
python3 check_skill_descriptions.py .              # exit 0 clean / 1 over-cap or corrupt / 2 bad path
python3 check_skill_descriptions.py . --triggers   # what truncation is destroying
python3 check_skill_descriptions.py --compare main:path/SKILL.md path/SKILL.md
```

---

## 7. How this was run, and what to repeat

Three agent rounds: fan-out trim (10 agents) → defect fixes (8) → consistency audit (10).
**Adversarial verification earned its keep** — it caught a fabricated "tagged releases" claim on a
repo with zero tags, a false sibling-coverage justification, and a real bug in the gate itself.

**But it does not converge on prose.** Each round fixed the substance and generated new checkable
claims that the next audit caught. Round 2 cost ~1.6M tokens to fix 62 findings and surface 42
more. Recommendation: **do the remaining accuracy work in one focused pass, not another
fan-out** — and have a single agent verify at the end rather than one per repo.

**Do not trust an agent's self-report.** Several claimed a fix was complete while the retracted
claim survived elsewhere in their own diff. Always re-read `git diff main...HEAD` yourself.

---

## 8. Round 3 — executed and delivered 2026-08-05

All seven items in §4b are done. One PR per repo, all merged, all plugins updated, and the
**live install re-measured**: `192 SKILL.md · 103 model-invocable · 0 over cap · 0 wrap
corruption · 0 lost triggers · 5 no-headroom · exit 0` (192 after a parallel session's v1.10.0
landed mid-flight; it was 191 when round 3 closed), with both changed descriptions confirmed at the
*installed* copies (`context-police` 1,483 · `pre-dispatch-schema-probe` 1,423).

| repo | PR | version |
|---|---|---|
| `context-police` | #7 | 2.2.2 |
| `claude-ecosystem-hygiene` | #16 | 1.10.2 / ecosystem-audit 1.2.3 |
| `agent-review-panel` | #66 | 3.8.2 |
| `overnight-workflows` | #22 | — (nothing under a plugin source dir) |
| `agent-traffic-control` | #9 | 1.9.1 (rebased onto a mid-flight v1.9.0) |
| `publish-skill` | #10 | 2.4.1 |
| `skill-portfolio-existence-review` | #2 | 1.1.2 |

**The constants were re-extracted from the current `2.1.222` binary** — newer than the 2.1.221
this workstream was built on. All four unchanged (`0.01 / 4 / 200000 / 1536`); only the minified
identifiers moved. Truncation is still `slice(0, cap-1) + "…"`. §1's warning can be downgraded:
the load-bearing assumption held across a release.

Two extraction gotchas worth keeping: `strings` is ASCII-only and the source escapes the ellipsis
as `…`, so `strings BINARY | grep '…'` returns **zero** hits and looks like the behaviour is
gone — use `LC_ALL=C grep -ao` on the binary. And the collapse-priority floor is on the **decay
term**, not the product: `usageCount * Math.max(Math.pow(0.5, days/7), 0.1)`. A published README
had it as "floored at 0.1" applied to the product — a 5× error.

### What round 3 actually found

Every one of these was a guard or a claim that looked true and was not:

- **A "not a stale fork" test that passed on an actual stale fork.** Three substring greps; the
  drift was *inside* a function whose name never changed. Now a pinned sha256, with a negative
  control proving it goes red.
- **A description routing to `verify-plan-constants-against-data`**, a skill that exists nowhere.
- **`CONTRIBUTING.md` promising a wrap gate that skips disabled skills** — 74 of 94 in that repo.
  Negative control: corruption in a disabled skill, text report exit 0 and silent, `--json` exit 1.
- **A 6th published surface with zero gating** — dropping `web-verified` from it left 12/12 green.
- **A golden snapshot never committed**, so its test's missing-file branch did
  `writeFileSync(...); assert.ok(true)`. That fixture had never been guarded.
- **A coverage table that did not reproduce** — 13/25/1 claimed vs 12/27/0 measured, and the
  "1 marginally lower" row does not exist.
- **A reproduce command pinned to `main`** which, post-merge, prints a table of zero deltas and
  reads as refuting the table above it. Pin to commits.
- **A "9 artifact categories" list naming two categories that do not exist** (`provenance`
  appears zero times in the skill).
- **`context-police` itself at cap−3** while publishing "leave 30–50 chars of headroom".

### Round 3b — the gate's own guarantees (context-police v2.3.0)

Asked whether context-police itself should absorb what round 3 found. It should: **two of the
four lessons existed only in downstream repos**, which is backwards for the upstream six repos
copy from. Shipped as `context-police#8`, then re-vendored into all six (`#17 #23 #11 #3 #67 #11`)
and delivered — `agent-review-panel` 3.8.3 and `publish-skill` 2.4.2 bumped because those two
actually ship the gate; the other four are CI-only.

| gap | fix | control |
|---|---|---|
| wrap corruption scored over model-invocable skills only — 74/94 disabled in one repo, so CI was blind to most of it | scored over **every** skill, fails the build, disabled hits in their own group | disabled skill + real hyphen break: was silent/exit 0, now named/exit 1 |
| `APPROACHING CAP` spanned 23→340 chars of headroom in one bucket; this skill sat at cap−3 inside it | new **`NO HEADROOM`** tier at `MIN_HEADROOM = 40`, tightest-first, slack on every row | fixture at 1,520 vs 1,200 → separate tiers, both still exit 0 |
| a "not a stale fork" guard built from 3 substring greps stayed green on a real stale fork | SKILL.md prescribes a **pinned sha256** + naming the test for what it proves | already proven in round 3 (283/1 vs 284/0) |
| `--compare` blind to backticked literals; a trim dropped 3 with 0 DROPPED reported | SKILL.md documents it + ships a description-scoped hand-diff recipe | recipe run against the trim that hid them |

**No repo went red** — all seven were verified clean, disabled skills included, before the exit
code was tightened. The new tier surfaces exactly 5 skills across the live install.

Also caught in passing: the corrected `agent-review-panel` figures had **not** reached
context-police, which is where the procedure that quotes them lives. `+26.0 → +32.0 pts` and
`13 / 25 / 1` were still published in SKILL.md and README; now `+0.2605 → +0.3183` and
`12 / 27 / 0`. *Ship the correction to every rendered surface, not just the repo you found it in.*

### Round 3c — the delivery bug this session committed itself

Caught by the fact-verifier on the plain-English explainer, **after** the session had been reported
as delivered. Two merged changes had never reached an installed user:

| what | why it was stranded | fix |
|---|---|---|
| `overnight-workflows` #22 — 12 dead cross-refs removed from **6 shipped `SKILL.md` files** | commit body asserted "nothing under a plugin source dir changed". False. No bump → `claude plugin update` compared equal and did nothing | #24: `observational-analysis-rigor` 1.2.2, `overnight-multi-issue-implementation` 1.2.2, `overnight-review-panel-blocked-reviewer-reads-as-clean` 1.0.1 |
| `claude-ecosystem-hygiene` — `skill-portfolio-repo-placement-scan`'s **description** routed to `skill-portfolio-audit`, which exists nowhere | the dangling-ref sweep only scanned See-also **bullets**, never descriptions | #18: 1,304 → 1,278 chars, 0 dropped / 0 narrowed, plugin 1.0.1 / repo 1.10.3 |

**This is §4's lesson, committed by the session cleaning up after §4.** Verified after fixing:
repo and installed copies byte-identical for all six files, and a scoped re-scan finds **0**
stranded removals in the three repos that were stripped.

> **The live-install gate cannot catch this.** It measures cap, corruption and triggers — never
> repo-vs-install parity. Nothing does. The only reliable guard would be a CI check that any commit
> touching `plugins/**` also touches that plugin's version. **Worth building; it is the single
> highest-value thing left in this workstream.**

Second-order lesson: the *dangling-ref audit itself* was scoped to bullets, so it could never have
found the description-level instance. When you scope a sweep for safety, write down what the scope
excludes — the exclusion is where the next defect lives.

### Still open

- **~11 dangling `See also` refs remain**, deliberately. 32 unambiguous bare-name pointers were
  stripped; the residue is ambiguous — some carry GitHub URLs or explicit `~/.claude/skills/…`
  paths (real external pointers), and `the-project-repo` / `the-dashboard-service` /
  `scan-bugs-parallel` are a repo, a Cloud Run service and a session label. A regex sweep deleted
  those and was thrown away. **Do not automate this one.**
- **5 skills now report `NO HEADROOM`** (under 40 chars), which the v2.3.0 gate surfaces for you:
  `funnel-lever-vs-predictor-deleaked-forward-gap` (23), `agent-review-panel` (31),
  `publish-skill` (33), `cross-worktree-spec-handoff-via-checkout-paths` (35),
  `skill-portfolio-existence-review` (39). Just run the gate — no need to compute it by hand.

---

## 9. Next-session prompt

```
Continue the SKILL.md description-cap workstream.

Read first:
  ~/Documents/docs/handoffs/description-cap-workstream-handoff.md   (§8 = current state)
  ~/Documents/docs/handoffs/description-cap-open-findings.md        (round-2 audit, now historical)

State: rounds 1, 2, 3, 3b and 3c are all merged and DELIVERED (context-police
is at v2.3.0 and re-vendored everywhere). 17 PRs, 11 of which carried a version
bump and reached the install. The live install measures
192 SKILL.md / 103 model-invocable / 0 over cap / 0 wrap corruption / 0 lost triggers / 5 no-headroom / exit 0. Nothing is broken. Everything below is optional.

BEFORE ACTING ON ANY CLAIM IN THIS DOC, re-derive it. §4b's headline instruction
was flatly false and would have corrupted every correct character figure it
touched. ("dozens" was the handoff's own unverified word -- I did not count them
either, and said so.) One command
is usually enough: `git diff OLD NEW -- <file>` for a code claim, `gh pr view` for
a merge-state claim.

Candidates, in rough value order:

1. BUILD THE REPO-VS-INSTALL PARITY CHECK. This session merged two changes that
   never reached an installed user (see §8, round 3c) and NOTHING caught it --
   not CI, not the live-install gate, which measures cap/corruption but never
   whether the installed copy matches the repo. A CI check that any commit
   touching `plugins/**` also touches that plugin's version would have caught
   both. Highest-value item left.

2. Headroom pass. Run the gate and read the NO HEADROOM tier -- v2.3.0 computes it
   for you. Currently 5 skills: funnel-lever-vs-predictor-deleaked-forward-gap (23),
   agent-review-panel (31), publish-skill (33),
   cross-worktree-spec-handoff-via-checkout-paths (35),
   skill-portfolio-existence-review (39). Follow §5's procedure; context-police
   v2.2.2 is a worked example of exactly this trim, end to end.

2. DONE in v2.3.0 — the wrap-corruption exit code now covers disabled skills, and
   a NO HEADROOM tier separates the urgent cases. Nothing left here.

4. The ~11 remaining dangling `See also` refs. DO NOT AUTOMATE THIS. A regex
   sweep deleted bullets naming `the-project-repo` (a repo), `the-dashboard-service`
   (a Cloud Run service) and `scan-bugs-parallel` (a session label), and had to be
   thrown away. The residue also includes real external pointers carrying GitHub
   URLs and explicit ~/.claude/skills/ paths. Vet each by hand or leave it.

ALWAYS bump the plugin version when a shipped file changes — a fix without a bump
never reaches an installed user. Finish by measuring the LIVE INSTALL (active
versions from installed_plugins.json, not the whole cache tree, which double-counts
superseded version dirs). Verify nothing you have not run a command to confirm.
```
