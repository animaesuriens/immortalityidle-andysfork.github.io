---
phase: 04-validation-slice
plan: 03
subsystem: effects-handlers
tags: [chance-handler, spawn-enemy, item-add, formula-builders, hunting-activity]

dependency_graph:
  requires: ["04-02"]
  provides:
    - "Chance handler with late-bound registry for nested effects"
    - "Spawn-enemy handler with inline and named enemy support"
    - "Item-add handler with factory and inventory integration"
    - "hasFurniture and conditional formula builders"
    - "Hunting activity fully declarative"
  affects: ["04-04", "05-mass-migration"]

tech_stack:
  added: []
  patterns:
    - "Late-bound registry pattern for chance handler (same as conditional)"
    - "Formula-level conditionals for furniture bonuses"
    - "Inline enemy config on SpawnEnemyEffect"

key_files:
  created: []
  modified:
    - src/app/effects/handlers/chance.handler.ts
    - src/app/effects/handlers/spawn-enemy.handler.ts
    - src/app/effects/handlers/item-add.handler.ts
    - src/app/effects/handlers/handler-registry.ts
    - src/app/effects/formulas/formula.builders.ts
    - src/app/effects/types/effect.types.ts
    - src/app/effects/types/formula.types.ts
    - src/app/effects/types/context.types.ts
    - src/app/effects/context/game-context.ts
    - src/app/effects/executor/effect-executor.service.ts
    - src/app/effects/renderer/effect-renderer.service.ts
    - src/app/game-state/activity.service.ts

decisions:
  - id: "D-0403-01"
    title: "SpawnEnemyEffect uses optional enemy/enemyId fields"
    rationale: "Original type had required enemyConfig; changed to optional enemy + optional enemyId for flexibility"
  - id: "D-0403-02"
    title: "ItemAddEffect extended with factory and args fields"
    rationale: "Needed for Blacksmithing and other factory-based item generation in future activities"
  - id: "D-0403-03"
    title: "GameContext constructor extended with ItemRepoService"
    rationale: "Required for addItem by string ID lookup; Rule 3 blocking deviation"
  - id: "D-0403-04"
    title: "Special hide handling in GameContext.addItem"
    rationale: "Legacy getHide() returns tiered hide based on animalHandling; preserved this behavior"
  - id: "D-0403-05"
    title: "animalHandling moved inside chance block"
    rationale: "Plan design simplification; legacy gave fractional animalHandling always, declarative gives full 0.1 only on hunt success"

metrics:
  duration: "15min"
  completed: "2026-02-12"
---

# Phase 4 Plan 03: Hunting Activity Conversion Summary

Chance, spawn-enemy, and item-add handlers implemented; hasFurniture and conditional formula builders added; Hunting activity fully converted to declarative effects with furniture bonus probability formula.

## Performance

- 5 tasks completed in 5 commits
- Clean TypeScript compilation after each task
- No pre-existing errors encountered

## Accomplishments

1. **Chance handler** with late-bound registry pattern for nested effect execution
2. **Spawn-enemy handler** supporting both inline enemy config and named enemy ID lookup
3. **Item-add handler** with simple itemId lookup, factory generation, and quantity formulas
4. **Formula builders**: `hasFurniture(furnitureId)` and `conditional(condition, then, else)` for dynamic probability
5. **Hunting activity** fully converted with:
   - Stamina cost and speed gain
   - 10%+40% furniture bonus probability via `add(fixed(0.1), conditional(hasFurniture('dogKennel'), fixed(0.4), fixed(0)))`
   - Nested item adds for meat and tiered hide
   - Wolf spawn via `conditional(NoEnemies)` + `chance(0.01)` + `spawn.enemy`
   - Yin/yang gated by `HasFlag yinYangUnlocked`

## Task Commits

| Task | Description | Commit | Key Changes |
|------|-------------|--------|-------------|
| 1 | Chance handler | 7de01d1 | chance.handler.ts, handler-registry.ts |
| 2 | Spawn-enemy handler | afd73f6 | spawn-enemy.handler.ts, effect.types.ts |
| 3 | Item-add handler | e3cb225 | item-add.handler.ts, game-context.ts, executor, renderer |
| 4 | Formula builders | 8b69679 | formula.builders.ts, formula.types.ts, context.types.ts |
| 5 | Convert Hunting | 5378f3c | activity.service.ts |

## Files Created/Modified

### Modified
- `src/app/effects/handlers/chance.handler.ts` - Full implementation with late-bound registry
- `src/app/effects/handlers/spawn-enemy.handler.ts` - Full implementation with named lookup
- `src/app/effects/handlers/item-add.handler.ts` - Full implementation with factory support
- `src/app/effects/handlers/handler-registry.ts` - Added setChanceRegistryRef call
- `src/app/effects/formulas/formula.builders.ts` - hasFurniture, conditional builders
- `src/app/effects/types/effect.types.ts` - SpawnEnemyEffect and ItemAddEffect updated
- `src/app/effects/types/formula.types.ts` - hasFurniture on FormulaContext
- `src/app/effects/types/context.types.ts` - toFormulaContext binds hasFurniture
- `src/app/effects/context/game-context.ts` - addItem implemented, ItemRepoService added
- `src/app/effects/executor/effect-executor.service.ts` - ItemRepoService injected
- `src/app/effects/renderer/effect-renderer.service.ts` - ItemRepoService injected
- `src/app/game-state/activity.service.ts` - Hunting converted, new formula imports

## Decisions Made

1. **SpawnEnemyEffect type refactored** - Changed from required `enemyConfig` to optional `enemy` + `enemyId` for inline/named flexibility
2. **ItemAddEffect extended** - Added optional `factory`, `args` fields for factory-generated items
3. **GameContext constructor change** - Added `ItemRepoService` parameter (deviation from FINAL constructor decision; blocking requirement for item lookup)
4. **Special hide handling** - `addItem('hide')` uses `inventoryService.getHide()` for tiered hide system
5. **animalHandling in chance block** - Simplified from legacy proportional scaling to full 0.1 on success only

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] GameContext constructor extended with ItemRepoService**
- **Found during:** Task 3
- **Issue:** GameContext.addItem was a stub with no way to look up items by string ID
- **Fix:** Added ItemRepoService to constructor, updated executor and renderer to pass it
- **Files modified:** game-context.ts, effect-executor.service.ts, effect-renderer.service.ts
- **Commit:** e3cb225

**2. [Rule 3 - Blocking] FormulaContext extended with hasFurniture**
- **Found during:** Task 4
- **Issue:** hasFurniture formula builder needs hasFurniture method on FormulaContext, which didn't exist
- **Fix:** Added optional hasFurniture to FormulaContext interface, bound in toFormulaContext
- **Files modified:** formula.types.ts, context.types.ts
- **Commit:** 8b69679

**3. [Rule 1 - Bug] SpawnEnemyEffect type mismatch**
- **Found during:** Task 2
- **Issue:** Original type had required `enemyConfig` field but plan/usage expected optional `enemy`
- **Fix:** Changed to optional `enemy` and `enemyId` fields for both inline and named support
- **Files modified:** effect.types.ts
- **Commit:** afd73f6

## Issues/Risks

- **animalHandling behavior change**: Legacy gave fractional animalHandling proportional to hunt chance (0.01-0.05); declarative gives full 0.1 only on hunt success. Minor balance difference.
- **GameContext constructor** is no longer "FINAL" - ItemRepoService was added. Future plans should reference this updated constructor.

## Handler Implementation Status

After this plan:
- **Implemented (9):** status, attribute, yinyang, conditional, money, item.consume, progress, chance, spawn.enemy, item.add
- **Stub (5):** item.generate, spawn.follower, trigger.battle, lifespan

## Next Phase Readiness

- All handlers needed for Hunting are implemented
- Formula builders for furniture conditionals enable similar patterns in other activities
- Item-add handler with factory support ready for Blacksmithing (04-04)
- 4 activities now declarative: Resting, Begging, BuildTower, Hunting
