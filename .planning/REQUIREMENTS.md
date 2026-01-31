# Requirements: Declarative Effects System

**Defined:** 2026-01-31
**Core Value:** Single source of truth for activity effects - change definition once, execution and display update automatically.

## v1 Requirements

### Core System

- [ ] **CORE-01**: Discriminated union types for all effect kinds with exhaustive type checking
- [ ] **CORE-02**: Handler registry pattern - each effect type has execute() + render() handler
- [ ] **CORE-03**: Formula builder system - same AST executes AND renders to multiple formats
- [ ] **CORE-04**: Context object pattern for service access in handlers
- [ ] **CORE-05**: Integration with expr-eval library for complex math formulas

### Effect Types - Basic

- [ ] **ATTR-01**: Attribute effects - increase attribute by fixed value
- [ ] **ATTR-02**: Attribute effects - increase attribute by formula-computed value
- [ ] **ATTR-03**: Aptitude effects - modify attribute aptitudes
- [ ] **STAT-01**: Status effects - modify current value (health, stamina, mana)
- [ ] **STAT-02**: Status effects - modify max value
- [ ] **STAT-03**: Status effects - special bonuses (healthBonusSoul, magicLifespan)
- [ ] **MONEY-01**: Money effects - fixed amount
- [ ] **MONEY-02**: Money effects - formula-based (scaling with attributes)

### Effect Types - Items

- [ ] **ITEM-01**: Give specific item (guaranteed)
- [ ] **ITEM-02**: Give item with probability
- [ ] **ITEM-03**: Generate equipment (weapon/armor with grade calculation)
- [ ] **ITEM-04**: Generate consumable (potion/pill with grade)
- [ ] **ITEM-05**: Consume item as input (returns grade for crafting)

### Effect Types - Conditional

- [ ] **COND-01**: Feature check conditions (manaUnlocked, yinYangUnlocked, immortal)
- [ ] **COND-02**: Furniture/equipment check conditions
- [ ] **COND-03**: Probability conditions (random chance)
- [ ] **COND-04**: Dynamic selection (weakest lore, weakest stat)
- [ ] **COND-05**: Composite effects - combine multiple primitives

### Effect Types - Special

- [ ] **SPEC-01**: Progress effects (field work, task progress)
- [ ] **SPEC-02**: Spawn enemy effects
- [ ] **SPEC-03**: Spawn follower/pet effects
- [ ] **SPEC-04**: Trigger battle effect
- [ ] **SPEC-05**: Yin/yang modification effects (conditional on unlock)

### Rendering

- [ ] **REND-01**: EffectRenderService with pluggable format handlers
- [ ] **REND-02**: Short format rendering ('+1 Str, +10% Weapon')
- [ ] **REND-03**: Current value computation (show what you'd get now)
- [ ] **REND-04**: Long format rendering ('Increases Strength by 1')
- [ ] **REND-05**: Formula format rendering ('log2(Cha) + Water Lore x 5')
- [ ] **REND-06**: Thin Angular pipes delegating to render service

### Multi-day Activities

- [ ] **MDAY-01**: Duration field - base duration per activity level
- [ ] **MDAY-02**: Duration scaling - optional modifier based on attributes
- [ ] **MDAY-03**: Progress tracking - current day / total days
- [ ] **MDAY-04**: Progress bar display in activity card
- [ ] **MDAY-05**: Effects apply only at completion (not per-day)

### Schedule Rework

- [ ] **SCHED-01**: Completion-based scheduling (repeatTimes = completions)
- [ ] **SCHED-02**: Display format shows both completions and days
- [ ] **SCHED-03**: resetOnInterrupt flag per activity
- [ ] **SCHED-04**: persistAcrossLives flag per activity

### Migration

- [ ] **MIG-01**: Convert all ~50 activities to declarative format
- [ ] **MIG-02**: Validate with 5 representative activities before full migration
- [ ] **MIG-03**: Remove old consequence functions and effects strings
- [ ] **MIG-04**: Handle save format migration (if needed)

## v2 Requirements

### Performance Optimization

- **PERF-01**: Formula pre-compilation and caching
- **PERF-02**: Angular signals integration for reactive values
- **PERF-03**: Benchmark at 100x game speed

### Expansion

- **EXP-01**: Item effect definitions (equipment, consumables)
- **EXP-02**: Furniture effect definitions
- **EXP-03**: Home effect definitions

## Out of Scope

| Feature | Reason |
|---------|--------|
| Escape hatch for custom functions | Always extend type system instead - keeps single source of truth |
| Per-day effects for multi-day activities | Adds complexity, can use 1-day activities instead |
| Partial completion effects | Adds complexity, complete fully or not at all |
| Full DSL/scripting language | Over-engineering - use structured JSON with formula strings |
| Localization | Not needed for current single-language game |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| (To be filled during roadmap creation) | | |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 0
- Unmapped: 38

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after initial definition*
