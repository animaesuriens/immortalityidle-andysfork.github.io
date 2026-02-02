---
created: 2026-02-02T17:59
title: Enforce bonus tracking through functions
area: architecture
files:
  - src/app/game-state/bonus-food.ts
  - src/app/game-state/character.ts
  - src/app/game-state/item-repo.service.ts
---

## Problem

Current food bonus tracking system has a gap: TypeScript enforces that tracked foods have counters and that tracking calls use valid IDs, but it cannot enforce that developers actually call the tracking functions when modifying `healthBonusFood`, `staminaBonusFood`, `nourishmentBonusFood`, or `foodLifespan`.

A developer could add a new food item that does `healthBonusFood += quantity` without:
1. Adding the food to `BONUS_FOOD_IDS`
2. Calling `trackBonusFoodEaten()`
3. Calling `trackBonusFoodTrigger()`

TypeScript has no way to detect this pattern violation.

## Solution

Refactor so bonuses can ONLY be applied through tracked functions. Instead of:

```typescript
this.characterService.characterState.healthBonusFood += quantity;
this.characterService.characterState.trackBonusFoodTrigger(foodId, 'health', quantity);
```

Make it:

```typescript
this.characterService.characterState.applyFoodBonus(foodId, 'health', quantity);
// This function internally updates healthBonusFood AND tracks the trigger
```

This would:
- Make the bonus fields private/readonly from outside
- Provide `applyFoodBonus(foodId, bonusType, amount)` as the only way to modify them
- Automatically track triggers when bonuses are applied
- TypeScript enforces `foodId` is valid via the function signature

Trade-off: More invasive refactor, but closes the enforcement gap completely.
