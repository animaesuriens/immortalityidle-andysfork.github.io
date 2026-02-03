# Phase 4: Validation Slice - Research

**Researched:** 2026-02-03
**Domain:** Handler implementation, RxJS event system, type system extensions
**Confidence:** HIGH (codebase analysis-based, decisions locked in CONTEXT.md)

## Summary

Phase 4 converts 4 diverse activities (Begging, Blacksmithing, Hunting, BuildTower) to declarative effects, implementing the stub handlers created in Phase 3. The primary technical challenges are:

1. **Event system architecture** - RxJS Subject for side effect tracking (Decision 19)
2. **Variable capture workflow** - Consume item, store grade, use in subsequent effects (Decision 9)
3. **New condition kinds** - NoEnemies and CompareProperty (Decisions 12, 18)
4. **Handler implementations** - money, progress, chance, spawn-enemy, item-consume, item-add

All decisions are locked in 04-CONTEXT.md. This research focuses on *how* to implement these decisions, not *what* to implement.

**Primary recommendation:** Implement in strict sequential order (04-01 through 04-04) with Begging including all infrastructure, leveraging existing patterns from Phase 3 handlers.

## Standard Stack

### Core (Already in Project)
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Angular | 17+ | Application framework | Modern standalone patterns |
| RxJS | 7.x | Event system | Already used extensively in codebase |
| TypeScript | 5.x | Type safety | Strict mode enabled |

### Existing Infrastructure (from Phase 3)
| Component | Location | Purpose |
|-----------|----------|---------|
| EffectExecutorService | `effects/executor/` | Executes effects via handlers |
| HandlerRegistry | `effects/handlers/handler-registry.ts` | Maps effect kinds to handlers |
| GameContext | `effects/context/game-context.ts` | Implements EffectContext interface |
| Condition evaluator | `effects/conditions/condition-evaluator.ts` | Evaluates 9 condition kinds |
| Formula builders | `effects/formulas/formula.builders.ts` | 17 formula building functions |

### Services Requiring Integration
| Service | Purpose | Methods Needed |
|---------|---------|----------------|
| BattleService | Enemy spawning | `addEnemy()`, `enemies.length` |
| FollowersService | Follower power | `jobs[job].totalPower` |
| ImpossibleTaskService | Progress tracking | `taskProgress[type].progress`, `checkCompletion()` |
| InventoryService | Item operations | `consume()`, `addItem()`, items lookup |
| HomeService | Furniture checks | `furniture.workbench?.id` |

## Architecture Patterns

### Pattern 1: Handler Implementation

Follow existing Phase 3 handler patterns. Each handler exports a const object with execute and render methods.

```typescript
// Source: src/app/effects/handlers/attribute.handler.ts (existing pattern)
export const newHandler: EffectHandler<NewEffect> = {
  execute(effect: NewEffect, context: EffectContext): void {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    // Execute the effect using context methods
  },

  render(effect: NewEffect, context: EffectContext): RenderedEffect {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    // Return structured RenderedEffect
    return {
      kind: 'money', // or appropriate kind
      visible: true,
      positive: amount >= 0,
      short: { sign: '+', amount: Math.abs(amount), label: 'Money' },
      long: { verb: 'Earns', amount: Math.abs(amount), name: 'coins' },
    };
  },
};
```

### Pattern 2: RxJS Subject Event System (Decision 19)

Add event emission to EffectExecutorService. Handlers emit events during execution.

```typescript
// In EffectExecutorService
import { Subject } from 'rxjs';

export interface EffectEvent {
  kind: 'moneyEarned' | 'itemAdded' | 'itemConsumed' | 'enemySpawned' | 'progressUpdated';
  // Specific fields per kind
}

export interface MoneyEarnedEvent extends EffectEvent {
  kind: 'moneyEarned';
  amount: number;
}

export interface ItemAddedEvent extends EffectEvent {
  kind: 'itemAdded';
  itemId: string;
  quantity: number;
}

// In service:
effectEvents$ = new Subject<EffectEvent>();

// Handlers access via context method (passed through)
```

The Subject pattern is well-established in this codebase (see `mainLoopService.longTickSubject`, `reincarnationService.reincarnateSubject`).

### Pattern 3: Variable Capture (Decision 9)

Existing GameContext already has `setVariable(name, value)` and `variables` property. Extend ItemConsumeEffect to support `storeGradeAs`:

```typescript
// Effect definition
{ kind: 'item.consume', itemType: 'metal', storeGradeAs: 'oreGrade' }

// In item-consume handler execute():
const grade = context.consumeItem(effect.itemType, effect.minGrade);
if (effect.storeGradeAs) {
  context.setVariable(effect.storeGradeAs, grade);
}

// Subsequent effect uses it:
{ kind: 'item.add', factory: 'generateWeapon', args: [variable('oreGrade')] }
```

### Pattern 4: New Condition Kinds (Decisions 12, 18)

Extend condition.types.ts and condition-evaluator.ts:

```typescript
// condition.types.ts - add to union
export interface NoEnemies {
  readonly kind: 'NoEnemies';
}

export interface CompareProperty {
  readonly kind: 'CompareProperty';
  readonly path: string;  // e.g., 'furniture.workbench.id'
  readonly operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  readonly value: string | number | boolean;
}

// condition-evaluator.ts - add cases
case 'NoEnemies':
  return context.getEnemyCount() === 0;  // New context method

case 'CompareProperty':
  return evaluateCompareProperty(condition, context);
```

### Pattern 5: Item Factory Support (Decision 17)

ItemAddEffect supports both direct itemId and factory functions:

```typescript
export interface ItemAddEffect extends BaseEffect {
  readonly kind: 'item.add';
  readonly itemId?: string;           // Simple lookup
  readonly factory?: string;          // Factory function name
  readonly args?: (number | Formula | VariableRef)[];  // Factory arguments
  readonly quantity?: number | Formula;
}

// In handler:
if (effect.itemId) {
  context.addItem(effect.itemId, quantity);
} else if (effect.factory) {
  const resolvedArgs = effect.args?.map(arg => resolveArg(arg, context));
  context.callFactory(effect.factory, resolvedArgs);
}
```

### Anti-Patterns to Avoid

- **Direct service injection in handlers:** Handlers access services only through EffectContext
- **Hardcoding values in handlers:** Use effect properties and formulas for all configurable values
- **Mutating effect objects:** Effects are readonly; handlers read but never mutate
- **Synchronous event handling for side effects:** Use Subject.next() for async-compatible event emission

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Event emission | Custom event system | RxJS Subject | Already in codebase, standard pattern |
| Property path access | Manual parsing | Lodash `get()` or simple recursive | Edge cases with nested nulls |
| Item consumption | New consume logic | Existing `InventoryService.consume()` | Already handles all edge cases |
| Enemy spawning | New spawn logic | Existing `BattleService.addEnemy()` | Already handles stacking, logging |

**Key insight:** Most operations already exist in services. Context methods are thin wrappers that delegate to existing service methods.

## Common Pitfalls

### Pitfall 1: Context Injection Order
**What goes wrong:** Services not available when GameContext is constructed
**Why it happens:** Angular DI ordering, especially with Injector pattern
**How to avoid:** Inject all required services in EffectExecutorService constructor, pass to GameContext
**Warning signs:** "Cannot read property X of undefined" in context methods

### Pitfall 2: Variable Scope Leaking Between Activities
**What goes wrong:** Variable set in one activity execution leaks to next
**Why it happens:** Reusing context or not clearing variables
**How to avoid:** GameContext creates fresh `_variables = {}` on construction. Executor creates new context per execution.
**Warning signs:** Unexpected values in formulas using `variable()`

### Pitfall 3: Event Observer Lifecycle
**What goes wrong:** Memory leaks from unsubscribed event listeners
**Why it happens:** Subscribing to Subject without unsubscribing on destroy
**How to avoid:** Use `takeUntilDestroyed()` or manage subscriptions in ngOnDestroy
**Warning signs:** Console logs continuing after component destruction

### Pitfall 4: Chance Handler Nested Execution
**What goes wrong:** Chance handler doesn't execute nested effects
**Why it happens:** Missing registry reference for nested execution (same issue as conditional handler)
**How to avoid:** Use same `setRegistryRef()` pattern from conditional.handler.ts
**Warning signs:** Nested effects not firing when probability passes

### Pitfall 5: Item Consume Returns Grade, Not Boolean
**What goes wrong:** Treating consume result as success/failure boolean
**Why it happens:** Confusion about what `consume()` returns
**How to avoid:** `consume()` returns item grade (number), not boolean. 0 or -1 means nothing found.
**Warning signs:** Effects firing when they shouldn't, or not firing when they should

### Pitfall 6: Effect Type Changes Break Registry
**What goes wrong:** Adding new effect types causes compilation errors in registry
**Why it happens:** HandlerRegistry is mapped type requiring all EffectKind entries
**How to avoid:** When extending effect types, immediately add stub handler to registry
**Warning signs:** TypeScript "property X is missing" on handlerRegistry

## Code Examples

### Money Handler Implementation

```typescript
// Source: Pattern following attribute.handler.ts
export const moneyHandler: EffectHandler<MoneyEffect> = {
  execute(effect: MoneyEffect, context: EffectContext): void {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    context.updateMoney(amount);
    // Emit event for tracking
    context.emitEvent({ kind: 'moneyEarned', amount });
  },

  render(effect: MoneyEffect, context: EffectContext): RenderedEffect {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    const positive = amount >= 0;

    return {
      kind: 'money',
      visible: true,
      positive,
      short: {
        sign: positive ? '+' : '',
        amount: Math.abs(amount),
        label: 'Coins',
      },
      long: {
        verb: positive ? 'Earns' : 'Costs',
        amount: Math.abs(amount),
        name: 'coins',
      },
      formula: typeof effect.amount === 'number'
        ? { type: 'fixed', base: effect.amount }
        : { type: 'fixed', expression: effect.amount.render(formulaContext, 'both') },
    };
  },
};
```

### Progress Handler Implementation

```typescript
// Progress handler integrates with ImpossibleTaskService
export const progressHandler: EffectHandler<ProgressEffect> = {
  execute(effect: ProgressEffect, context: EffectContext): void {
    const formulaContext = toFormulaContext(context);
    const amount = effect.amount
      ? evaluateAmount(effect.amount, formulaContext)
      : 1;
    context.incrementProgress(effect.progressType, amount);
    context.checkProgressCompletion();
    context.emitEvent({ kind: 'progressUpdated', progressType: effect.progressType, amount });
  },

  render(effect: ProgressEffect, context: EffectContext): RenderedEffect {
    const formulaContext = toFormulaContext(context);
    const amount = effect.amount
      ? evaluateAmount(effect.amount, formulaContext)
      : 1;

    return {
      kind: 'progress',
      visible: true,
      positive: true,
      short: {
        sign: '+',
        amount,
        label: `${effect.progressType} Progress`,
      },
      long: {
        verb: 'Adds',
        amount,
        name: `${effect.progressType} progress`,
      },
    };
  },
};
```

### Chance Handler Implementation

```typescript
// Chance handler wraps nested effects in probability check
export const chanceHandler: EffectHandler<ChanceEffect> = {
  execute(effect: ChanceEffect, context: EffectContext): void {
    const formulaContext = toFormulaContext(context);
    const probability = evaluateAmount(effect.probability, formulaContext);

    if (Math.random() < probability) {
      // Execute nested effects - same pattern as conditional handler
      for (const nested of effect.effects) {
        executeEffect(nested, context);
      }
    }
  },

  render(effect: ChanceEffect, context: EffectContext): RenderedEffect[] {
    const formulaContext = toFormulaContext(context);
    const probability = evaluateAmount(effect.probability, formulaContext);
    const percentStr = `${Math.round(probability * 100)}%`;

    // Render nested effects with chance annotation
    const results: RenderedEffect[] = [];
    for (const nested of effect.effects) {
      const rendered = flattenEffects(renderEffect(nested, context));
      for (const r of rendered) {
        results.push({
          ...r,
          condition: `${percentStr} chance`,
        });
      }
    }
    return results;
  },
};
```

### NoEnemies Condition Implementation

```typescript
// In condition-evaluator.ts
function evaluateNoEnemies(context: EffectContext): boolean {
  return context.getEnemyCount() === 0;
}

// In evaluateCondition switch:
case 'NoEnemies':
  return evaluateNoEnemies(context);

// In EffectContext interface and GameContext:
getEnemyCount(): number {
  return this.battleService.enemies.length;
}
```

### Begging Activity Definition

```typescript
// Begging level 0: charisma + formula-based money
effects: {
  0: [
    { kind: 'status', status: 'stamina', amount: -5 },
    { kind: 'attribute', attribute: 'charisma', amount: 0.1 },
    {
      kind: 'money',
      amount: add(3, log2(attr('charisma'))),
    },
    {
      kind: 'conditional',
      condition: { kind: 'HasFlag', flag: 'yinYangUnlocked' },
      then: [{ kind: 'yinyang', modify: 'yang', amount: 1 }],
    },
  ],
  // Higher levels follow similar pattern with different amounts
}
```

### Hunting Activity Definition

```typescript
effects: {
  0: [
    { kind: 'status', status: 'stamina', amount: -50 },
    { kind: 'attribute', attribute: 'speed', amount: 0.1 },
    {
      kind: 'chance',
      // 10% base + 40% if dog kennel
      probability: add(
        0.1,
        conditional(
          { kind: 'CompareProperty', path: 'furniture.workbench.id', operator: '==', value: 'dogKennel' },
          0.4,
          0
        )
      ),
      effects: [
        { kind: 'attribute', attribute: 'animalHandling', amount: 0.1 },
        { kind: 'item.add', itemId: 'meat' },
        {
          kind: 'item.add',
          itemId: 'hide',
          quantity: floor(div(followerPower('hunter'), 20)),
        },
      ],
    },
    // Wolf spawn: 1% if no enemies
    {
      kind: 'conditional',
      condition: {
        kind: 'And',
        conditions: [
          { kind: 'CompareValues', left: 'random', operator: '<', right: 0.01 },
          { kind: 'NoEnemies' },
        ],
      },
      then: [
        {
          kind: 'spawn.enemy',
          enemyConfig: {
            name: 'a hungry wolf',
            health: 20,
            attack: 5,
            defense: 5,
            loot: ['hide'],
          },
        },
      ],
    },
    {
      kind: 'conditional',
      condition: { kind: 'HasFlag', flag: 'yinYangUnlocked' },
      then: [{ kind: 'yinyang', modify: 'yang', amount: 1 }],
    },
  ],
}
```

## State of the Art

| Concept | Phase 3 Approach | Phase 4 Enhancement |
|---------|-----------------|---------------------|
| Handler stubs | Throw "not implemented" | Full implementation |
| Context methods | Warn and no-op | Wire to real services |
| Event tracking | None | RxJS Subject system |
| Variable capture | Interface ready | Handler implementation |

**Deprecated/outdated:**
- None. Phase 3 patterns continue unchanged; Phase 4 adds implementation.

## Open Questions

### 1. Random in Conditions
**What we know:** Hunting uses `Math.random() < 0.01` for wolf spawn check
**What's unclear:** Should random be evaluated in condition or use ChanceEffect?
**Recommendation:** Use ChanceEffect for probability-based execution. For conditions, add 'random' as a special value type in CompareValues (like 'yin', 'yang'). The random value is generated once per condition evaluation.

### 2. FollowerPower Formula Builder
**What we know:** Decision 16 requires `getFollowerPower(job)` in EffectContext
**What's unclear:** Should this be a formula builder like `followerPower('hunter')` or context method only?
**Recommendation:** Add both - formula builder wraps context method for formula composition:
```typescript
export function followerPower(job: string): Formula {
  return {
    evaluate(context) { return context.getFollowerPower(job); },
    render(context, format) { /* ... */ }
  };
}
```

### 3. Factory Argument Resolution
**What we know:** Blacksmithing uses consumed ore grade to generate weapon of matching grade
**What's unclear:** How to represent `variable('oreGrade')` in factory args array
**Recommendation:** Create VariableRef type that evaluates at execution time:
```typescript
type FactoryArg = number | Formula | { ref: 'variable', name: string };
```

## Migration Complexity Assessment

| Activity | Handlers Needed | Conditions Needed | Complexity |
|----------|-----------------|-------------------|------------|
| Begging | money | HasFlag | Low |
| BuildTower | progress, item.consume | HasInventory | Medium |
| Hunting | chance, spawn.enemy, item.add | NoEnemies, CompareProperty, HasFlag | High |
| Blacksmithing | item.consume, item.add (factory), chance | HasInventory, CompareProperty | High |

**Order rationale (Decision 30):**
1. **Begging first** - Simplest, establishes money handler and event system
2. **BuildTower second** - Progress handler, validates ImpossibleTask integration
3. **Hunting third** - Chance handler, spawn-enemy, new conditions
4. **Blacksmithing last** - Most complex: variable capture, factory-generated items

## Required Type Changes Summary

### effect.types.ts Extensions
```typescript
// ItemAddEffect - add factory support
export interface ItemAddEffect extends BaseEffect {
  readonly kind: 'item.add';
  readonly itemId?: string;
  readonly factory?: string;
  readonly args?: FactoryArg[];
  readonly quantity?: number | Formula;
}

// ItemConsumeEffect - add storeGradeAs
export interface ItemConsumeEffect extends BaseEffect {
  readonly kind: 'item.consume';
  readonly itemType: string;
  readonly minGrade?: number;
  readonly storeGradeAs?: string;
}

// All effects - add onError override
interface BaseEffect {
  readonly description?: string;
  readonly onError?: 'continue' | 'abort' | 'skip';
}
```

### condition.types.ts Extensions
```typescript
// Add to Condition union
export interface NoEnemies {
  readonly kind: 'NoEnemies';
}

export interface CompareProperty {
  readonly kind: 'CompareProperty';
  readonly path: string;
  readonly operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  readonly value: string | number | boolean;
}

// Update Condition union to include new kinds
export type Condition =
  | HasFlag | CompareAttribute | CompareStatus | CompareValues
  | HasFurniture | HasInventory | And | Or | Not
  | NoEnemies | CompareProperty;  // New
```

### context.types.ts Extensions
```typescript
// Add to EffectContext interface
getEnemyCount(): number;
getFollowerPower(job: string): number;
getPropertyValue(path: string): unknown;
emitEvent(event: EffectEvent): void;
```

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/app/effects/` module structure and patterns
- Codebase analysis: `src/app/game-state/activity.service.ts` (current activity implementations)
- Phase 3 handlers: `attribute.handler.ts`, `conditional.handler.ts` (implementation patterns)
- 04-CONTEXT.md: All 34 user decisions

### Secondary (MEDIUM confidence)
- RxJS Subject pattern: Observable in `MainLoopService`, `ReincarnationService`
- GameContext pattern: `src/app/effects/context/game-context.ts`

### Tertiary (LOW confidence)
- None. All findings based on codebase analysis.

## Metadata

**Confidence breakdown:**
- Handler patterns: HIGH - Based on existing Phase 3 implementations
- Event system: HIGH - RxJS Subject pattern already used in codebase
- Type extensions: HIGH - Clear requirements from CONTEXT.md decisions
- Integration points: HIGH - Service methods already exist and working

**Research date:** 2026-02-03
**Valid until:** Indefinite (codebase-specific, no external dependencies)
