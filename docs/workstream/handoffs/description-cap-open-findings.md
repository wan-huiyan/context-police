# Open findings after Round 2 (2026-08-05)

> **⚠️ HISTORICAL as of 2026-08-05 (round 3). Do not act on this file directly.**
>
> Round 3 re-verified every finding below against `main` and fixed the ones that were still
> live. Most were **PR-body / commit-message only** and never reached a shipped file — the
> "60-word stoplist", the "29-skill" plugin, the misquoted eval prompt and the `each one`
> phrasing all return **zero** grep hits in any repo's tracked files.
>
> Several findings were also **already stale when written or overtaken since**:
> `context-police#6` has merged, so every "the fix is on an open PR / uncommitted in upstream's
> working tree" claim is resolved by a plain re-vendor; and
> `claude-ecosystem-hygiene`'s coverage figures **do** reproduce to four decimals — the harness
> prints two stopword variants and reading only the tail shows the wrong one.
>
> What was real and is now fixed, plus what is deliberately left: see §8 of
> [`description-cap-workstream-handoff.md`](./description-cap-workstream-handoff.md).

Verbatim output of the round-2 consistency auditors. Every item below was produced by an
agent that ran the commands; treat as high-signal but RE-VERIFY before acting — the auditors
themselves occasionally miscount.

All five PRs are OPEN, MERGEABLE, CI-green. Nothing here blocks merge; these are accuracy
defects in PR narratives and docs, plus a few real code nits.


---

## wan-huiyan/overnight-workflows (PR #19, branch `fix/skill-description-cap`, tip `7d0dc62`)

- surfaces agree: False  | gate up-to-date: False  | wrap clean: True  | numbers reproducible: False

### Problems (10)

1. STALE NUMBER, two surfaces: the harness stoplist is 72 words, not 60. PR body line 135 says "'before' is a function word in the committed harness's 60-word stoplist"; commit 7d0dc62's message says "whose stoplist is 60 visible function words". Reality: /Users/huiyan/Documents/overnight-workflows/scripts/score_trigger_coverage.py:63-68 defines STOP with 72 words (72 unique). Verified by parsing the literal. The upstream script it was adapted from (/Users/huiyan/Documents/agent-review-panel/scripts/score_trigger_coverage.py) also has 72, so 60 is not inherited -- it is invented. 60 appears nowhere in CONTRIBUTING.md or either script.

2. MISQUOTED EVAL PROMPT: PR body line 140 and commit 7d0dc62 both quote the regressed prompt as "...implement test and review each one". No such prompt exists. The committed suite's actual string (scripts/eval/description-trigger-suite.json, overnight-multi-issue-implementation positives) is "each of these issues has acceptance criteria, implement test and review them independently". `grep -c 'each one' scripts/eval/description-trigger-suite.json` returns 0. The PR quotes a prompt from a suite it just committed and does not match it.

3. WRONG CAUSAL DIAGNOSIS of that same regression. PR body line 140: "the description says 'implemented + tested + reviewed'. The harness does not stem, and it keeps hyphenated compounds whole, so bare `test` / `review` do not match." The harness's own output disagrees: regressions[].dropped_words for that prompt is ["review"] only. `test` did not match BEFORE the trim either (verified: matched-before set = acceptance, criteria, each, implement, independently, issues, review), so it contributes nothing to the .875 -> .750 delta. The real cause is that the trim deleted the prose word "review" that main's visible description carried in "...so review trail survives". The conclusion ("No trigger vocabulary was lost") still holds, but the stated mechanism is not the mechanism.

4. SKILL COUNTS CONTRADICT THE REPO'S OWN SURFACES, INSIDE THE SAME DIFF. PR body line 180 says "the 29-skill observational-analysis-rigor plugin" and line 234 says "across observational-analysis-rigor -- 29 skills, 25 of them model-invocable at ~1,200 chars each". Reality: 31 SKILL.md under plugins/observational-analysis-rigor (13 disabled -> 18 model-invocable). plugins/observational-analysis-rigor/.claude-plugin/plugin.json:3 says "31 skills ... One flagship 9-step protocol skill + 30 focused deep-dive skills"; README.md:36 says the same 1+30. The "25 model-invocable" is the REPO-WIDE figure from the gate header ("38 SKILL.md (25 model-invocable, 13 disabled)"), correctly repo-scoped in commit 7eae92e's message and then misattributed to a single plugin in the PR body. This misstates the size of the 'Not addressed' triage pass by 7 skills.

5. VENDORED GATE PROVENANCE IS NOT REPRODUCIBLE AND IS OVERSTATED ON THREE SURFACES. scripts/check_skill_descriptions.py does not exist on wan-huiyan/context-police main at all (`git ls-tree origin/main scripts/` lists only apply_disable_model_invocation.py, dev/, pilot/, render_treatment_report.py). Upstream main's plugin.json version is 2.0.0. The 'v2.2.0' code lives only on the OPEN, UNMERGED branch feat/description-cap-gate (PR #6, still OPEN, titled 'feat: publish-time description-cap gate (v2.1.0)'), commit 4dc1a62. No v2.1.0 or v2.2.0 tag/release exists -- latest release is v2.0.0. PR body line 212 discloses only that the copy is 'one fix ahead of upstream's PUBLISHED TREE', which implies a published tree containing v2.2.0 exists. It does not.

6. THE VENDORED FILE'S OWN HEADER CONTRADICTS THE FILE. /Users/huiyan/Documents/overnight-workflows/scripts/check_skill_descriptions.py:4-6 reads "Vendored from wan-huiyan/context-police (scripts/check_skill_descriptions.py) at v2.2.0. Do not edit locally -- fix it upstream and re-vendor, so every repo's gate agrees on the cap arithmetic." The file IS locally edited relative to 4dc1a62 (13 insertions / 2 deletions in find_wrap_corruption) and carries no in-file note of the delta. Commit a64ada7's message says "re-vendor once it is, and drop this note" -- but there is no such note in the file. CONTRIBUTING.md ("The gate script is vendored from wan-huiyan/context-police; fix it upstream and re-vendor rather than editing the copy here.") has the same gap. A future contributor re-vendoring per those instructions silently reverts the fix and turns CI red.

7. THE FIX THE WHOLE PR DEPENDS ON EXISTS ONLY AS AN UNCOMMITTED WORKING-TREE CHANGE IN ANOTHER REPO. `git -C /Users/huiyan/Documents/context-police status --short` -> ` M scripts/check_skill_descriptions.py`. A reviewer cannot obtain it. I confirmed the consequence: running the COMMITTED upstream 4dc1a62 against this branch reports 2 false-positive BROKEN BY LINE-WRAP hits (finding-verification-live-bq-triple-probe: `- Independently`; ship-the-correction-to-every-rendered-surface: `- The`). The PR's Verification block (line 217, `--triggers -> exit 0`) therefore only holds against the local patched copy.

8. MINOR, two surfaces disagree on the collapse mechanism: PR body line 150 says the harness "ranks by usage, not by length"; the vendored gate's own docstring at scripts/check_skill_descriptions.py:18 says "the harness walks skills by priority". Neither is verifiable from this repo.

9. MINOR, rounding disagreement inside the same section: PR body line 130's table prints snapshot-feature separation +0.744 -> +0.729 (a -0.015 step as printed) while line 142 says "moved -0.014 on the fifth". The underlying values are 0.7436 -> 0.7293 = -0.0143, so line 142 is right and the rounded table is what disagrees.

10. MINOR, misleading history claim: PR body line 207 and commit a64ada7 say "The previously vendored copy had drifted behind [upstream]." The 'previously vendored copy' was introduced one commit earlier on this same branch (7eae92e); nothing drifted over time -- 7eae92e vendored a pre-wrap-detection version and a64ada7 replaced it three commits later in the same PR.


### Stale numbers (7)

1. scripts/score_trigger_coverage.py:63-68 -- stoplist has 72 words vs PR body line 135 + commit 7d0dc62 claiming "60-word stoplist" / "60 visible function words"

2. plugins/observational-analysis-rigor -- 31 SKILL.md on disk and "31 skills" in plugins/observational-analysis-rigor/.claude-plugin/plugin.json:3 (and 1+30 in README.md:36) vs PR body lines 180 and 234 claiming "29-skill" / "29 skills"

3. plugins/observational-analysis-rigor -- 18 model-invocable (31 total minus 13 disabled) vs PR body line 234 claiming "25 of them model-invocable"; 25 is the repo-wide count from the gate header "38 SKILL.md (25 model-invocable, 13 disabled)"

4. scripts/eval/description-trigger-suite.json -- actual prompt "each of these issues has acceptance criteria, implement test and review them independently" vs PR body line 140 + commit 7d0dc62 quoting "...implement test and review each one" (grep for "each one" returns 0 hits)

5. harness JSON regressions[].dropped_words = ["review"] vs PR body line 140 + commit 7d0dc62 attributing the delta to bare "test" AND "review"

6. wan-huiyan/context-police main plugin.json version = 2.0.0, latest release/tag = v2.0.0, and scripts/check_skill_descriptions.py absent from main entirely -- vs "at v2.2.0" in PR body line 207 and unqualified in scripts/check_skill_descriptions.py:4

7. PR body line 130 prints snapshot separation step -0.015 while line 142 states -0.014 (underlying -0.0143)


### Unverified claims (5)

1. "1,536 chars (skillListingMaxDescChars, default read from the v2.1.221 binary)" and "skillListingBudgetFraction, 1% of the context window" (PR body lines 3 and 150). Asserted from an external binary; nothing in this repo or the reachable environment verifies them. Every char-cap and listing-budget figure in the PR inherits from these two constants, so all of them are conditional on an unaudited claim.

2. "it ranks by usage, not by length" (PR body line 150) -- the mechanism by which the harness chooses which descriptions collapse to bare names. The vendored gate says "by priority" instead. Unverifiable either way from the repo.

3. "the NOT-for redirect pointed at a skill name that does not exist, so the model reading it had nothing to route to" (PR body line 193). The repaired target `exploratory-data-analysis` is not a skill in this repo either (only referenced, never defined), so the routing target may still not resolve; the claim's premise about the corrupted form is true but the implied fix-to-a-real-skill is unverified.

4. "adapted from wan-huiyan/agent-review-panel's script of the same name" (PR body line 117). The local file exists and is committed there (c798528), but I did not verify it is pushed to the public remote, so a reviewer may not be able to check the adaptation.

5. The re-vendor instruction "Applied to the upstream working copy but not yet committed or released there; re-vendor and drop the note once it is" (PR body line 212, commit a64ada7). Verified true as of now, but it makes correctness of this repo's CI depend on a future action in a different repo that has no tracking issue, no PR, and no note in the vendored file itself.


---

## wan-huiyan/agent-traffic-control (PR #7, branch fix/skill-description-cap-trim, HEAD 1c734e3 — matches PR headRefOid and origin)

- surfaces agree: False  | gate up-to-date: True  | wrap clean: True  | numbers reproducible: True

### Problems (8)

1. FALSE CLAIM, disproved by the PR's own committed harness. PR body 'Two honest caveats' #2: 'Both remaining `worse` rows are tokenizer artifacts, not lost triggers. Both lose the token `unblock`... I chose not to spend 9 chars buying back a word the description already carries in another inflection.' Reality: only ONE of the two rows loses `unblock`. The other row — prompt 'My html deliverables are blanket ignored but I need to share the design mockups', 0.714 -> 0.571 — loses the token `deliverables`. That word was inside the pre-trim VISIBLE window (old description: '`*.html` in a repo that produces HTML deliverables but also keeps design mockups under `docs/`') and NO inflection survives (`deliver*` returns [] in the new description, /Users/huiyan/Documents/agent-traffic-control/plugins/agent-traffic-control/skills/cross-worktree-spec-handoff-via-checkout-paths/SKILL.md:4-22). It is a real dropped content word, not a tokenizer artifact, and the stated justification does not apply. Conflicting values: PR body 'Both lose the token `unblock`' vs harness-computed lost-token sets ['deliverables'] and ['unblock'].

2. FALSE CLAIM + CONTRADICTION INSIDE THE PR BODY. PR body (Reproducible coverage numbers, final paragraph): 'the first trim had dropped the ordinary words `working`, `other` and `cycle` that the natural-language prompts leaned on. Those are restored.' Commit 1cf83a6 repeats it verbatim. Token-level check (harness words()) across every revision of cross-worktree-spec-handoff-via-checkout-paths/SKILL.md: `cycle` present at afbee80 ('no PR review cycle'), present at a4cda1a, present at HEAD — NEVER dropped, therefore never restored. `other` was present at afbee80 and dropped only at a4cda1a, so 'the first trim' is the wrong attribution for it too. Only `working` matches. This also contradicts the PR body's OWN REWORDED table (row 2, 'without a PR review cycle' -> 'no PR review cycle'), which shows `cycle` present on both sides of the diff.

3. SURFACE DISAGREEMENT INSIDE THE SAME DIFF: CONTRIBUTING.md vs PR body on what the gate enforces. CONTRIBUTING.md (new 'skill-description cap gate' section) says 'The same script also fails on line-wrap corruption' and adds an 'If the description gate fires — BROKEN BY LINE-WRAP' remediation section. The PR body's 'One upstream wart, reported not patched' section says the opposite for the majority case: the text report's exit code counts wrap corruption in model-invocable skills only. Verified in code at /Users/huiyan/Documents/agent-traffic-control/scripts/check_skill_descriptions.py:427 (`corrupt = [s for s in live if s.wrap_corruption]`) and :484 (`return 1 if (over or corrupt) else 0`). 74 of 94 skills here are disabled, so for the vast majority CONTRIBUTING.md's promise is false — which is precisely why the 4 real defects had to be found via `--json` and not CI.

4. OVERSTATED CLAIM about the eval suites. PR body: 'Negatives are drawn from sibling skills in this repo (each row names the sibling).' /Users/huiyan/Documents/agent-traffic-control/scripts/eval/pre-dispatch-schema-probe.eval-suite.json:29 (neg-1) names `verify-plan-constants-against-data`, which does not exist anywhere in this repo — grep finds it only as a dangling cross-reference inside pre-dispatch-schema-probe/SKILL.md lines 19, 265, 282. 29 of 30 negatives name a real sibling directory; that one does not. Same clause the PR body defends keeping as 'precision — it is what stops false firing'.

5. TRANSCRIPT PRESENTED AS VERBATIM OUTPUT BUT IS NOT. PR body lines 83-98 show a `$ python3 scripts/check_skill_descriptions.py ... --compare ...` block. Figures are right (2,146->1,501 REWORDED (4); 1,539->1,465 REWORDED (1); no drop/narrow), but real output differs: header reads 'trigger-surface diff · 2,146 → 1,501 chars · 0 triggers unchanged' — the PR omits '0 triggers unchanged', i.e. that EVERY trigger was reworded and none held verbatim; REWORDED rows print as a bulleted list, not comma-joined; and the tool never prints 'exit 0' inside its output. The other quoted block (OVER CAP, +611/+4 cut) IS byte-accurate, so the mixed fidelity misleads.

6. THE 'Superseded claims still in the git history' TABLE IS INCOMPLETE though presented as the mechanism by which 'the record corrects itself'. Missing: (a) afbee80's 'reclaimed 613 chars of pure waste' — the gate on main now prints 'removes 615 wasted chars'; (b) afbee80's 'roughly 72%' delivery figure; (c) a4cda1a's 'it sat at offset 1,690' — corrected to 1,702 in prose but attributed only to 'an earlier revision of this PR', not to the published commit that also carries it; (d) a4cda1a's quoted restored text 'Cleanup: `gh pr merge --delete-branch` fails...' and '...the parallel session's files' — the shipped description has no 'Cleanup:' prefix and says '...that session's files'.

7. MINOR: PR body says scripts/score_trigger_coverage.py differs from wan-huiyan/agent-review-panel's copy in 'only the docstring's USAGE paths'. `diff` shows the USAGE paths PLUS a 2-line attribution note added to the docstring. Scoring logic is byte-identical (verified), so the substantive claim holds.

8. MINOR/INFORMATIONAL on the re-vendor claim. PR body: '`diff` against upstream shows those three lines as the only difference.' True against upstream's COMMITTED v2.2.0 (context-police 4dc1a62) — verified, 3-line provenance note only. NOT true against the upstream checkout as it currently stands: /Users/huiyan/Documents/context-police/scripts/check_skill_descriptions.py has uncommitted changes to find_wrap_corruption() (whole-block-header regex handling `>-`/`|+`/`|2` chomping, and stopping at the next YAML key). I ran BOTH against HEAD and main: identical results (0 wrap hits on HEAD, same 4 on main), so no quoted number is affected. Also, context-police has no v2.2.0 git tag (tags stop at v2.0.0); 'v2.2.0' is a plugin.json/marketplace version, not a release tag.


### Stale numbers (5)

1. afbee80 commit message: 'Trimming these two reclaimed 613 chars of pure waste' — the gate on main now reports 615 (610+3 -> 611+4 under the corrected desc-(cap-1) formula). Not listed in the PR body's superseded-claims table.

2. a4cda1a commit message: 'it sat at offset 1,690' — actual is 1,702 (verified: description.find('gh pr merge') == 1702). Corrected in prose, absent from the superseded-claims table.

3. a4cda1a commit message quotes the restored footgun as 'Cleanup: `gh pr merge --delete-branch` fails...' and the referent fix as '...the parallel session's files'; HEAD ships neither the 'Cleanup:' prefix nor that wording ('...that session's files'). Not flagged anywhere.

4. afbee80 commit message: 'roughly 72% of that refresh's description work was written and immediately discarded' — corrected complement is 71.6% (242/853 = 28.4% delivered). Not named in the superseded table.

5. No stale number found in the working tree itself: repo-wide grep returns 0 hits for 1,485 / 1,508 / 1,424 / 610 / 0.6415 / 0.7050 / 0.4541 / 0.5457 / 'line 155' / 'sibling skill were cut' / 'StructuredOutput schema with one cheap agent' / 21,057. VERSION, plugin.json and marketplace.json all read 1.8.1.


### Unverified claims (8)

1. 'Both remaining `worse` rows ... Both lose the token `unblock`' — DISPROVED by running the committed harness: one row loses `deliverables`, a word with no surviving inflection in the new description.

2. 'the first trim had dropped the ordinary words `working`, `other` and `cycle` ... Those are restored' (PR body + commit 1cf83a6) — DISPROVED: `cycle` was never dropped at any revision; `other` was dropped by a4cda1a, not the first trim.

3. 'Negatives are drawn from sibling skills in this repo (each row names the sibling)' — schema-probe neg-1 names `verify-plan-constants-against-data`, which is not a skill in this repo.

4. 'capped per skill by skillListingMaxDescChars (default 1536, read from the v2.1.221 binary)' and 'the harness keeps description[:1535] and appends an ellipsis' — inherited from upstream context-police, not verifiable from this repo, yet every downstream figure (611, 4, 35, 71, all coverage baselines) depends on it.

5. 'Upstream context-police reports ... only ~41% of descriptions survive the budget at 1M context' — the figure does exist at /Users/huiyan/Documents/context-police/SKILL.md:264 and is correctly attributed as 'their measurement, not one I ran here', but is itself unverified.

6. 'the scoring logic is byte-identical, only the docstring's USAGE paths differ' — logic byte-identical (verified); docstring also gained a 2-line attribution note.

7. Coverage figures reproduce exactly but, as the PR itself discloses, are NOT independent — the eval suite is authored by the same agent and the descriptions were tuned against it.

8. README.md:178 'Every distinct concept and every quoted trigger phrase survives the trim' — the quoted-trigger half is verified by --compare (0 dropped, 0 narrowed); the 'every distinct concept' half is a human judgement no tool checks, and the PR body itself lists two deliberate non-restorations (`--oneline`, `no merge needed`) plus the now-demonstrated loss of `deliverables`.


---

## wan-huiyan/publish-skill — PR #9, branch fix/skill-description-cap, head 7113864e7b27eeaadb0ebeb5a941def5c3025953 (local HEAD == origin == PR headRefOid)

- surfaces agree: False  | gate up-to-date: False  | wrap clean: True  | numbers reproducible: False

### Problems (7)

1. P1 CONTRADICTION INSIDE THE SAME DIFF (README vs README vs PR body vs commit). README.md:68 (line added by this PR): "The 25-prompt suite had zero prompts for the plugin-install-failure surface". README.md:266 (also added by this PR): "expands the trigger corpus 45 -> 50". README.md:272 (pre-existing): "Expand eval suite: 35->45 triggers". PR body §4: "The suite had 45 prompts and zero of them touched the plugin-install-failure surface". Commit 7113864 body: "The 45-prompt suite had ZERO prompts...". Same corpus, two values: 25 vs 45. Verified: main's eval-suite.json has 45 triggers (25 positive / 20 negative); HEAD has 50 (30/20). This is the exact one-surface-fixed/other-surface-stale failure mode the PR is about, and it landed in the Hard-Won Lessons table the PR added to teach that lesson.

2. P2 THE --compare ACCOUNTING IS PRESENTED AS COMPLETE BUT IS STRUCTURALLY BLIND TO BACKTICKED LITERALS. plugins/publish-skill/scripts/check_skill_descriptions.py:178 extract_triggers() matches only double-quoted spans (regex over "..." and curly-quoted spans). Backticked error literals are invisible to it. This trim removed two of them from the description with no mention in PR body §3's "The 4 DROPPED, decided individually" table: (a) `Plugin X not found in any configured marketplace` — present in main's description, gone from HEAD's (SKILL.md:13-14 now carries only `Plugin X not found in marketplace Y`); (b) the `Failed to add marketplace:` prefix — main's description had `Failed to add marketplace: Failed to parse marketplace file` (main SKILL.md:16), HEAD has only `Failed to parse marketplace file` (SKILL.md:14). Both are among the "four literal install-failure error strings" the PR's own A5 disposition makes a point of. Compounding it: the 5 new eval prompts added in §4 include none for either string, so §4's claim that the corpus now covers the plugin-install-failure surface is partial. And SKILL.md:167 rule 6 tells every future author to clear the trigger surface with --compare without disclosing the blind spot, so this propagates to every repo this skill publishes.

3. P3 UNREPRODUCIBLE QUOTED FIGURES (PR body §7, finding A8). The three counterfactual char counts — "+ multi-agent README review panel -> 1,533 (3 headroom)", "+ grounded-vs-heuristic threshold verification -> 1,579 (43 over cap)", "+ via puppeteer -> 1,589 (53 over cap)" — are the only quantitative claims in the PR with no command line printed, and I could not reproduce them. Inserting each phrase comma-separated into the Covers clause and re-running the committed gate gives 1,536 / 1,582 / 1,596 (deltas -3 / -3 / -7 from the quoted values). The conclusion survives (each lands at or over the 1,536 cap), but the decimals fail the standard §5 sets for itself: "a coverage figure a reviewer cannot re-run is not evidence".

4. P4 WITHDRAWN NUMBERS SURVIVE IN AN UNREWRITTEN COMMIT MESSAGE, AND THE DISCLOSURE THAT COVERS IT IS ITSELF WRONG. PR body §5 explicitly withdraws the round-1/round-2 coverage decimals ("they came from an uncommitted one-off and do not reproduce"). Confirmed: commit c7e14c3's body still states pos 0.8913->0.9325, neg 0.2483->0.2758, sep 0.6430->0.6566 (and stripped 0.9258/0.2458/0.6800) as measurements; re-running the committed harness on exactly those inputs (--old main: --new c7e14c3: --eval main's 45-prompt eval-suite.json) gives 0.8931->0.9378, 0.2508->0.2808, 0.6423->0.6570 — different. The PR body's disclosure callout names only "the pre-correction '849' and the pre-correction char counts" for that commit, so the retracted coverage table is an undisclosed leftover. Separately, that callout is factually wrong about the second commit: it claims c7e14c3 AND 4934248 "still contain the pre-correction '849' and the pre-correction char counts" — grep of 4934248's message finds no "849", no "1,489", no "2,385". What 4934248 actually carries stale is "Test suite: 266 -> 271 assertions" (now 284), which the callout does not mention.

5. P5 VENDORED GATE DIFFERS FROM THE UPSTREAM WORKING COPY (functional, though benign here). plugins/publish-skill/scripts/check_skill_descriptions.py is byte-identical to context-police commit 4dc1a62 ("v2.2.0") apart from the 4-line vendoring note — but /Users/huiyan/Documents/context-police/scripts/check_skill_descriptions.py has uncommitted working-tree changes to find_wrap_corruption() that the vendored copy lacks: the block-scalar header regex was tightened to match the whole header including the chomping/indent indicator (the old form leaves the `-` of `description: >-` behind as a phantom one-char line and reports a bogus BROKEN BY LINE-WRAP on every such skill), and the body scan was changed to stop at the first non-indented line instead of consuming the rest of the frontmatter. No effect on this repo (both versions produce byte-identical output, exit 0, 1,503 chars), and it is not a stale fork against published upstream. But tests/skill-description-cap.test.mjs's "not a stale fork" guard only greps for three substrings (find_wrap_corruption, compare_descriptions, `MAX_DESC_CHARS - 1)`), so it cannot catch this class of drift — the guard is weaker than README.md:213-218 implies. Also, context-police has no v2.2.0 git tag (tags: v1.5.0, v1.7.0, v1.9.0, v1.10.0, v2.0.0); "v2.2.0" comes from the commit subject and the repo's own version fields.

6. P6 (agent report accuracy, not the PR). Three evidence statements in the agent's report do not hold. (a) "DIFF I ACTUALLY PRODUCED (re-read from git diff main...HEAD): 8 files" — it is 10 files (marketplace.json, test.yml, README.md, eval-suite.json, package.json, plugin.json, SKILL.md, check_skill_descriptions.py, score_trigger_coverage.py, skill-description-cap.test.mjs). The round-3 commit's 6 files is correct. (b) A2 evidence: "grep -rn 'Step [0-9]+\\.[0-9]' over plugins/ README.md tests/ .github/ now returns zero hits" — README.md:266 matches ("renames `Step 2.5` to a named stage"). Benign historical reference and the test only scans SKILL.md, but the claim as stated is false. (c) A1 evidence: "Manual fallback formula len(name)+4+len(description) is present at SKILL.md:110" — SKILL.md:110 is the listing-entry measurement formula stated as explanation, and SKILL.md:1046 explicitly says the step "does not degrade gracefully" and python3 must be installed. There is no manual fallback; A1 was resolved by making the dependency hard, not by adding one.

7. WHAT CHECKED OUT (for balance, all independently re-run): upstream gate on the repo = exit 0, 1,503 chars, 0 BROKEN BY LINE-WRAP; vendored gate byte-for-byte same output. npm test = 284/284/0 fail; main worktree = 259. gh pr checks 9 = test(20) pass, test(22) pass, run 30928416865 headSha == 7113864. Archaeology reproduces exactly: c0d6540=1,359, c6c33e2=2,332 (+797 cut), b219e1a/main=2,385 (+850 cut); +973 and +53 deltas correct; 2,385-1,503=882 matches the PR's −882 claim. Coverage table reproduces to the digit: 0.9068->0.9440, 0.2508->0.2808, sep 0.6560->0.6632; --strip-not-list 0.9068->0.9373, 0.2508->0.2483, sep 0.6560->0.6890; 4 better / 26 same / 0 worse. Budget caveat reproduces exactly: 43 installed plugins, needed 89,960 / budget 40,000 @1M ctx, ~42% survive. --compare exits 1 with 0 NARROWED / 4 DROPPED / 5 REPHRASED / 15 REWORDED. All five "verified red" guards reproduce: restore stale gate = 2 red, delete scorer = 1 red, reintroduce "### Step 2.5" = 1 red, split awesome-list across lines = gate exit 1 BROKEN BY LINE-WRAP + 2 red, pad over cap = gate exit 1 + 4 red. Installed-user simulation (CLAUDE_PLUGIN_ROOT against a copy of plugins/publish-skill/ alone) resolves both gate and scorer, exit 0. Version 2.4.0 is consistent across SKILL.md:3, plugin.json, marketplace.json, package.json, eval-suite.json. No "849", "266", or "1,489" survives anywhere in the tree. README's How-It-Works block now mirrors SKILL.md's numbering exactly (Step 0/1, Description Cap Gate, Steps 2-8), and Bundling Hooks is genuinely a ### under SKILL.md's Step 3 (SKILL.md:517, between Step 3 at :395 and Step 4 at :572). No decimal-numbered stage headings remain in SKILL.md.


### Stale numbers (6)

1. README.md:68 "The 25-prompt suite" vs README.md:266 "trigger corpus 45 -> 50" vs README.md:272 "35->45 triggers" vs PR body §4 "45 prompts" vs commit 7113864 "The 45-prompt suite" — 25 vs 45 for the same corpus

2. commit c7e14c3 body: withdrawn coverage decimals 0.8913 -> 0.9325 / 0.2483 -> 0.2758 / sep 0.6430 -> 0.6566 (and stripped 0.9258 / 0.2458 / 0.6800). Committed harness on the same inputs gives 0.8931 -> 0.9378 / 0.2508 -> 0.2808 / 0.6423 -> 0.6570. PR body §5 withdraws them; the body's disclosure callout does not cover them

3. commit 4934248 body line 36: "Test suite: 266 -> 271 assertions" — actual is now 284 (npm test: tests 284 / pass 284 / fail 0). The PR body's disclosure callout claims this commit carries "849" and pre-correction char counts; it carries neither, and omits the number it does carry

4. commit c7e14c3 body line 28: "+973, 796 over cap" for c6c33e2 — the re-vendored gate reports 2,332 chars (+797 cut) and the PR body Archaeology says 797

5. commit c7e14c3 subject + body: "2,385 -> 1,489 chars", "47 chars headroom", "849 chars" — superseded by 1,503 / 33 / 850 (disclosed in the PR body callout; history deliberately not rewritten)

6. PR body §7 row A8: "1,533" / "1,579" / "1,589" — my reconstruction with the committed gate gives 1,536 / 1,582 / 1,596


### Unverified claims (7)

1. PR body callout (top): "The two earlier commit messages on this branch (c7e14c3, 4934248) still contain the pre-correction '849' and the pre-correction char counts." FALSE for 4934248 — grep finds no 849, no 1,489, no 2,385 in its message

2. PR body §3: "The 4 DROPPED, decided individually" presented as the complete trigger-surface loss accounting. --compare's extract_triggers() only sees double-quoted spans, so the two backticked error literals this trim removed from the description are absent from the table and from the analysis

3. PR body §4: "Added 5 positives drawn from the install-diagnostic vocabulary" covering "the plugin-install-failure surface" — no prompt was added for `Plugin X not found in any configured marketplace` or `Failed to add marketplace:`, the two literals the trim actually removed from the description

4. PR body §7 / A8: the three counterfactual char counts are stated as measurements but no command line is given and they do not reproduce (1,533/1,579/1,589 quoted vs 1,536/1,582/1,596 measured)

5. README.md:213-218 and tests/skill-description-cap.test.mjs: "another asserts the vendored copy is not a stale fork" — the assertion is three substring greps, which the actual upstream divergence found here (a rewritten find_wrap_corruption body-scan) would pass unchanged

6. Agent report: "8 files" for git diff main...HEAD (actually 10); "zero hits" for the decimal-step grep (README.md:266 hits); "Manual fallback formula ... is present at SKILL.md:110" (there is no fallback — SKILL.md:1046 explicitly forbids degrading)

7. README.md:266 credits the vendored gate to "context-police v2.2.0" — there is no v2.2.0 tag in wan-huiyan/context-police; the version comes from the commit subject of 4dc1a62 and the repo's own version fields


---

## wan-huiyan/claude-ecosystem-hygiene (PR #14, branch fix/skill-description-cap, HEAD 562d051)

- surfaces agree: False  | gate up-to-date: True  | wrap clean: True  | numbers reproducible: True

### Problems (6)

1. PR body §A6 contradicts PR body §1 inside the same document. §A6: 'every category it named is already in the opening scope line; `docs` was the one exception and was added there.' FALSE — the pre-PR opening scope line (main:plugins/ecosystem-audit/SKILL.md:6-7) reads 'Claude Code setup, installed skills, memory system, handoffs, worktrees, or ~/.claude directory health'; `ADRs` was ALSO absent and was also newly added. §1's own added-terms bullet lists 'lessons, feedbacks, ADRs, docs'. Conflicting values: 'docs was the one exception' vs '{lessons, feedbacks, ADRs, docs} added'.

2. The deliberate stale-commit-message exemption is under-declared. PR body lines 48-56 assert they name the stale strings in commit 2d13782's message, listing four. That message carries two more superseded claims NOT named: (a) 2d13782 message line 99 'the nine descriptions total 10,425 chars against an 8,000 listing budget' vs actual 10,435 (README.md:267 and the gate both report 10,435; main measured 10,558); (b) 2d13782 message line 66 '1636 -> 1454 (82 under cap). Prose only.' — 'prose only' is explicitly withdrawn by PR body §2 and §A8 ('the earlier "prose only" framing was too generous and is withdrawn').

3. README.md:257 (Quality Checklist) and README.md:267 (v1.10.1 entry) both describe the gate as 'vendored from wan-huiyan/context-police at upstream v2.2.0' with no mention that the shipped .github/scripts/check_skill_descriptions.py is v2.2.0 PLUS an uncommitted upstream fix — i.e. ahead of upstream's committed HEAD 4dc1a62, matching only an unpushed working-tree state in /Users/huiyan/Documents/context-police that no one else can reach. PR body §0 and the file's own docstring disclose it; the two shipped README surfaces do not. Conflicting values: README 'at upstream v2.2.0' vs docstring 'Upstream v2.2.0 (commit 4dc1a62) PLUS one uncommitted fix ... this file is AHEAD of upstream's committed HEAD'.

4. PR body §1 (lines 150-154) presents the post-restore --compare output as a quoted block containing only 'trigger-surface diff · 1,694 → 1,495 chars · 13 triggers unchanged', 'No trigger dropped or narrowed.', 'exit 0'. The actual output also prints 'REWORDED (7)' (7 named rows) and 'ADDED (3): give me a cleanup script, regenerate my stale audit, audit' between those lines, with no elision marker. The §Verification block at lines 490-494 does mark its elision with '...'; §1 does not.

5. PR body §1 line 314: 'Cut prose and implementation detail — dark-themed, 6 categories, health percentages, ready-to-run, radar chart ... All still in the skill body and README.' The 'and README' half is false for '6 categories': plugins/ecosystem-audit/SKILL.md:294 keeps the fact as 'The radar chart shows 6 axes', but README.md:31 says '9 artifact categories (skills, memory, handoffs, ADRs, plans, reviews, worktrees, automation, provenance)' and plugins/ecosystem-audit/README.md:5 says '9 artifact categories' — a different count AND a different list (no 'docs'). Pre-existing contradiction the PR removes without noting.

6. Informational / pre-existing: plugins/ecosystem-audit/CHANGELOG.md has entries at v1.0.0 (line 158), v1.1.0 (149), v1.2.0 (101) and now v1.2.2 (3) — there is no v1.2.1 entry, although d556709 shipped ecosystem-audit v1.2.1 and the PR body's own archaeology table cites it as a release. This PR is the natural place to have noticed, since it bumps the same plugin.


### Stale numbers (7)

1. commit 2d13782 message line 99: '10,425' total description chars vs actual 10,435 (README.md:267 and gate output) — NOT named in the PR body's supersession list

2. commit 2d13782 message: '1694 chars, 158 invisible' vs 159 — stale but explicitly declared in PR body lines 48-56

3. commit 2d13782 message: '1694 -> 1485 (51 under cap)' vs 1495 / 41 under cap — stale but explicitly declared

4. commit 2d13782 message: '1636 chars, 100 invisible' vs 101 — stale but explicitly declared

5. commit 2d13782 message: '0.4291 -> 0.4525' coverage — retracted, stale but explicitly declared

6. commit 2d13782 message line 66: 'Prose only' for the context-police trim — withdrawn by PR body §A8, NOT named in the supersession list

7. NO stale numbers in any shipped file: README.md, contracts/claude-code-internals.md, plugins/ecosystem-audit/CHANGELOG.md, both SKILL.md files and all manifests carry only corrected figures (grep sweep for 'will reconcile', 'one commit before', '158 invisible', '100 invisible', '1485', '51 under cap', '10,425' — all 0 hits)


### Unverified claims (9)

1. PR body §A6 'every category it named is already in the opening scope line; docs was the one exception' — checked and FALSE (ADRs was also absent from the old opening scope line).

2. PR body §1 'Cut ... 6 categories ... All still in the skill body and README' — checked and FALSE for the README half (both READMEs say 9 categories, different list).

3. PR body lines 48-56 implicit claim that it names the stale strings surviving in 2d13782's message — checked and INCOMPLETE (misses '10,425' and 'Prose only').

4. PR body §0 / commit 562d051 'the fix was sitting uncommitted in upstream's working tree' — VERIFIED (git status in /Users/huiyan/Documents/context-police shows ' M scripts/check_skill_descriptions.py'; the diff is exactly the find_wrap_corruption regex + body-scan fix; the buggy-vs-fixed 3-hit/2-hit fixture reproduces exactly, including the bogus 'clean-skill: - Use' row).

5. PR body §3 'Upstream context-police measured a real 18-plugin install: only ~41% of descriptions survive the budget at 1M context' — VERIFIED as sourced from upstream context-police SKILL.md:264 (committed at 4dc1a62), not fabricated.

6. PR body §A8 'upstream's own fix compresses the same parenthetical to a bare the cross-harness landscape;' — VERIFIED at 4dc1a62:plugins/context-police/skills/context-police/SKILL.md:14.

7. PR body §A4 'upstream's fix branch already renamed exactly those three' — VERIFIED (upstream feat SKILL.md lines 15/62/99 use skillListingMaxDescChars; upstream main lines 15/63/100 still use maxSkillDescriptionChars).

8. PR body §A10 'there is no bundled copy' and 'upstream ships plugins/context-police/skills/context-police/scripts/check_skill_descriptions.py inside the rsync'd dir' — BOTH VERIFIED (absent on upstream main, present at 4dc1a62; sync-context-police.yml rsyncs exactly that directory).

9. PR body §Verification 'The repo has no test runner (no package.json, Makefile or pytest config)' — VERIFIED; validate_plugins.py and the description gate are the only checks, both green. Coverage harness committed at plugins/ecosystem-audit/scripts/score_trigger_coverage.py reproduces every quoted figure to 4 decimals under both stopword variants.


---

## wan-huiyan/skill-portfolio-existence-review

- surfaces agree: False  | gate up-to-date: False  | wrap clean: True  | numbers reproducible: False

### Problems (11)

1. STALE TEST INDEX, INTRODUCED BY THIS SAME DIFF. PR body line 175 (A5 row) and the commit message both say: 'The next description edit that adds >9 chars fails **test 7** by design; the assertion message names the file, the count and the floor.' Reality: the headroom assertion lives in `tests/skill-description-cap.test.mjs:63-72` inside the test named 'no trigger phrase is lost to truncation, and every skill keeps headroom', which is test **#10 of 12** in the current suite. Test **#7** is now 'bundled method reference and workflow template are present' (tests/manifest-consistency.test.mjs:108). The '7' was correct in the previous round (manifest 4 + cap 3 = 7 tests, headroom last); THIS PR inserted 3 description-parity tests ahead of it at tests/manifest-consistency.test.mjs:62/72/85 and never updated the reference. Two conflicting values: PR body/commit say 'test 7'; `npm test` says index 10. This is exactly the one-surface-fixed / other-surface-stale failure mode, inside the same diff.

2. SAME ASSERTION, SECOND INACCURACY: 'the assertion message names the file'. tests/skill-description-cap.test.mjs:70 emits `${skill.name} description is ${skill.desc_chars}/${report.cap} chars — only ${headroom} to spare, keep at least ${MIN_HEADROOM}` — it names the SKILL NAME, the char count and the floor. No file path appears. PR body:175 and commit message both claim it names the file.

3. RE-INTRODUCED NUMERIC ERROR IN THE LINE THAT CLAIMS TO FIX B2. PR body:54 and the commit message state: the phrase is '**64 chars**; **67** including the leading em dash and the spaces either side, **which is what the removed span actually measures**.' The 64 is correct. The 67 is not: character-level diff of the two descriptions produces exactly one delete op for this edit — `' answering the one question the other portfolio skills never ask:'` = **65 chars**. The em dash and BOTH surrounding spaces survive into the new description (`plugins/skill-portfolio-existence-review/SKILL.md:5` — `…adjacent repos and non-skill tools (dashboards, CLIs) — *should each of these exist at all?*`), so they cannot be part of 'the removed span'. Conflicting values: PR body/commit say 67; measured removed span is 65 (finding B2 itself said 66; the original PR said 62 — three rounds, three different wrong numbers).

4. CROSS-SURFACE DATE DRIFT INTRODUCED BY THIS DIFF. plugins/skill-portfolio-existence-review/SKILL.md:22 says `date: 2026-06-01` for `version: 1.1.1` (SKILL.md:21), while README.md:138 says '- **1.1.1** (2026-08-04) — **Description-cap fix.**'. The two prior entries agree with the frontmatter (README.md:139/140 date 1.1.0 and 1.0.0 as 2026-06-01, matching the old `date: 2026-06-01`), so `date` demonstrably tracked the release date until this PR. PR body:185 and the commit message justify freezing `last_verified` (a genuine freshness assertion) and silently lump `date` into the same sentence with no separate rationale. Nothing gates `date`, and the new description-parity gate does not cover it.

5. OVERSTATED SCOPE IN THE A4 ROW. PR body:174 says '**Deliberately not changed:** README:5/:7 **and the manifests** keep `existence-pinned` and the "the one question the other portfolio skills never ask" framing.' grep for 'never ask' returns 0 hits in .claude-plugin/marketplace.json, plugins/skill-portfolio-existence-review/.claude-plugin/plugin.json and package.json — it exists only at README.md:5. The manifests keep `existence-pinned` only. Conflicting values: PR body says manifests keep both framings; repo says manifests keep one.

6. VENDORED GATE REPORTS DIFFERENT NUMBERS THAN UPSTREAM'S CURRENT SCRIPT. scripts/check_skill_descriptions.py is byte-identical to context-police@4dc1a62 modulo the 19-line vendoring note (independently confirmed: stripped sha256 = 941228f39bbd4ed73e586f772cc6ad2c1b1f298a3d077b239f6a850cccd85157, matching both the pin in tests/vendored-gate-parity.test.mjs:28 and `git show 4dc1a62:scripts/check_skill_descriptions.py`). BUT upstream /Users/huiyan/Documents/context-police/scripts/check_skill_descriptions.py has already fixed `find_wrap_corruption()`: the vendored revision matches `^(description|whenToUse|when_to_use):\s*([|>])` and then scans EVERY non-empty line to the end of the frontmatter, so a `description: >-` chomping indicator becomes a phantom `-` line and the block spills past its own key. Measured over ~/.claude/plugins/cache: vendored copy reports **wrap_corruption = 10**, upstream's current script reports **8** — two false positives. No figure quoted in the PR is affected (listing_chars 92,511 and model_invocable 103 are identical under both, and this repo uses `description: >`), and the upstream fix is UNCOMMITTED (context-police HEAD == 4dc1a62), so pinning to 4dc1a62 is defensible. But the vendoring docstring's stated purpose — 'fix it upstream and re-vendor, so every repo gates on the same rules' (scripts/check_skill_descriptions.py:11-12) — is already false against upstream's live script, and neither the PR body nor tests/vendored-gate-parity.test.mjs surfaces that.

7. SIXTH PUBLISHED SURFACE LEFT UNGATED, AND THE GAP IS INVISIBLE TO THE NEW TEST. .claude-plugin/marketplace.json:4 carries a top-level marketplace `description` containing the same load-bearing claims ('KEEP / CONSOLIDATE / KILL / PIVOT verdicts with web-verified differentiation'). The new parity test at tests/manifest-consistency.test.mjs:85-104 checks only `marketplace.plugins[].description` (via `mpPlugin`, line 25). Demonstrated by negative control: replacing 'web-verified' with 'field-verified' on marketplace.json:4 leaves `npm test` at 12/12 pass. The equivalent edit on line 12 correctly turns 2 tests red. PR body:154 frames the gate as closing description drift across the published surfaces; one surface with identical claim vocabulary is still unguarded.

8. SELF-CONTRADICTION INSIDE ONE PARAGRAPH. PR body:154 says the gate exists because 'the **four** published surfaces could drift apart silently' and, in the same sentence, that it now asserts 'all **five** surfaces (SKILL.md, both manifests, `package.json`, README lead)'. The same 'four published surfaces' wording is baked into the committed test comment at tests/manifest-consistency.test.mjs:59 while the loop at :89-95 iterates five.

9. NEGATIVE-CONTROL COUNT DISAGREES BETWEEN SURFACES. Commit message says 'All **four** gates were verified to actually fail' and then lists only **three** injected faults (folded-scalar hyphen break, marketplace description drift, WARN_FRACTION edit). PR body:158-164 lists a four-row table (the fourth being 'Push the description 100 chars over'). I reproduced all four independently — hyphen break: gate prints `BROKEN BY LINE-WRAP (1): non- skill`, exit 1, 2 cap tests red; marketplace 'web-verified' drop on line 12: 2 manifest tests red; WARN_FRACTION 0.75->0.95: parity test red; +100 chars: 2 cap tests red — so the controls are real, but the two surfaces state different counts.

10. IMPRECISE FORMULA ON AN UNGATED SURFACE. README.md:139 states the collapse priority as 'usageCount × 0.5^(days_since_last_use / 7), floored at 0.1'. The binary (verified verbatim at ~/.local/share/claude/versions/2.1.221) is `return r.usageCount*Math.max(o,0.1)` where `o=Math.pow(0.5,n/7)` — the 0.1 floors the DECAY TERM, not the product. For usageCount=5 at 100 days the true priority is 0.5, not the 0.1 the README formula yields. PR body:125-130 quotes the actual JS so it is self-correcting there; README:139 does not and is the surface a reader lands on.

11. INCOMPLETE ENUMERATION. PR body:176 (A6 row) and the commit message list the new .gitignore as '(`__pycache__/`, `*.py[cod]`, `node_modules/`, `.DS_Store`)'. The committed file (.gitignore:7,8,11,12,15) also contains `npm-debug.log*`. Not a contradiction, but a fifth pattern silently omitted from both descriptive surfaces.


### Stale numbers (6)

1. PR body:175 + commit message: 'fails **test 7** by design' — the headroom assertion is test **#10** of 12 after this PR's own 3 new manifest tests were inserted ahead of it; test #7 is now 'bundled method reference and workflow template are present'

2. PR body:54 + commit message: removed span '**67** chars … which is what the removed span actually measures' — the measured removed span is **65** chars (`' answering the one question the other portfolio skills never ask:'`); the em dash and both flanking spaces survive in the new description

3. plugins/skill-portfolio-existence-review/SKILL.md:22 `date: 2026-06-01` vs README.md:138 '**1.1.1** (2026-08-04)' — same version, two different dates, where the prior two entries agreed

4. Commit message 'All **four** gates were verified to actually fail' followed by **three** listed injections; PR body:158-164 lists four

5. PR body:154 'the **four** published surfaces' vs 'all **five** surfaces' in the same sentence; tests/manifest-consistency.test.mjs:59 comment says 'four' while the loop checks five

6. Vendored scripts/check_skill_descriptions.py reports wrap_corruption=**10** over ~/.claude/plugins/cache where upstream's current script reports **8**


### Unverified claims (7)

1. PR body:54 / commit: '67 including the leading em dash and the spaces either side, which is what the removed span actually measures' — FALSIFIED. Measured 65 by character-level opcode diff of the two frontmatter descriptions.

2. PR body:174: 'README:5/:7 and the manifests keep existence-pinned and the "the one question the other portfolio skills never ask" framing' — PARTLY FALSIFIED. 'never ask' appears only in README.md:5; zero hits in either manifest or package.json.

3. PR body:175 / commit: 'fails test 7 by design; the assertion message names the file, the count and the floor' — FALSIFIED on both halves. Test #10, and the message names the skill name, not any file path.

4. scripts/check_skill_descriptions.py:11-12 (vendored docstring, carried forward by this PR): 'fix it upstream and re-vendor, so every repo gates on the same rules' — NOT CURRENTLY TRUE against upstream's live script (10 vs 8 wrap hits). Mitigated: the upstream fix is uncommitted, and tests/vendored-gate-parity.test.mjs:14-16 does explicitly disclaim that it cannot see upstream moving on.

5. README.md:139: priority 'usageCount × 0.5^(days/7), floored at 0.1' — the floor is on the decay factor only per `Math.max(o,0.1)` in the 2.1.221 binary.

6. PR body:176 / commit: .gitignore contents listed as four patterns — file has five (`npm-debug.log*` omitted).

7. EVERYTHING ELSE I CHECKED REPRODUCED EXACTLY. Verified independently: 1,621 -> 1,497 chars, 85 over cap, 86 discarded, 39 headroom, 124-char delta; the mid-word cut text at char 1,535 quoted at PR body:26-28 is byte-exact; both prior commits carry byte-identical 1,621-char descriptions (md5 9d5a7c93ae0d57d38b90353b202c0212); `git tag -l` / `gh release list` empty, 3 commits; frontmatter diff vs main is exactly one -/+ pair (version only); NOT-for segment 393 -> 380 = 13; dropped content words are exactly the ten listed and gained exactly {plus, suspect}; `--compare` prints 3 unchanged / 8 REWORDED / 0 DROPPED / 0 NARROWED; coverage harness reproduces 0/23/2, 0.6912->0.6811, negatives 0.3004 / routing 0.6008 / off-topic 0.0000 unchanged, both regression prompts verbatim and both losing exactly the token `other`; eval suite is 25 positives (4 readme + 11 quoted + 10 paraphrase) and 12 negatives (6 routing + 6 offtopic); vendored digest matches the pin AND context-police@4dc1a62 byte-for-byte; the previously vendored copy at 9cfa97f is 388 lines with `desc_chars - MAX_DESC_CHARS` and no find_wrap_corruption/--compare, as claimed; all five binary quotes (`var n7_=0.01,Jud=4,o7_=200000,i7_=1536;`, `l7_`, `dBt`, `X4t`, the settings schema) extracted verbatim from ~/.local/share/claude/versions/2.1.221 with `claude --version` = 2.1.221; install measurements 43 plugins (installed_plugins.json), 190 SKILL.md, 103 model-invocable, 92,511 listing chars, ~41% @1M and ~5% @200k all reproduce exactly; `git check-ignore -v scripts/__pycache__/foo.pyc` -> `.gitignore:7:__pycache__/`; plugin.json and marketplace.json plugin descriptions byte-identical at 494 chars; repo-wide grep for every withdrawn figure ('45 chars', '62 chars', 0.6692, 0.4014, 0.4514, 0.6742, 0.6192, 0.6242, 'tagged release', '24 same', 'surgical regex') returns zero hits outside explicitly-labelled erratum sentences.
