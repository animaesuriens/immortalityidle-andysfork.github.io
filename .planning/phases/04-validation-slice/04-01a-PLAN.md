---
phase: 04-validation-slice
plan: 01a
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/effects/types/effect.types.ts
  - src/app/effects/types/condition.types.ts
  - src/app/effects/types/context.types.ts
  - src/app/effects/types/event.types.ts
  - src/app/effects/index.ts
autonomous: true

must_haves:
  truths:
    - "EffectEvent discriminated union exists for tracking"
    - "NoEnemies and CompareProperty conditions defined"
    - "EffectContext interface extended with new methods"
    - "onError field available on all effects"
  artifacts:
    - path: "src/app/effects/types/event.types.ts"
      provides: "EffectEvent discriminated union for tracking"
      exports: ["EffectEvent", "MoneyEarnedEvent"]
    - path: "src/app/effects/types/condition.types.ts"
      provides: "NoEnemies and CompareProperty condition types"
      contains: "NoEnemies"
  key_links:
    - from: "src/app/effects/types/context.types.ts"
      to: "event.types.ts"
      via: "import"
      pattern: "import.*EffectEvent"
---

<objective>
Extend effect type system with event types, new conditions, and context interface methods.

Purpose: This establishes the foundational types that all Phase 4 handlers will use. Separating types from implementation keeps context budget manageable.

Output: Extended type definitions ready for handler implementation in 04-01b.
</objective>

<execution_context>
@C:\Users\marce\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\marce\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04-validation-slice/04-CONTEXT.md
@.planning/phases/04-validation-slice/04-RESEARCH.md
@.planning/phases/03-first-vertical-slice/03-04-SUMMARY.md
@src/app/effects/types/context.types.ts
@src/app/effects/types/condition.types.ts
@src/app/effects/types/effect.types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Event Types</name>
  <files>
    src/app/effects/types/event.types.ts
    src/app/effects/index.ts
  </files>
  <action>
1. Create `src/app/effects/types/event.types.ts` with EffectEvent discriminated union:
   ```typescript
   export interface MoneyEarnedEvent {
     readonly kind: 'moneyEarned';
     readonly amount: number;
   }
   export interface ItemAddedEvent {
     readonly kind: 'itemAdded';
     readonly itemId: string;
     readonly quantity: number;
   }
   export interface ItemConsumedEvent {
     readonly kind: 'itemConsumed';
     readonly itemType: string;
     readonly grade: number;
   }
   export interface EnemySpawnedEvent {
     readonly kind: 'enemySpawned';
     readonly enemyName: string;
   }
   export interface ProgressUpdatedEvent {
     readonly kind: 'progressUpdated';
     readonly progressType: string;
     readonly amount: number;
   }
   export type EffectEvent = MoneyEarnedEvent | ItemAddedEvent | ItemConsumedEvent | EnemySpawnedEvent | ProgressUpdatedEvent;
   ```

2. Update barrel export (index.ts) to export new types from event.types.ts.
  </action>
  <verify>
    Run `npx tsc --noEmit` - no errors. Check that EffectEvent is exported from index.ts.
  </verify>
  <done>
    Event types created and exported. RxJS Subject will use this in 04-01b.
  </done>
</task>

<task type="auto">
  <name>Task 2: Extend Condition and Context Types</name>
  <files>
    src/app/effects/types/condition.types.ts
    src/app/effects/types/context.types.ts
    src/app/effects/types/effect.types.ts
    src/app/effects/index.ts
  </files>
  <action>
1. In `condition.types.ts`, add NoEnemies and CompareProperty conditions:
   ```typescript
   export interface NoEnemies {
     readonly kind: 'NoEnemies';
   }
   export interface CompareProperty {
     readonly kind: 'CompareProperty';
     readonly path: string;
     readonly operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
     readonly value: string | number | boolean;
   }
   ```
   Update Condition union to include NoEnemies | CompareProperty.

2. In `context.types.ts`, add to EffectContext interface:
   ```typescript
   getEnemyCount(): number;
   getFollowerPower(job: string): number;
   getPropertyValue(path: string): unknown;
   emitEvent(event: EffectEvent): void;
   ```
   Import EffectEvent from './event.types'.

3. In `effect.types.ts`, add to BaseEffect interface:
   ```typescript
   readonly onError?: 'continue' | 'abort' | 'skip';
   ```

4. Update index.ts exports for new condition types.
  </action>
  <verify>
    Run `npx tsc --noEmit` - no errors. New conditions and context methods visible in types.
  </verify>
  <done>
    All type extensions in place: EffectEvent union, NoEnemies/CompareProperty conditions, new EffectContext methods, onError field.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes
- EffectEvent exported from index.ts
- NoEnemies and CompareProperty in Condition union
- EffectContext has new method signatures
- BaseEffect has onError field
</verification>

<success_criteria>
1. Event types created with all Phase 4 event kinds
2. Condition types extended with NoEnemies and CompareProperty
3. Context types extended with new method signatures
4. Effect types extended with onError field
5. All new types exported from barrel
</success_criteria>

<output>
After completion, create `.planning/phases/04-validation-slice/04-01a-SUMMARY.md`
</output>
