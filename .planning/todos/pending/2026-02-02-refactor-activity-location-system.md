---
created: 2026-02-02T14:59
title: Refactor activity location/visibility system
area: architecture
files:
  - src/app/game-state/activity.service.ts:732-850
  - src/app/game-state/hell.service.ts:1310-1360
  - src/app/game-state/hell.service.ts:1260-1280
---

## Problem

The activity visibility system isn't scalable. Current issues:

1. **Activities scattered across services**: Most on `ActivityService`, hell-specific ones (`burnMoney`, `hellRecruiting`) on `HellService`

2. **Visibility is procedural, not declarative**: Instead of activities having location flags, there's conditional code:
   ```typescript
   if (this.someCondition) {
     newList.push(this.SomeActivity);
   }
   ```

3. **No unified activity registry**: `getActivityList()` constructs arrays by conditionally pushing activities. Each location has separate logic:
   - `ActivityService.getActivityList()` - mortal realm
   - `HellService.getActivityList()` - delegates based on currentHell
   - `HellService.setEnterHellsArray()` - Gates of Hell (special case at currentHell=-1)
   - Each hell's `activities`/`projectionActivities` arrays

4. **Repetition for shared activities**: Adding OddJobs/burnMoney to all hells required editing 18+ `projectionActivities` arrays plus Gates of Hell special handling

5. **projectionOnly flag set dynamically**: The same activity object has `projectionOnly` toggled based on location, rather than location determining how to treat the activity

## Solution

Data-driven approach:

```typescript
interface Activity {
  // ... existing fields
  locations: LocationType[];  // ['mortal', 'gates_of_hell', 'all_hells', 'hell_of_scissors', ...]
  projectionOnlyIn?: LocationType[];  // locations where it's projection-only
}

// Single filter function
getActivityList(location: LocationType): Activity[] {
  return this.allActivities.filter(a =>
    a.unlocked &&
    a.locations.includes(location)
  ).map(a => ({
    ...a,
    projectionOnly: a.projectionOnlyIn?.includes(location) ?? false
  }));
}
```

This would:
- Centralize all activities in one registry
- Make visibility declarative (data, not code)
- Allow adding activities to locations by editing one definition
- Treat Gates of Hell as a normal location (index -1 or dedicated enum)
