# Project Research Summary

**Project:** Declarative Effect System for Immortality Idle
**Domain:** Angular 18 idle game architecture refactoring
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

This refactor transforms Immortality Idle's ~50 activities from imperative consequence functions to a declarative effect system. The core insight: **TypeScript's type system IS your effect framework**. No external effect libraries needed - discriminated unions, formula builders, and a handler registry provide everything required. The single source of truth pattern eliminates drift between execution and display.

The recommended approach uses three layers: (1) Pure data definitions (Effect union types with formula builders), (2) Execution layer (handler registry dispatching to plain handler classes), (3) Rendering layer (same definitions rendered via pipes). This mirrors standard data-driven game design but adapted for TypeScript/Angular. The architecture scales horizontally - adding 100 more activities means 100 more definitions, not 100 more handlers.

Critical risks include type system over-engineering (fighting TypeScript instead of building features), formula performance death (builder overhead in hot paths), and big bang migration failure (no fallback if design flaws surface). Mitigations: establish type complexity ceiling early, pre-compile formulas with caching, validate architecture with 5 representative activities before full migration.

## Key Findings

### Recommended Stack

TypeScript's built-in features provide the entire foundation - no external effect system libraries needed. Discriminated unions create compile-time exhaustive type checking. Formula builders (pure functions returning evaluatable/renderable objects) eliminate execution/display drift. Angular's DI provides service context to handlers via a context object pattern.

**Core technologies:**
- **TypeScript Discriminated Unions**: Effect type definitions - compiler enforces exhaustive handling, new types cause errors where missing
- **Handler Registry Pattern**: Extensible effect processing - map effect types to handler classes, add new types without modifying executor
- **Formula Builders (Custom)**: Single-source-of-truth formulas - `add(log2(attr('charisma')), mult(5))` evaluates AND renders from same definition
- **Angular Services + Pipes**: Integration layer - EffectExecutorService orchestrates execution, EffectRenderService + thin pipes handle display
- **Context Object Pattern**: Testable service access - handlers receive context object, not Angular DI (easier unit testing)

**Optional enhancement:**
- **ts-pattern library**: Cleaner pattern matching syntax than switch statements - only add if code becomes unwieldy (2.5KB bundle cost)

**Explicitly avoid:**
- Formula parser libraries (expr-eval, fparse) - unnecessary when defining in TypeScript, not parsing user input
- Class hierarchies for effects - no compile-time exhaustiveness checking
- External game effect systems - massive overkill for ~50 activities

### Expected Features

The effect system must both execute effects (modify game state) and render them to UI from a single definition. Current pain point: consequence functions duplicate logic in consequenceDescription strings.

**Must have (table stakes):**
- Effect Type Registry - finite set of ~10-15 types (attribute, status, money, item, conditional, chance, progress)
- Single Definition Execution - same JSON/object defines behavior AND display
- Attribute/Status/Money Effects - covers ~90% of current activities
- Formula Evaluator - support formulas like `log2(strength + toughness) + metalLore * 5`
- Basic Conditional Effects - `if manaUnlocked then effects` patterns
- Probability Effects - `chance: 0.1, effects: [...]` for item drops
- Text Renderer - generate `"+0.1 Str, -25 Sta"` from effect definitions

**Should have (competitive):**
- Multi-Format Rendering - tooltip, card summary, detail views from same definition
- Effect Composition - effects wrapping other effects (conditional wraps probability wraps attribute)
- Effect Modifiers - furniture/condition bonuses: `{modifier: 'hasFurniture.anvil', multiply: 1.5}`
- Effect Previews - show expected outcomes before execution (especially for formulas)

**Defer (v2+):**
- Visual Effect Editor - GUI for creating effects (massive undertaking)
- Full Localization - i18n-ready effect strings
- Stacking Rules - how repeated effects combine (complex, low value for idle game)

**Anti-features (do NOT build):**
- Full DSL/Scripting Language - complexity explosion, use structured JSON with formulas only
- Bidirectional Sync - auto-generating code from definitions or vice versa
- Real-Time Effect Streaming - pub/sub is overkill, synchronous execution is fine

### Architecture Approach

Three-layer architecture: definitions (pure data) → execution (services) → rendering (display). Effect types are discriminated unions. Handlers are plain classes (not Angular services) that receive context objects. Registry maps effect types to handlers. Formula builders create objects that both evaluate to numbers and render to strings.

**Major components:**
1. **Effect Types** (`effect.types.ts`) — Union type definitions, imported everywhere, zero service dependencies
2. **Formula Builders** (`formula.ts`) — Pure functions creating evaluatable/renderable formula objects
3. **Handler Registry** (`handler-registry.ts`) — Maps effect types to handler classes, dispatches execution/rendering
4. **Effect Handlers** (`handlers/*.ts`) — Plain classes implementing execute() and render() for one effect type each
5. **Effect Executor Service** — Angular service orchestrating effect execution, builds context from injected game services
6. **Effect Render Service** — Generates display strings, used by thin pipes in templates
7. **Effect Context** — Interface providing handler access to game services without direct DI

**Boundary rules:**
- Handlers are plain classes (not Angular services) - instantiated by registry
- Pipes are thin wrappers - all logic lives in EffectRenderService
- Context is the only bridge to game services - handlers never inject directly
- Types are standalone - no service dependencies, pure TypeScript

**File organization:**
New `src/app/effects/` directory with subdirectories: `types/`, `formulas/`, `handlers/`, `services/`, `pipes/`. Parallel to existing `game-state/` directory. Clean imports, testable in isolation.

### Critical Pitfalls

1. **Type System Over-Engineering** — Complex types become harder to maintain than imperative code. Nested generics, conditional types, `infer` keyword in app code. Learning curve 2-6 months. Prevention: Start simple, document inline, limit generic depth to 2 levels max, use runtime validation as backup.

2. **Big Bang Migration Failure Mode** — Converting all 50 activities at once means any design flaw affects everything. No fallback, insufficient testing, launch crisis. Prevention: Validate architecture with 5 representative activities first (simple, formula, conditional, spawning, progress), build save migration separately, create shadow mode comparing old vs new, tag rollback commit.

3. **Formula Builder Performance Death** — Builder elegance creates overhead in hot paths (object allocations, function calls, service lookups per tick). GC pauses, battery drain. Prevention: Cache formula results aggressively, pre-compile formulas to closures on load, use Angular signals for dependency tracking, benchmark at 100x speed early.

4. **Handler Registry Becomes God Object** — Registry accumulates execution, rendering, validation, serialization, statistics. Prevention: Separate registries per concern, handlers are leaf nodes depending only on input + context, context is read-mostly.

5. **Exhaustive Switch Maintenance Burden** — Every switch over effect types needs updating when adding new type. 15 switch statements all need boilerplate. Prevention: Centralize dispatch in registry (one lookup replaces switches), use ts-pattern library, default handlers for common patterns.

## Implications for Roadmap

Based on research, suggested phase structure follows dependency order: types → formulas → handlers → integration → migration.

### Phase 1: Core Types & Formulas
**Rationale:** Foundation for everything else. Types have zero dependencies (pure TypeScript). Formulas depend only on types. Can build and test in isolation before touching existing code.

**Delivers:**
- Effect union type definitions (AttributeEffect, StatusEffect, MoneyEffect, ItemEffect, ConditionalEffect, etc.)
- Formula type definitions and builder functions (attr, log2, add, mult, etc.)
- Formula evaluator and renderer (evaluate to number, render to string)
- Condition system types and builders (comparison, hasItem, hasFurniture, and/or/not)

**Addresses:**
- Effect Type Registry (must-have)
- Formula Evaluator (must-have)

**Avoids:**
- Type System Over-Engineering (establish complexity ceiling now)

**Research needed:** None - TypeScript patterns are well-documented, architecture is proven.

### Phase 2: Handler Registry & Basic Handlers
**Rationale:** Registry provides extensibility. Start with simple handlers (attribute, status, money) to prove the pattern before complex ones (conditional, probability). Handlers are plain classes with no Angular dependencies - fast to iterate.

**Delivers:**
- EffectHandler interface with execute() and render() methods
- HandlerRegistry class with register() and get()
- AttributeHandler, StatusHandler, MoneyHandler (cover ~70% of current activities)
- Mock EffectContext for testing

**Addresses:**
- Single Definition Execution (must-have)
- Attribute/Status/Money Effects (must-have)

**Avoids:**
- Handler Registry Becomes God Object (separate concerns from start)

**Research needed:** None - handler pattern is standard.

### Phase 3: Complex Handlers & Composition
**Rationale:** Build on proven handler pattern. Conditional and probability effects wrap other effects (composition). Item handlers need special handling for generation. Progress handlers integrate with existing task system.

**Delivers:**
- ConditionalHandler (if/then/else effects)
- ProbabilityHandler (chance-based effects)
- ItemHandler (add, consume, generate weapons/potions)
- ProgressHandler (task counters)
- SpawnHandler (enemies, followers)

**Addresses:**
- Basic Conditional Effects (must-have)
- Probability Effects (must-have)
- Effect Composition (should-have)

**Avoids:**
- Conditional Effect Complexity Explosion (limit nesting to 2 levels)

**Research needed:** Minimal - item generation formulas may need validation with existing ItemRepoService patterns.

### Phase 4: Angular Integration Services
**Rationale:** Handlers exist but need Angular integration. Executor service builds real context from injected game services. Render service provides template-friendly API. Thin pipes wrap render service.

**Delivers:**
- EffectContext implementation (real service references)
- EffectExecutorService (orchestrates execution)
- EffectRenderService (multi-format rendering)
- EffectShortPipe, EffectLongPipe, EffectFormulaPipe

**Addresses:**
- Text Renderer (must-have)
- Multi-Format Rendering (should-have)

**Avoids:**
- Testing Wrong Layer (test services with real character state, not heavy mocks)

**Research needed:** None - Angular service patterns are standard, context object pattern is proven.

### Phase 5: Activity Migration (Incremental)
**Rationale:** Validate architecture with 5 representative activities before full migration. Shadow mode compares old vs new outputs. Catch design flaws before committing to big bang.

**Delivers:**
- Resting activity (simplest - just attribute changes)
- Begging/OddJobs (formulas for money)
- Blacksmithing (conditionals, probability, item generation)
- Hunting (spawning effects)
- BuildTower (progress counters)
- Shadow mode executor comparing outcomes

**Addresses:**
- Backward Compatibility Layer (must-have during migration)

**Avoids:**
- Big Bang Migration Failure Mode (prove design works first)

**Research needed:** None - validation only.

### Phase 6: Full Migration & Cleanup
**Rationale:** Architecture validated, proceed with converting remaining ~45 activities. Remove old consequence functions, effects strings, shadow mode. One-way door.

**Delivers:**
- All 50+ activities converted to effect definitions
- consequence and effects fields removed from Activity interface
- Shadow mode removed
- Save migration tested (though effects aren't serialized, activity IDs remain stable)

**Addresses:**
- Complete transition to declarative system

**Avoids:**
- Save Format Coupling (never serialize effect definitions, only activity IDs)

**Research needed:** None - mechanical conversion.

### Phase 7: Performance Optimization
**Rationale:** With all activities converted, profile at 100x speed. Add caching, pre-compilation, signal integration as needed. This phase may reveal nothing needed or may require significant work - depends on profiling.

**Delivers:**
- Formula result caching with dependency tracking
- Pre-compiled formula closures
- Angular signal integration for reactive formula evaluation
- Performance benchmarks

**Addresses:**
- Effect Previews (should-have, requires efficient formula evaluation)
- Effect Modifiers (should-have, bonus calculations)

**Avoids:**
- Formula Builder Performance Death (measure before optimizing)

**Research needed:** Moderate - Angular signals integration patterns may need validation if used.

### Phase Ordering Rationale

- **Types first** because they have zero dependencies and establish vocabulary for everything else
- **Formulas immediately after** because handlers need them, and they depend only on types
- **Simple handlers before complex** to prove the pattern incrementally (AttributeHandler is 20 lines, ConditionalHandler is 100+)
- **Services after handlers** because services orchestrate handlers, not vice versa
- **Validation before migration** to catch design flaws when they're cheap to fix
- **Performance last** because premature optimization is wasteful - measure after migration

Dependencies enforce this order: Handlers → Registry → Executor → Migration is a strict chain. Formulas and Types can parallelize but everything depends on them.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 7 (Performance):** Angular signals integration is new in Angular 18, may need API research if signals used for formula dependency tracking

**Phases with standard patterns (skip research-phase):**
- **Phase 1-6:** All use well-documented TypeScript, Angular service, and handler registry patterns. Existing codebase provides all context needed (activity definitions, service interfaces).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | TypeScript discriminated unions, handler registries, Angular services are all established patterns with official documentation |
| Features | HIGH | Derived directly from codebase analysis of 50+ existing activities - requirements are grounded in real usage |
| Architecture | HIGH | Three-layer architecture (data/execution/rendering) is standard for data-driven systems; verified against Angular DI patterns |
| Pitfalls | MEDIUM | Type over-engineering, migration risks, and performance issues are well-documented generally but specific Angular 18 + game context extrapolated |

**Overall confidence:** HIGH

The research is grounded in official TypeScript/Angular documentation plus thorough analysis of the existing codebase. The primary uncertainty is performance (formula builder overhead), but this is addressable via profiling and optimization in Phase 7.

### Gaps to Address

**Formula performance characteristics**
- Gap: Don't know if formula builders will create performance issues in practice
- Handle: Phase 7 benchmarks at 100x speed, optimize only if profiling shows problems
- Risk: Low - can always fall back to pre-compiled closures if needed

**Angular signals integration patterns**
- Gap: Signals are new in Angular 18, less documentation on formula dependency tracking use case
- Handle: Research during Phase 7 only if performance requires it (may not be needed)
- Risk: Low - this is optional optimization, not critical path

**Save migration testing**
- Gap: Don't know if any edge cases exist in save format interactions
- Handle: Test save round-trips in Phase 5 before full migration
- Risk: Low - effects aren't serialized, only activity IDs (which remain stable)

## Sources

### Primary (HIGH confidence)
- TypeScript Official Docs - Discriminated unions, type narrowing, exhaustive checking
- Angular 18 Docs - Services, DI, pipes, signals
- Codebase analysis - `activity.ts`, `activity.service.ts`, 50+ activity implementations

### Secondary (MEDIUM confidence)
- TypeScript Playground examples - Practical discriminated union patterns
- Angular community guides - Pure pipe performance, service patterns
- Handler Registry Pattern docs - GeeksforGeeks, io.digital function registry
- Data-driven game design articles - GDC talks, incremental game wisdom

### Tertiary (LOW confidence - context extrapolated)
- ts-pattern library - Optional enhancement, not critical path
- Game effect system comparisons - Unreal GAS documentation for stacking/modifier patterns
- Performance optimization articles - General DSL optimization applied to formula builders

---
*Research completed: 2026-01-31*
*Ready for roadmap: yes*
