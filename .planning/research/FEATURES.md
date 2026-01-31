# Feature Landscape: Declarative Effect System

**Domain:** Declarative effect system for Angular idle game
**Researched:** 2026-01-31
**Overall Confidence:** MEDIUM - Based on analysis of existing codebase patterns and established game dev patterns; specific Angular implementations require validation.

## Context

This research addresses features needed for a declarative effect system in Immortality Idle, an Angular 18 idle game with ~50 activities. The goal is a system that can both **execute effects** and **render them to UI** from a single definition.

Current pain points observed in codebase:
- `consequence` functions are imperative code blocks that duplicate logic found in `consequenceDescription` strings
- `effects` field added as manual summary strings that can drift from actual implementation
- Probability handling scattered with inline `Math.random()` calls
- Conditional logic embedded in consequence functions with no UI reflection
- Formula calculations (money earned) duplicated between execution and display

---

## Must-Have Features

Features required for this refactor to be viable. Without these, the system fails to meet its core goal.

| Feature | Why Essential | Complexity | Dependencies |
|---------|---------------|------------|--------------|
| **Effect Type Registry** | Need finite set of effect types (attribute gain, item drop, status change, money) to build handlers and renderers | Low | None |
| **Single Definition Execution** | Core requirement: same JSON/object defines what happens AND what displays | Medium | Effect Type Registry |
| **Attribute Modification Effects** | ~80% of activities modify attributes; must support `{type: 'attribute', name: 'strength', value: 0.1}` | Low | Effect Type Registry |
| **Resource Cost/Gain Effects** | Stamina/health/mana changes are universal: `{type: 'status', name: 'stamina', value: -25}` | Low | Effect Type Registry |
| **Money Formula Support** | Money calculations need formulas like `log2(strength + toughness) + metalLore * 5` | Medium | Formula Evaluator |
| **Formula Evaluator** | Parse and execute formulas referencing game state; library like `expr-eval` recommended | Medium | None |
| **Basic Conditional Effects** | Support `{condition: 'manaUnlocked', effects: [...]}` for gated effects | Medium | Condition Evaluator |
| **Probability Effects** | Support `{type: 'chance', probability: 0.1, effects: [...]}` for item drops | Medium | Effect Type Registry |
| **Text Renderer** | Generate display strings from effect definitions: `"+0.1 Str, -25 Sta"` | Medium | Effect Type Registry |
| **Backward Compatibility Layer** | Must coexist with existing imperative activities during migration | Medium | None |

### Critical Path

```
Effect Type Registry
       |
       v
Single Definition Execution <-- Formula Evaluator
       |
       v
Text Renderer
       |
       v
Backward Compatibility Layer
```

---

## Nice-to-Have Features

Features that add significant value but can be deferred to post-MVP or later phases.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| **Multi-Format Rendering** | Generate tooltip, card summary, and detailed views from same definition | Medium | Text Renderer |
| **Localization Support** | i18n-ready effect strings with interpolation (`"+{{value}} {{attribute}}"`) | Medium | Text Renderer |
| **Effect Composition/Nesting** | Allow effects to contain other effects for complex behaviors | Medium | Effect Type Registry |
| **Stacking Rules** | Define how repeated effects combine (additive, multiplicative, max) | High | Effect Type Registry |
| **Effect Modifiers** | Apply multipliers/bonuses to effects: `{modifier: 'hasFurniture.anvil', multiply: 1.5}` | Medium | Condition Evaluator |
| **Weighted Random Tables** | Support `{type: 'weightedRandom', options: [{weight: 10, effects: [...]}, ...]}` | Medium | Probability Effects |
| **Effect Previews** | Show expected outcomes before execution (especially for formulas) | High | Formula Evaluator, Text Renderer |
| **Effect History/Logging** | Track what effects fired for debugging and analytics | Low | Effect Executor |
| **Schema Validation** | JSON Schema validation for effect definitions | Low | None |
| **Visual Effect Editor** | GUI for creating/editing effect definitions (dev tool) | Very High | Schema Validation, all above |

### Value vs Effort Matrix

```
                    High Value
                        |
   Effect Previews  *   |   * Multi-Format Rendering
                        |   * Localization Support
   Weighted Tables  *   |   * Effect Composition
                        |
  Low Effort -----------+----------- High Effort
                        |
   Effect History   *   |   * Stacking Rules
   Schema Valid.    *   |   * Visual Editor
                        |
                    Low Value
```

---

## Anti-Features

Features to explicitly NOT build. Common over-engineering traps in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full DSL/Scripting Language** | Complexity explosion; hard to validate, secure, and maintain | Use structured JSON with formula strings for math only |
| **Generic Expression Trees for Conditions** | Leads to Turing-complete condition system nobody can debug | Use predefined condition types with simple AND/OR |
| **Dynamic Effect Type Creation** | If designers can create new effect types at runtime, renderer can't keep up | Fixed registry of effect types; new types require code |
| **Bidirectional Sync** | Auto-generating code from definitions OR vice versa adds complexity | One source of truth: definitions only |
| **Over-Abstracted Modifier System** | Stacking 5 layers of modifiers makes outcomes unpredictable | Keep modifier chains shallow (1-2 levels max) |
| **Real-Time Effect Streaming** | Effects don't need pub/sub architecture for an idle game | Simple synchronous execution is fine |
| **Visual Programming for Effects** | Node-based editors are massive undertakings | JSON definitions with good documentation |
| **Undo/Redo for Effects** | Games don't need transactional rollback per-effect | Effects are fire-and-forget; use save/load for recovery |

### Warning Signs You're Over-Engineering

- Adding types to handle "future requirements" not in current activities
- Building a plugin system for effect types
- Creating a separate query language for conditions
- Adding dependency injection to effects
- Making effects async when they don't need to be

---

## Feature Dependencies

```
                                 +-----------------+
                                 | Effect Type     |
                                 | Registry        |
                                 +--------+--------+
                                          |
              +---------------------------+---------------------------+
              |                           |                           |
              v                           v                           v
   +----------+----------+    +-----------+---------+    +------------+-----------+
   | Attribute Effects   |    | Status Effects      |    | Item Drop Effects      |
   +---------------------+    +---------------------+    +------------------------+
                                          |
                                          v
                              +-----------+---------+
                              | Formula Evaluator   |<-------- (expr-eval library)
                              +---------------------+
                                          |
              +---------------------------+---------------------------+
              |                           |                           |
              v                           v                           v
   +----------+----------+    +-----------+---------+    +------------+-----------+
   | Money Calculations  |    | Conditional Effects |    | Probability Effects    |
   +---------------------+    +---------------------+    +------------------------+
              |                           |                           |
              +---------------------------+---------------------------+
                                          |
                                          v
                              +-----------+---------+
                              | Effect Executor     |
                              +---------------------+
                                          |
                              +-----------+---------+
                              | Text Renderer       |
                              +---------------------+
                                          |
              +---------------------------+---------------------------+
              |                           |                           |
              v                           v                           v
   +----------+----------+    +-----------+---------+    +------------+-----------+
   | Multi-Format        |    | Localization        |    | Effect Previews        |
   | Rendering           |    | Support             |    |                        |
   +---------------------+    +---------------------+    +------------------------+
```

---

## MVP Recommendation

For MVP (Phase 1), prioritize:

1. **Effect Type Registry** - Foundation for everything else
2. **Single Definition Execution** - Core value proposition
3. **Attribute/Status/Money Effects** - Covers ~90% of current activities
4. **Formula Evaluator** - Required for money calculations; use `expr-eval`
5. **Basic Conditional Effects** - `if manaUnlocked` patterns are common
6. **Probability Effects** - Item drops are core to many activities
7. **Text Renderer (basic)** - Must generate display strings

Defer to Phase 2:
- Multi-format rendering (different views)
- Effect composition/nesting
- Stacking rules
- Effect modifiers

Defer to Phase 3 or never:
- Visual editor
- Full localization
- Effect previews with simulated values

### Migration Strategy

The backward compatibility layer allows incremental migration:

1. **Phase 1a:** Build effect system alongside existing activities
2. **Phase 1b:** Convert 5 simple activities (OddJobs, Resting, etc.)
3. **Phase 1c:** Convert 10 more activities with formulas
4. **Phase 1d:** Convert activities with probability
5. **Phase 2:** Convert complex activities with conditionals
6. **Phase 3:** Remove backward compatibility layer

---

## Detailed Feature Specifications

### Effect Type Registry

**Purpose:** Central catalog of all effect types the system can handle.

**Recommended types based on codebase analysis:**
```typescript
type EffectType =
  | 'attribute'     // increaseAttribute('strength', 0.1)
  | 'status'        // status.stamina.value -= 25
  | 'money'         // updateMoney(formula)
  | 'item'          // addItem(itemRepoService.items['junk'])
  | 'itemGenerate'  // generateWeapon(), generatePotion()
  | 'itemConsume'   // consume('metal', 1)
  | 'progress'      // taskProgress[X].progress++
  | 'log'           // logService.log(...)
  | 'conditional'   // if (condition) { effects }
  | 'chance'        // if (Math.random() < p) { effects }
  | 'yinYang'       // yin++, yang++
```

**Complexity:** Low
**Confidence:** HIGH - directly derived from codebase analysis

---

### Formula Evaluator

**Purpose:** Evaluate mathematical formulas referencing game state.

**Example formulas from codebase:**
```javascript
// Mining money calculation
Math.log2(strength + toughness) + earthLore

// Blacksmithing money calculation
Math.log2(strength + toughness) + metalLore * 5

// Alchemy success chance
1 - Math.exp(0 - 0.025 * Math.log(waterLore))
```

**Recommended library:** `expr-eval` (MIT license, well-maintained)
- Supports: `log2`, `log`, `log10`, `sqrt`, `pow`, `exp`, `floor`, `ceil`, `round`
- Custom functions: Can add `Math.random()` wrapper
- Variables: Direct binding to game state values
- Performance: Compiles to JS function for reuse

**Integration pattern:**
```typescript
const parser = new Parser();
parser.consts.strength = characterState.attributes.strength.value;
parser.consts.toughness = characterState.attributes.toughness.value;
const result = parser.evaluate('log2(strength + toughness) + metalLore * 5');
```

**Complexity:** Medium
**Confidence:** HIGH - `expr-eval` verified via official documentation

---

### Conditional Effect System

**Purpose:** Execute effects only when conditions are met.

**Conditions observed in codebase:**
- `manaUnlocked` - Boolean flag
- `yinYangUnlocked` - Boolean flag
- `immortal` - Boolean flag
- `homeService.furniture.workbench?.id === 'anvil'` - Equipment check
- `followerService.followersUnlocked` - Feature unlock
- `inventoryService.openInventorySlots() > 0` - Capacity check
- `hellService?.inHell` - Game state check

**Recommended approach:**
```typescript
type ConditionType =
  | { type: 'flag', name: string }           // characterState.manaUnlocked
  | { type: 'furniture', slot: string, id: string }  // workbench === 'anvil'
  | { type: 'attribute', name: string, op: '>' | '<' | '>=', value: number }
  | { type: 'inventory', check: 'hasSlots' | 'hasItem', item?: string }
  | { type: 'and', conditions: Condition[] }
  | { type: 'or', conditions: Condition[] }
```

**Complexity:** Medium
**Confidence:** MEDIUM - condition patterns derived from codebase, specific API needs validation

---

### Probability Effects

**Purpose:** Execute effects with a random chance.

**Patterns observed:**
```javascript
// Simple chance
if (Math.random() < 0.1) { effects }

// Chance modified by conditions
let chance = 0.01;
if (hasAnvil) chance += 0.05;
if (Math.random() < chance) { effects }
```

**Recommended structure:**
```typescript
interface ChanceEffect {
  type: 'chance';
  probability: number | string;  // number or formula
  effects: Effect[];
  modifiers?: Array<{
    condition: Condition;
    additive?: number;
    multiplicative?: number;
  }>;
}
```

**Complexity:** Medium
**Confidence:** HIGH - probability patterns clearly visible in codebase

---

### Text Renderer

**Purpose:** Generate human-readable strings from effect definitions.

**Output formats needed:**
1. **Card summary:** Compact, one line: `"+Str, +Tough, -25 Sta, +Money"`
2. **Tooltip detail:** Multi-line with values: `"Strength +0.1\nToughness +0.1\nStamina -25\nMoney: log2(Str+Tough)"`
3. **Consequence description:** Natural language: `"Uses 25 Stamina. Increases strength and toughness slightly."`

**Rendering rules:**
- Attribute gains: `"+{value} {name}"` or `"+{name}"` if value omitted
- Status costs: `"-{value} {abbreviation}"` (HP, Sta, Mana)
- Money: `"+Money"` or formula preview
- Item drops: `"+{itemName} ({probability}%)"` for chance-based
- Conditionals: `"+{effect} (if {condition})"` or suppress if too complex

**Complexity:** Medium
**Confidence:** MEDIUM - rendering patterns exist in `getActivityEffects()`, needs expansion

---

## Existing Codebase Patterns to Preserve

The current system has some patterns worth preserving:

1. **Level-based arrays:** Activities have multiple levels with different effects per level
   - Effect definitions should support: `effects: Effect[][]` (array per level)

2. **Last income tracking:** `activity.lastIncome` tracks actual money earned
   - Effect system should emit actual values for tracking

3. **Resource use validation:** `resourceUse` field checked before execution
   - Effect system should separate "costs" from "effects" for pre-validation

4. **Apprenticeship checks:** Some activities call `checkApprenticeship()`
   - Consider as special effect type or pre-execution hook

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Formula parser security | Low | High | Use vetted library, no eval(), limit function set |
| Performance regression | Medium | Medium | Cache parsed formulas, benchmark against current |
| Migration breaks activities | Medium | High | Comprehensive test suite, gradual rollout |
| Rendering doesn't match execution | Medium | Medium | Single definition prevents drift by design |
| Scope creep into DSL | High | High | Strict anti-feature list, code review |

---

## Sources

### Codebase Analysis (PRIMARY)
- `D:\Immortality Idle\src\app\game-state\activity.ts` - Activity interface definition
- `D:\Immortality Idle\src\app\game-state\activity.service.ts` - 50+ activity implementations
- `D:\Immortality Idle\src\app\activity-panel\activity-panel.component.ts` - Current rendering logic

### Effect System Patterns (MEDIUM confidence)
- [Unreal Gameplay Effects Documentation](https://dev.epicgames.com/documentation/en-us/unreal-engine/gameplay-effects-for-the-gameplay-ability-system-in-unreal-engine) - Industry-standard effect system design
- [GAS Documentation (Community)](https://github.com/tranek/GASDocumentation) - Stacking, modifiers, conditions patterns
- [GameDev.net Item System Discussion](https://gamedev.net/forums/topic/634197-item-system-design-patterns/5000152/) - Effect/item separation patterns

### Formula Evaluation (HIGH confidence)
- [expr-eval GitHub](https://github.com/silentmatt/expr-eval) - MIT licensed, well-maintained expression evaluator
- [fparse GitHub](https://github.com/bylexus/fparse) - TypeScript formula parser with memoization

### Data-Driven Design (MEDIUM confidence)
- [Data-Driven Game Object System (GDC 2002)](https://www.gamedevs.org/uploads/data-driven-game-object-system.pdf) - Foundational patterns
- [DEV.to Data-Driven Design Article](https://dev.to/methodox/data-driven-design-leveraging-lessons-from-game-development-in-everyday-software-5512) - Modern application

### Idle Game Patterns (MEDIUM confidence)
- [Machinations: How to Design Idle Games](https://machinations.io/articles/idle-games-and-how-to-design-them) - Core loop design
- [Gamedeveloper: Lessons from First Incremental Game](https://www.gamedeveloper.com/design/lessons-of-my-first-incremental-game) - Skill balancing with effects/parameters separation

### Combinator Patterns (LOW confidence - theoretical)
- [DEV.to Functional Design: Combinators](https://dev.to/gcanti/functional-design-combinators-14pn) - Effect composition patterns
- [Java Design Patterns: Combinator](https://java-design-patterns.com/patterns/combinator/) - Composable behavior building

---

## Appendix: Example Effect Definition

Based on research, here's a proposed effect definition for the Blacksmithing activity (level 1):

```typescript
const blacksmithingLevel1: ActivityEffectDefinition = {
  costs: [
    { type: 'status', name: 'stamina', value: 25 }
  ],
  effects: [
    { type: 'attribute', name: 'strength', value: 0.2 },
    { type: 'attribute', name: 'toughness', value: 0.2 },
    {
      type: 'money',
      formula: 'log2(strength + toughness) + metalLore * 2'
    },
    {
      type: 'chance',
      probability: 0.02,
      modifiers: [
        { condition: { type: 'furniture', slot: 'workbench', id: 'anvil' }, additive: 0.05 }
      ],
      effects: [
        { type: 'attribute', name: 'metalLore', formula: '0.2 * successChance' },
        { type: 'attribute', name: 'fireLore', formula: '0.02 * successChance' },
        {
          type: 'conditional',
          condition: { type: 'inventory', check: 'hasSlots' },
          effects: [
            { type: 'itemConsume', item: 'metal', storeGrade: 'metalGrade' },
            {
              type: 'itemGenerate',
              generator: 'weapon',
              params: {
                power: 'floor(max(pow(log2(metalLore), metalGrade / 160), metalGrade / 10))',
                material: 'metal',
                isBlacksmith: true
              }
            }
          ]
        }
      ]
    },
    {
      type: 'conditional',
      condition: { type: 'flag', name: 'yinYangUnlocked' },
      effects: [
        { type: 'yinYang', yin: 1, yang: 1 }
      ]
    }
  ],
  // Text renderer can generate:
  // Card: "+Str, +Tough, +Money, +Weapon (7%)"
  // Tooltip: "Strength +0.2, Toughness +0.2, Money (formula), 2-7% chance for weapon (with Anvil +5%)"
};
```

This demonstrates the system handling:
- Fixed attribute gains
- Formula-based money
- Conditional probability with modifiers
- Nested conditionals (inventory check inside chance)
- Complex item generation with formulas
- Feature flags (yinYangUnlocked)
