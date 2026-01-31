# Requirements: Declarative Effects System

**Defined:** 2026-01-31
**Core Value:** Single source of truth for activity effects - change definition once, execution and display update automatically.

## v1 Requirements

### Core System

- [x] **CORE-01**: Discriminated union types for all effect kinds with exhaustive type checking
- [x] **CORE-02**: Handler registry pattern - each effect type has execute() + render() handler
- [x] **CORE-03**: Formula builder system - same AST executes AND renders to multiple formats
- [x] **CORE-04**: Context object pattern for service access in handlers
- [x] **CORE-05**: Integration with expr-eval library for complex math formulas

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

- [x] **MDAY-01**: Duration field - base duration per activity level
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
| CORE-01 | Phase 2 | Complete |
| CORE-02 | Phase 2 | Complete |
| CORE-03 | Phase 2 | Complete |
| CORE-04 | Phase 2 | Complete |
| CORE-05 | Phase 2 | Complete |
| ATTR-01 | Phase 2 | Pending |
| ATTR-02 | Phase 2 | Pending |
| ATTR-03 | Phase 3 | Pending |
| STAT-01 | Phase 2 | Pending |
| STAT-02 | Phase 3 | Pending |
| STAT-03 | Phase 3 | Pending |
| MONEY-01 | Phase 3 | Pending |
| MONEY-02 | Phase 3 | Pending |
| ITEM-01 | Phase 3 | Pending |
| ITEM-02 | Phase 3 | Pending |
| ITEM-03 | Phase 3 | Pending |
| ITEM-04 | Phase 3 | Pending |
| ITEM-05 | Phase 3 | Pending |
| COND-01 | Phase 3 | Pending |
| COND-02 | Phase 3 | Pending |
| COND-03 | Phase 3 | Pending |
| COND-04 | Phase 3 | Pending |
| COND-05 | Phase 3 | Pending |
| SPEC-01 | Phase 3 | Pending |
| SPEC-02 | Phase 3 | Pending |
| SPEC-03 | Phase 3 | Pending |
| SPEC-04 | Phase 3 | Pending |
| SPEC-05 | Phase 3 | Pending |
| REND-01 | Phase 2 | Pending |
| REND-02 | Phase 2 | Pending |
| REND-03 | Phase 3 | Pending |
| REND-04 | Phase 3 | Pending |
| REND-05 | Phase 3 | Pending |
| REND-06 | Phase 2 | Pending |
| MDAY-01 | Phase 1 | Complete |
| MDAY-02 | Phase 5 | Pending |
| MDAY-03 | Phase 5 | Pending |
| MDAY-04 | Phase 5 | Pending |
| MDAY-05 | Phase 5 | Pending |
| SCHED-01 | Phase 6 | Pending |
| SCHED-02 | Phase 6 | Pending |
| SCHED-03 | Phase 6 | Pending |
| SCHED-04 | Phase 6 | Pending |
| MIG-01 | Phase 4 | Pending |
| MIG-02 | Phase 3 | Pending |
| MIG-03 | Phase 4 | Pending |
| MIG-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 47 total
- Mapped to phases: 47
- Unmapped: 0

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after Phase 2 completion*
