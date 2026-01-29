# Codebase Concerns

**Analysis Date:** 2026-01-29

## Tech Debt

**Auto-save feature disabled:**
- Issue: Auto-save functionality is completely disabled with a TODO comment
- Files: `src/app/game-state/game-state.service.ts` (lines 148-154)
- Impact: Players lose progress if browser crashes or closes. Data is only saved on manual export/import.
- Fix approach: Implement periodic auto-save when "UI improvements are finalized" per TODO comment. Should throttle saves to avoid excessive localStorage writes.

**Attribute aptitude multiplier recalculation on every frame:**
- Issue: `getAptitudeMultipier()` is called every frame (25ms) with complex exponential math including `Math.pow()` and `Math.log()` operations
- Files: `src/app/game-state/character.ts` (lines 601-652), called from `character.ts` (line 127)
- Impact: Expensive repeated calculations. The TODO at line 601 acknowledges this should be cached on aptitude change instead.
- Fix approach: Cache multiplier values in an object keyed by aptitude ranges. Recalculate only when aptitude or empowerment changes, not every frame.

**Hardcoded tuning constants scattered throughout codebase:**
- Issue: 19+ "TODO: tune this" comments indicating balance parameters were never finalized
- Files:
  - `src/app/game-state/achievement.service.ts` (lines 243, 257)
  - `src/app/game-state/activity.service.ts` (lines 3612, 3624)
  - `src/app/game-state/battle.service.ts` (lines 243, 361, 389, 624)
  - `src/app/game-state/character.ts` (line 648)
  - `src/app/game-state/followers.service.ts` (line 281)
  - `src/app/game-state/hell.service.ts` (lines 540, 579, 731, 852, 968, 1697, 1725, 1832, 2009, 2052, 2114)
- Impact: Game balance is likely suboptimal. Many progression gates and item generation rates were never properly balanced.
- Fix approach: Create a game-balance config file with centralized tuning constants. Add tracking to see which constants affect player progression most.

**Generator activity definitions use @ts-ignore decorators:**
- Issue: 44 activity properties decorated with `// @ts-ignore` to suppress TypeScript initialization warnings
- Files: `src/app/game-state/activity.service.ts` (lines 814-914)
- Impact: Type safety is compromised. Properties may not initialize properly. Makes refactoring risky.
- Fix approach: Initialize all Activity properties in constructor or use a factory pattern. Remove all `@ts-ignore` decorators.

## Known Bugs

**Follower job execution may not run for jobs that need per-tick execution:**
- Issue: TODO comment indicates jobs with `runEachTick: true` requirement may not execute properly
- Files: `src/app/game-state/followers.service.ts` (line 281)
- Impact: Hunter and Farmer followers may accumulate items in batches rather than continuously, causing gameplay discrepancies.
- Workaround: Avoid relying on precise follower production timing in low-speed modes.

**Activity loop may enter infinite pause state:**
- Issue: ActivityService can pause indefinitely if it loops through all activities without finding valid options
- Files: `src/app/game-state/activity.service.ts` (lines 287, 340)
- Impact: Player gets stuck needing manual resume. Activity loop logic is fragile.
- Workaround: Manually resume game from time panel.

## Security Considerations

**Exposed GameStateService on window object:**
- Risk: `window.GameStateService = this` allows any script to manipulate game state
- Files: `src/app/game-state/game-state.service.ts` (line 147)
- Current mitigation: None. This appears intentional for debugging.
- Recommendations: Remove in production build or wrap with development-only checks. Add warning about cheat vulnerability.

**Hard-coded anti-piracy check with poor fallback:**
- Risk: `getDeploymentFlavor()` throws error if game is hosted anywhere except official GitHub pages, which might break gameplay
- Files: `src/app/game-state/game-state.service.ts` (lines 453-466)
- Current mitigation: Only checks specific URLs
- Recommendations: Use more graceful fallback. Allow localhost and provide clear error messaging. Consider removing if not actively fighting piracy.

**LocalStorage used for all persistent data:**
- Risk: LocalStorage has ~5-10MB limit depending on browser. Large game states (with many followers/items) risk exceeding quota.
- Files: Multiple files use `window.localStorage` directly
- Current mitigation: Compression on export (uses `btoa(encodeURIComponent())`)
- Recommendations: Monitor save file sizes as game grows. Consider switching to IndexedDB for larger capacity.

**Backup save system creates duplicate data:**
- Risk: Every save creates a BACKUP key which doubles storage usage
- Files: `src/app/game-state/game-state.service.ts` (lines 267-275)
- Current mitigation: Only one backup stored at a time
- Recommendations: Use versioning or separate storage for backups instead of duplicating in localStorage.

## Performance Bottlenecks

**Main loop frame calculations execute Math operations every 25ms:**
- Problem: `getTPS()` method performs `Math.pow()`, `Math.sqrt()`, and conditional logic on every frame
- Files: `src/app/game-state/main-loop.service.ts` (lines 301-323)
- Cause: TPS (ticks per second) varies by age/playtime speed unlocks but is recalculated constantly
- Improvement path: Cache TPS value and only recalculate when a speed multiplier changes (age reached milestone, playtime increases).

**Complex weapon/armor generation in item repo:**
- Problem: Item generation involves multiple string concatenations and lookups from large arrays
- Files: `src/app/game-state/item-repo.service.ts` (2846 lines)
- Cause: Item generation happens frequently during gameplay
- Improvement path: Pre-generate common items or use object pools. Cache generated items by stats hash.

**Activity service is 3633 lines with monolithic defineActivities():**
- Problem: Single method defines 40+ activity types with hundreds of properties each
- Files: `src/app/game-state/activity.service.ts` (entire file)
- Cause: All activity logic centralized in one massive service
- Improvement path: Extract activity definitions to separate files. Use factory pattern or configuration-driven approach.

**Character aptitude scaling uses exponential functions in hot path:**
- Problem: `increaseAptitudeDaily()` and `getAptitudeMultipier()` called every tick for 14 attributes
- Files: `src/app/game-state/character.ts` (lines 683-693, 601-652)
- Cause: Need to recalculate attribute values based on complex scaling curves
- Improvement path: Cache and interpolate. Store pre-calculated lookup tables for common aptitude ranges.

## Fragile Areas

**Activity loop logic with activity switching:**
- Files: `src/app/game-state/activity.service.ts` (lines 145-350)
- Why fragile: Complex state management with multiple exit conditions. currentIndex, currentTickCount, currentLoopEntry, currentApprenticeship need careful synchronization. Loop entry parsing is error-prone.
- Safe modification: Add detailed logging of state transitions. Create unit tests for each activity loop edge case (death, apprenticeship complete, activity finish, pause).
- Test coverage: Minimal. No tests verify activity loop state transitions.

**Follower job system with dynamic property assignment:**
- Files: `src/app/game-state/followers.service.ts` (lines 100-300, entire jobs object)
- Why fragile: Jobs are defined as `{ [key: string]: {...} }` map. Property access is not type-checked. Adding new job types requires careful synchronization with `unlockedHiddenJobs` array.
- Safe modification: Create strict interface for job definition. Use factory to create job objects. Add validation that all required properties exist.
- Test coverage: No tests for job execution or property validation.

**ItemStack restoration from JSON:**
- Files: `src/app/game-state/game-state.service.ts` (lines 333-341)
- Why fragile: After JSON deserialization, item functions are lost. Restoration iterates all item stacks searching by ID and reassigns item reference. If ItemRepoService item changes, loaded stacks silently lose functionality.
- Safe modification: Use custom deserializer that validates item references. Log warnings if items not found in repo.
- Test coverage: Not tested.

**Character death and life summary dialog flow:**
- Files: `src/app/game-state/character.service.ts` (lines 120-140), `src/app/life-summary/life-summary.component.ts`
- Why fragile: Death triggers multiple state changes (showLifeSummary flag, life reset, cleanup) across different services. Dialog close might not trigger cleanup properly.
- Safe modification: Use callback/promise to ensure cleanup happens. Make life summary a required modal (no dismiss without action).
- Test coverage: No tests for death flow or life summary interaction.

## Scaling Limits

**LocalStorage capacity for saves:**
- Current capacity: Browser-dependent (typically 5-10MB)
- Limit: Game with thousands of followers and items may exceed quota
- Impact: Save failure, data loss
- Scaling path: Migrate to IndexedDB (50MB+), implement compression, prune old log entries, separate save file into multiple chunks.

**Component rendering with large follower/item lists:**
- Current capacity: Can display ~100-200 followers/items before slowdown
- Limit: Angular change detection and DOM manipulation become bottleneck
- Impact: Inventory and Followers panels lag when scrolling with large lists
- Scaling path: Implement virtual scrolling (CDK virtual-scroller). Lazy-load item details. Virtualize follower list rendering.

**Activity loop iteration when many activities unlocked:**
- Current capacity: ~40 activities defined
- Limit: If activity unlocks continue to scale, loop finding next valid activity becomes O(n)
- Impact: Activity switching might stutter with 50+ activities
- Scaling path: Index activities by type. Pre-filter available activities based on requirements.

## Dependencies at Risk

**RxJS ~7.5.0 (outdated minor version):**
- Risk: Package is several minor versions behind current RxJS 7.x. May have memory leaks or performance issues fixed in later patches.
- Impact: Potential memory leaks from subscriptions. Performance regression.
- Migration plan: Update to latest RxJS 7.x patch. Review all subscriptions for proper cleanup using takeUntil or async pipe.

**Angular Material 17.3.0 with Angular 18.0.0 version mismatch:**
- Risk: Angular Material is one major version behind Angular. May have compatibility issues or miss bug fixes.
- Impact: Unexpected layout shifts, accessibility issues, missing features.
- Migration plan: Update Angular Material to 18.x to match Angular version.

**@angular-eslint still in alpha (18.0.0-alpha.16):**
- Risk: Alpha versions may have breaking changes or undiscovered bugs.
- Impact: Linting may become inconsistent. Rules may change unexpectedly.
- Migration plan: Move to stable @angular-eslint 18.x when available.

## Missing Critical Features

**No data backup/cloud save system:**
- Problem: Players who lose browser data lose entire game progress. Only manual export/import available.
- Blocks: Can't reliably preserve progress across device changes or browser reinstalls.
- Recommendation: Implement cloud save with GitHub Gist, or at minimum provide automatic backup download option.

**No activity execution history or rollback:**
- Problem: If activity loop makes wrong choices, no way to see what happened or undo.
- Blocks: Difficult to debug activity loop issues or recover from perceived stuck states.
- Recommendation: Log activity loop decisions with timestamps. Provide activity history viewer.

**No performance profiling tools:**
- Problem: Can't easily identify which activities/calculations are slow without browser DevTools.
- Blocks: Optimizing performance requires manual investigation.
- Recommendation: Add debug panel showing FPS, TPS, and per-component calculation times.

## Test Coverage Gaps

**No tests for game state persistence:**
- What's not tested: Save/load cycle, backup restore, legacy save migration, compression round-trip
- Files: `src/app/game-state/game-state.service.ts`
- Risk: Save corruption could go unnoticed until players report data loss
- Priority: High - data integrity is critical

**No tests for activity loop state machine:**
- What's not tested: Activity transitions, pause/resume, apprenticeship flow, loop entry parsing
- Files: `src/app/game-state/activity.service.ts`
- Risk: Activity loop bugs affect core gameplay and are hard to diagnose
- Priority: High - affects all players

**No tests for follower job execution:**
- What's not tested: Job work() functions, power calculations, per-tick vs batched execution
- Files: `src/app/game-state/followers.service.ts`
- Risk: Follower balance broken silently
- Priority: Medium - affects progression balance

**No tests for character death and resurrection:**
- What's not tested: Death state transitions, blood rank application, attribute reset, achievement unlock on death
- Files: `src/app/game-state/character.service.ts`, `src/app/game-state/character.ts`
- Risk: Death penalties might not apply correctly, breaking balance
- Priority: High - core game mechanic

**No integration tests for main game loop:**
- What's not tested: Full tick cycle with all services subscribing and updating state
- Files: `src/app/game-state/main-loop.service.ts`
- Risk: Subscription order issues or state update conflicts go unnoticed
- Priority: High - ensures game loop stability

**No tests for item generation and effects:**
- What's not tested: Random item generation, effect application, item use side effects
- Files: `src/app/game-state/item-repo.service.ts`, `src/app/game-state/inventory.service.ts`
- Risk: Item balance broken or effects don't apply
- Priority: Medium

**No browser compatibility tests:**
- What's not tested: LocalStorage quota handling, audio playback in background, visibility change events
- Files: `src/app/game-state/main-loop.service.ts`, `src/app/game-state/game-state.service.ts`
- Risk: Offline functionality may break in some browsers
- Priority: Medium

---

*Concerns audit: 2026-01-29*
