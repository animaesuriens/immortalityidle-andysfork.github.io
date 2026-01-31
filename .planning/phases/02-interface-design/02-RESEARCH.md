# Phase 2: Interface Design - Research

**Researched:** 2026-01-31
**Domain:** TypeScript type system, discriminated unions, handler patterns, Angular service integration
**Confidence:** HIGH

## Summary

Phase 2 defines all type contracts for the declarative effects system without implementation. This is a pure TypeScript interface design phase - no runtime behavior changes, just type definitions that will compile. The codebase already uses TypeScript 5.4 with strict mode, so discriminated unions will get full compile-time exhaustiveness checking.

The approach is well-established: discriminated unions with a `type` literal property, handler interfaces with `execute()` and `render()` methods, formula builders as function signatures returning typed objects, and a context interface for service access. All patterns are standard TypeScript with extensive documentation and community usage.

**Primary recommendation:** Define effect types as a discriminated union with `type` as the discriminant. Use the `assertNever` pattern for exhaustive checking. Create formula builder function signatures that return evaluatable/renderable objects. Keep handler interface simple with two methods. Use stubs (`throw new Error('Not implemented')`) to make TypeScript compile.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.4.2 | Discriminated unions, exhaustive checks | Already in project, strict mode enabled |
| expr-eval | ^2.0.2 | Mathematical expression evaluation | MIT licensed, built-in TypeScript types, well-maintained |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/expr-eval | N/A | TypeScript definitions | NOT NEEDED - expr-eval includes its own types |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expr-eval | fparse | fparse is smaller but less documentation; expr-eval has better TypeScript support |
| expr-eval | Hand-rolled parser | REJECTED - reinventing the wheel for math expressions |
| Discriminated unions | Class hierarchy | REJECTED - class hierarchies don't provide compile-time exhaustiveness |
| ts-pattern | Native switch | ts-pattern adds 2.5KB bundle for cleaner syntax; start with native switch, add later if needed |

**Installation:**
```bash
npm install expr-eval
```

## Architecture Patterns

### Recommended Project Structure

```
src/app/
├── game-state/           # Existing services
├── effects/              # NEW: Effect system
│   ├── types/
│   │   ├── effect.types.ts      # Effect union type and variants
│   │   ├── formula.types.ts     # Formula builder types
│   │   └── context.types.ts     # EffectContext interface
│   ├── formulas/
│   │   └── formula.builders.ts  # Formula builder function signatures
│   ├── handlers/
│   │   └── handler.interface.ts # EffectHandler interface
│   └── index.ts                 # Public exports
```

### Pattern 1: Discriminated Union for Effects

**What:** Union type with `type` literal discriminant enabling exhaustive switch/if handling

**When to use:** Any time you have a finite set of effect kinds that need different handling

**Example:**
```typescript
// Source: TypeScript Handbook - Narrowing
interface AttributeEffect {
  readonly type: 'attribute';
  attribute: AttributeType;
  value: number | Formula;
}

interface StatusEffect {
  readonly type: 'status';
  status: StatusType;
  change: number | Formula;
}

interface MoneyEffect {
  readonly type: 'money';
  amount: number | Formula;
}

// Union type - TypeScript enforces exhaustive handling
type Effect =
  | AttributeEffect
  | StatusEffect
  | MoneyEffect
  | ItemEffect
  | ConditionalEffect
  | ChanceEffect
  | ProgressEffect
  | SpawnEffect
  | YinYangEffect;
```

### Pattern 2: Handler Interface with Registry

**What:** Interface defining execute() and render() methods, registered by effect type

**When to use:** Each effect type needs its own implementation logic

**Example:**
```typescript
// Source: Handler Registry Pattern
interface EffectHandler<T extends Effect = Effect> {
  /** Execute the effect, modifying game state via context */
  execute(effect: T, context: EffectContext): void;

  /** Render the effect to a display string in specified format */
  render(effect: T, context: EffectContext, format: RenderFormat): string;
}

type RenderFormat = 'short' | 'long' | 'formula';

// Registry maps effect type to handler instance
type HandlerRegistry = {
  [K in Effect['type']]: EffectHandler<Extract<Effect, { type: K }>>;
};
```

### Pattern 3: Formula Builders

**What:** Functions returning typed objects that can be evaluated AND rendered

**When to use:** Any numeric value that needs to compute AND display from same definition

**Example:**
```typescript
// Source: DECISIONS.md formula builder pattern
interface Formula {
  /** Evaluate to a number using context values */
  evaluate(context: FormulaContext): number;

  /** Render to string in specified format */
  render(context: FormulaContext, format: RenderFormat): string;
}

// Builder function signatures
function attr(attribute: AttributeType): Formula;
function log2(operand: Formula | number): Formula;
function add(...operands: (Formula | number)[]): Formula;
function mult(...operands: (Formula | number)[]): Formula;
function fixed(value: number): Formula;
```

### Pattern 4: Context Object for Service Access

**What:** Interface providing handlers access to game services without Angular DI

**When to use:** Handlers need to read/modify game state but should be testable without Angular

**Example:**
```typescript
// Source: DECISIONS.md context object pattern
interface EffectContext {
  // Read-only access to character state
  readonly character: {
    attributes: Record<AttributeType, AttributeValue>;
    status: Record<StatusType, StatusValue>;
    money: number;
    manaUnlocked: boolean;
    yinYangUnlocked: boolean;
    immortal: boolean;
    // ... other flags
  };

  // Mutation methods (mirrors existing service methods)
  increaseAttribute(attr: AttributeType, amount: number): void;
  updateMoney(amount: number): void;
  modifyStatus(status: StatusType, change: number): void;

  // Item operations
  addItem(item: Item, quantity?: number): void;
  consumeItem(type: string, minGrade?: number): number; // returns grade
  generateWeapon(grade: number, material: string): Equipment;
  generatePotion(grade: number): Pill;

  // Progress operations
  incrementProgress(taskType: string): void;

  // Spawn operations
  spawnEnemy(config: EnemyConfig): void;
  spawnFollower(): void;

  // Home/furniture checks
  hasFurniture(slot: FurnitureSlot, id?: string): boolean;

  // Logging
  log(topic: LogTopic, message: string): void;
}
```

### Pattern 5: Exhaustive Check Helper

**What:** Utility function that errors at compile-time when not all cases handled

**When to use:** Every switch statement over Effect union type

**Example:**
```typescript
// Source: TypeScript Deep Dive - Discriminated Unions
function assertNever(x: never, message?: string): never {
  throw new Error(message ?? `Unexpected value: ${JSON.stringify(x)}`);
}

// Usage in dispatch
function dispatch(effect: Effect, context: EffectContext): void {
  switch (effect.type) {
    case 'attribute':
      // handle attribute
      break;
    case 'status':
      // handle status
      break;
    // ... other cases
    default:
      assertNever(effect); // Compile error if new type added without case
  }
}
```

### Anti-Patterns to Avoid

- **Optional discriminant:** Never make the `type` property optional - breaks type narrowing
- **String unions instead of literal types:** Use `readonly type: 'attribute'` not `type: string`
- **Class hierarchies for effects:** Classes don't provide compile-time exhaustiveness checking
- **Generic effect handler:** Don't try to make one handler do everything - each type gets its own
- **Handlers importing Angular services:** Use context object pattern for testability
- **Implementing logic in Phase 2:** This phase defines ONLY interfaces - use stubs

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Math expression evaluation | Custom parser | expr-eval library | Expression parsing is complex; expr-eval handles operators, functions, variables |
| Type narrowing | Runtime type checks | TypeScript discriminated unions | Compiler handles it; runtime checks are redundant |
| Exhaustive case handling | Manual tracking | `assertNever` pattern | Compiler enforces completeness |
| Formula AST | Custom tree structure | expr-eval Expression class | Already parsed, optimized, convertible to JS function |

**Key insight:** TypeScript's type system IS your framework. Discriminated unions + exhaustive checking + handler interfaces provide everything needed without external libraries (except expr-eval for math).

## Common Pitfalls

### Pitfall 1: Effect Type Enum Temptation

**What goes wrong:** Using enum for effect types instead of literal types
**Why it happens:** Enums feel more "proper" or "organized"
**How to avoid:** Stick with string literal discriminants - they work better with TypeScript narrowing
**Warning signs:** Defining `enum EffectType { Attribute = 'attribute', ... }` separately from interfaces

### Pitfall 2: Over-Engineering Formula Types

**What goes wrong:** Creating complex generic types for formulas that become unmaintainable
**Why it happens:** Wanting to express all formula relationships in the type system
**How to avoid:** Keep Formula interface simple (evaluate + render methods). Let runtime handle composition.
**Warning signs:** Using `infer`, nested conditional types, or more than 2 levels of generics

### Pitfall 3: Premature Handler Implementation

**What goes wrong:** Starting to implement handler logic instead of just signatures
**Why it happens:** Natural urge to see something working
**How to avoid:** Phase 2 success criteria explicitly says "stubs/throw only"
**Warning signs:** Handler methods with more than `throw new Error('Not implemented')`

### Pitfall 4: Missing Effect Types

**What goes wrong:** Forgetting effect types that exist in current consequence functions
**Why it happens:** Not systematically reviewing all activities
**How to avoid:** Reference DECISIONS.md effect types list; verify against activity.service.ts patterns
**Warning signs:** Phase 3/4 discovering effects that don't fit the type system

### Pitfall 5: Circular Import Dependencies

**What goes wrong:** Effect types importing from handlers or context importing from effects
**Why it happens:** Putting too much in one file, or wrong file organization
**How to avoid:** Types are standalone - no imports from services or handlers
**Warning signs:** TypeScript circular dependency errors during compilation

## Code Examples

### Effect Union Type Definition

```typescript
// Source: Pattern derived from TypeScript Discriminated Unions documentation
// File: src/app/effects/types/effect.types.ts

import { AttributeType, StatusType } from '../../game-state/character';
import { Formula } from './formula.types';

// Base effect properties (optional, for metadata)
interface BaseEffect {
  /** Optional description for debugging/logging */
  readonly description?: string;
}

// Attribute modification effect
export interface AttributeEffect extends BaseEffect {
  readonly type: 'attribute';
  readonly attribute: AttributeType;
  readonly value: number | Formula;
  /** If true, modifies aptitude instead of value */
  readonly aptitude?: boolean;
}

// Status modification effect (health, stamina, mana, nourishment)
export interface StatusEffect extends BaseEffect {
  readonly type: 'status';
  readonly status: StatusType;
  readonly change: number | Formula;
  /** If true, modifies max instead of current value */
  readonly modifyMax?: boolean;
}

// Money effect
export interface MoneyEffect extends BaseEffect {
  readonly type: 'money';
  readonly amount: number | Formula;
}

// Item effects
export interface ItemAddEffect extends BaseEffect {
  readonly type: 'item.add';
  readonly itemId: string;
  readonly quantity?: number | Formula;
}

export interface ItemConsumeEffect extends BaseEffect {
  readonly type: 'item.consume';
  readonly itemType: string;
  readonly minGrade?: number;
  /** Variable name to store consumed item's grade */
  readonly storeGradeAs?: string;
}

export interface ItemGenerateEffect extends BaseEffect {
  readonly type: 'item.generate';
  readonly category: 'weapon' | 'armor' | 'potion' | 'pill';
  readonly grade: number | Formula;
  readonly material?: string;
}

// Conditional effect
export interface ConditionalEffect extends BaseEffect {
  readonly type: 'conditional';
  readonly condition: Condition;
  readonly then: Effect[];
  readonly else?: Effect[];
}

// Probability effect
export interface ChanceEffect extends BaseEffect {
  readonly type: 'chance';
  readonly probability: number | Formula;
  readonly effects: Effect[];
}

// Progress counter effect
export interface ProgressEffect extends BaseEffect {
  readonly type: 'progress';
  readonly progressType: string; // matches ImpossibleTaskType or field work
  readonly amount?: number | Formula;
}

// Spawn effects
export interface SpawnEnemyEffect extends BaseEffect {
  readonly type: 'spawn.enemy';
  readonly enemyConfig: EnemyConfig;
}

export interface SpawnFollowerEffect extends BaseEffect {
  readonly type: 'spawn.follower';
}

// Yin/Yang modification
export interface YinYangEffect extends BaseEffect {
  readonly type: 'yinyang';
  readonly modify: 'yin' | 'yang' | 'balance';
  readonly amount?: number;
}

// Special effects
export interface TriggerBattleEffect extends BaseEffect {
  readonly type: 'trigger.battle';
}

export interface LifespanEffect extends BaseEffect {
  readonly type: 'lifespan';
  readonly amount: number | Formula;
  readonly cap?: number;
}

// Union of all effect types
export type Effect =
  | AttributeEffect
  | StatusEffect
  | MoneyEffect
  | ItemAddEffect
  | ItemConsumeEffect
  | ItemGenerateEffect
  | ConditionalEffect
  | ChanceEffect
  | ProgressEffect
  | SpawnEnemyEffect
  | SpawnFollowerEffect
  | YinYangEffect
  | TriggerBattleEffect
  | LifespanEffect;

// Extract effect type literals for registry typing
export type EffectType = Effect['type'];
```

### Condition Type Definition

```typescript
// File: src/app/effects/types/condition.types.ts

import { AttributeType, StatusType } from '../../game-state/character';
import { Formula } from './formula.types';

// Flag-based conditions (boolean properties on character state)
export interface FlagCondition {
  readonly type: 'flag';
  readonly flag: 'manaUnlocked' | 'yinYangUnlocked' | 'immortal' | 'god';
  readonly negate?: boolean;
}

// Attribute comparison conditions
export interface AttributeCondition {
  readonly type: 'attribute';
  readonly attribute: AttributeType;
  readonly operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  readonly value: number | Formula;
}

// Status comparison conditions
export interface StatusCondition {
  readonly type: 'status';
  readonly status: StatusType;
  readonly operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  readonly value: number | Formula;
}

// Furniture check conditions
export interface FurnitureCondition {
  readonly type: 'furniture';
  readonly slot: 'workbench' | 'bed' | 'bathtub' | 'kitchen' | 'storage';
  readonly furnitureId?: string; // specific furniture, or any if omitted
}

// Inventory conditions
export interface InventoryCondition {
  readonly type: 'inventory';
  readonly check: 'hasSlots' | 'hasItem';
  readonly itemId?: string;
  readonly quantity?: number;
}

// Logical combinators
export interface AndCondition {
  readonly type: 'and';
  readonly conditions: Condition[];
}

export interface OrCondition {
  readonly type: 'or';
  readonly conditions: Condition[];
}

export interface NotCondition {
  readonly type: 'not';
  readonly condition: Condition;
}

// Union of all condition types
export type Condition =
  | FlagCondition
  | AttributeCondition
  | StatusCondition
  | FurnitureCondition
  | InventoryCondition
  | AndCondition
  | OrCondition
  | NotCondition;
```

### Formula Type Definition

```typescript
// File: src/app/effects/types/formula.types.ts

import { AttributeType, StatusType } from '../../game-state/character';

/**
 * Context provided to formula evaluation and rendering.
 * Read-only snapshot of game state values.
 */
export interface FormulaContext {
  readonly attributes: Record<AttributeType, number>;
  readonly status: Record<StatusType, { value: number; max: number }>;
  readonly money: number;
  /** Custom variables set during effect execution (e.g., consumed item grade) */
  readonly variables: Record<string, number>;
}

/**
 * Render format for formula output.
 * - 'value': Just the computed number (e.g., "127")
 * - 'formula': The formula expression (e.g., "log2(Cha) + Water Lore x 5")
 * - 'both': Value with formula (e.g., "127 (log2(Cha) + Water Lore x 5)")
 */
export type FormulaRenderFormat = 'value' | 'formula' | 'both';

/**
 * A formula that can be evaluated to a number and rendered to a string.
 * This is the core abstraction for the "single source of truth" requirement.
 */
export interface Formula {
  /**
   * Evaluate the formula to a number.
   * @param context Game state values for variable substitution
   */
  evaluate(context: FormulaContext): number;

  /**
   * Render the formula to a display string.
   * @param context Game state values (for 'value' format)
   * @param format Output format
   */
  render(context: FormulaContext, format: FormulaRenderFormat): string;
}
```

### Formula Builder Signatures

```typescript
// File: src/app/effects/formulas/formula.builders.ts

import { AttributeType, StatusType } from '../../game-state/character';
import { Formula } from '../types/formula.types';

// ============================================================
// BUILDER FUNCTION SIGNATURES (stubs for Phase 2)
// ============================================================

/**
 * Reference an attribute value.
 * Evaluates to: context.attributes[attribute]
 * Renders to: "Str", "Cha", "Metal Lore", etc.
 */
export function attr(attribute: AttributeType): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * Reference a status value.
 * Evaluates to: context.status[status].value
 * Renders to: "HP", "Sta", "Mana", etc.
 */
export function status(status: StatusType): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * Reference a status max value.
 * Evaluates to: context.status[status].max
 * Renders to: "Max HP", "Max Sta", etc.
 */
export function statusMax(status: StatusType): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * A fixed numeric constant.
 * Evaluates to: value
 * Renders to: "5", "0.1", etc.
 */
export function fixed(value: number): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * Reference a variable (set during execution, e.g., consumed item grade).
 * Evaluates to: context.variables[name]
 * Renders to: variable name or "Grade" etc.
 */
export function variable(name: string): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

// ============================================================
// ARITHMETIC OPERATIONS
// ============================================================

/**
 * Add operands together.
 * Evaluates to: sum of all operands
 * Renders to: "a + b + c"
 */
export function add(...operands: (Formula | number)[]): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * Subtract right from left.
 * Evaluates to: left - right
 * Renders to: "a - b"
 */
export function sub(left: Formula | number, right: Formula | number): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * Multiply operands together.
 * Evaluates to: product of all operands
 * Renders to: "a x b x c"
 */
export function mult(...operands: (Formula | number)[]): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * Divide left by right.
 * Evaluates to: left / right
 * Renders to: "a / b"
 */
export function div(left: Formula | number, right: Formula | number): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

// ============================================================
// MATHEMATICAL FUNCTIONS
// ============================================================

/**
 * Logarithm base 2.
 * Evaluates to: Math.log2(operand)
 * Renders to: "log2(operand)"
 */
export function log2(operand: Formula | number): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * Natural logarithm.
 * Evaluates to: Math.log(operand)
 * Renders to: "ln(operand)"
 */
export function ln(operand: Formula | number): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * Square root.
 * Evaluates to: Math.sqrt(operand)
 * Renders to: "sqrt(operand)"
 */
export function sqrt(operand: Formula | number): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * Floor (round down).
 * Evaluates to: Math.floor(operand)
 * Renders to: "floor(operand)"
 */
export function floor(operand: Formula | number): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * Power.
 * Evaluates to: Math.pow(base, exponent)
 * Renders to: "base^exponent"
 */
export function pow(base: Formula | number, exponent: Formula | number): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * Exponential.
 * Evaluates to: Math.exp(operand)
 * Renders to: "e^operand"
 */
export function exp(operand: Formula | number): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

// ============================================================
// COMPARISON / CONDITIONAL
// ============================================================

/**
 * Minimum of operands.
 * Evaluates to: Math.min(...operands)
 * Renders to: "min(a, b, ...)"
 */
export function min(...operands: (Formula | number)[]): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}

/**
 * Maximum of operands.
 * Evaluates to: Math.max(...operands)
 * Renders to: "max(a, b, ...)"
 */
export function max(...operands: (Formula | number)[]): Formula {
  throw new Error('Not implemented - Phase 2 interface only');
}
```

### Handler Interface

```typescript
// File: src/app/effects/handlers/handler.interface.ts

import { Effect, EffectType } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

/**
 * Format for rendered effect text.
 * - 'short': Compact format for activity cards ("+1 Str, -5 Sta")
 * - 'long': Full sentence for tooltips ("Increases Strength by 1")
 * - 'formula': Show the formula ("log2(Charisma) + 5")
 */
export type RenderFormat = 'short' | 'long' | 'formula';

/**
 * Interface that all effect handlers must implement.
 * Each effect type has exactly one handler.
 */
export interface EffectHandler<T extends Effect = Effect> {
  /**
   * Execute the effect, modifying game state via the context.
   * @param effect The effect definition to execute
   * @param context Access to game state and mutation methods
   */
  execute(effect: T, context: EffectContext): void;

  /**
   * Render the effect to a display string.
   * @param effect The effect definition to render
   * @param context Access to game state for value computation
   * @param format The output format
   * @returns Display string for UI
   */
  render(effect: T, context: EffectContext, format: RenderFormat): string;
}

/**
 * Registry type mapping each effect type to its handler.
 * Used to ensure exhaustive handler registration.
 */
export type HandlerRegistry = {
  [K in EffectType]: EffectHandler<Extract<Effect, { type: K }>>;
};
```

### Context Interface

```typescript
// File: src/app/effects/types/context.types.ts

import { AttributeType, StatusType, EquipmentPosition } from '../../game-state/character';
import { Item, Equipment, Pill } from '../../game-state/inventory.service';
import { LogTopic } from '../../game-state/log.service';

/**
 * Read-only view of attribute data.
 */
export interface AttributeValue {
  readonly value: number;
  readonly aptitude: number;
  readonly aptitudeMult: number;
}

/**
 * Read-only view of status data.
 */
export interface StatusValue {
  readonly value: number;
  readonly max: number;
}

/**
 * Enemy configuration for spawn effects.
 */
export interface EnemyConfig {
  readonly name: string;
  readonly health: number;
  readonly attack: number;
  readonly defense: number;
  readonly loot?: string[];
}

/**
 * Furniture slot types.
 */
export type FurnitureSlot = 'workbench' | 'bed' | 'bathtub' | 'kitchen' | 'storage';

/**
 * Context object providing handlers access to game state.
 * This is the bridge between pure effect handlers and Angular services.
 *
 * Designed for testability: mock this interface for unit tests.
 */
export interface EffectContext {
  // ============================================================
  // READ-ONLY STATE ACCESS
  // ============================================================

  /** Character attributes (strength, charisma, etc.) */
  readonly attributes: Readonly<Record<AttributeType, AttributeValue>>;

  /** Character status (health, stamina, mana, nourishment) */
  readonly status: Readonly<Record<StatusType, StatusValue>>;

  /** Current money */
  readonly money: number;

  /** Feature unlock flags */
  readonly manaUnlocked: boolean;
  readonly yinYangUnlocked: boolean;
  readonly immortal: boolean;
  readonly god: boolean;

  /** Yin/Yang values */
  readonly yin: number;
  readonly yang: number;

  /** Variables set during effect execution (e.g., consumed item grade) */
  readonly variables: Record<string, number>;

  // ============================================================
  // MUTATION METHODS
  // ============================================================

  /**
   * Increase an attribute by the specified amount.
   * Applies aptitude multiplier automatically.
   * @returns The actual amount increased (after multiplier)
   */
  increaseAttribute(attribute: AttributeType, amount: number): number;

  /**
   * Modify an attribute's aptitude directly.
   */
  modifyAptitude(attribute: AttributeType, amount: number): void;

  /**
   * Add or subtract money.
   */
  updateMoney(amount: number): void;

  /**
   * Modify a status value (health, stamina, mana, nourishment).
   */
  modifyStatus(status: StatusType, change: number): void;

  /**
   * Modify a status max value.
   */
  modifyStatusMax(status: StatusType, change: number): void;

  /**
   * Modify yin or yang value.
   */
  modifyYinYang(which: 'yin' | 'yang', amount: number): void;

  /**
   * Modify lifespan.
   */
  modifyLifespan(amount: number, cap?: number): void;

  /**
   * Set a variable for use in subsequent formulas.
   */
  setVariable(name: string, value: number): void;

  // ============================================================
  // ITEM OPERATIONS
  // ============================================================

  /**
   * Add an item to inventory.
   */
  addItem(itemId: string, quantity?: number): void;

  /**
   * Consume an item by type (e.g., 'metal', 'wood').
   * @returns The grade of the consumed item, or 0 if none found
   */
  consumeItem(itemType: string, minGrade?: number): number;

  /**
   * Generate a weapon.
   * @returns The generated equipment (may also add to inventory)
   */
  generateWeapon(grade: number, material: string): Equipment;

  /**
   * Generate armor.
   */
  generateArmor(grade: number, slot: EquipmentPosition): Equipment;

  /**
   * Generate a potion.
   */
  generatePotion(grade: number): Pill;

  /**
   * Generate a pill.
   */
  generatePill(grade: number): Pill;

  /**
   * Check if inventory has open slots.
   */
  hasInventorySlots(): boolean;

  // ============================================================
  // PROGRESS OPERATIONS
  // ============================================================

  /**
   * Increment a progress counter.
   * @param progressType Identifier for the progress type (e.g., 'Swim', 'RaiseIsland')
   */
  incrementProgress(progressType: string, amount?: number): void;

  /**
   * Check and handle progress completion.
   */
  checkProgressCompletion(): void;

  // ============================================================
  // SPAWN OPERATIONS
  // ============================================================

  /**
   * Spawn an enemy for battle.
   */
  spawnEnemy(config: EnemyConfig): void;

  /**
   * Spawn a follower.
   */
  spawnFollower(): void;

  /**
   * Spawn a pet.
   */
  spawnPet(): void;

  /**
   * Trigger a battle tick.
   */
  triggerBattle(): void;

  // ============================================================
  // HOME/FURNITURE CHECKS
  // ============================================================

  /**
   * Check if a specific furniture is equipped in a slot.
   * @param slot The furniture slot to check
   * @param furnitureId Optional specific furniture ID; if omitted, checks if slot has any furniture
   */
  hasFurniture(slot: FurnitureSlot, furnitureId?: string): boolean;

  /**
   * Get the ID of furniture in a slot.
   * @returns The furniture ID, or undefined if empty
   */
  getFurnitureId(slot: FurnitureSlot): string | undefined;

  // ============================================================
  // LOGGING
  // ============================================================

  /**
   * Log a message.
   */
  log(topic: LogTopic, message: string): void;

  /**
   * Log an injury message (red color).
   */
  logInjury(topic: LogTopic, message: string): void;
}
```

### Exhaustive Check Utility

```typescript
// File: src/app/effects/utils/exhaustive.ts

/**
 * Utility for exhaustive type checking in switch statements.
 *
 * When all cases of a discriminated union are handled, TypeScript narrows
 * the type to `never`. This function enforces that at compile time.
 *
 * @example
 * function handleEffect(effect: Effect) {
 *   switch (effect.type) {
 *     case 'attribute': // ...
 *     case 'status': // ...
 *     // ... all other cases
 *     default:
 *       assertNever(effect); // Compile error if case missing
 *   }
 * }
 */
export function assertNever(x: never, message?: string): never {
  throw new Error(message ?? `Unexpected value: ${JSON.stringify(x)}`);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class hierarchies for variants | Discriminated unions | TypeScript 2.0+ | Compile-time exhaustiveness checking |
| Manual type guards | Narrowing via discriminant | TypeScript 2.0+ | Automatic type inference in branches |
| Runtime type assertions | `never` type exhaustiveness | TypeScript 2.0+ | Catch missing cases at compile time |
| Angular-heavy patterns | Context object pattern | Modern testing practices | Better unit testability |

**Deprecated/outdated:**
- `@types/expr-eval`: No longer needed, expr-eval ships its own types
- Class-based effect hierarchies: Don't provide compile-time exhaustiveness

## Open Questions

1. **Formula vs expr-eval Expression**
   - What we know: expr-eval's Expression class already has evaluate() and can be converted to JS function
   - What's unclear: Whether to wrap expr-eval or create custom Formula type
   - Recommendation: Create Formula interface that wraps expr-eval under the hood; provides better control over rendering and testing

2. **Effect array ordering**
   - What we know: Current consequence functions execute in definition order
   - What's unclear: Whether effect ordering matters for correctness
   - Recommendation: Document that effects execute in array order; test critical ordering in Phase 3

3. **Nested conditional depth**
   - What we know: DECISIONS.md mentions composable effects
   - What's unclear: Maximum practical nesting depth before types become unwieldy
   - Recommendation: Start with 2-level max (conditional containing conditional); expand if needed

## Sources

### Primary (HIGH confidence)
- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) - Official discriminated union documentation
- [TypeScript Deep Dive - Discriminated Unions](https://basarat.gitbook.io/typescript/type-system/discriminated-unions) - Exhaustive checking patterns
- [expr-eval GitHub](https://github.com/silentmatt/expr-eval) - Expression evaluator API, TypeScript support
- [expr-eval npm](https://www.npmjs.com/package/expr-eval) - Package information, version

### Secondary (MEDIUM confidence)
- [Registry Pattern - GeeksforGeeks](https://www.geeksforgeeks.org/system-design/registry-pattern/) - Handler registry pattern fundamentals
- [Scaling TypeScript Registries - Slash Engineering](https://puzzles.slash.com/blog/scaling-1m-lines-of-typescript-registries) - Registry pattern at scale
- [Strategy Pattern Angular - AngularSpace](https://www.angularspace.com/strategy-pattern-the-angular-way-di-and-runtime-flexibility/) - Angular DI with handler patterns

### Tertiary (LOW confidence)
- [ts-pattern npm](https://www.npmjs.com/package/ts-pattern) - Alternative pattern matching library (optional enhancement)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - TypeScript discriminated unions well-documented; expr-eval verified in npm
- Architecture: HIGH - Handler registry and context object patterns are established
- Effect types: HIGH - Derived directly from codebase audit in DECISIONS.md
- Pitfalls: MEDIUM - Based on common TypeScript anti-patterns and project-specific concerns

**Research date:** 2026-01-31
**Valid until:** Indefinite (TypeScript patterns stable; expr-eval 2.x stable)

---

## Implementation Checklist

For planner reference, files to create:

1. **Type definitions** (`src/app/effects/types/`)
   - `effect.types.ts` - Effect union type with all variants
   - `condition.types.ts` - Condition union type
   - `formula.types.ts` - Formula interface and FormulaContext
   - `context.types.ts` - EffectContext interface

2. **Formula builders** (`src/app/effects/formulas/`)
   - `formula.builders.ts` - Builder function signatures (stubs)

3. **Handler interface** (`src/app/effects/handlers/`)
   - `handler.interface.ts` - EffectHandler interface, RenderFormat, HandlerRegistry type

4. **Utilities** (`src/app/effects/utils/`)
   - `exhaustive.ts` - assertNever helper

5. **Barrel export** (`src/app/effects/`)
   - `index.ts` - Public API exports

6. **Package dependency**
   - `npm install expr-eval` - Add to package.json

All files contain only type definitions and stub implementations (`throw new Error('Not implemented')`). TypeScript must compile with no errors.
