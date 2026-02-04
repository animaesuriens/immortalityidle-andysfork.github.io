# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** Single source of truth for activity effects - change definition once, execution and display update automatically
**Current focus:** Ready for Phase 4 - Validation Slice

## Current Position

Phase: 4 of 7 (Validation Slice) - IN PROGRESS
Plan: 1 of 4 in current phase - COMPLETE
Status: In progress
Last activity: 2026-02-04 - Completed 04-01-PLAN.md (Begging Infrastructure)

Progress: [████████░░] 73%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 12min
- Total execution time: 1.7 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-duration-foundation | 1 | 12min | 12min |
| 02-interface-design | 2 | 17min | 8.5min |
| 03-first-vertical-slice | 4 | 53min | 13min |
| 04-validation-slice | 1 | 18min | 18min |

**Recent Trend:**
- Last 5 plans: 7min, 8min, 30min (checkpoint), 18min
- Trend: Checkpoint plans take longer due to user verification

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in DECISIONS.md. Key decisions affecting current work:

- Activities only (start narrow, expand to items/equipment later)
- Big bang migration (no hybrid period)
- Handler registry pattern (extensible without modifying executor)
- Context object pattern (easy testing with mock context)
- Duration field placed after activityType, before description
- 14 effect variants covering all current consequence patterns
- EnemyConfig in effect.types.ts to avoid circular dependencies
- RenderFormat: 'short' | 'long' | 'formula' for different display contexts
- HandlerRegistry uses mapped type for exhaustive handler registration
- **Code Standards**: Modern TypeScript/Angular syntax required (see DECISIONS.md)
- **Type discriminator 'kind'**: All effects and conditions use 'kind' not 'type' (avoids TypeScript keyword)
- **Field name 'amount'**: All quantity fields use 'amount' consistently
- **Condition naming**: Has/Is/Compare prefix (HasFlag, CompareAttribute, CompareValues)
- **Formula builders**: Object literals with evaluate() and render() methods
- **Singleton handler pattern**: const exports, not classes (simpler, better tree-shaking)
- **Late-bound registry reference**: setRegistryRef() breaks conditional handler circular dependency
- **Activity union type**: DeclarativeActivity | LegacyActivity allows gradual migration
- **Level-keyed effects**: effects: { [level: number]: Effect[] } mirrors consequence array pattern
- **Pre-filter visible effects**: Filter before template iteration to fix comma-joining edge cases
- **FINAL GameContext constructor**: Modified ONCE with ALL Phase 4 services (no future constructor changes)
- **Event emission pattern**: RxJS Subject in executor, callback in GameContext for decoupling
- **Property path resolution**: CompareProperty uses dot notation for extensible game state queries
- **Math.floor rounding**: Money amounts from formulas floored to ensure integer coin values

### Pending Todos

1. **Angular modernization refactor** (ui) - Standalone components, inject() function, signal-based inputs/outputs
2. **Refactor activity location/visibility system** (architecture) - Data-driven activity visibility with location flags instead of procedural list building
3. **Enforce bonus tracking through functions** (architecture) - Refactor so food bonuses can only be applied via tracked functions, closing TypeScript enforcement gap
4. **Restructure consumables with unified type system** (architecture) - Add consistent type field to all consumables (food/potion/pill) for automatic tracking

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-04T15:30:00Z
Stopped at: Completed 04-01-PLAN.md (Begging Infrastructure)
Resume file: None

## Completed Phases

### Phase 1: Duration Foundation
- **Plan 01-01:** Duration field added to Activity interface and all 69 definitions
- **Summary:** `.planning/phases/01-duration-foundation/01-01-SUMMARY.md`
- **Commit:** b05ed3f

### Phase 2: Interface Design (Complete)
- **Plan 02-01:** Core type definitions for effects system (14 effect variants, 8 condition variants, Formula interface, EffectContext)
- **Summary:** `.planning/phases/02-interface-design/02-01-SUMMARY.md`
- **Commits:** 772fe5c, 2abe1af
- **Plan 02-02:** Formula builders (17 functions), EffectHandler interface, HandlerRegistry type, assertNever utility, barrel export
- **Summary:** `.planning/phases/02-interface-design/02-02-SUMMARY.md`
- **Commits:** 5fb8780, 640efa5, c4b22f3

### Phase 3: First Vertical Slice (Complete)
- **Plan 03-01:** Type discriminators updated (type->kind), field names standardized (value/change->amount), CompareValues condition added, all 17 formula builders implemented
- **Summary:** `.planning/phases/03-first-vertical-slice/03-01-SUMMARY.md`
- **Commits:** c922319, 7a4cf83, 3cd6a6a
- **Plan 03-02:** Condition evaluator (9 kinds), 4 implemented handlers (status, attribute, yinyang, conditional), 10 stub handlers, handler registry
- **Summary:** `.planning/phases/03-first-vertical-slice/03-02-SUMMARY.md`
- **Commits:** bbb7bc3, 312f529, 69d6353
- **Plan 03-03:** GameContext implementing EffectContext, EffectExecutorService, EffectRendererService, three Angular pipes, barrel export updated
- **Summary:** `.planning/phases/03-first-vertical-slice/03-03-SUMMARY.md`
- **Commits:** 272a2ab, 38b4ec4, 4a47e74
- **Plan 03-04:** Activity discriminated union (DeclarativeActivity | LegacyActivity), Resting converted to declarative, executeActivity helper, effect rendering in activity panel
- **Summary:** `.planning/phases/03-first-vertical-slice/03-04-SUMMARY.md`
- **Commits:** 12e16c3, 34f7abf, 47d2d54, e654853, 119d113

### Phase 4: Validation Slice (In Progress)
- **Plan 04-01:** EffectEvent types, NoEnemies and CompareProperty conditions, GameContext wired to all Phase 4 services (FINAL constructor), event emission system, followerPower/followerCount formula builders, Money handler fully implemented, Begging activity converted to declarative effects
- **Summary:** `.planning/phases/04-validation-slice/04-01-SUMMARY.md`
- **Commits:** 2ca249c, 00e40e0, 62e1acc, 037f37f, 9f29212, 32f312e

## Effects Module Structure

After Phase 4 Plan 01, the effects module has complete Phase 4 infrastructure:

```
src/app/effects/
├── types/
│   ├── effect.types.ts      # 14 effect variants + onError field
│   ├── condition.types.ts   # 11 condition variants (NoEnemies, CompareProperty added)
│   ├── formula.types.ts     # Formula interface
│   ├── render.types.ts      # RenderedEffect structured data
│   ├── context.types.ts     # EffectContext with Phase 4 methods
│   └── event.types.ts       # EffectEvent discriminated union (5 event kinds)
├── formulas/
│   └── formula.builders.ts  # 19 formula builders (followerPower, followerCount added)
├── conditions/
│   └── condition-evaluator.ts # evaluateCondition function (11 kinds)
├── context/
│   └── game-context.ts      # GameContext with FINAL constructor + all services
├── executor/
│   └── effect-executor.service.ts # EffectExecutorService + effectEvents$ Subject
├── renderer/
│   └── effect-renderer.service.ts # EffectRendererService
├── pipes/
│   ├── effect-short.pipe.ts   # EffectShortPipe
│   ├── effect-long.pipe.ts    # EffectLongPipe
│   └── effect-formula.pipe.ts # EffectFormulaPipe
├── handlers/
│   ├── handler.interface.ts   # EffectHandler, HandlerRegistry
│   ├── handler-registry.ts    # Complete registry (14 handlers)
│   ├── status.handler.ts      # Implemented
│   ├── attribute.handler.ts   # Implemented
│   ├── yinyang.handler.ts     # Implemented
│   ├── conditional.handler.ts # Implemented
│   ├── money.handler.ts       # Implemented (Phase 4)
│   ├── item-add.handler.ts    # Stub
│   ├── item-consume.handler.ts    # Stub
│   ├── item-generate.handler.ts   # Stub
│   ├── chance.handler.ts      # Stub
│   ├── progress.handler.ts    # Stub
│   ├── spawn-enemy.handler.ts # Stub
│   ├── spawn-follower.handler.ts  # Stub
│   ├── trigger-battle.handler.ts  # Stub
│   └── lifespan.handler.ts    # Stub
├── utils/
│   ├── exhaustive.ts        # assertNever helper
│   ├── abbreviations.ts     # ABBREVIATIONS constant
│   └── render-helpers.ts    # FLAG_DISPLAY_NAMES, rendering utilities
└── index.ts                 # Barrel export (includes event.types.ts)

src/app/game-state/
├── activity.ts              # DeclarativeActivity | LegacyActivity union, isDeclarativeActivity guard
└── activity.service.ts      # Resting and Begging declarative, executeActivity helper

src/app/activity-panel/
├── activity-panel.component.ts   # getActivityEffects, formatEffectsLong
└── activity-panel.component.html # @for loop for effect rendering
```

**Phase 4 infrastructure complete:** Event emission system, follower formulas, property path queries, money handler, and Begging activity fully declarative.

**Declarative activities:** Resting (Phase 3), Begging (Phase 4) - 67 activities remaining
