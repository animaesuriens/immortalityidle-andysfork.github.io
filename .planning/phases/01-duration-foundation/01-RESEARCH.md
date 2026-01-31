# Phase 1: Duration Foundation - Research

**Researched:** 2026-01-31
**Domain:** TypeScript interface extension, Angular/TypeScript codebase migration
**Confidence:** HIGH

## Summary

This phase adds a required `duration` field to the Activity interface and all ~69 activity definitions across two files. The codebase uses TypeScript 5.4 with strict mode enabled, meaning once the interface is updated, the compiler will enforce that all activity definitions include the field.

The approach is straightforward: modify the interface, then systematically add `duration: 1` to every activity object literal. No behavioral changes occur - this is pure data scaffolding for future multi-day activity support.

**Primary recommendation:** Add the duration field to the Activity interface, then use TypeScript compiler errors to identify all locations requiring updates. Add `duration: 1` to each activity definition between behavioral fields (like `activityType`) and effect fields (like `consequenceDescription`).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.4.2 | Type enforcement | Already in project, strict mode enabled |
| Angular | ^18.0.0 | Framework | Already in project |

### Supporting

No additional libraries needed. This is a pure TypeScript interface modification.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Required field | Optional field with default | REJECTED per CONTEXT.md - user wants explicit values on all activities |
| Single file edit | Script-based migration | OVERKILL for ~69 activities - manual is safer for one-time change |

## Architecture Patterns

### Recommended Edit Structure

Activities are defined as object literals implementing the `Activity` interface. The pattern is:

```typescript
// Current pattern
this.ActivityName = {
  level: 0,
  name: ['Activity Name'],
  imageBaseName: 'activityname',
  activityType: ActivityType.ActivityName,
  description: ['...'],
  consequenceDescription: ['...'],
  effects: ['...'],
  consequence: [() => { ... }],
  // ... other fields
};
```

Duration should be inserted after `activityType` (which defines WHAT the activity is) and before `description` (which describes effects):

```typescript
// Target pattern
this.ActivityName = {
  level: 0,
  name: ['Activity Name'],
  imageBaseName: 'activityname',
  activityType: ActivityType.ActivityName,
  duration: 1,  // NEW: days to complete
  description: ['...'],
  // ... rest unchanged
};
```

### Activity Definition Locations

Activities are defined in two files:

1. **`src/app/game-state/activity.service.ts`** - 46 static activity definitions
2. **`src/app/game-state/hell.service.ts`** - 23 activity definitions (20 static + 3 dynamic)

Dynamic activities (created at runtime):
- `flee()` method returns an activity object
- `setEnterHellsArray()` creates Hell portal activities and FinishHell activity

### Anti-Patterns to Avoid

- **Adding optional field with default:** User explicitly decided against this - wants explicit `duration: 1` on every activity
- **Fractional durations:** User explicitly decided integers only - no 0.5, 1.5, etc.
- **Changing behavior:** This phase is scaffolding only - no logic changes to how activities execute

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding all activities | Manual file search | TypeScript compiler errors | Compiler will identify every missing field |
| Validation | Runtime checks | TypeScript strict mode | Already enabled, guarantees compile-time safety |

**Key insight:** TypeScript strict mode is already enabled. Once the interface is modified, the compiler becomes the exhaustive checker - every activity missing `duration` will cause a compile error.

## Common Pitfalls

### Pitfall 1: Missing Dynamic Activities

**What goes wrong:** Forgetting activities created at runtime in hell.service.ts
**Why it happens:** Most activities are static class properties, but 3 are created in methods
**How to avoid:** Compiler errors will catch these - `flee()`, `setEnterHellsArray()` both return Activity objects
**Warning signs:** Compile errors in methods, not just property assignments

### Pitfall 2: Interface vs Implementation Order

**What goes wrong:** Placing duration field at different positions in interface vs implementations
**Why it happens:** TypeScript doesn't enforce field order, just presence
**How to avoid:** Define consistent placement rule (after activityType, before description) and follow it
**Warning signs:** Code review inconsistency

### Pitfall 3: Type Widening

**What goes wrong:** Using `number` type allows floats (1.5, 0.5)
**Why it happens:** TypeScript `number` includes all numeric values
**How to avoid:** For Phase 1, `number` is acceptable since all values are literal `1`. Future phases may want a branded type or validation.
**Warning signs:** None in this phase - becomes relevant when durations vary

## Code Examples

### Interface Modification

```typescript
// Source: src/app/game-state/activity.ts
export interface Activity {
  name: string[];
  imageBaseName?: string;
  level: number;
  activityType: ActivityType;
  duration: number;  // NEW: base duration in days
  description: string[];
  consequenceDescription: string[];
  // ... rest unchanged
}
```

### Static Activity Definition

```typescript
// Source: src/app/game-state/activity.service.ts
this.OddJobs = {
  level: 0,
  name: ['Odd Jobs'],
  imageBaseName: 'oddjobs',
  activityType: ActivityType.OddJobs,
  duration: 1,  // NEW
  description: [oddJobsDescription],
  consequenceDescription: [
    'Uses 5 Stamina. Increases all your basic attributes by a small amount and provides a little money.',
  ],
  // ... rest unchanged
};
```

### Dynamic Activity Definition (flee method)

```typescript
// Source: src/app/game-state/hell.service.ts
flee(): Activity {
  return {
    level: 0,
    name: ['Escape from this hell'],
    activityType: ActivityType.EscapeHell,
    duration: 1,  // NEW
    description: ["Return to the gates of Lord Yama's realm."],
    // ... rest unchanged
  };
}
```

### Dynamic Activity Definition (setEnterHellsArray method)

```typescript
// Source: src/app/game-state/hell.service.ts
// Inside setEnterHellsArray():
newList.push({
  level: 0,
  name: [hell.name],
  activityType: ActivityType.Hell + hell.index,
  duration: 1,  // NEW
  description: [hell.description],
  // ... rest unchanged
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A | N/A | N/A | This is new functionality |

No deprecated patterns to avoid - this is greenfield addition to existing interface.

## Open Questions

1. **Field documentation**
   - What we know: TypeScript JSDoc comments work for intellisense
   - What's unclear: Project doesn't consistently use JSDoc on interface fields
   - Recommendation: Check existing pattern in Activity interface (some fields have comments, e.g., `effects`). Follow existing convention.

2. **Exact activity count**
   - What we know: grep shows 46 in activity.service.ts, 23 in hell.service.ts = 69 total
   - What's unclear: Some may be duplicates or overrides
   - Recommendation: Let compiler be the source of truth. Fix all errors = complete.

## Sources

### Primary (HIGH confidence)
- `src/app/game-state/activity.ts` - Activity interface definition (lines 78-97)
- `src/app/game-state/activity.service.ts` - All static activity definitions
- `src/app/game-state/hell.service.ts` - Hell-related activity definitions
- `tsconfig.json` - Confirmed strict mode enabled

### Secondary (MEDIUM confidence)
- Package.json - TypeScript version ~5.4.2, Angular ^18.0.0

### Tertiary (LOW confidence)
- None required - all research verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified from package.json and codebase
- Architecture: HIGH - verified from reading actual source files
- Pitfalls: HIGH - derived from codebase structure analysis

**Research date:** 2026-01-31
**Valid until:** Indefinite (codebase-specific, not time-sensitive)

---

## Implementation Checklist

For planner reference, the complete list of changes:

1. **Interface update** (`activity.ts`)
   - Add `duration: number;` after `activityType: ActivityType;`

2. **Static activities** (`activity.service.ts`) - 46 definitions
   - All named properties like `this.OddJobs`, `this.Resting`, etc.

3. **Static activities** (`hell.service.ts`) - 20 definitions
   - `burnMoney`, `hellRecruiting`, `rehabilitation`, `honorAncestors`
   - `copperMining`, `forgeHammer`, `climbMountain`, `attackClimbers`
   - `meltMountain`, `freezeMountain`, `healAnimals`, `liftBoulder`
   - `swim`, `searchForExit`, `teachTheWay`, `interrogate`
   - `recoverTreasure`, `replaceTreasure`, `endure`, `examineContracts`

4. **Dynamic activities** (`hell.service.ts`) - 3 locations
   - `flee()` method return object
   - `setEnterHellsArray()` - Hell portal activity object literal
   - `setEnterHellsArray()` - FinishHell activity object literal

Total: 69 activity definitions + 1 interface
