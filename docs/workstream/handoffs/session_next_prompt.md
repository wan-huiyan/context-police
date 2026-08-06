# Next-session prompt — description-cap workstream (paste-ready)

*Refreshed 2026-08-05 at the end of the rounds 3 / 3b / 3c session. Supersedes §9 of
`description-cap-workstream-handoff.md`, which carries the same content inline.*

---

```
Continue the SKILL.md description-cap workstream.

Read first, in this order. These live in the context-police repo under
docs/workstream/ -- that copy is CANONICAL. An older copy at ~/Documents/docs/
is a scratch leftover and has already drifted; ignore it.

  docs/workstream/handoffs/session_2026-08-05b_handoff.md          (last session, incl. review findings)
  docs/workstream/handoffs/description-cap-workstream-handoff.md   (§8 = current state, §4b has a STRUCK false claim)
  docs/workstream/plans/future_sessions_plan.md                    (prioritised backlog)
  docs/workstream/decisions/                                       (5 ADRs -- read 0003 and 0004 before acting)

STATE. Rounds 1, 2, 3, 3b and 3c are all merged AND delivered. 17 PRs across 7 repos;
11 carried a version bump and reached the installed copies. context-police is at
v2.3.0 and re-vendored into all six downstream repos (all hash-match canon).

Live install, measured at end of session:
  192 SKILL.md · 103 model-invocable · 89 disabled
  0 over cap · 0 wrap corruption · 0 lost triggers · 5 under 40 chars headroom · exit 0

Nothing is broken. Everything below is optional.

BEFORE ACTING ON ANY CLAIM IN THESE DOCS, RE-DERIVE IT. This is not boilerplate:
the previous handoff's headline instruction was flatly false and would have
corrupted correct figures across six repos (see ADR-0003). One command is usually
enough -- `git diff OLD NEW -- <file>` for a code claim, `gh pr view` for a
merge-state claim. The same applies to review-agent output: the fact-verifier that
found this session's best catch was itself wrong twice.

--------------------------------------------------------------------------------
TASK 1 (highest value) -- build the repo-vs-install parity check.  [issue #9]

WHY: this session merged two changes that never reached an installed user, and
NOTHING caught it. Not CI. Not the live-install gate -- which measures cap,
corruption and triggers, but never whether the installed copy matches the repo.
It was found by a fact-checking subagent reviewing a REPORT about the session,
after the session had been declared delivered. See ADR-0004.

WHAT: a CI rule that any commit touching `plugins/**` must also touch that
plugin's version (`plugins/<name>/.claude-plugin/plugin.json` + the matching
`marketplace.json` entry).

WHERE TO PUT IT: `context-police` is the natural home -- it already owns
`scripts/check_skill_descriptions.py`, which all six downstream repos vendor, so
the check ships the same way. Add it as a sibling script, wire it into
`.github/workflows/`, then re-vendor.

INPUTS YOU ALREADY HAVE:
  - the bump test is "does this file ship?", resolved from marketplace.json's
    `source` field -- NOT "is it a description?" (that framing is what failed).
    A repo whose source is `./` ships everything, README and CHANGELOG included.
  - the two real violations to use as fixtures:
      overnight-workflows      40b2460   6 shipped SKILL.md, no bump
      claude-ecosystem-hygiene 0dd72c5   1 shipped SKILL.md, no bump
  - verification recipe that caught it:
      diff <repo>/plugins/<p>/SKILL.md <installPath>/SKILL.md

GATE IT THE WAY THIS WORKSTREAM NOW GATES THINGS: write the negative control
first -- check out one of those two commits, confirm the new check goes red,
confirm it is green on HEAD. A check that has never failed has not been tested.

--------------------------------------------------------------------------------
TASK 2 -- headroom pass on the 5 skills the gate now names.  [issue #10]

Run the gate; read the NO HEADROOM tier (v2.3.0 computes it for you):
      23 left  funnel-lever-vs-predictor-deleaked-forward-gap   [overnight-workflows]
      31 left  agent-review-panel                               [agent-review-panel]
      33 left  publish-skill                                    [publish-skill]
      35 left  cross-worktree-spec-handoff-via-checkout-paths   [agent-traffic-control]
      39 left  skill-portfolio-existence-review                 [skill-portfolio-existence-review]

Follow §5 of the workstream handoff (the 9-step procedure). context-police v2.2.2
(PR #7) is a worked example of exactly this trim, end to end, including the
verification block. Expect the first attempt to regress; diagnose by
set-differencing dropped words.

REMEMBER: `--compare` only sees DOUBLE-QUOTED spans. Backticked literals are
invisible to it -- diff those by hand too (recipe in context-police SKILL.md
rule 11). And word-overlap scoring is blind to trigger RESTRUCTURING: rewriting
"fires on X -- separately, watch for Y" into "fires on X WHOSE Y" scores
identically while narrowing the trigger. Read the REWORDED rows yourself.

Bump every plugin whose SKILL.md you touch, and finish by measuring the LIVE
INSTALL (active paths from installed_plugins.json, not the whole cache tree --
it double-counts superseded version dirs).

--------------------------------------------------------------------------------
TASK 3 -- the ~11 remaining dangling `See also` refs. DO NOT AUTOMATE THIS.  [issue #11]

32 were removed by hand this session. A regex sweep for the rest deleted bullets
naming `the-project-repo` (a repo), `the-dashboard-service` (a Cloud Run service)
and `scan-bugs-parallel` (a session label), and was thrown away. The residue also
includes real external pointers carrying GitHub URLs and `~/.claude/skills/...`
paths, which resolve for a reader even with no local SKILL.md.

Vet each by hand or leave it. See ADR-0005 -- including its second-order lesson:
the original sweep was scoped to BULLETS, so it could never have found the dead
name that was sitting in a DESCRIPTION. When you scope a sweep for safety, write
down what the scope excludes; the exclusion is where the next defect lives.

--------------------------------------------------------------------------------
HOUSEKEEPING, if you have appetite:
  - ~/.claude/usage-tracking/ is in active use (18 records) but has no README.md,
    and the cctime fork is not installed at ~/.claude/tools/cctime-fork/ -- so
    session metrics fall back to a tokens-only recompute with NO cost figures.
    Both are one-time setup; see session-handoff step 24c.

ALWAYS bump the plugin version when a SHIPPED file changes -- not just when a
description changes. Finish by measuring the LIVE INSTALL. Verify nothing you
have not run a command to confirm.
```
