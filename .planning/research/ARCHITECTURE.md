# Architecture: Declarative Effect System

**Domain:** Effect system for Angular 18 idle game
**Researched:** 2026-01-31
**Confidence:** HIGH (based on codebase analysis and Angular patterns)

## Recommended Architecture

The declarative effect system follows a three-layer architecture:

```
+-------------------+     +-------------------+     +-------------------+
|   DEFINITIONS     |     |    EXECUTION      |     |    RENDERING      |
|   (Pure Data)     | --> |    (Services)     | --> |    (Display)      |
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
| Effect union type |     | EffectExecutor    |     | EffectRender      |
| Formula builders  |     | HandlerRegistry   |     | Service + Pipes   |
| Activity defs     |     | EffectContext     |     |                   |
+-------------------+     +-------------------+     +-------------------+
```

**Data flows left to right:**
1. Activities define effects as structured data (definitions)
2. Executor reads definitions, dispatches to handlers (execution)
3. Render service reads same definitions for display (rendering)

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Effect Types (`effect.types.ts`) | Union type definitions, type guards | All components (imported everywhere) |
| Formula Builders (`formula.ts`) | Create executable/renderable formulas | Effect types, handlers |
| Handler Registry (`handler-registry.ts`) | Map effect types to handlers | Executor, handlers |
| Effect Handlers (`handlers/*.ts`) | Execute + render single effect type | Context, game services |
| Effect Executor Service | Orchestrate effect execution | Registry, context, activity service |
| Effect Render Service | Generate display strings | Registry, templates |
| Effect Pipes (`effect.pipes.ts`) | Template-friendly wrappers | Render service only |
| Effect Context | Provide service access to handlers | All game services |

### Boundary Rules

1. **Handlers are plain classes** (not Angular services) - instantiated by registry
2. **Pipes are thin wrappers** - all logic lives in EffectRenderService
3. **Context is the only bridge** to game services - handlers never inject directly
4. **Types are standalone** - no service dependencies, pure TypeScript

## Data Flow

### Execution Flow (tick happens)

```
ActivityService.tick()
    |
    v
activity.effectDefinitions[level]   // Get effect array
    |
    v
EffectExecutor.execute(effects, context)
    |
    +---> For each effect:
          |
          v
    HandlerRegistry.getHandler(effect.type)
          |
          v
    handler.execute(effect, context)
          |
          v
    Context provides services (characterService, inventoryService, etc.)
```

### Render Flow (display needed)

```
Template: {{ activity.effects | effectShort }}
    |
    v
EffectShortPipe.transform(effects)
    |
    v
EffectRenderService.renderShort(effects)
    |
    +---> For each effect:
          |
          v
    HandlerRegistry.getHandler(effect.type)
          |
          v
    handler.render(effect, format: 'short')
          |
          v
    Return: "+1 Str, +1 Spd, +Money (log2 Cha)"
```

## File Organization

**Recommended structure** (new `effects/` directory alongside existing `game-state/`):

```
src/app/
  effects/                          # NEW DIRECTORY
    types/
      effect.types.ts               # Union type: Effect = AttrEffect | ItemEffect | ...
      formula.types.ts              # Formula type and builder result types

    formulas/
      formula.ts                    # Formula builders: add(), mult(), log2(), attr()
      formula-evaluator.ts          # Execute formulas to get numeric result
      formula-renderer.ts           # Render formulas to display strings

    handlers/
      handler.interface.ts          # EffectHandler interface
      handler-registry.ts           # Registry class
      attribute.handler.ts          # Handles AttributeEffect
      status.handler.ts             # Handles StatusEffect
      money.handler.ts              # Handles MoneyEffect
      item.handler.ts               # Handles ItemEffect (add, consume, generate)
      spawn.handler.ts              # Handles SpawnEffect (enemies, followers)
      progress.handler.ts           # Handles ProgressEffect (task counters)
      conditional.handler.ts        # Handles ConditionalEffect (wraps other effects)
      composite.handler.ts          # Handles CompositeEffect (array of effects)

    services/
      effect-executor.service.ts    # Executes effect arrays
      effect-render.service.ts      # Renders effect arrays
      effect-context.ts             # Context object with service references

    pipes/
      effect.pipes.ts               # effectShort, effectLong, effectFormula pipes

    index.ts                        # Public API exports

  game-state/
    activity.ts                     # MODIFY: Add effectDefinitions field
    activity.service.ts             # MODIFY: Call executor instead of consequence
    ... (existing files unchanged)
```

### Why This Structure

1. **Isolated module**: Effects system is self-contained, not scattered across game-state
2. **Clear imports**: `import { Effect, AttributeEffect } from '../effects'`
3. **Parallel to existing**: Follows game-state/ pattern of grouped functionality
4. **Testable in isolation**: effects/ has no implicit dependencies on game-state/

## Patterns to Follow

### Pattern 1: Discriminated Union Types

**What:** Use TypeScript discriminated unions for effect types with exhaustive switch handling.

**When:** Always for the Effect type system.

**Example:**
```typescript
// effect.types.ts
interface BaseEffect {
  type: string;
}

interface AttributeEffect extends BaseEffect {
  type: 'attribute';
  attribute: AttributeType;
  amount: number | Formula;
}

interface MoneyEffect extends BaseEffect {
  type: 'money';
  amount: number | Formula;
}

interface ItemEffect extends BaseEffect {
  type: 'item';
  action: 'add' | 'consume' | 'generate';
  itemId?: string;
  quantity?: number | Formula;
  generator?: ItemGenerator;
}

interface ConditionalEffect extends BaseEffect {
  type: 'conditional';
  condition: Condition;
  then: Effect[];
  else?: Effect[];
}

// Union type
type Effect =
  | AttributeEffect
  | MoneyEffect
  | ItemEffect
  | ConditionalEffect
  | /* ... more types */;

// Type guard
function isAttributeEffect(e: Effect): e is AttributeEffect {
  return e.type === 'attribute';
}
```

**Why:** Compiler enforces exhaustive handling. Adding new effect type causes errors where handling is missing.

### Pattern 2: Handler Registry

**What:** Map effect types to handler classes. Handlers are plain classes with execute() and render() methods.

**When:** For all effect execution and rendering.

**Example:**
```typescript
// handler.interface.ts
interface EffectHandler<T extends Effect = Effect> {
  readonly effectType: string;
  execute(effect: T, context: EffectContext): void;
  render(effect: T, format: RenderFormat): string;
}

// handler-registry.ts
class HandlerRegistry {
  private handlers = new Map<string, EffectHandler>();

  register(handler: EffectHandler): void {
    this.handlers.set(handler.effectType, handler);
  }

  getHandler(type: string): EffectHandler {
    const handler = this.handlers.get(type);
    if (!handler) throw new Error(`No handler for effect type: ${type}`);
    return handler;
  }
}

// Usage during bootstrap
const registry = new HandlerRegistry();
registry.register(new AttributeHandler());
registry.register(new MoneyHandler());
registry.register(new ItemHandler());
// ... etc
```

**Why:** Adding new effect type = create handler class + register it. Never modify executor or existing handlers.

### Pattern 3: Context Object for Service Access

**What:** Pass a context object containing all game services to handlers instead of injecting services.

**When:** Always when handlers need game state access.

**Example:**
```typescript
// effect-context.ts
interface EffectContext {
  character: CharacterService;
  inventory: InventoryService;
  battle: BattleService;
  home: HomeService;
  followers: FollowersService;
  items: ItemRepoService;
  log: LogService;
  impossibleTask: ImpossibleTaskService;
  // Add more as needed
}

// effect-executor.service.ts
@Injectable({ providedIn: 'root' })
class EffectExecutorService {
  private context: EffectContext;

  constructor(
    private registry: HandlerRegistry,
    characterService: CharacterService,
    inventoryService: InventoryService,
    // ... inject all services
  ) {
    this.context = {
      character: characterService,
      inventory: inventoryService,
      // ... build context
    };
  }

  execute(effects: Effect[]): void {
    for (const effect of effects) {
      const handler = this.registry.getHandler(effect.type);
      handler.execute(effect, this.context);
    }
  }
}
```

**Why:**
- Handlers are plain classes, not Angular services (easier to test)
- Single injection point for all services
- Mock entire context in tests

### Pattern 4: Formula Builders (Execute AND Render)

**What:** Functions that build formula objects which can both compute values and generate display strings.

**When:** For any computed value (money income, attribute gains, etc.).

**Example:**
```typescript
// formula.types.ts
interface Formula {
  evaluate(context: EffectContext): number;
  render(context: EffectContext): string;
}

// formula.ts - Builder functions
function attr(attribute: AttributeType): Formula {
  return {
    evaluate: (ctx) => ctx.character.characterState.attributes[attribute].value,
    render: (ctx) => formatAttributeName(attribute)  // "Cha", "Str", etc.
  };
}

function log2(inner: Formula | number): Formula {
  const innerFormula = typeof inner === 'number' ? constant(inner) : inner;
  return {
    evaluate: (ctx) => Math.log2(innerFormula.evaluate(ctx)),
    render: (ctx) => `log2(${innerFormula.render(ctx)})`
  };
}

function add(...terms: (Formula | number)[]): Formula {
  const formulas = terms.map(t => typeof t === 'number' ? constant(t) : t);
  return {
    evaluate: (ctx) => formulas.reduce((sum, f) => sum + f.evaluate(ctx), 0),
    render: (ctx) => formulas.map(f => f.render(ctx)).join(' + ')
  };
}

// Usage in activity definition
const beggingMoney: MoneyEffect = {
  type: 'money',
  amount: add(3, log2(attr('charisma')))
};

// Execution: evaluates to 127 (if charisma is ~1e38)
// Rendering: "3 + log2(Cha)" or "127 Taels" depending on format
```

**Why:** Single definition serves both execution and display. No drift possible.

### Pattern 5: Thin Pipes

**What:** Pipes that only delegate to EffectRenderService.

**When:** For all effect display in templates.

**Example:**
```typescript
// effect.pipes.ts
@Pipe({ name: 'effectShort' })
export class EffectShortPipe implements PipeTransform {
  constructor(private renderService: EffectRenderService) {}

  transform(effects: Effect[]): string {
    return this.renderService.render(effects, 'short');
  }
}

@Pipe({ name: 'effectLong' })
export class EffectLongPipe implements PipeTransform {
  constructor(private renderService: EffectRenderService) {}

  transform(effects: Effect[]): string {
    return this.renderService.render(effects, 'long');
  }
}

// Template usage
<span class="effects">{{ activity.effectDefinitions[level] | effectShort }}</span>
```

**Why:**
- Logic stays in service (testable, injectable)
- Pipes stay thin (just format selection)
- Multiple formats from same data

## Anti-Patterns to Avoid

### Anti-Pattern 1: Handlers as Angular Services

**What:** Making each handler an `@Injectable()` service.

**Why bad:**
- Bloats provider list (20+ handlers = 20+ services)
- Circular dependency risk with game services
- Makes registry awkward (inject all handlers into registry?)

**Instead:** Handlers are plain classes. Registry instantiates them. Context provides services.

### Anti-Pattern 2: Logic in Pipes

**What:** Putting rendering logic directly in pipe transform() methods.

**Why bad:**
- Hard to test (pipes need full Angular testing infrastructure)
- Hard to share logic between pipes
- Violates single responsibility

**Instead:** Pipes delegate to EffectRenderService. Service is testable in isolation.

### Anti-Pattern 3: Escape Hatch for Custom Functions

**What:** Adding a `CustomEffect` type with arbitrary function.

**Why bad:**
- Defeats the purpose of declarative system
- Cannot render what you cannot inspect
- Creates two systems to maintain

**Instead:** Extend the type system. If something seems to need custom code, model it as a new effect type.

### Anti-Pattern 4: Handlers Accessing Services Directly

**What:** Having handlers import and access game services directly.

**Why bad:**
- Tight coupling to Angular DI
- Hard to test (need to mock Angular injector)
- Circular dependency risk

**Instead:** All service access through EffectContext. Context is injected into executor, passed to handlers.

### Anti-Pattern 5: Mixed Old and New Systems

**What:** Keeping consequence functions alongside declarative effects.

**Why bad:**
- Two systems to understand and maintain
- Effects might execute twice
- No clear migration path

**Instead:** Big bang migration. Convert all activities, remove old system entirely.

## Build Order Dependencies

**Phase ordering based on what depends on what:**

```
Phase 1: Types + Formulas (no dependencies)
    |
    v
Phase 2: Handlers + Registry (depends on types)
    |
    v
Phase 3: Context + Executor (depends on handlers, services)
    |
    v
Phase 4: Render Service + Pipes (depends on handlers)
    |
    v
Phase 5: Activity Migration (depends on all above)
    |
    v
Phase 6: Cleanup (remove old system)
```

### Detailed Build Order

| Order | Component | Depends On | Can Test |
|-------|-----------|------------|----------|
| 1 | `effect.types.ts` | Nothing | N/A (just types) |
| 2 | `formula.types.ts` | Nothing | N/A (just types) |
| 3 | `formula.ts` | formula.types | Yes, pure functions |
| 4 | `formula-evaluator.ts` | formula, types | Yes, with mock context |
| 5 | `formula-renderer.ts` | formula, types | Yes, pure functions |
| 6 | `handler.interface.ts` | effect.types | N/A (just interface) |
| 7 | Individual handlers | interface, formulas | Yes, with mock context |
| 8 | `handler-registry.ts` | handlers | Yes, unit test |
| 9 | `effect-context.ts` | Game services (types only) | N/A (interface) |
| 10 | `effect-executor.service.ts` | registry, context | Yes, integration |
| 11 | `effect-render.service.ts` | registry | Yes, unit test |
| 12 | `effect.pipes.ts` | render service | Yes, unit test |
| 13 | Activity definitions | All effect system | Yes, validation |
| 14 | ActivityService changes | definitions, executor | Yes, integration |
| 15 | Remove old system | Everything working | N/A |

### Critical Path

The longest dependency chain is:

`types -> formulas -> handlers -> registry -> executor/render -> migration`

Types and formulas can be built in parallel with each other. Handlers can be built incrementally (start with simple ones like AttributeHandler before complex ones like ConditionalHandler).

## Integration Points with Existing Code

### ActivityService Changes

```typescript
// Before (current)
interface Activity {
  consequence: (() => void)[];
  effects?: string[];  // display only
}

// After (declarative)
interface Activity {
  effectDefinitions: Effect[][];  // [level] -> effects
  // consequence removed
  // effects string removed
}

// Execution change
// Before:
activity.consequence[activity.level]();

// After:
this.effectExecutor.execute(activity.effectDefinitions[activity.level]);
```

### Statistics Integration

The lastIncome tracking and day counters should observe effect execution:

```typescript
// In EffectExecutorService
execute(effects: Effect[], activity: Activity): void {
  let totalMoney = 0;

  for (const effect of effects) {
    const handler = this.registry.getHandler(effect.type);
    const result = handler.execute(effect, this.context);

    // Accumulate for statistics
    if (effect.type === 'money') {
      totalMoney += result.value;
    }
  }

  // Update statistics
  activity.lastIncome = totalMoney;
  this.statisticsService.recordActivityExecution(activity.activityType);
}
```

## Scalability Considerations

| Concern | Current (~50 activities) | Future (200+ activities) | Recommendation |
|---------|--------------------------|--------------------------|----------------|
| Handler count | ~10-15 handlers | Same | Static, doesn't grow with activities |
| Type definitions | Small union | Same | Types are reused, not duplicated |
| Memory | Negligible | Negligible | Effect objects are small |
| Execution speed | Instant | Instant | Handler lookup is O(1) map access |
| Bundle size | +10-20KB | Same | Effect system is fixed size |

The architecture scales horizontally (more activities) without growing vertically (more code). Adding 100 more activities means 100 more activity definitions, not 100 more handlers.

## Testing Strategy

| Component | Test Type | What to Mock |
|-----------|-----------|--------------|
| Formula builders | Unit | Nothing (pure functions) |
| Formula evaluator | Unit | EffectContext |
| Individual handlers | Unit | EffectContext |
| Handler registry | Unit | Nothing |
| EffectExecutorService | Integration | Game services or full context |
| EffectRenderService | Unit | Nothing (uses registry) |
| Pipes | Unit | EffectRenderService |
| Activity definitions | Validation | Check all effects parse correctly |

### Mock Context Example

```typescript
function createMockContext(overrides: Partial<EffectContext> = {}): EffectContext {
  return {
    character: {
      characterState: {
        attributes: { strength: { value: 100 }, charisma: { value: 1000 } },
        status: { stamina: { value: 50 }, health: { value: 100 } },
        money: 500
      }
    } as CharacterService,
    inventory: { addItem: jest.fn() } as unknown as InventoryService,
    // ... minimal mocks for other services
    ...overrides
  };
}

// Handler test
describe('AttributeHandler', () => {
  it('increases attribute by fixed amount', () => {
    const handler = new AttributeHandler();
    const ctx = createMockContext();
    const effect: AttributeEffect = { type: 'attribute', attribute: 'strength', amount: 0.5 };

    handler.execute(effect, ctx);

    expect(ctx.character.characterState.attributes.strength.value).toBe(100.5);
  });
});
```

## Sources

- Existing codebase analysis: `activity.service.ts`, `activity.ts`
- Existing project decisions: `.planning/DECISIONS.md`
- Angular 18 service patterns: standard DI patterns
- TypeScript discriminated unions: TypeScript handbook (HIGH confidence)
- Handler registry pattern: established software pattern (HIGH confidence)
