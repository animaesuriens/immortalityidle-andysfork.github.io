---
phase: 04-validation-slice
plan: 01
subsystem: effects
tags: [typescript, angular, declarative-effects, events, formulas, conditions, begging]

# Dependency graph
requires:
  - phase: 03-04
    provides: DeclarativeActivity union type, EffectExecutorService, GameContext foundation, executeActivity helper
provides:
  - EffectEvent discriminated union for tracking/statistics
  - NoEnemies and CompareProperty condition evaluators (11 total condition kinds)
  - GameContext wired to ALL Phase 4 services (FINAL constructor)
  - Event emission system via RxJS Subject
  - followerPower() and followerCount() formula builders
  - Money handler fully implemented with formula evaluation
  - Begging activity converted to declarative effects
affects: [04-02, 04-03, 04-04, remaining-activity-migrations, statistics-tracking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Event emission via RxJS Subject for effect tracking
    - Phase 4 service wiring pattern (battle, followers, home, impossibleTask)
    - Property path resolution for extensible game state queries
    - Formula-based money calculations with Math.floor rounding

key-files:
  created:
    - src/app/effects/types/event.types.ts
  modified:
    - src/app/effects/types/effect.types.ts
    - src/app/effects/types/condition.types.ts
    - src/app/effects/types/context.types.ts
    - src/app/effects/context/game-context.ts
    - src/app/effects/executor/effect-executor.service.ts
    - src/app/effects/conditions/condition-evaluator.ts
    - src/app/effects/formulas/formula.builders.ts
    - src/app/effects/handlers/money.handler.ts
    - src/app/game-state/activity.service.ts
    - src/app/effects/index.ts

key-decisions:
  - "GameContext constructor modified ONCE with ALL Phase 4 services - no future constructor changes needed"
  - "Event emission pattern: Subject in executor, callback in GameContext for decoupling"
  - "Property path resolution with dot notation (furniture.workbench.id) for extensible queries"
  - "Math.floor rounding for money amounts ensures integer coin values"
  - "Formula builders for followers accept job string parameter for flexible calculations"

patterns-established:
  - "Event emission: Services call emitEvent(), executor exposes effectEvents$ observable"
  - "Phase service wiring: Constructor accepts all needed services upfront, no lazy injection"
  - "CompareProperty condition: Generic path-based comparison for extending game state checks"
  - "Formula builder pattern: followerPower(job) and followerCount(job) for dynamic calculations"

# Metrics
duration: ~18min
completed: 2026-02-03
---

# Phase 4 Plan 1: Begging Infrastructure Summary

**Complete Phase 4 infrastructure wired with event emission, new conditions, formula builders, money handler, and Begging activity converted to declarative effects**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-02-03T21:02:49+08:00
- **Completed:** 2026-02-03T21:20:04+08:00
- **Tasks:** 6 (5 auto + 1 checkpoint)
- **Files created:** 1
- **Files modified:** 10

## Accomplishments

- Created EffectEvent discriminated union (MoneyEarnedEvent, ItemAddedEvent, ItemConsumedEvent, EnemySpawnedEvent, ProgressUpdatedEvent)
- Added NoEnemies and CompareProperty conditions to condition.types.ts (11 total condition kinds)
- Added onError field to BaseEffect for error handling customization
- Extended EffectContext interface with Phase 4 query methods (getEnemyCount, getFollowerCount, getFollowerPower, getPropertyValue, emitEvent)
- Wired GameContext to ALL Phase 4 services (BattleService, FollowersService, HomeService, ImpossibleTaskService) - FINAL constructor
- Fully implemented all Phase 4 context methods (no stubs remain)
- Implemented progress operations (incrementProgress, checkProgressCompletion, resolveProgressType)
- Implemented spawn operations (spawnEnemy with event emission)
- Implemented furniture operations (hasFurniture, getFurnitureId)
- Added RxJS Subject for event emission in EffectExecutorService (effectEvents$)
- Implemented NoEnemies condition evaluator (checks enemy count === 0)
- Implemented CompareProperty condition evaluator with path resolution and operator support
- Added evaluateCompareProperty helper with null/undefined handling
- Created followerPower(job) formula builder with power lookup
- Created followerCount(job) formula builder with count calculation
- Fully implemented Money handler with formula evaluation, Math.floor rounding, and event emission
- Converted Begging activity to declarative effects at all 4 levels with formula-based money

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Type Definitions** - `2ca249c` (feat)
2. **Task 2: Wire Services and Implement Context Methods** - `00e40e0` (feat)
3. **Task 3: Implement New Condition Evaluators** - `62e1acc` (feat)
4. **Task 4: Add followerPower Formula Builder** - `037f37f` (feat)
5. **Task 5: Implement Money Handler** - `9f29212` (feat)
6. **Task 6: Convert Begging Activity** - `32f312e` (feat)

## Files Created/Modified

**Created:**
- `src/app/effects/types/event.types.ts` - EffectEvent discriminated union with 5 event kinds

**Modified:**
- `src/app/effects/types/effect.types.ts` - Added onError field to BaseEffect
- `src/app/effects/types/condition.types.ts` - Added NoEnemies and CompareProperty (11 total)
- `src/app/effects/types/context.types.ts` - Added Phase 4 query methods to EffectContext
- `src/app/effects/context/game-context.ts` - FINAL constructor with all services, full method implementations
- `src/app/effects/executor/effect-executor.service.ts` - Service injection, effectEvents$ Subject, createContext updated
- `src/app/effects/conditions/condition-evaluator.ts` - NoEnemies and CompareProperty case handlers
- `src/app/effects/formulas/formula.builders.ts` - followerPower() and followerCount() builders
- `src/app/effects/handlers/money.handler.ts` - Full implementation replacing stub
- `src/app/game-state/activity.service.ts` - Begging declarative effects at all 4 levels
- `src/app/effects/index.ts` - Export event.types.ts

## Decisions Made

- **FINAL GameContext constructor:** Modified ONCE to accept ALL Phase 4 services (BattleService, FollowersService, HomeService, ImpossibleTaskService) plus eventEmitter callback. No subsequent plans will touch the constructor again.
- **Event emission pattern:** RxJS Subject in EffectExecutorService exposes effectEvents$ observable; GameContext receives callback function to decouple from RxJS internals.
- **Property path resolution:** CompareProperty uses dot notation (furniture.workbench.id, followerCount.builder) for extensible game state queries without adding EffectContext methods for every property.
- **Math.floor rounding:** Money amounts evaluated from formulas are floored to ensure integer coin values, matching existing game behavior.
- **Formula builder parameters:** followerPower(job) and followerCount(job) accept job string parameter for flexible per-job calculations.
- **No legacy fields:** Begging's consequence, consequenceDescription, and effectsLegacy fields removed completely - full declarative migration.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0

## Issues Encountered

None. All tasks completed without blocking issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Phase 4 Plan 1 Complete.** Infrastructure is now ready for remaining Phase 4 activities:

**Infrastructure Complete:**
1. **Type System:** EffectEvent union, NoEnemies and CompareProperty conditions, onError field
2. **Context:** GameContext wired to all services with FINAL constructor
3. **Execution:** Event emission via effectEvents$ observable
4. **Formulas:** followerPower() and followerCount() builders for dynamic calculations
5. **Handlers:** Money handler fully implemented with formula support
6. **Validation:** Begging converted and working with declarative effects

**Ready for Plans 04-02, 04-03, 04-04:**
- Pattern established for converting activities with formula-based rewards
- Event emission working for statistics tracking
- NoEnemies and CompareProperty conditions ready for complex activities
- followerPower/followerCount ready for follower-dependent activities

**No blockers or concerns.**

---
*Phase: 04-validation-slice*
*Plan: 01*
*Completed: 2026-02-03*
