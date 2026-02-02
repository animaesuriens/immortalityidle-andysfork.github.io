---
created: 2026-02-02T18:51
title: Restructure consumables with unified type system
area: architecture
files:
  - src/app/game-state/item-repo.service.ts
  - src/app/game-state/inventory.service.ts
  - src/app/game-state/consumable-tracking.ts
---

## Problem

Consumables (foods, potions, pills) have inconsistent structures:
- Foods: items with `useConsumes: true` and individual `use()` functions, no type field
- Potions: `type: 'potion'` with `attribute` field, dynamically generated
- Pills: `type: 'pill'` with `effect` field, dynamically generated

This makes tracking scattered - each consumable type needs separate tracking logic. Adding new consumable types requires updating multiple places.

## Solution

Add consistent structure to all consumables:

```typescript
interface Consumable extends Item {
  type: 'food' | 'potion' | 'pill' | ...; // extensible
  consumableId: ConsumableId;  // for tracking
}
```

Then:
1. Add `type: 'food'` and `consumableId` to all 14 food definitions
2. Update potion/pill generation to include `consumableId`
3. Create centralized `useConsumable()` that handles tracking + effects automatically
4. Remove/simplify individual `use()` functions

This makes tracking automatic and adding new consumable types simpler.
