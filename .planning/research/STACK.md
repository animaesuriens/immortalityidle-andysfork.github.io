# Technology Stack: Declarative Effect System

**Project:** Immortality Idle - Declarative Activity Effects
**Researched:** 2026-01-31
**Confidence:** HIGH (patterns verified against TypeScript/Angular documentation)

## Executive Summary

This document prescribes TypeScript and Angular patterns for building a declarative effect system. The core insight: **TypeScript's type system IS your effect framework**. No external libraries needed - discriminated unions, generics, and Angular's DI provide everything required.

---

## Core Patterns

### 1. Discriminated Union Types for Effects

**Confidence:** HIGH (TypeScript official documentation)

The foundation of the effect system. Each effect type is a tagged object in a union.

```typescript
// effect-types.ts

/** Base for all effects - the discriminant property */
type EffectKind =
  | 'attribute'
  | 'status'
  | 'money'
  | 'item'
  | 'spawn'
  | 'progress'
  | 'conditional'
  | 'sequence';

/** Attribute modification effect */
interface AttributeEffect {
  kind: 'attribute';
  attribute: AttributeType;
  target: 'value' | 'aptitude';
  amount: FormulaNode;  // Can be static or computed
}

/** Item-related effects */
interface ItemEffect {
  kind: 'item';
  action: 'give' | 'consume';
  itemId: string;
  quantity: FormulaNode;
  /** For crafted items, generate from grade */
  generated?: {
    type: 'weapon' | 'armor' | 'potion';
    gradeSource: 'consumed' | FormulaNode;
  };
}

/** Conditional wrapper - wraps other effects */
interface ConditionalEffect {
  kind: 'conditional';
  condition: ConditionNode;
  then: Effect[];
  else?: Effect[];
}

/** Probability wrapper */
interface ProbabilisticEffect {
  kind: 'probabilistic';
  chance: FormulaNode;  // 0-1
  effect: Effect;
}

/** Sequence of effects (for ordering) */
interface SequenceEffect {
  kind: 'sequence';
  effects: Effect[];
}

/** The union - compiler enforces handling all variants */
type Effect =
  | AttributeEffect
  | StatusEffect
  | MoneyEffect
  | ItemEffect
  | SpawnEffect
  | ProgressEffect
  | ConditionalEffect
  | ProbabilisticEffect
  | SequenceEffect;
```

**Why this pattern:**
- Compiler enforces exhaustive handling via `never` checks
- Adding new effect type causes compile errors where handling is missing
- Each variant carries exactly the data it needs (no optional fields)
- Pattern matching with switch/case or ts-pattern provides clean dispatch

**What NOT to do:**
```typescript
// BAD: Single interface with optional fields
interface Effect {
  type: string;  // No type safety
  attribute?: AttributeType;
  amount?: number;
  itemId?: string;
  // Every handler must check which fields exist
}

// BAD: Class hierarchy with instanceof checks
class Effect { }
class AttributeEffect extends Effect { }
// Runtime checks, no compile-time exhaustiveness
```

---

### 2. Handler Registry Pattern

**Confidence:** HIGH (standard pattern, verified with Angular DI docs)

Each effect type gets a dedicated handler. Handlers are plain classes (not Angular services) for testability.

```typescript
// effect-handler.ts

/** Context passed to all handlers - contains service references */
interface EffectContext {
  character: CharacterService;
  inventory: InventoryService;
  battle: BattleService;
  home: HomeService;
  items: ItemRepoService;
  log: LogService;
  random: () => number;  // Injectable for testing
}

/** Handler interface - every handler implements this */
interface EffectHandler<T extends Effect = Effect> {
  readonly kind: T['kind'];

  /** Execute the effect, mutating game state */
  execute(effect: T, ctx: EffectContext): void;

  /** Render for display - short format for cards */
  renderShort(effect: T, ctx: EffectContext): string;

  /** Render for display - long format for details */
  renderLong(effect: T, ctx: EffectContext): string;

  /** Render showing formula (for debugging/tooltips) */
  renderFormula(effect: T, ctx: EffectContext): string;
}

/** Registry holding all handlers */
class EffectHandlerRegistry {
  private handlers = new Map<Effect['kind'], EffectHandler>();

  register<T extends Effect>(handler: EffectHandler<T>): void {
    this.handlers.set(handler.kind, handler as EffectHandler);
  }

  get(kind: Effect['kind']): EffectHandler {
    const handler = this.handlers.get(kind);
    if (!handler) {
      throw new Error(`No handler registered for effect kind: ${kind}`);
    }
    return handler;
  }

  execute(effect: Effect, ctx: EffectContext): void {
    this.get(effect.kind).execute(effect, ctx);
  }

  renderShort(effect: Effect, ctx: EffectContext): string {
    return this.get(effect.kind).renderShort(effect, ctx);
  }
}
```

**Example handler implementation:**

```typescript
// attribute-effect-handler.ts

class AttributeEffectHandler implements EffectHandler<AttributeEffect> {
  readonly kind = 'attribute' as const;

  execute(effect: AttributeEffect, ctx: EffectContext): void {
    const amount = evaluateFormula(effect.amount, ctx);
    const attr = ctx.character.characterState.attributes[effect.attribute];

    if (effect.target === 'value') {
      attr.value += amount;
    } else {
      attr.aptitude += amount;
    }
  }

  renderShort(effect: AttributeEffect, ctx: EffectContext): string {
    const amount = evaluateFormula(effect.amount, ctx);
    const sign = amount >= 0 ? '+' : '';
    const attrName = formatAttributeName(effect.attribute);

    if (effect.target === 'aptitude') {
      return `${sign}${amount} ${attrName} Apt`;
    }
    return `${sign}${amount} ${attrName}`;
  }

  renderLong(effect: AttributeEffect, ctx: EffectContext): string {
    // More descriptive version
    const amount = evaluateFormula(effect.amount, ctx);
    return `Increase ${effect.attribute} by ${amount}`;
  }

  renderFormula(effect: AttributeEffect, ctx: EffectContext): string {
    const formula = renderFormulaNode(effect.amount);
    return `${effect.attribute} += ${formula}`;
  }
}
```

**Why this pattern:**
- Adding new effect type = add new handler file + register it
- Core executor never needs modification
- Handlers are plain classes - easy to unit test with mock context
- Single responsibility - each handler knows one thing

---

### 3. Formula Builder System

**Confidence:** HIGH (pattern derived from expression engine research, typed for TypeScript)

Formulas are data structures that can be both evaluated and rendered. This is the key to "single source of truth."

```typescript
// formula-types.ts

/** Literal number */
interface LiteralNode {
  type: 'literal';
  value: number;
}

/** Reference to character attribute */
interface AttributeRefNode {
  type: 'attributeRef';
  attribute: AttributeType;
  target: 'value' | 'aptitude' | 'max';
}

/** Reference to status */
interface StatusRefNode {
  type: 'statusRef';
  status: StatusType;
  target: 'value' | 'max';
}

/** Binary operation */
interface BinaryOpNode {
  type: 'binaryOp';
  op: '+' | '-' | '*' | '/';
  left: FormulaNode;
  right: FormulaNode;
}

/** Function call (log2, floor, min, max, etc.) */
interface FunctionNode {
  type: 'function';
  fn: 'log2' | 'floor' | 'ceil' | 'min' | 'max' | 'sqrt';
  args: FormulaNode[];
}

/** Conditional expression */
interface ConditionalFormulaNode {
  type: 'conditionalFormula';
  condition: ConditionNode;
  then: FormulaNode;
  else: FormulaNode;
}

type FormulaNode =
  | LiteralNode
  | AttributeRefNode
  | StatusRefNode
  | BinaryOpNode
  | FunctionNode
  | ConditionalFormulaNode;
```

**Builder functions (for ergonomic definition):**

```typescript
// formula-builders.ts

/** Create a literal number */
const lit = (value: number): LiteralNode => ({ type: 'literal', value });

/** Reference an attribute's value */
const attr = (attribute: AttributeType): AttributeRefNode => ({
  type: 'attributeRef',
  attribute,
  target: 'value',
});

/** Reference an attribute's aptitude */
const aptitude = (attribute: AttributeType): AttributeRefNode => ({
  type: 'attributeRef',
  attribute,
  target: 'aptitude',
});

/** Add two formulas */
const add = (left: FormulaNode, right: FormulaNode): BinaryOpNode => ({
  type: 'binaryOp',
  op: '+',
  left,
  right,
});

/** Multiply */
const mult = (left: FormulaNode, right: FormulaNode): BinaryOpNode => ({
  type: 'binaryOp',
  op: '*',
  left,
  right,
});

/** Log base 2 */
const log2 = (arg: FormulaNode): FunctionNode => ({
  type: 'function',
  fn: 'log2',
  args: [arg],
});

// Usage example - the old imperative code:
// const income = Math.floor(Math.log2(charisma.value) + waterLore.value * 5);

// Becomes declarative:
const incomeFormula = add(
  log2(attr('charisma')),
  mult(attr('waterLore'), lit(5))
);
```

**Formula evaluator:**

```typescript
// formula-evaluator.ts

function evaluateFormula(node: FormulaNode, ctx: EffectContext): number {
  switch (node.type) {
    case 'literal':
      return node.value;

    case 'attributeRef': {
      const attr = ctx.character.characterState.attributes[node.attribute];
      return attr[node.target];
    }

    case 'statusRef': {
      const status = ctx.character.characterState.status[node.status];
      return status[node.target];
    }

    case 'binaryOp': {
      const left = evaluateFormula(node.left, ctx);
      const right = evaluateFormula(node.right, ctx);
      switch (node.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right !== 0 ? left / right : 0;
      }
    }

    case 'function': {
      const args = node.args.map(a => evaluateFormula(a, ctx));
      switch (node.fn) {
        case 'log2': return Math.log2(args[0]);
        case 'floor': return Math.floor(args[0]);
        case 'ceil': return Math.ceil(args[0]);
        case 'min': return Math.min(...args);
        case 'max': return Math.max(...args);
        case 'sqrt': return Math.sqrt(args[0]);
      }
    }

    case 'conditionalFormula': {
      const conditionMet = evaluateCondition(node.condition, ctx);
      return evaluateFormula(conditionMet ? node.then : node.else, ctx);
    }

    default:
      assertNever(node);  // Exhaustive check
  }
}

/** Exhaustive check helper - causes compile error if cases missed */
function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${x}`);
}
```

**Formula renderer (for display):**

```typescript
// formula-renderer.ts

/** Render formula as readable string */
function renderFormulaNode(node: FormulaNode): string {
  switch (node.type) {
    case 'literal':
      return formatNumber(node.value);

    case 'attributeRef':
      const abbrev = getAttributeAbbrev(node.attribute);
      return node.target === 'value' ? abbrev : `${abbrev} Apt`;

    case 'statusRef':
      return node.status;

    case 'binaryOp':
      const left = renderFormulaNode(node.left);
      const right = renderFormulaNode(node.right);
      // Add parens for precedence clarity
      return `(${left} ${node.op} ${right})`;

    case 'function':
      const args = node.args.map(renderFormulaNode).join(', ');
      return `${node.fn}(${args})`;

    case 'conditionalFormula':
      return `if ${renderCondition(node.condition)} then ${renderFormulaNode(node.then)} else ${renderFormulaNode(node.else)}`;

    default:
      return assertNever(node);
  }
}
```

**Why this pattern:**
- Same formula definition serves both execution and display
- Formulas are pure data - serializable to JSON for saves
- Easy to add new formula node types
- Testable - evaluate against mock context

---

### 4. Condition System

**Confidence:** HIGH (follows same discriminated union pattern)

Conditions are used for both conditional effects and formula conditionals.

```typescript
// condition-types.ts

interface ComparisonCondition {
  type: 'comparison';
  left: FormulaNode;
  op: '>' | '>=' | '<' | '<=' | '==' | '!=';
  right: FormulaNode;
}

interface HasItemCondition {
  type: 'hasItem';
  itemId: string;
  minQuantity?: number;
}

interface HasFurnitureCondition {
  type: 'hasFurniture';
  slot: FurnitureSlot;
  furnitureId?: string;  // Specific furniture, or any if undefined
}

interface FeatureUnlockedCondition {
  type: 'featureUnlocked';
  feature: 'mana' | 'yinYang' | 'immortal' | 'pets';
}

interface AndCondition {
  type: 'and';
  conditions: ConditionNode[];
}

interface OrCondition {
  type: 'or';
  conditions: ConditionNode[];
}

interface NotCondition {
  type: 'not';
  condition: ConditionNode;
}

interface ProbabilityCondition {
  type: 'probability';
  chance: FormulaNode;  // 0-1
}

type ConditionNode =
  | ComparisonCondition
  | HasItemCondition
  | HasFurnitureCondition
  | FeatureUnlockedCondition
  | AndCondition
  | OrCondition
  | NotCondition
  | ProbabilityCondition;
```

**Builder functions:**

```typescript
// condition-builders.ts

const gt = (left: FormulaNode, right: FormulaNode): ComparisonCondition => ({
  type: 'comparison', left, op: '>', right
});

const gte = (left: FormulaNode, right: FormulaNode): ComparisonCondition => ({
  type: 'comparison', left, op: '>=', right
});

const hasItem = (itemId: string, minQuantity = 1): HasItemCondition => ({
  type: 'hasItem', itemId, minQuantity
});

const hasFurniture = (slot: FurnitureSlot, furnitureId?: string): HasFurnitureCondition => ({
  type: 'hasFurniture', slot, furnitureId
});

const featureUnlocked = (feature: FeatureUnlockedCondition['feature']): FeatureUnlockedCondition => ({
  type: 'featureUnlocked', feature
});

const and = (...conditions: ConditionNode[]): AndCondition => ({
  type: 'and', conditions
});

const or = (...conditions: ConditionNode[]): OrCondition => ({
  type: 'or', conditions
});

const not = (condition: ConditionNode): NotCondition => ({
  type: 'not', condition
});

const prob = (chance: number | FormulaNode): ProbabilityCondition => ({
  type: 'probability',
  chance: typeof chance === 'number' ? lit(chance) : chance
});
```

---

### 5. Angular Service + Pipe Pattern

**Confidence:** HIGH (Angular official documentation)

Heavy logic lives in the service. Pipes are thin wrappers for template use.

```typescript
// effect-render.service.ts

@Injectable({ providedIn: 'root' })
export class EffectRenderService {
  private registry: EffectHandlerRegistry;

  constructor(
    private character: CharacterService,
    private inventory: InventoryService,
    private battle: BattleService,
    private home: HomeService,
    private items: ItemRepoService,
    private log: LogService
  ) {
    this.registry = createHandlerRegistry();
  }

  /** Build context from current game state */
  private buildContext(): EffectContext {
    return {
      character: this.character,
      inventory: this.inventory,
      battle: this.battle,
      home: this.home,
      items: this.items,
      log: this.log,
      random: Math.random,
    };
  }

  /** Render effect in short format (for activity cards) */
  renderShort(effect: Effect): string {
    return this.registry.renderShort(effect, this.buildContext());
  }

  /** Render effect in long format (for detail modals) */
  renderLong(effect: Effect): string {
    return this.registry.renderLong(effect, this.buildContext());
  }

  /** Render multiple effects, joining with separator */
  renderEffectsShort(effects: Effect[], separator = ', '): string {
    return effects
      .map(e => this.renderShort(e))
      .filter(s => s.length > 0)  // Skip hidden effects
      .join(separator);
  }
}
```

**Thin pipes (pure by default for performance):**

```typescript
// effect.pipes.ts

@Pipe({ name: 'effectShort', pure: true })
export class EffectShortPipe implements PipeTransform {
  constructor(private renderService: EffectRenderService) {}

  transform(effect: Effect): string {
    return this.renderService.renderShort(effect);
  }
}

@Pipe({ name: 'effectLong', pure: true })
export class EffectLongPipe implements PipeTransform {
  constructor(private renderService: EffectRenderService) {}

  transform(effect: Effect): string {
    return this.renderService.renderLong(effect);
  }
}

@Pipe({ name: 'effectsShort', pure: true })
export class EffectsShortPipe implements PipeTransform {
  constructor(private renderService: EffectRenderService) {}

  transform(effects: Effect[], separator = ', '): string {
    return this.renderService.renderEffectsShort(effects, separator);
  }
}
```

**Template usage:**

```html
<!-- Activity card -->
<div class="effects">{{ activity.effects | effectsShort }}</div>

<!-- Detail modal -->
<ul>
  <li *ngFor="let effect of activity.effects">
    {{ effect | effectLong }}
  </li>
</ul>
```

**Why pure pipes:**
- Pure pipes only re-evaluate when input reference changes
- Effect definitions are immutable data - reference won't change during gameplay
- Computed values (from formulas) come from services which track changes via their own mechanisms
- Impure pipes run every change detection cycle - massive performance hit

**When you might need impure:** If effect display must reflect real-time attribute changes (e.g., showing current damage value that updates with stats), consider:
1. Using signals (Angular 18+) to trigger change detection
2. Computing values in component and passing to pipe
3. As last resort, mark specific pipes as `pure: false`

---

### 6. Context Object Pattern for Testing

**Confidence:** HIGH (standard DI pattern)

Handlers receive everything they need via context. Easy to mock for tests.

```typescript
// effect-context.ts

interface EffectContext {
  // Service references
  character: CharacterService;
  inventory: InventoryService;
  battle: BattleService;
  home: HomeService;
  items: ItemRepoService;
  log: LogService;
  followers: FollowersService;
  impossibleTask: ImpossibleTaskService;

  // Injectable functions for testing
  random: () => number;
  now: () => number;  // Date.now replacement
}

/** Create real context from Angular services */
function createRealContext(injector: Injector): EffectContext {
  return {
    character: injector.get(CharacterService),
    inventory: injector.get(InventoryService),
    battle: injector.get(BattleService),
    home: injector.get(HomeService),
    items: injector.get(ItemRepoService),
    log: injector.get(LogService),
    followers: injector.get(FollowersService),
    impossibleTask: injector.get(ImpossibleTaskService),
    random: Math.random,
    now: Date.now,
  };
}

/** Create mock context for testing */
function createMockContext(overrides: Partial<EffectContext> = {}): EffectContext {
  return {
    character: createMockCharacterService(),
    inventory: createMockInventoryService(),
    battle: createMockBattleService(),
    home: createMockHomeService(),
    items: createMockItemRepoService(),
    log: createMockLogService(),
    followers: createMockFollowersService(),
    impossibleTask: createMockImpossibleTaskService(),
    random: () => 0.5,  // Deterministic for tests
    now: () => 1000000,
    ...overrides,
  };
}
```

**Example test:**

```typescript
describe('AttributeEffectHandler', () => {
  it('should increase attribute value', () => {
    const handler = new AttributeEffectHandler();
    const ctx = createMockContext();
    ctx.character.characterState.attributes.strength.value = 100;

    const effect: AttributeEffect = {
      kind: 'attribute',
      attribute: 'strength',
      target: 'value',
      amount: lit(10),
    };

    handler.execute(effect, ctx);

    expect(ctx.character.characterState.attributes.strength.value).toBe(110);
  });

  it('should render short format correctly', () => {
    const handler = new AttributeEffectHandler();
    const ctx = createMockContext();

    const effect: AttributeEffect = {
      kind: 'attribute',
      attribute: 'strength',
      target: 'value',
      amount: lit(10),
    };

    expect(handler.renderShort(effect, ctx)).toBe('+10 Str');
  });
});
```

---

## Recommended Stack Summary

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Type System | TypeScript Discriminated Unions | Built-in | Effect type definitions |
| Pattern Matching | Native switch + never check | Built-in | Exhaustive effect handling |
| Formula AST | Custom FormulaNode types | N/A | Evaluatable + renderable formulas |
| Handler Registry | Custom EffectHandlerRegistry | N/A | Extensible effect processing |
| Service Layer | Angular @Injectable | 18.x | Game state access |
| Template Integration | Angular @Pipe (pure) | 18.x | Effect rendering in templates |
| Testing | Context object pattern | N/A | Mock injection for handlers |

## Optional Enhancements

### ts-pattern Library (Optional)

**Confidence:** MEDIUM (community library, well-maintained)

For cleaner pattern matching syntax than switch statements:

```typescript
import { match, P } from 'ts-pattern';

// Instead of switch:
const result = match(effect)
  .with({ kind: 'attribute' }, (e) => handleAttribute(e))
  .with({ kind: 'item' }, (e) => handleItem(e))
  .with({ kind: 'conditional' }, (e) => handleConditional(e))
  .exhaustive();  // Compile error if cases missing
```

**Pros:**
- Cleaner syntax for complex matching
- Built-in exhaustiveness checking
- Good TypeScript inference

**Cons:**
- 2.5KB bundle size (minified + gzipped)
- Slight type-checking slowdown
- Another dependency to maintain

**Recommendation:** Start without it. Use native switch + assertNever. Add ts-pattern later if code becomes unwieldy.

### Formula Parser (NOT Recommended)

**Confidence:** HIGH (recommendation based on project scope)

Libraries like fparse or building a custom expression parser are **overkill** for this project:

1. You're defining formulas in code, not accepting user input
2. TypeScript builder functions provide better type safety
3. AST is already serializable to JSON for saves
4. No need for runtime formula parsing

**Only consider a parser if:** You want designers to edit formulas in JSON without TypeScript knowledge. In that case, consider SoonFx or a custom mini-parser.

---

## What NOT to Do

### 1. Class Hierarchies for Effects

```typescript
// BAD - No compile-time exhaustiveness, runtime type checks
abstract class Effect {
  abstract execute(ctx: EffectContext): void;
}

class AttributeEffect extends Effect { ... }
class ItemEffect extends Effect { ... }

function processEffect(effect: Effect) {
  if (effect instanceof AttributeEffect) { ... }
  else if (effect instanceof ItemEffect) { ... }
  // What if someone adds a new type? No compile error!
}
```

**Problem:** Adding a new effect type doesn't cause compile errors where it's not handled. Runtime instanceof checks are fragile.

### 2. String-Based Type Discrimination

```typescript
// BAD - No type narrowing, typos not caught
interface Effect {
  type: string;  // "attribute", "item", etc.
  data: any;     // Hope for the best
}

function processEffect(effect: Effect) {
  switch (effect.type) {
    case 'attribute':  // Typo "atribute" compiles fine
      // effect.data is still 'any'
  }
}
```

**Problem:** No type safety. TypeScript can't narrow based on string values unless they're literal types in a union.

### 3. External Effect Configuration Libraries

Don't reach for game engine effect systems or complex DSL libraries. Your needs are:
- ~10-15 effect types
- ~50 activities
- TypeScript-first development

Built-in TypeScript patterns handle this perfectly. External libraries add:
- Bundle size
- Learning curve
- Maintenance burden
- Often worse TypeScript support

### 4. Impure Pipes for Effect Rendering

```typescript
// BAD - Runs on every change detection cycle
@Pipe({ name: 'effectRender', pure: false })
export class EffectRenderPipe { ... }
```

**Problem:** Angular games often run at 60fps or have high-frequency state updates. Impure pipes recalculate constantly, destroying performance.

### 5. Mixing Execution and Rendering

```typescript
// BAD - Can't render without executing
function handleAttributeEffect(effect: AttributeEffect): string {
  character.strength += effect.amount;  // Side effect!
  return `+${effect.amount} Str`;       // And rendering!
}
```

**Problem:** Can't display what an effect would do without actually doing it. Separate execute() and render() methods on handlers.

---

## Sources

**TypeScript Discriminated Unions:**
- [TypeScript Playground - Discriminate Types](https://www.typescriptlang.org/play/typescript/meta-types/discriminate-types.ts.html) - Official examples
- [CodeSpud - 10 Discriminated Union Examples](https://www.codespud.com/2025/discriminated-unions-examples-typescript/) - Practical patterns
- [Convex TypeScript Guide](https://www.convex.dev/typescript/advanced/type-operators-manipulation/typescript-discriminated-union) - Deep dive

**Handler Registry Pattern:**
- [io.digital - Function Registry Pattern](https://techhub.iodigital.com/articles/function-registry-pattern-react) - Registration and dispatch patterns
- [GeeksforGeeks - Registry Pattern](https://www.geeksforgeeks.org/system-design/registry-pattern/) - System design perspective

**Angular Patterns:**
- [Angular.dev - Pipes](https://angular.dev/guide/templates/pipes) - Official pipe documentation
- [Angular.dev - InjectionToken](https://angular.dev/api/core/InjectionToken) - Token-based DI
- [Angular Training - Pure Pipes Performance](https://www.angulartraining.com/daily-newsletter/how-to-improve-performance-with-pure-pipes/) - Performance best practices

**Formula/Expression Systems:**
- [SoonFx Engine](https://github.com/soonfx-engine/core) - TypeScript game formula engine
- [LeanyLabs - Expression Interpreter](https://leanylabs.com/blog/js-formula-engine/) - Building formula parsers

**ts-pattern (Optional):**
- [ts-pattern GitHub](https://github.com/gvergnaud/ts-pattern) - Exhaustive pattern matching
- [npm ts-pattern](https://www.npmjs.com/package/ts-pattern) - Package documentation

**Builder Pattern:**
- [Refactoring Guru - Builder in TypeScript](https://refactoring.guru/design-patterns/builder/typescript/example) - Pattern reference
- [fluent-builder GitHub](https://github.com/NathanJAdams/fluent-builder) - TypeScript fluent builder library

---

## Implementation Priority

1. **Effect type union** - Define all effect kinds as discriminated union
2. **Formula node types** - Define formula AST with builders
3. **Condition node types** - Define condition AST with builders
4. **Handler interface + registry** - Core dispatch infrastructure
5. **First handler (AttributeEffect)** - Prove the pattern works
6. **EffectRenderService** - Angular integration point
7. **Thin pipes** - Template integration
8. **Remaining handlers** - One per effect kind
9. **Activity migration** - Convert all ~50 activities

This order minimizes risk - you prove the architecture works with one effect type before committing to the full migration.
