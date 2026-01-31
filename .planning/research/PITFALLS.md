# Domain Pitfalls: Declarative Effect Systems

**Domain:** Angular 18 idle game declarative effect system migration
**Researched:** 2026-01-31
**Confidence:** MEDIUM (based on web research + codebase analysis; patterns are well-documented but specific Angular 18 + game context requires extrapolation)

---

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

---

### Pitfall 1: Type System Over-Engineering

**What goes wrong:** The type system becomes so complex that it's harder to maintain than the original imperative code. Developers spend more time fighting TypeScript than building features. New effect types require "type gymnastics" that only one person understands.

**Why it happens:** TypeScript's advanced features make elaborate type utilities possible. The community celebrates type sophistication, and developers want compile-time exhaustiveness checks. But there's a trap: "Things that should be easy become hard, and things that are hard become `any`." ([Source](https://octomind.dev/blog/navigating-the-typescript-gymnastics-on-developer-dogma-2))

**Consequences:**
- 2-6 months learning curve for advanced types ([Source](https://byteiota.com/typescripts-complexity-trap-when-type-safety-fails/))
- New contributors can't add effect types without deep TypeScript knowledge
- Refactoring becomes terrifying because type errors cascade
- Eventually, frustrated developers use `any` or `as unknown as X` to escape

**Warning signs:**
- Type definitions longer than 10 lines
- Conditional types nested more than 2 levels deep
- `infer` keyword appearing in application code (not library code)
- Mapped types that nobody can explain without reference docs
- Type errors that require 5+ minutes to understand

**Prevention:**
1. **Start simple, add complexity only when bugs prove it necessary.** A discriminated union with 10 members is fine. A generic type that infers handler return types from effect definitions is probably overkill.
2. **Use runtime validation as backup.** TypeScript catches compile-time errors. A simple `assertEffectType(effect)` function catches runtime errors from JSON/save data.
3. **Document types inline.** If a type needs external documentation, it's too complex.
4. **Limit generic depth.** One generic parameter is good. Two is acceptable. Three requires justification.

**Phase mapping:** Core Types phase. Establish complexity ceiling early. If types get complex in prototype, they'll be worse in production.

---

### Pitfall 2: Big Bang Migration Failure Mode

**What goes wrong:** Converting all 50 activities at once means any bug or design flaw affects everything. No fallback exists. Testing coverage is insufficient because the system is new. Launch day becomes a crisis.

**Why it happens:** Big bang feels efficient - one migration, done. But "if something goes wrong, it can have widespread consequences" and "identifying and resolving issues can be more challenging because everything changes simultaneously." ([Source](https://brainhub.eu/library/big-bang-migration-vs-trickle-migration))

**Consequences:**
- A single type design flaw requires touching all 50 activities
- Save game incompatibility breaks all existing players
- Debugging is harder because you can't compare old vs new behavior
- Rollback requires reverting everything

**Warning signs:**
- No working subset exists to test end-to-end
- First real test is "migrate everything and see what breaks"
- No save migration path tested before full migration
- Team hasn't validated the approach on 3-5 representative activities first

**Prevention:**
1. **Validate architecture with 5 representative activities first.** Pick: one simple (Resting), one with formulas (Begging/OddJobs), one with conditionals (Blacksmithing), one with spawning (Hunting), one with progress counters (BuildTower).
2. **Build and test save migration separately.** Before migrating activities, ensure the save/load round-trip works with new effect definitions.
3. **Create a "shadow mode" during development.** Run both old and new systems, compare outputs, alert on divergence.
4. **Have a rollback commit ready.** Tag the last-known-good state before migration begins.

**Phase mapping:** Architecture Validation phase (before full migration). Prove the design works before committing to big bang.

---

### Pitfall 3: Formula Builder Performance Death

**What goes wrong:** Formula builders like `add(log2(attr('charisma')), mult(attr('waterLore'), 5))` look elegant but create performance problems. Each formula execution involves object allocations, function calls, and potentially repeated service lookups. In an idle game running every tick, this compounds.

**Why it happens:** Initial Encoding (representing DSL as data structures) is "harder to optimize (sometimes impossible)" compared to Final Encoding (direct interpretation). ([Source](https://dev.to/effect/building-custom-dsls-in-typescript-29el)) The elegant composability creates overhead.

**Consequences:**
- Noticeable slowdown when running at high speed (10x, 100x)
- Memory pressure from object allocations in hot path
- GC pauses causing frame drops
- Players complain about battery drain on mobile

**Warning signs:**
- Formula evaluation appears in profiler hot paths
- Object allocations during tick processing
- Service lookups (dependency resolution) happening per-formula-evaluation
- Nested formula trees deeper than 3-4 levels

**Prevention:**
1. **Cache formula results aggressively.** Most formulas depend on attributes that change rarely. Invalidate cache only when dependencies change.
2. **Pre-compile formulas.** On activity load, convert formula tree to a closure: `const compiled = (ctx) => Math.log2(ctx.charisma) + ctx.waterLore * 5`. Pay parsing cost once.
3. **Use Angular signals for dependency tracking.** Signals provide built-in caching: "The calculated value is then cached, and if you read it again, it will return the cached value without recalculating." ([Source](https://angular.dev/guide/signals))
4. **Benchmark early with 100x speed.** Don't wait until launch to discover performance problems.

**Phase mapping:** Formula Builder phase. Build with performance in mind from the start. Retrofitting caching is painful.

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt.

---

### Pitfall 4: Handler Registry Becomes God Object

**What goes wrong:** The handler registry accumulates responsibilities: effect execution, rendering (short/long/formula formats), validation, serialization, statistics tracking. Eventually it knows too much and changes ripple everywhere.

**Why it happens:** Registry patterns are convenient. "Each plugin can register itself with the registry upon initialization, allowing the main application to discover and interact with these extensions dynamically." ([Source](https://www.geeksforgeeks.org/system-design/registry-pattern/)) But convenience leads to coupling.

**Warning signs:**
- Registry has methods beyond `register()` and `get()`
- Handlers need to know about other handlers
- Changing render format requires touching executor
- Registry imports grow to include half the codebase

**Prevention:**
1. **Separate registries for separate concerns.** EffectExecutorRegistry, EffectRendererRegistry, EffectValidatorRegistry. They can share effect type definitions but not implementations.
2. **Handlers are leaf nodes.** A handler should depend only on its input effect and the context object. Never on other handlers.
3. **Context object is read-mostly.** The context provides services but handlers don't mutate it. Effects return results; the executor applies them.

**Phase mapping:** Handler Registry phase. Establish boundaries before handlers proliferate.

---

### Pitfall 5: Exhaustive Switch Maintenance Burden

**What goes wrong:** Every switch statement over effect types needs updating when a new effect type is added. The compiler helps find them, but you end up with 15 switch statements that all need the same boilerplate for the new type.

**Why it happens:** Exhaustive matching is a feature, not a bug - it catches missing cases. But "the upfront effort of defining separate types pays off when you refactor. Add a new state to your union, and TypeScript will show you every place you need to handle it." ([Source](https://www.convex.dev/typescript/advanced/type-operators-manipulation/typescript-discriminated-union)) The problem is those places multiply.

**Warning signs:**
- More than 3 switch statements over the same union type
- Copy-paste patterns across switch statements
- New effect type requires touching 10+ files
- Handlers have switch statements inside them

**Prevention:**
1. **Centralize dispatch.** One registry lookup replaces multiple switch statements. Handler classes encapsulate type-specific logic.
2. **Use ts-pattern library.** Provides exhaustive matching with cleaner syntax and better tooling. ([Source](https://github.com/gvergnaud/ts-pattern))
3. **Default handlers for common patterns.** If 80% of effect types render the same way, provide a default renderer and only override for special cases.

**Phase mapping:** Handler Implementation phase. Choose dispatch pattern before implementing handlers.

---

### Pitfall 6: Testing the Wrong Layer

**What goes wrong:** Tests mock everything to test handlers in isolation, but real bugs come from integration - the executor calling the wrong handler, the renderer missing a case, the context providing stale data. Unit tests pass, system breaks.

**Why it happens:** "Developers who want to achieve 100% unit test coverage often can't imagine a world in which they do not use mocks extensively." ([Source](https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a)) But "if there's no logic, there's nothing meaningful to unit test."

**Warning signs:**
- Tests mock the context object so heavily they're testing mocks
- No tests run actual effect definitions through actual executor
- Formula evaluation tests don't use real character state
- Breaking changes don't cause test failures

**Prevention:**
1. **Test the public API, not internals.** Test `executor.execute(activity.effects)` produces expected character state changes.
2. **Use real (test) character state.** Create a `TestCharacterBuilder` that produces valid character state, not mocks.
3. **Integration tests for each activity.** After migration, each activity should have at least one test that runs its effects and asserts outcomes.
4. **Handlers can be pure functions.** If handlers are `(effect, context) => result` with no side effects, they're trivially testable without mocks.

**Phase mapping:** Testing Strategy phase (early). Establish test patterns before writing handlers.

---

### Pitfall 7: Save Format Coupling

**What goes wrong:** Effect definitions are stored in saves (for multi-day activity progress or deferred effects). When effect schema evolves, old saves can't load. Migration code becomes a permanent maintenance burden.

**Why it happens:** "Complications can arise at the boundaries - for example, if you changed a value in the static data that invalidates the dynamic data." ([Source](https://michaelbitzos.com/devblog/demystifying-game-persistence)) Static (code) and dynamic (saves) data have different lifecycles.

**Warning signs:**
- Effect objects serialized directly to JSON
- No version field in save format
- Effect type discriminants are strings that could be renamed
- Schema changes break existing test saves

**Prevention:**
1. **Never serialize effect definitions.** Saves should reference activities by ID, not store effect data.
2. **For deferred effects (multi-day), serialize minimal state.** Store `{ activityId: 'blacksmithing', progress: 0.5 }`, not the full effect definition.
3. **Version the save format.** When loading, check version and run migrations.
4. **Use numeric enums or stable string IDs.** `ActivityType.Blacksmithing` becomes a number in compiled code. Add new types at the end.

**Phase mapping:** Multi-day Activities phase. Design save format before implementing persistence.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

---

### Pitfall 8: Render Format Proliferation

**What goes wrong:** Different UI contexts want different formats: short (`+1 Str`), long (`Increases strength by 1`), tooltip (`Strength +1 (base: 0.5, furniture bonus: +100%)`), accessible (`Strength increases by 1 point`). Each format is a new renderer. Formats drift out of sync.

**Prevention:**
1. **Start with one format.** Add formats only when UI design requires them.
2. **Build formats from primitives.** `formatValue(effect.value)`, `formatAttribute(effect.attribute)` - compose, don't duplicate.
3. **Test format consistency.** Snapshot tests catch drift between formats.

**Phase mapping:** Render Service phase. Establish primitives before adding formats.

---

### Pitfall 9: Conditional Effect Complexity Explosion

**What goes wrong:** Conditionals seem simple: `conditional(hasFurniture('anvil'), bonus(0.1))`. But then you need AND, OR, NOT, nested conditions, conditions that depend on effect results. The conditional system becomes its own language.

**Prevention:**
1. **Flatten when possible.** Instead of `conditional(AND(A, B, C), effect)`, consider separate effects with simpler conditions.
2. **Limit nesting to 2 levels.** `conditional(A, conditional(B, effect))` is the max.
3. **Complex logic stays in activity definition phase.** If you need 5 conditions, maybe that's 5 separate effects with simple guards.

**Phase mapping:** Composable Primitives phase. Define condition complexity ceiling.

---

### Pitfall 10: Statistics Layer Creep

**What goes wrong:** The statistics layer (lastIncome, counters, achievements) starts observing effects. Then it starts modifying effects ("50% bonus on 100th completion"). Then it has its own effect types. Now two systems are interleaved.

**Prevention:**
1. **Statistics are read-only observers.** They observe effect execution results but never modify them.
2. **Achievements trigger separately.** After effect execution, check achievement conditions and grant rewards as a separate step.
3. **Keep statistics service unaware of effect internals.** It sees "money changed by X", not "MoneyEffect with formula Y was executed".

**Phase mapping:** Statistics Integration phase. Draw boundary before implementation.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Core Types | Over-engineering types | Complexity ceiling, document inline |
| Handler Registry | God object accumulation | Separate registries per concern |
| Formula Builders | Performance death | Pre-compile, cache, benchmark at 100x |
| Composable Primitives | Conditional complexity explosion | Limit nesting, flatten when possible |
| Effect Rendering | Format proliferation | Start with one, build from primitives |
| Multi-day Activities | Save format coupling | Serialize IDs not definitions, version saves |
| Full Migration | Big bang failure | Validate architecture with 5 activities first |
| Statistics Layer | Statistics creep | Read-only observers, separate achievement triggers |
| Testing | Testing wrong layer | Test public API, use real character state |

---

## Research Confidence Notes

| Topic | Confidence | Rationale |
|-------|------------|-----------|
| Type system pitfalls | HIGH | Well-documented in TypeScript community, multiple sources agree |
| Big bang migration risks | HIGH | Enterprise patterns, many case studies (Hershey 1999, etc.) |
| Formula performance | MEDIUM | General DSL patterns apply, specific Angular 18 + signals extrapolated |
| Handler registry | MEDIUM | General pattern advice, specific game context extrapolated |
| Save format issues | MEDIUM | Incremental game community wisdom, less formal documentation |
| Testing patterns | MEDIUM | General advice applies, specific effect system context extrapolated |

---

## Sources

### Web Sources (verified across multiple)
- [TypeScript's Complexity Trap](https://byteiota.com/typescripts-complexity-trap-when-type-safety-fails/) - Type gymnastics learning curve
- [Navigating TypeScript Gymnastics](https://octomind.dev/blog/navigating-the-typescript-gymnastics-on-developer-dogma-2) - DHH quote, complexity trap
- [Big Bang vs Trickle Migration](https://brainhub.eu/library/big-bang-migration-vs-trickle-migration) - Migration strategy comparison
- [Building Custom DSLs in TypeScript](https://dev.to/effect/building-custom-dsls-in-typescript-29el) - Initial vs final encoding tradeoffs
- [Angular Signals Guide](https://angular.dev/guide/signals) - Computed signal caching
- [ts-pattern Library](https://github.com/gvergnaud/ts-pattern) - Exhaustive pattern matching
- [Mocking is a Code Smell](https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a) - Testing philosophy
- [Registry Pattern](https://www.geeksforgeeks.org/system-design/registry-pattern/) - Registry anti-patterns
- [Discriminated Unions in TypeScript](https://www.convex.dev/typescript/advanced/type-operators-manipulation/typescript-discriminated-union) - Exhaustive matching
- [Demystifying Game Persistence](https://michaelbitzos.com/devblog/demystifying-game-persistence) - Save format boundaries

### Codebase Analysis
- `activity.service.ts` - ~50 activities with imperative consequence functions
- `activity.ts` - Current Activity interface with `effects` strings and `consequence` functions
- `.planning/DECISIONS.md` - Architecture decisions (handler registry, formula builders, big bang migration)
