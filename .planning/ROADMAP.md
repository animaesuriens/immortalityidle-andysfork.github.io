# Roadmap: Declarative Activity Effects System

## Overview

Transform Immortality Idle's ~50 activities from imperative consequence functions to a declarative effects system using vertical slices. Phase 1 adds duration field to all activities (default 1). Phases 2-5 implement declarative effects with vertical slices. Phases 6-7 add multi-day logic and schedule rework.

## Phases

- [x] **Phase 1: Duration Foundation** - Add duration field to all activities (default 1 day)
- [ ] **Phase 2: Interface Design** - Define all type contracts (no implementation)
- [ ] **Phase 3: First Vertical Slice** - ONE activity (Resting) working end-to-end
- [ ] **Phase 4: Validation Slice** - 4 diverse activities stress-testing all effect types
- [ ] **Phase 5: Full Migration** - Apply proven patterns to remaining ~45 activities
- [ ] **Phase 6: Multi-day Logic** - Progress tracking, completion-based effects
- [ ] **Phase 7: Schedule Rework** - Completion-based scheduling (Time panel rework)

## Phase Details

### Phase 1: Duration Foundation
**Goal**: Add duration field to Activity interface and all activity definitions
**Depends on**: Nothing (first phase)
**Requirements**: MDAY-01
**Success Criteria** (what must be TRUE):
  1. Activity interface has `duration` field (number, defaults to 1)
  2. All ~50 activities have duration: 1 in their definitions
  3. Game runs exactly as before (no behavior change yet)
  4. TypeScript compiles with no errors
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md - Add duration field to interface and all 69 activity definitions

### Phase 2: Interface Design
**Goal**: Define all contracts (types, interfaces, handler signatures) without implementation
**Depends on**: Phase 1
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05
**Success Criteria** (what must be TRUE):
  1. Effect union type exists with all effect kinds as discriminated variants
  2. EffectHandler interface defines execute() and render() signatures
  3. Formula builder function signatures exist (attr, add, mult, log2, etc.)
  4. EffectContext interface specifies all service access points
  5. TypeScript compiles with no implementation (stubs/throw only)
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md - Foundation types (Effect, Condition, Formula, Context)
- [ ] 02-02-PLAN.md - Formula builders, handler interface, barrel export

### Phase 3: First Vertical Slice
**Goal**: ONE activity (Resting) works end-to-end with declarative effects
**Depends on**: Phase 2
**Requirements**: ATTR-01, ATTR-02, STAT-01, REND-01, REND-02, REND-06
**Success Criteria** (what must be TRUE):
  1. Resting activity uses declarative effect definition (not consequence function)
  2. Effect execution produces same game state changes as old code
  3. Activity card displays rendered effects (short format)
  4. Adding a new attribute effect requires only definition change (no handler modification)
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Validation Slice
**Goal**: 4 diverse activities validate architecture handles all complexity
**Depends on**: Phase 3
**Requirements**: ATTR-03, STAT-02, STAT-03, MONEY-01, MONEY-02, ITEM-01, ITEM-02, ITEM-03, ITEM-04, ITEM-05, COND-01, COND-02, COND-03, COND-04, COND-05, SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, REND-03, REND-04, REND-05, MIG-02
**Success Criteria** (what must be TRUE):
  1. OddJobs activity works (formula-based money, conditional effects)
  2. Blacksmithing activity works (item consumption, probability, equipment generation)
  3. Hunting activity works (enemy spawning, battle triggering)
  4. BuildTower activity works (progress counters, special effects)
  5. All 4 activities render correctly in short, long, and formula formats
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Full Migration
**Goal**: All ~45 remaining activities converted to declarative format
**Depends on**: Phase 4
**Requirements**: MIG-01, MIG-03, MIG-04
**Success Criteria** (what must be TRUE):
  1. All activities use declarative effect definitions
  2. Old consequence functions and effects strings removed
  3. Existing saves load and work correctly
  4. Game runs at normal and 100x speed without errors
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Multi-day Logic
**Goal**: Activities can span multiple days with progress tracking
**Depends on**: Phase 5
**Requirements**: MDAY-02, MDAY-03, MDAY-04, MDAY-05
**Success Criteria** (what must be TRUE):
  1. Duration scaling works based on attributes (optional modifier)
  2. Activity card shows progress bar (current day / total days)
  3. Effects apply only at completion (not per-day)
  4. Progress persists based on resetOnInterrupt flag
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: Schedule Rework
**Goal**: Time panel uses completion-based scheduling
**Depends on**: Phase 6
**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04
**Success Criteria** (what must be TRUE):
  1. Schedule shows "Blacksmithing x10 (30 days)" format
  2. repeatTimes means completions, not days
  3. resetOnInterrupt flag works per-activity
  4. persistAcrossLives flag works per-activity
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Duration Foundation | 1/1 | Complete | 2026-01-31 |
| 2. Interface Design | 0/2 | In progress | - |
| 3. First Vertical Slice | 0/TBD | Not started | - |
| 4. Validation Slice | 0/TBD | Not started | - |
| 5. Full Migration | 0/TBD | Not started | - |
| 6. Multi-day Logic | 0/TBD | Not started | - |
| 7. Schedule Rework | 0/TBD | Not started | - |

---
*Created: 2026-01-31*
