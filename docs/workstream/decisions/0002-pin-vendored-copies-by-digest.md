# 0002 — Guard a vendored copy with a pinned digest, never a feature grep

**Status:** Accepted · **Date:** 2026-08-05 · **Shipped:** `publish-skill` #10, `skill-portfolio-existence-review` #2, doctrine in `context-police` v2.3.0 SKILL.md

## Context

Six repos vendor `check_skill_descriptions.py`. A vendored copy rots silently, so each wants a guard.

`publish-skill` had a test named *"the vendored gate is current with upstream, not a stale fork"*. It
asserted three substrings were present: `def find_wrap_corruption(`, `def compare_descriptions(`,
`MAX_DESC_CHARS - 1)`.

**Its copy was a stale fork** — context-police v2.2.0, whose `find_wrap_corruption()` reported a bogus
`BROKEN BY LINE-WRAP` on every skill written `description: >-`. All three substrings were present,
because the drift was *inside* a function whose name never changed. **The test stayed green through
the entire drift: 284/284.**

## Decision

Wrap the local vendoring note in machine-strippable markers, hash the remainder, pin the upstream
sha256. Name the test for what it proves — *"matches the upstream revision it was vendored from"* —
never *"is current with upstream"*, and say in the body that it **cannot** see upstream moving on.

All six vendored copies now carry the same `--8<--` markers so any repo can add the digest check.

## Consequences

- A feature-presence grep answers "does this version have the feature", never "is this the version I
  vendored". Any in-function bug fix is invisible to it.
- Re-vendoring stays a deliberate act: the pin forces the digest to be updated, which forces someone
  to look.
- Trade-off accepted: the digest cannot detect that upstream has moved on. CI has no upstream access.
  That limit is now stated in the test body rather than implied away by the test's name.

## Confirmation

Restore the v2.2.0 copy → `283 pass / 1 fail`, failing by name. Under the old assertion the identical
copy was `284/284` green.
