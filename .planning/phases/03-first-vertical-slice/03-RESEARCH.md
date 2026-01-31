# Phase 3: First Vertical Slice - Research

**Researched:** 2026-01-31
**Phase Goal:** ONE activity (Resting) works end-to-end with declarative effects
**Overall confidence:** HIGH

## Executive Summary

Phase 3 implements the first complete vertical slice of the declarative effects system: the Resting activity. This validates the architecture before broader migration. The research covers implementation patterns for effect handlers, formula builders, the condition evaluator, the effect executor service, the render service, and Angular integration via pipes.

The Phase 2 foundation is solid. Effect types (14 variants), condition types (8 variants), formula interface, context interface, handler interface, and handler registry are all in place. Phase 3 implements these interfaces for the specific effects needed by Resting.

**Key findings:**
- Resting uses 4 effect types: StatusEffect, AttributeEffect, YinYangEffect, ConditionalEffect
- Resting has 4 levels with progressively more complex effects
- Level 3 introduces the "balance toward lower" yin/yang logic requiring CompareValues condition
- Angular 18 signals are available but the codebase uses traditional patterns; we'll use computed signals for template reactivity
- Modern Angular standalone pipes with inject() pattern for thin pipes delegating to render service

## Resting Activity Analysis

### Current Implementation (Legacy)

```typescript
// From activity.service.ts
this.Resting = {
  level: 0,
  name: ['Resting', 'Meditation', 'Communing With Divinity', 'Finding True Inner Peace'],
  consequenceDescription: [
    'Restores 50 Stamina and 2 Health.',
    'Restores 100 Stamina, 10 Health, and 1 Mana (if unlocked).',
    'Restores 200 Stamina, 20 Health, and 10 Mana (if unlocked).',
    'Restores 300 Stamina, 30 Health, and 20 Mana (if unlocked).',
  ],
  effects: [
    '+50 Sta, +2 HP',
    '+100 Sta, +10 HP, +1 Mana, +Spirituality',
    '+200 Sta, +20 HP, +10 Mana, +Spirituality',
    '+300 Sta, +30 HP, +20 Mana, +Spirituality',
  ],
  consequence: [/* 4 consequence functions */],
  // ...
}
```

### Per-Level Effects Breakdown

**Level 0: Resting**
- `+50 Stamina` - StatusEffect
- `+2 Health` - StatusEffect
- `+1 Yin` (if yinYangUnlocked) - ConditionalEffect + YinYangEffect

**Level 1: Meditation**
- `+100 Stamina` - StatusEffect
- `+10 Health` - StatusEffect
- `+0.001 Spirituality` - AttributeEffect
- `+1 Mana` (if manaUnlocked) - ConditionalEffect + StatusEffect
- `+1 Yin` (if yinYangUnlocked) - ConditionalEffect + YinYangEffect

**Level 2: Communing With Divinity**
- `+200 Stamina` - StatusEffect
- `+20 Health` - StatusEffect
- `+10 Mana` (unconditional - player must have mana to reach level 2) - StatusEffect
- `+0.5 Spirituality` - AttributeEffect
- `+1 Yin` (if yinYangUnlocked) - ConditionalEffect + YinYangEffect

**Level 3: Finding True Inner Peace**
- `+300 Stamina` - StatusEffect
- `+30 Health` - StatusEffect
- `+20 Mana` - StatusEffect
- `+1 Spirituality` - AttributeEffect
- If yin > yang: `+1 Yang`, else: `+1 Yin` (if yinYangUnlocked) - ConditionalEffect + CompareValues + YinYangEffect

### Effect Types Required

1. **StatusEffect** - modify health/stamina/mana current values
2. **AttributeEffect** - increase spirituality (fixed values, no formulas needed for Resting)
3. **YinYangEffect** - modify yin or yang (with 'balance' mode for level 3)
4. **ConditionalEffect** - wrap effects with HasFlag or CompareValues conditions

### Condition Types Required

1. **HasFlag** - check manaUnlocked, yinYangUnlocked flags
2. **CompareValues** - compare yin > yang for level 3 balance logic (Phase 2 update needed)

## Type System Updates (Phase 2 Adjustments)

Per 03-CONTEXT.md decisions, Phase 2 types need renaming before Phase 3 implementation.

### Discriminator Rename: type -> kind

```typescript
// BEFORE (Phase 2)
interface StatusEffect {
  readonly type: 'status';
  // ...
}

// AFTER (Phase 3)
interface StatusEffect {
  readonly kind: 'status';
  // ...
}
```

**Rationale:** Avoids confusion with TypeScript's `type` keyword and JavaScript's `typeof`. Pattern used by many libraries.

### Field Standardization: value/change -> amount

```typescript
// BEFORE
interface AttributeEffect {
  readonly value: number | Formula;
}
interface StatusEffect {
  readonly change: number | Formula;
}

// AFTER
interface AttributeEffect {
  readonly amount: number | Formula;
}
interface StatusEffect {
  readonly amount: number | Formula;
}
```

**Rationale:** Consistent naming across all effect types that modify a quantity.

### Condition Naming: Suffix removal

```typescript
// BEFORE
interface FlagCondition { readonly type: 'flag'; ... }
interface AttributeCondition { readonly type: 'attribute'; ... }

// AFTER
interface HasFlag { readonly kind: 'HasFlag'; ... }
interface CompareAttribute { readonly kind: 'CompareAttribute'; ... }
```

**Rationale:** Clearer intent, more descriptive names. Has/Is prefix indicates boolean check.

### New Condition: CompareValues

For level 3 yin/yang balance logic:

```typescript
interface CompareValues {
  readonly kind: 'CompareValues';
  readonly left: 'yin' | 'yang' | GameProperty;
  readonly operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  readonly right: 'yin' | 'yang' | GameProperty | number;
}
```

**Confidence:** HIGH - Required for Resting level 3 logic. Pattern matches existing AttributeCondition.

## DeclarativeActivity Type

### Type Definition

```typescript
// Discriminated union for Activity migration
interface DeclarativeActivity {
  readonly activityType: ActivityType;
  readonly name: string[];
  readonly description: string[];
  readonly imageBaseName?: string;
  readonly duration: number;
  readonly requirements: CharacterAttribute[];
  readonly resourceUse?: ActivityResource[];
  readonly skipApprenticeshipLevel: number;

  // New declarative effects - object with level keys
  readonly effects: { [level: number]: Effect[] };

  // Never both - TypeScript trick
  readonly consequence?: never;
  readonly consequenceDescription?: never;
  readonly effectsLegacy?: never;

  // Runtime state (not readonly)
  level: number;
  unlocked: boolean;
  discovered?: boolean;
  lastIncome?: number;
  projectionOnly?: boolean;
  portal?: boolean;
}

interface LegacyActivity {
  readonly activityType: ActivityType;
  readonly name: string[];
  readonly description: string[];
  readonly consequenceDescription: string[];
  readonly effectsLegacy?: string[]; // renamed from effects
  readonly consequence: (() => void)[];
  // ... rest of fields

  // Never - TypeScript trick
  readonly effects?: never;
}

type Activity = DeclarativeActivity | LegacyActivity;
```

### Type Narrowing

```typescript
function isDeclarativeActivity(activity: Activity): activity is DeclarativeActivity {
  return 'effects' in activity && activity.effects !== undefined;
}

// Or inline check
if (activity.effects) {
  // TypeScript knows this is DeclarativeActivity
}
```

**Confidence:** HIGH - Standard TypeScript discriminated union pattern.

## Formula Builders Implementation

### Implementation Pattern

```typescript
// Object literals, not classes
function attr(attribute: AttributeType): Formula {
  return {
    evaluate(context: FormulaContext): number {
      return context.attributes[attribute];
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      const value = this.evaluate(context);
      switch (format) {
        case 'value':
          return String(Math.floor(value));
        case 'formula':
          return ABBREVIATIONS.attributes[attribute];
        case 'both':
          return `${Math.floor(value)} (${ABBREVIATIONS.attributes[attribute]})`;
      }
    }
  };
}
```

### Abbreviation Mapping

```typescript
const ABBREVIATIONS = {
  attributes: {
    strength: 'Str',
    toughness: 'Tou',
    speed: 'Spd',
    intelligence: 'Int',
    charisma: 'Cha',
    spirituality: 'Spi',
    earthLore: 'Earth',
    metalLore: 'Metal',
    woodLore: 'Wood',
    waterLore: 'Water',
    fireLore: 'Fire',
    animalHandling: 'Animals',
    combatMastery: 'Combat',
    magicMastery: 'Magic',
  },
  status: {
    health: 'HP',
    stamina: 'Sta',
    mana: 'Mana',
    nourishment: 'Food',
  },
} as const;
```

**Note:** Per 03-CONTEXT.md, add `abbreviation` field to AttributeObject and CharacterStatus types for runtime lookup. Implementation should prefer type definitions over magic strings.

### Formulas Needed for Resting

Resting only uses fixed numeric values, no formula composition needed. The `fixed(n)` builder wraps numbers:

```typescript
function fixed(value: number): Formula {
  return {
    evaluate(_context: FormulaContext): number {
      return value;
    },
    render(_context: FormulaContext, format: FormulaRenderFormat): string {
      return String(value);
    }
  };
}
```

**Confidence:** HIGH - Simple implementation. Phase 3 implements all 17 builders but Resting only exercises `fixed()`.

## Effect Handlers

### Handler Pattern

```typescript
// One file per handler, singleton pattern
// src/app/effects/handlers/status.handler.ts

const statusHandler: EffectHandler<StatusEffect> = {
  execute(effect: StatusEffect, context: EffectContext): void {
    const amount = evaluateValue(effect.amount, context);
    if (effect.modifyMax) {
      context.modifyStatusMax(effect.status, amount);
    } else {
      context.modifyStatus(effect.status, amount);
    }
  },

  render(effect: StatusEffect, context: EffectContext, format: RenderFormat): string {
    const amount = evaluateValue(effect.amount, context);
    const sign = amount >= 0 ? '+' : '';
    const abbrev = getStatusAbbreviation(effect.status);

    switch (format) {
      case 'short':
        return `${sign}${amount} ${abbrev}`;
      case 'long':
        const verb = amount >= 0 ? 'Restores' : 'Uses';
        const fullName = getStatusFullName(effect.status);
        return `${verb} ${Math.abs(amount)} ${fullName}.`;
      case 'formula':
        return renderFormula(effect.amount, context);
    }
  }
};

export { statusHandler };
```

### Helper for Value Evaluation

```typescript
function evaluateValue(value: number | Formula, context: FormulaContext): number {
  if (typeof value === 'number') {
    return value;
  }
  return value.evaluate(context);
}

function renderFormula(value: number | Formula, context: FormulaContext): string {
  if (typeof value === 'number') {
    return String(value);
  }
  return value.render(context, 'formula');
}
```

### Handlers for Resting

**StatusHandler** (status.handler.ts)
- Handles StatusEffect
- Modifies status.value or status.max

**AttributeHandler** (attribute.handler.ts)
- Handles AttributeEffect
- Uses context.increaseAttribute() for aptitude-multiplied gains

**YinYangHandler** (yinyang.handler.ts)
- Handles YinYangEffect
- modify: 'yin' | 'yang' | 'balance'
- 'balance' mode: increase whichever is lower

**ConditionalHandler** (conditional.handler.ts)
- Handles ConditionalEffect
- Evaluates condition, then executes 'then' or 'else' effects
- Uses ConditionEvaluator

### Stub Handlers (Phase 3)

All 14 handlers stubbed with `throw new Error('Not implemented')`:
- money.handler.ts
- item-add.handler.ts
- item-consume.handler.ts
- item-generate.handler.ts
- chance.handler.ts
- progress.handler.ts
- spawn-enemy.handler.ts
- spawn-follower.handler.ts
- trigger-battle.handler.ts
- lifespan.handler.ts

**Confidence:** HIGH - Following established pattern from 02-02-PLAN.md.

## Condition Evaluator

### Implementation

```typescript
// src/app/effects/conditions/condition-evaluator.ts

export function evaluateCondition(condition: Condition, context: EffectContext): boolean {
  switch (condition.kind) {
    case 'HasFlag':
      return evaluateHasFlag(condition, context);
    case 'CompareValues':
      return evaluateCompareValues(condition, context);
    case 'CompareAttribute':
      return evaluateCompareAttribute(condition, context);
    case 'CompareStatus':
      return evaluateCompareStatus(condition, context);
    case 'HasFurniture':
      return evaluateHasFurniture(condition, context);
    case 'HasInventory':
      return evaluateHasInventory(condition, context);
    case 'And':
      return condition.conditions.every(c => evaluateCondition(c, context));
    case 'Or':
      return condition.conditions.some(c => evaluateCondition(c, context));
    case 'Not':
      return !evaluateCondition(condition.condition, context);
    default:
      assertNever(condition);
  }
}

function evaluateHasFlag(condition: HasFlag, context: EffectContext): boolean {
  const flagValue = context[condition.flag]; // manaUnlocked, yinYangUnlocked, etc.
  return condition.negate ? !flagValue : flagValue;
}

function evaluateCompareValues(condition: CompareValues, context: EffectContext): boolean {
  const leftVal = getPropertyValue(condition.left, context);
  const rightVal = typeof condition.right === 'number'
    ? condition.right
    : getPropertyValue(condition.right, context);

  return compareValues(leftVal, condition.operator, rightVal);
}
```

### Conditions for Resting

**Level 0-2:** `HasFlag` with `yinYangUnlocked`
**Level 1:** Additional `HasFlag` with `manaUnlocked`
**Level 3:** `CompareValues` with `yin > yang`

**Confidence:** HIGH - Standard pattern, straightforward implementation.

## Effect Executor Service

### Service Design

```typescript
// src/app/effects/executor/effect-executor.service.ts

@Injectable({
  providedIn: 'root'
})
export class EffectExecutorService {
  private readonly characterService = inject(CharacterService);
  private readonly inventoryService = inject(InventoryService);
  // ... inject all required services

  private readonly handlers: HandlerRegistry = {
    status: statusHandler,
    attribute: attributeHandler,
    yinyang: yinyangHandler,
    conditional: conditionalHandler,
    // ... all 14 handlers
  };

  executeActivity(activity: DeclarativeActivity): void {
    const context = this.createContext();
    const effects = activity.effects[activity.level] ?? [];

    for (const effect of effects) {
      this.executeEffect(effect, context);
    }

    // After all effects, check overage
    this.characterService.characterState.checkOverage();
  }

  private executeEffect(effect: Effect, context: EffectContext): void {
    try {
      const handler = this.handlers[effect.kind];
      handler.execute(effect, context);
    } catch (error) {
      console.error(`Effect execution error for ${effect.kind}:`, error);
      // Continue with next effect - non-blocking per 03-CONTEXT.md
    }
  }

  private createContext(): EffectContext {
    return new GameContext(
      this.characterService,
      this.inventoryService,
      // ... all services
    );
  }
}
```

### GameContext Class

```typescript
// src/app/effects/context/game-context.ts

export class GameContext implements EffectContext {
  private _variables: Record<string, number> = {};

  constructor(
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    // ... services
  ) {}

  // Read-only state access
  get attributes(): Readonly<Record<AttributeType, AttributeValue>> {
    const result: Partial<Record<AttributeType, AttributeValue>> = {};
    const state = this.characterService.characterState;
    for (const key of Object.keys(state.attributes) as AttributeType[]) {
      result[key] = {
        value: state.attributes[key].value,
        aptitude: state.attributes[key].aptitude,
        aptitudeMult: state.attributes[key].aptitudeMult,
      };
    }
    return result as Record<AttributeType, AttributeValue>;
  }

  get manaUnlocked(): boolean {
    return this.characterService.characterState.manaUnlocked;
  }

  get yinYangUnlocked(): boolean {
    return this.characterService.characterState.yinYangUnlocked;
  }

  get yin(): number {
    return this.characterService.characterState.yin;
  }

  get yang(): number {
    return this.characterService.characterState.yang;
  }

  get variables(): Record<string, number> {
    return { ...this._variables };
  }

  // Mutation methods
  increaseAttribute(attribute: AttributeType, amount: number): number {
    return this.characterService.characterState.increaseAttribute(attribute, amount);
  }

  modifyStatus(status: StatusType, change: number): void {
    this.characterService.characterState.status[status].value += change;
  }

  modifyYinYang(which: 'yin' | 'yang', amount: number): void {
    this.characterService.characterState[which] += amount;
  }

  setVariable(name: string, value: number): void {
    this._variables[name] = value;
  }

  // ... rest of interface methods
}
```

**Confidence:** HIGH - Standard Angular service pattern with inject().

## Effect Render Service

### Service Design

```typescript
// src/app/effects/renderer/effect-renderer.service.ts

@Injectable({
  providedIn: 'root'
})
export class EffectRendererService {
  private readonly characterService = inject(CharacterService);

  private readonly handlers: HandlerRegistry = {
    status: statusHandler,
    attribute: attributeHandler,
    // ... same handlers as executor
  };

  /**
   * Render effects for a specific activity level.
   */
  renderActivityEffects(
    activity: DeclarativeActivity,
    format: RenderFormat
  ): string {
    const context = this.createRenderContext();
    const effects = activity.effects[activity.level] ?? [];

    const rendered = effects
      .map(effect => this.renderEffect(effect, context, format))
      .filter(text => text.length > 0);

    return format === 'long'
      ? rendered.join(' ')
      : rendered.join(', ');
  }

  /**
   * Render a single effect.
   */
  renderEffect(effect: Effect, context: EffectContext, format: RenderFormat): string {
    const handler = this.handlers[effect.kind];
    return handler.render(effect, context, format);
  }

  private createRenderContext(): EffectContext {
    return new GameContext(
      this.characterService,
      // ... services for read-only access
    );
  }
}
```

### Rendering Rules (from 03-CONTEXT.md)

1. **Short format:** `+25 Sta` - sign, value, abbreviated target
2. **Long format:** `Restores 50 Stamina.` - full sentences
3. **Formula format:** `Water Lore x 5 = 5 x 5 = 25` - formula, substitution, result
4. **Conditional hints:** `+1 Mana (if unlocked)` for conditional effects
5. **Hide zero-value effects**
6. **Sort by effect type** (no explicit sectioning)
7. **Red/green coloring** for costs vs gains (CSS, not in render service)

**Confidence:** HIGH - Follows established pattern, decisions documented in context.

## Angular Integration

### Thin Pipes Pattern

```typescript
// src/app/effects/pipes/effect-short.pipe.ts

@Pipe({
  name: 'effectShort',
  standalone: true,
  pure: false, // Activity level can change
})
export class EffectShortPipe implements PipeTransform {
  private readonly renderer = inject(EffectRendererService);

  transform(activity: Activity): string {
    if (!isDeclarativeActivity(activity)) {
      // Fallback for legacy activities
      return activity.effectsLegacy?.[activity.level] ?? '';
    }
    return this.renderer.renderActivityEffects(activity, 'short');
  }
}
```

```typescript
// src/app/effects/pipes/effect-long.pipe.ts

@Pipe({
  name: 'effectLong',
  standalone: true,
  pure: false,
})
export class EffectLongPipe implements PipeTransform {
  private readonly renderer = inject(EffectRendererService);

  transform(activity: Activity): string {
    if (!isDeclarativeActivity(activity)) {
      return activity.consequenceDescription?.[activity.level] ?? '';
    }
    return this.renderer.renderActivityEffects(activity, 'long');
  }
}
```

### Computed Signals (for Angular 18)

```typescript
// In components that need reactive effect text

@Component({
  // ...
})
export class ActivityCardComponent {
  private readonly renderer = inject(EffectRendererService);

  // Input signal
  activity = input.required<Activity>();

  // Computed signal for effect text
  effectText = computed(() => {
    const act = this.activity();
    if (!isDeclarativeActivity(act)) {
      return act.effectsLegacy?.[act.level] ?? '';
    }
    return this.renderer.renderActivityEffects(act, 'short');
  });
}
```

**Note:** The current codebase doesn't use signals yet. Pipes work immediately. Signals are optional enhancement for reactive scenarios.

### Template Usage

```html
<!-- Using pipe -->
<div class="activityEffects">{{ activity | effectShort }}</div>

<!-- Or using computed signal -->
<div class="activityEffects">{{ effectText() }}</div>
```

**Confidence:** HIGH - Standard Angular patterns, verified in Angular documentation.

## ActivityService Integration

### Helper Method

```typescript
// In ActivityService

private effectExecutor = inject(EffectExecutorService);

/**
 * Execute activity effects using either declarative or legacy path.
 */
executeActivity(activity: Activity): void {
  if (activity.effects) {
    // Declarative path
    this.effectExecutor.executeActivity(activity as DeclarativeActivity);
  } else {
    // Legacy path
    activity.consequence[activity.level]();
    this.characterService.characterState.checkOverage();
  }
}
```

### Call Site Updates

Three places call `activity.consequence[activity.level]()`:

1. **Line ~253:** Immediate activity execution (during spirit projection pause)
2. **Line ~307:** Main activity loop execution
3. **Line ~? (if applicable):** Any other direct calls

Replace all with:
```typescript
this.executeActivity(activity);
```

**Confidence:** HIGH - Simple refactor, maintains backward compatibility.

## Testing Strategy

### Unit Tests with Mock Context

```typescript
// status.handler.spec.ts

describe('StatusHandler', () => {
  let mockContext: jest.Mocked<EffectContext>;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  it('should add stamina', () => {
    const effect: StatusEffect = {
      kind: 'status',
      status: 'stamina',
      amount: 50,
    };

    statusHandler.execute(effect, mockContext);

    expect(mockContext.modifyStatus).toHaveBeenCalledWith('stamina', 50);
  });

  it('should render short format', () => {
    const effect: StatusEffect = {
      kind: 'status',
      status: 'stamina',
      amount: 50,
    };

    const result = statusHandler.render(effect, mockContext, 'short');

    expect(result).toBe('+50 Sta');
  });
});
```

### Integration Tests

```typescript
// effect-executor.service.spec.ts

describe('EffectExecutorService integration', () => {
  let service: EffectExecutorService;
  let characterService: CharacterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EffectExecutorService, CharacterService, /* ... */],
    });
    service = TestBed.inject(EffectExecutorService);
    characterService = TestBed.inject(CharacterService);
  });

  it('should execute Resting level 0 effects', () => {
    const restingActivity = createDeclarativeRestingActivity();
    restingActivity.level = 0;

    const initialStamina = characterService.characterState.status.stamina.value;
    const initialHealth = characterService.characterState.status.health.value;

    service.executeActivity(restingActivity);

    expect(characterService.characterState.status.stamina.value)
      .toBe(initialStamina + 50);
    expect(characterService.characterState.status.health.value)
      .toBe(initialHealth + 2);
  });
});
```

**Confidence:** HIGH - Standard testing patterns.

## Error Handling

Per 03-CONTEXT.md:

1. **Formula errors (div/0, negative log):** throw error
2. **Compile-time guards when possible**
3. **Invalid conditions:** let it crash (TypeScript catches most at compile time)
4. **Effect execution:** continue + log on error (non-blocking)
5. **Negative status values:** let checkOverage() handle clamping

```typescript
private executeEffect(effect: Effect, context: EffectContext): void {
  try {
    const handler = this.handlers[effect.kind];
    handler.execute(effect, context);
  } catch (error) {
    console.error(`Effect execution error for ${effect.kind}:`, error);
    // Non-blocking - continue to next effect
  }
}
```

**Confidence:** HIGH - Explicit decision documented.

## File Structure After Phase 3

```
src/app/effects/
├── types/
│   ├── effect.types.ts      # 14 effect variants (kind instead of type)
│   ├── condition.types.ts   # 8 condition variants (updated names)
│   ├── formula.types.ts     # Formula interface
│   └── context.types.ts     # EffectContext interface
├── formulas/
│   └── formula.builders.ts  # 17 builder implementations
├── handlers/
│   ├── handler.interface.ts # EffectHandler, HandlerRegistry
│   ├── status.handler.ts    # StatusEffect handler
│   ├── attribute.handler.ts # AttributeEffect handler
│   ├── yinyang.handler.ts   # YinYangEffect handler
│   ├── conditional.handler.ts # ConditionalEffect handler
│   ├── money.handler.ts     # Stub
│   ├── item-add.handler.ts  # Stub
│   ├── item-consume.handler.ts # Stub
│   ├── item-generate.handler.ts # Stub
│   ├── chance.handler.ts    # Stub
│   ├── progress.handler.ts  # Stub
│   ├── spawn-enemy.handler.ts # Stub
│   ├── spawn-follower.handler.ts # Stub
│   ├── trigger-battle.handler.ts # Stub
│   └── lifespan.handler.ts  # Stub
├── conditions/
│   └── condition-evaluator.ts # evaluateCondition function
├── context/
│   └── game-context.ts      # GameContext implements EffectContext
├── executor/
│   └── effect-executor.service.ts # EffectExecutorService
├── renderer/
│   └── effect-renderer.service.ts # EffectRendererService
├── pipes/
│   ├── effect-short.pipe.ts
│   ├── effect-long.pipe.ts
│   └── effect-formula.pipe.ts
├── utils/
│   ├── exhaustive.ts        # assertNever helper
│   └── abbreviations.ts     # Attribute/status abbreviation constants
└── index.ts                 # Barrel export
```

## Declarative Resting Definition

```typescript
// What Resting will look like as DeclarativeActivity

const declarativeResting: DeclarativeActivity = {
  activityType: ActivityType.Resting,
  name: ['Resting', 'Meditation', 'Communing With Divinity', 'Finding True Inner Peace'],
  imageBaseName: 'resting',
  duration: 1,
  description: [
    'Take a break and get some sleep. Good sleeping habits are essential for cultivating immortal attributes.',
    'Enter a meditative state and begin your journey toward spritual enlightenment.',
    'Extend your senses beyond the mortal realm and connect to deeper realities.',
    'Turn your senses inward and find pure stillness within.',
  ],
  requirements: [
    {},
    { strength: 1000, speed: 1000, charisma: 1000, intelligence: 1000, toughness: 1000 },
    // ... level 2 and 3 requirements
  ],
  resourceUse: [{}, {}, {}, {}],
  skipApprenticeshipLevel: 0,
  level: 0,
  unlocked: true,

  effects: {
    0: [
      { kind: 'status', status: 'stamina', amount: 50 },
      { kind: 'status', status: 'health', amount: 2 },
      {
        kind: 'conditional',
        condition: { kind: 'HasFlag', flag: 'yinYangUnlocked' },
        then: [{ kind: 'yinyang', modify: 'yin', amount: 1 }],
      },
    ],
    1: [
      { kind: 'status', status: 'stamina', amount: 100 },
      { kind: 'status', status: 'health', amount: 10 },
      { kind: 'attribute', attribute: 'spirituality', amount: 0.001 },
      {
        kind: 'conditional',
        condition: { kind: 'HasFlag', flag: 'manaUnlocked' },
        then: [{ kind: 'status', status: 'mana', amount: 1 }],
      },
      {
        kind: 'conditional',
        condition: { kind: 'HasFlag', flag: 'yinYangUnlocked' },
        then: [{ kind: 'yinyang', modify: 'yin', amount: 1 }],
      },
    ],
    2: [
      { kind: 'status', status: 'stamina', amount: 200 },
      { kind: 'status', status: 'health', amount: 20 },
      { kind: 'status', status: 'mana', amount: 10 },
      { kind: 'attribute', attribute: 'spirituality', amount: 0.5 },
      {
        kind: 'conditional',
        condition: { kind: 'HasFlag', flag: 'yinYangUnlocked' },
        then: [{ kind: 'yinyang', modify: 'yin', amount: 1 }],
      },
    ],
    3: [
      { kind: 'status', status: 'stamina', amount: 300 },
      { kind: 'status', status: 'health', amount: 30 },
      { kind: 'status', status: 'mana', amount: 20 },
      { kind: 'attribute', attribute: 'spirituality', amount: 1 },
      {
        kind: 'conditional',
        condition: { kind: 'HasFlag', flag: 'yinYangUnlocked' },
        then: [
          {
            kind: 'conditional',
            condition: { kind: 'CompareValues', left: 'yin', operator: '>', right: 'yang' },
            then: [{ kind: 'yinyang', modify: 'yang', amount: 1 }],
            else: [{ kind: 'yinyang', modify: 'yin', amount: 1 }],
          },
        ],
      },
    ],
  },
};
```

## Dependencies Map

```
Phase 2 files (exist):
├── types/*.ts (read-only, need minor updates for kind/amount rename)
├── formulas/formula.builders.ts (stubs, needs implementation)
├── handlers/handler.interface.ts (complete)
└── utils/exhaustive.ts (complete)

Phase 3 new files:
├── handlers/*.handler.ts (14 files, 4 implemented, 10 stubbed)
├── conditions/condition-evaluator.ts (new)
├── context/game-context.ts (new)
├── executor/effect-executor.service.ts (new)
├── renderer/effect-renderer.service.ts (new)
└── pipes/*.pipe.ts (3 files, new)

Modified existing files:
├── src/app/game-state/activity.ts (Activity type update)
├── src/app/game-state/activity.service.ts (executeActivity helper, Resting definition)
└── src/app/activity-panel/activity-panel.component.ts (optional: use pipes)
```

## Roadmap Implications

### Suggested Task Structure

1. **03-01: Type System Updates** (wave 1)
   - Rename type -> kind in effect.types.ts
   - Rename value/change -> amount
   - Add CompareValues condition
   - Update condition naming (HasFlag, etc.)

2. **03-02: Formula Builder Implementations** (wave 1)
   - Implement all 17 formula builders
   - Add abbreviation constants

3. **03-03: Condition Evaluator** (wave 1)
   - evaluateCondition function
   - All 9 condition handlers

4. **03-04: Effect Handlers** (wave 2, depends on 03-02, 03-03)
   - StatusHandler, AttributeHandler, YinYangHandler, ConditionalHandler
   - Stub remaining 10 handlers

5. **03-05: GameContext + Executor** (wave 3, depends on 03-04)
   - GameContext class
   - EffectExecutorService

6. **03-06: Renderer + Pipes** (wave 3, depends on 03-04)
   - EffectRendererService
   - Three thin pipes

7. **03-07: Activity Integration** (wave 4, depends on 03-05, 03-06)
   - DeclarativeActivity type
   - Resting definition update
   - ActivityService.executeActivity()

8. **03-08: Testing + Validation** (wave 5)
   - Unit tests for handlers
   - Integration tests for executor
   - Verify Resting produces identical game state

### Research Flags for Future Phases

- **Phase 4 (Validation Slice):** Standard patterns established, unlikely to need deep research
- **Phase 5 (Full Migration):** May need research on batch migration patterns, risk mitigation
- **Phase 6 (Multi-day Logic):** Needs research on progress tracking, interruption handling

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Type system updates | HIGH | Documented decisions, standard TypeScript patterns |
| Formula builders | HIGH | Simple implementation, stubs exist |
| Effect handlers | HIGH | Handler pattern established in Phase 2 |
| Condition evaluator | HIGH | Standard switch exhaustive pattern |
| Executor service | HIGH | Standard Angular service pattern |
| Render service | HIGH | Mirrors executor, documented format rules |
| Angular pipes | HIGH | Standard standalone pipe pattern |
| Activity integration | HIGH | Property check for type narrowing |

## Sources

- [Angular Signals Guide](https://angular.dev/guide/signals) - Signal and computed() documentation
- [Angular computed() API](https://angular.dev/api/core/computed) - Computed signal syntax
- [Angular Pipes Guide](https://angular.dev/guide/templates/pipes) - Standalone pipe patterns
- Angular 18 documentation for inject() pattern
- Project codebase analysis: activity.service.ts, character.ts, effects module

---

*Phase: 03-first-vertical-slice*
*Research completed: 2026-01-31*
