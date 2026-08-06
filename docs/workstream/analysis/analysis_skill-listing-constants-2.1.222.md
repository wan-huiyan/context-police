# Skill-listing constants re-verified against the 2.1.222 binary

**Date:** 2026-08-05 · **Binary:** `~/.local/share/claude/versions/2.1.222` (`claude --version` = 2.1.222)
**Why:** the whole description-cap workstream inherits from four constants that were read once, from
`2.1.221`, by string extraction. The handoff flagged them as *"the load-bearing assumption of this
entire workstream"* and asked for re-extraction before publishing new numbers. A newer binary was
installed, so this is a genuine independent check, not a re-read of the same bytes.

## Result: all four unchanged. Only the minified identifiers moved.

```
2.1.221   var n7_=0.01,Jud=4,o7_=200000,i7_=1536;
2.1.222   var fF_=0.01,mVu=4,mF_=200000,hF_=1536;
```

| constant | value | meaning |
|---|---|---|
| `skillListingMaxDescChars` | **1536** | per-skill cap on `description` + `" - "` + `whenToUse`, capped as a **pair** |
| `skillListingBudgetFraction` | **0.01** | listing budget = `contextWindow × bytesPerToken × 0.01` characters |
| `bytesPerToken` | **4** | used to size that budget |
| default context | **200000** | the 200k default; budget = 8,000 chars |

Both settings names confirmed present in the settings schema:
`skillListingMaxDescChars`, `skillListingBudgetFraction`.

## Truncation semantics — confirmed

```js
function Vyi(e,t){ return e.length>t ? e.slice(0,t-1)+"…" : e }
```

Generic helper: over the cap it keeps `full[:cap-1]` and appends an ellipsis. So the dead tail of an
over-cap description is `len - (cap - 1)` — **one more** than the naive `len - cap`. This confirms the
arithmetic already shipping in the gate since v2.2.0, and refutes the handoff's claim that v2.2.1
introduced it.

## Collapse priority — the 0.1 floors the DECAY TERM, not the product

```js
function g4t(e){
  let r=Lt().skillUsage?.[e]; if(!r) return 0;
  let n=(Date.now()-r.lastUsedAt)/86400000, o=Math.pow(0.5,n/7);
  return r.usageCount*Math.max(o,0.1)
}
```

priority = `usageCount × max(0.5^(days_since_last_use / 7), 0.1)`

A published README stated it as `usageCount × 0.5^(days/7)`, *"floored at 0.1"* — floor applied to the
product. A skill used 5 times but not for 100 days scores **0.5**, not the **0.1** that wording
implies: a **5× error**, on the surface a reader lands on. Corrected in
`skill-portfolio-existence-review` #2.

A never-used skill returns **0** and is collapsed first.

## Extraction gotcha worth keeping

`strings` is ASCII-only and the source escapes the ellipsis as `…`, so:

```bash
strings BINARY | grep '…'      # → ZERO hits. Looks like the behaviour is gone.
LC_ALL=C grep -ao 'slice(0,[A-Za-z0-9_$]\{1,6\}-1)+.\{0,12\}' BINARY   # → finds it
```

Grep the binary directly rather than piping through `strings`.

## What would change this conclusion

These are **settings**, not facts. A future release, or a line in a user's `settings.json`, can change
any of the four. Every character figure in the workstream is conditional on them. Re-extract before
publishing new numbers — this file records the method so that is cheap.

## Live-install measurement taken with these constants

```
192 SKILL.md · 103 model-invocable · 89 disabled
0 over cap · 0 wrap corruption · 0 lost triggers · 5 under 40 chars headroom · exit 0

Listing budget @ 1,000,000 ctx:  needed 90,422 chars vs budget 40,000  →  ~42% survive
Listing budget @   200,000 ctx:  budget 8,000                          →  ~5%  survive
```

**Under the cap is not the same as visible.** The shared budget collapses entries to bare names,
usage-ranked rather than length-ranked. Fixing the per-skill cap was necessary and never sufficient.
