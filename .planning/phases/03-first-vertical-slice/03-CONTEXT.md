# Phase 3: First Vertical Slice - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Resting activity works end-to-end with declarative effects. Execution produces same game state changes as old consequence function. Activity card displays rendered effects. This validates the architecture before broader migration.

</domain>

<decisions>
## Implementation Decisions

### Activity Definition Structure
- Effects organized as object with level keys: `effects: { 0: Effect[], 1: Effect[], ... }`
- Replace `consequence` entirely for Resting (not alongside)
- Remove old `effects` (string[]) — rename to `effectsLegacy` for legacy activities
- Remove `consequenceDescription` — renderer in 'long' format replaces it
- Discriminated union: `type Activity = DeclarativeActivity | LegacyActivity`
- Use `never` trick to prevent having both effects and consequence
- Property check for type narrowing: `if (activity.effects)`

### Type System Changes (Phase 2 Updates)
- Rename `type` to `kind` for all effect and condition discriminators
- Standardize value fields to `amount` (AttributeEffect.value → amount, StatusEffect.change → amount)
- Rename condition types: FlagCondition → HasFlag, etc. (Has/Is prefix, no suffix)
- Create GameFlag enum in game-state for type-safe flag references
- Create GameProperty enum + callback mapping for type-safe property accessors
- Update condition.types.ts: add CompareValues condition for yin > yang comparisons
- Implement AND/OR/NOT composite conditions

### Rendering
- Short format: "+25 Sta" — value with sign, abbreviated target
- Long format: "Restores 50 Stamina." — full sentences
- Formula format: "Water Lore x 5 = 5 x 5 = 25" — formula → substitution → result
- Formulas render value only; handlers add target context
- Render with context: evaluate conditions, hide effects where condition not met
- Inline hints for conditionals: "+1 Mana (if unlocked)"
- Group conditional hints once per condition, not per effect
- Red/green coloring for costs vs gains
- Sort effects by type (no explicit sectioning)
- Hide zero-value effects and empty effect arrays
- Computed signals for Angular templates

### Module Structure
- One file per handler: `handlers/status.handler.ts`, etc.
- Stub all 14 handlers (throw 'Not implemented')
- Implement 4 handlers for Resting: StatusHandler, AttributeHandler, YinYangHandler, ConditionalHandler
- Condition evaluator in effects module: `conditions/condition-evaluator.ts`
- EffectExecutor as Angular service: `executor/effect-executor.service.ts`
- EffectRenderService for display: `renderer/effect-renderer.service.ts`
- GameContext class implements EffectContext
- Barrel export exposes everything

### Formula Builders
- Implement all 17 builders (not just what Resting needs)
- Object literals, not classes: `{ evaluate: () => ..., render: () => ... }`
- Add `abbreviation` field to AttributeObject and CharacterStatus types

### Handler Registration
- Static registry object with type-enforced completeness
- Singleton handlers (stateless, reused)
- HandlerRegistry maps effect kinds to handler instances

### Context Building
- Executor creates context internally (not passed from ActivityService)
- GameContext class wraps services, implements EffectContext
- Same context reused for all effects in one activity execution
- Mutations visible to subsequent effects (variables, state changes)

### ActivityService Integration
- Helper method `executeActivity(activity)` handles both paths
- Property check: if effects exist, use executor; else use consequence
- Replace 3 consequence call sites with helper method
- `checkOverage()` called after all effects complete

### Error Handling
- Formula errors (div/0, negative log): throw error
- Compile-time guards when possible (e.g., fixed(0) as divisor)
- Invalid conditions: let it crash (TypeScript catches most at compile time)
- Effect execution: continue + log on error (non-blocking)
- Negative status values: let checkOverage() handle clamping
- No caching for conditions (trivial evaluation, not worth complexity)

### Testing
- Unit tests with mock EffectContext
- Integration tests with real services
- Both approaches for comprehensive coverage

### Claude's Discretion
- Exact spacing and typography in rendered text
- Progress bar implementation details (Phase 6)
- Any unspecified error message wording

</decisions>

<specifics>
## Specific Ideas

- Resting has 4 levels with different effects per level
- Level 3 yin/yang logic: "balance toward lower" → ConditionalEffect with CompareValues
- checkOverage() call placement: once after all effects, in executor
- Abbreviations must exist: add required field, TypeScript fails if missing

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

<cascading>
## Cascading Impacts

These decisions affect future phases:

**Phase 4 (Validation Slice):**
- Inherits all type system changes (kind, amount, condition naming)
- Uses same handler pattern and rendering formats
- Adds handlers for effect types not used by Resting

**Phase 5 (Full Migration):**
- Applies patterns to all ~45 activities
- When complete: remove LegacyActivity type
- Make effects required (no longer optional)
- Delete effectsLegacy and consequence fields from interface

**Phase 6 (Multi-day Logic):**
- Effects structure supports per-level definitions
- Executor may need progress tracking hooks
- Context may need activity progress state

**Phase 7 (Schedule Rework):**
- Duration field ready (Phase 1)
- Completion-based scheduling uses effects system

</cascading>

---

*Phase: 03-first-vertical-slice*
*Context gathered: 2026-01-31*
