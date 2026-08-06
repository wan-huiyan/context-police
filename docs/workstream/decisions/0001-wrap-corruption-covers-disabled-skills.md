# 0001 — Wrap-corruption detection covers disabled skills, and fails the build

**Status:** Accepted · **Date:** 2026-08-05 · **Shipped:** `context-police` v2.3.0 (PR #8), re-vendored into 6 repos

## Context

`check_skill_descriptions.py` detects *line-wrap corruption*: a folded/block YAML scalar joins its
lines with a space, so a line ending in a hyphen silently becomes `token- efficient` in the text the
harness injects. The character count is unchanged, so no length check can see it.

The exit code was built from the model-invocable subset:

```python
live    = [s for s in skills if not s.disabled]
corrupt = [s for s in live if s.wrap_corruption]
return 1 if (over or corrupt) else 0
```

In `agent-traffic-control`, **74 of its 94 skills** were `disable-model-invocation: true`. So for the
large majority of that repo a hyphen break was **neither printed nor failed**. This is not
hypothetical: all four real corruptions fixed in its v1.8.1 were in manual-only skills, and had to be
found by running the tool with `--json` rather than by the build check meant to catch them.

## Decision

Score wrap corruption over **every** skill, disabled included, and fail the build on any hit.
Print disabled hits in their own group so the reason is visible.

The cap check continues to skip disabled skills — deliberately asymmetric.

## Consequences

- **Why the asymmetry is right:** a disabled skill consumes no listing budget, so the *cap* genuinely
  does not apply to it. Corruption is a different kind of defect — the description is still read when
  the skill is invoked by name, and it ships corrupt the moment the skill is re-enabled.
- Every repo was verified clean (disabled skills included) **before** the exit code was tightened, so
  nothing went red on merge. A repo with pre-existing corruption will now fail; the vendored file's
  header says so in those words: *"IF THIS TURNS YOUR CI RED, the corruption was always there and was
  being hidden. Fix the description; do not re-scope the check."*
- `--json` gains `counts.wrap_corruption` over all skills, matching the text report.

## Confirmation

Negative control, in `tests/description-cap.test.mjs`: a `disable-model-invocation: true` skill with a
real hyphen break → **before** no `BROKEN BY LINE-WRAP` line and exit 0; **after** exit 1, named,
under a `disabled:` heading. Reverting the scoping turns the test red.
