---
status: complete
phase: 04-validation-slice
source: [04-01-SUMMARY.md, 04-02 commits]
started: 2026-02-05T12:00:00Z
updated: 2026-02-05T12:12:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Begging Activity Card Shows Declarative Effects
expected: Activity card displays short format effects (+0.1 Cha, +X Money). Stamina cost shown separately.
result: pass

### 2. Begging Earns Formula-Based Money
expected: Begging earns formula-based money (3 + log2(charisma) at level 0).
result: pass

### 3. Begging Grants Charisma
expected: Begging grants +0.1 charisma per tick at level 0.
result: pass

### 4. Begging Costs Stamina
expected: Begging costs 5 stamina per tick.
result: pass

### 5. Begging Conditional Yang Effect
expected: Yang +1 shown only when Yin/Yang unlocked, hidden otherwise.
result: pass

### 6. Begging Activity Detail View Shows Long Format
expected: Detail view shows long descriptions and formula breakdowns.
result: pass

### 7. BuildTower Activity Card Shows Declarative Effects
expected: Open the activity panel and find BuildTower. The card should display effects from the declarative system — progress text (e.g., "+1 Tower Progress") and/or item consumption costs. The display should come from the new effects rendering, not legacy effectsLegacy text.
result: issue
reported: "Multiple rendering problems: (1) Conditions not translated to readable text in the descriptive part — only visible in formula. Need 'If Builders < 10: Reduces HP by #' style. (2) Wording wrong — status reductions say 'Consumes' instead of 'Reduces HP by #'; item consumption says 'Consumes Scaffolding by 1' instead of 'Consumes 1x Scaffolding'. (3) Only the matching conditional branch is shown — user expects ALL effects (success AND failure paths) visible at once so they know what's needed and what happens on failure. (4) When missing materials, only failure consequence shown, not what's needed for success. (5) Missing mortar shows failure + spurious 'consume scaffolding'. Missing bricks shows failure + spurious 'consume scaffolding and mortar'. Missing both shows only failure. These are symptoms of showing only the active branch. (6) Formula shows raw paths like 'followerCount.builder >= 10' instead of readable condition text. (7) If conditions are properly rendered in the descriptive part, we don't need to show them in the formula at all — the formula section should focus on value calculations only."
severity: major

### 8. BuildTower Success Path — Items Consumed and Progress Increments
expected: With 10+ builders, 1 scaffolding, 100 mortar, and 1000 bricks: executing BuildTower should consume all those items and increment the tower progress counter by 1. Check your inventory afterward — scaffolding, mortar, and bricks should be reduced.
result: issue
reported: "Items consumed and tower progress incremented correctly. However, stamina does NOT get reduced when executing BuildTower. The stamina cost wasn't included in the declarative effects definition at all."

### 9. BuildTower Failure — Not Enough Builders
expected: With fewer than 10 builder followers: executing BuildTower should deal approximately 5% of your max health as damage. No items should be consumed. Tower progress should NOT increment.
result: pass

### 10. BuildTower Failure — No Scaffolding
expected: With 10+ builders but no scaffolding in inventory: executing BuildTower should deal approximately 20% of your max health as damage. No items consumed, no progress.
result: pass

### 11. BuildTower Failure — No Mortar
expected: With 10+ builders and scaffolding but less than 100 mortar: executing BuildTower should consume the scaffolding AND deal ~20% max health damage. Mortar and bricks untouched, no progress.
result: pass

### 12. BuildTower Failure — No Bricks
expected: With 10+ builders, scaffolding, 100+ mortar but less than 1000 bricks: executing BuildTower should consume scaffolding and 100 mortar, AND deal ~20% max health damage. No progress.
result: pass

## Summary

total: 12
passed: 10
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "Effect breakdown shows ALL conditional branches (success + failure) with readable condition text"
  status: failed
  reason: "User reported: Only the matching conditional branch renders. User expects to see all outcomes — what's needed for success and what happens on failure — at all times. Conditions shown only in formula as raw paths (followerCount.builder >= 10), not in descriptive text."
  severity: major
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Effect wording matches effect type — statuses use 'Reduces HP by #', items use 'Consumes 1x Scaffolding'"
  status: failed
  reason: "User reported: Status reductions say 'Consumes' instead of 'Reduces HP by #'. Item consumption says 'Consumes Scaffolding by 1' instead of 'Consumes 1x Scaffolding'."
  severity: major
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Condition formulas render human-readable text, not raw property paths. If conditions are rendered in the descriptive part, formula section should only show value calculations."
  status: failed
  reason: "User reported: Formula shows 'followerCount.builder >= 10' instead of readable 'If you have 10+ Builders'. Conditions need to be translated to player-facing language. If descriptive part handles conditions properly, formula section doesn't need to repeat them."
  severity: major
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "BuildTower declarative effects include stamina cost"
  status: failed
  reason: "User reported: Stamina does not get reduced when executing BuildTower. The stamina cost was not included in the declarative effects definition at all."
  severity: major
  test: 8
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
