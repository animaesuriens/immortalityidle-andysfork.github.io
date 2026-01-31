# Declarative Activity Effects System

## What This Is

A refactor of Immortality Idle's activity system from imperative consequence functions to a declarative effects system. Activities will define their effects as structured data that can be both executed and rendered, eliminating duplication between code and display strings. Also includes support for multi-day activities and schedule rework.

## Core Value

Single source of truth for activity effects - change the definition once, both execution and display update automatically.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] Effect type system with union types and exhaustive checking
- [ ] Handler registry pattern for effect execution and rendering
- [ ] Composable effect primitives (conditional, probabilistic, etc.)
- [ ] Formula builder system for computed values
- [ ] EffectRenderService with multiple render formats
- [ ] Thin pipes for template usage (effectShort, effectLong, effectFormula)
- [ ] Multi-day activity support with configurable duration
- [ ] Completion-based scheduling (Time panel rework)
- [ ] Statistics layer for tracking (lastIncome, activity counters)
- [ ] Migrate all existing activities to declarative format
- [ ] Remove old consequence functions and effects strings

### Out of Scope

- Items/equipment/furniture effects — start with activities only, expand later if successful
- Escape hatch for custom functions — always extend type system instead
- Per-day effects for multi-day activities — effects apply at completion only
- Partial completion effects — complete fully or don't get effects

## Context

**Codebase:** Angular 18 idle/incremental game with cultivation theme
**Branch:** andy's-fork
**Key file:** `src/app/game-state/activity.service.ts` - contains ~50 activities with consequence functions

**Current pain point:** Activity effects are defined twice:
1. `effects: ['+Str, +Spd']` - display string (hardcoded)
2. `consequence: [() => { ... }]` - execution code

These can drift out of sync. Declarative system eliminates this.

## Constraints

- **Tech stack**: Angular 18, TypeScript — use standard patterns
- **Testing**: Design for easy mocking with context object pattern
- **Migration**: Big bang — convert all activities at once, no hybrid period
- **Backward compatibility**: Save format may change, handle migration

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Activities only (start narrow) | Reduce scope, validate approach before expanding | — Pending |
| Handler registry pattern | Extensible without modifying core executor | — Pending |
| Union types for effects | Compiler enforces exhaustive handling | — Pending |
| Composable primitives | Fewer building blocks, infinite combinations | — Pending |
| Formula builders | Same definition executes AND renders | — Pending |
| Context object for services | Easy testing with mock context | — Pending |
| Completion-based scheduling | Cleaner mental model than day-based | — Pending |
| Per-activity interrupt flags | Different activities need different behavior | — Pending |

---
*Last updated: 2026-01-31 after initialization*
