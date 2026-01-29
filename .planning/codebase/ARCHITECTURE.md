# Architecture

**Analysis Date:** 2026-01-29

## Pattern Overview

**Overall:** Layered MVC with Angular component-based UI and centralized game state management through RxJS reactive streams.

**Key Characteristics:**
- Single-page application (SPA) built on Angular 18
- Centralized game state managed by dedicated services in `game-state/` layer
- Reactive data flow using RxJS Subjects and Observables
- UI rendered through modular, self-contained panel components
- Game loop driven by time-based ticks emitted through multiple Subject streams
- Persistent state serialization to browser localStorage

## Layers

**Presentation Layer (Components):**
- Purpose: Render UI and handle user interactions
- Location: `src/app/` (panel and modal components)
- Contains: Component classes (`.ts`), templates (`.html`), styles (`.less`)
- Depends on: Game state services, reactive streams from MainLoopService
- Used by: Angular application initialization in `AppComponent`
- Key directories: `*-panel/`, `*-modal/`

**Game State Management Layer:**
- Purpose: Maintain and coordinate all game logic and player data
- Location: `src/app/game-state/`
- Contains: Service classes managing character, activities, inventory, battles, followers, etc.
- Depends on: LogService, MainLoopService, localStorage API
- Used by: All presentation components via dependency injection
- Key services: `GameStateService`, `MainLoopService`, `CharacterService`, `ActivityService`

**Infrastructure Layer:**
- Purpose: Handle persistence, logging, and cross-cutting concerns
- Location: `src/app/game-state/`
- Contains: `GameStateService` (save/load), `LogService` (message logging), `MainLoopService` (game loop)
- Depends on: Browser APIs (localStorage, window events)
- Used by: All game state services

**Utility Layer:**
- Purpose: Provide shared formatting and data resources
- Location: `src/app/` (pipes in `app.component.ts`), `src/app/game-state/` (resource files)
- Contains: Pipes (`FloorPipe`, `BigNumberPipe`, `CamelToTitlePipe`), resource definitions (`itemResources.ts`, `textResources.ts`, `followerResources.ts`)
- Depends on: None
- Used by: Components and services for formatting and configuration

## Data Flow

**Game Loop Cycle:**

1. **Initialization**: `main.ts` → `AppComponent` constructor initializes all services
2. **Load State**: `AppComponent.ngOnInit()` calls `GameStateService.loadFromLocalStorage()`
3. **Start Loop**: `MainLoopService.start()` begins emitting ticks based on system clock
4. **Tick Emission**: Multiple Subject streams emit different tick frequencies:
   - `tickSubject`: Once per day (game time)
   - `frameSubject`: Every 25ms (foreground) or 1000ms (background)
   - `longTickSubject`: Every 500ms with elapsed day count
   - `yearOrLongTickSubject`: Every year or longTick, whichever comes first

5. **Service Subscriptions**: Each game service subscribes to relevant tick streams:
   - `CharacterService` subscribes to `longTickSubject` for lifespan calculations
   - `ActivityService` subscribes to `tickSubject` to process activity loops
   - `BattleService` subscribes to process ongoing battles
   - etc.

6. **State Updates**: Services modify their state in response to ticks
7. **Component Binding**: Angular templates bind to service properties, automatically re-rendering
8. **Persistence**: User interactions (drag panels, toggle options) trigger `savetoLocalStorage()`

**Key Data Subjects:**
- Game state properties flow from services to components via template binding
- Asynchronous operations emit through RxJS Subjects
- Reincarnation event triggers full state reset via `ReincarnationService.reincarnateSubject`

## Key Abstractions

**GameStateService:**
- Purpose: Central coordinator and persistent state manager
- Examples: `src/app/game-state/game-state.service.ts`
- Pattern: Singleton service (providedIn: 'root'), mediator pattern
- Responsibilities: Aggregate game state properties, coordinate save/load, manage panel layout via KtdGrid

**MainLoopService:**
- Purpose: Drives game progression with configurable time scaling
- Examples: `src/app/game-state/main-loop.service.ts`
- Pattern: Observable pattern via RxJS Subjects
- Responsibilities: Emit ticks at configurable rates (pause, slow, normal, fast, faster, fastest), emit frame updates for UI, manage offline progression

**Character Model:**
- Purpose: Encapsulates character attributes and lifecycle
- Examples: `src/app/game-state/character.ts`, `src/app/game-state/character.service.ts`
- Pattern: Model + Service pattern (character.ts holds state, CharacterService orchestrates changes)
- Responsibilities: Track attributes, health, lifespan, death events, ascension progress

**Activity System:**
- Purpose: Manage player activity loops and progression
- Examples: `src/app/game-state/activity.ts`, `src/app/game-state/activity.service.ts`
- Pattern: Loop state machine (ActivityLoopEntry[] tracks queued activities)
- Responsibilities: Execute activity loops day-by-day, track exhaustion, manage apprenticeships, emit activity completion events

**Inventory & Equipment System:**
- Purpose: Manage items, equipment, and home furnishings
- Examples: `src/app/game-state/inventory.service.ts`, `src/app/game-state/store.service.ts`, `src/app/game-state/item-repo.service.ts`
- Pattern: Repository pattern (ItemRepoService), service aggregation
- Responsibilities: Track owned items, equipment durability/stats, store prices, furnishings

## Entry Points

**HTML Entry Point:**
- Location: `src/index.html`
- Renders: `<app-root>` placeholder element
- Bootstrap: Angular platform initialization

**Bootstrap Module:**
- Location: `src/main.ts`
- Triggers: `platformBrowserDynamic().bootstrapModule(AppModule)`
- Loads: `AppModule` declaration and initialization

**Root Component:**
- Location: `src/app/app.component.ts`
- Selector: `app-root`
- Responsibilities:
  - Coordinate game state load and main loop start
  - Render grid layout of all game panels
  - Handle keyboard shortcuts (pause, speed controls, etc.)
  - Handle mouse/touch events for panel drag/resize
  - Open modal dialogs (store, options, achievements, etc.)
  - Instantiate all dependent services via constructor DI

**Panel Components:**
- Location: `src/app/*-panel/` directories
- Pattern: Dumb/presentation components that read service properties and emit user actions
- Examples: `ActivityPanelComponent`, `TimePanelComponent`, `BattlePanelComponent`
- Responsibilities: Display state from services, call service methods on user interaction, format display values using pipes

**Modal Components:**
- Location: `src/app/*-modal/` directories
- Pattern: Opened via `MatDialog.open()` from `AppComponent`
- Examples: `ManualStoreModalComponent`, `OptionsModalComponent`, `AscensionStoreModalComponent`
- Responsibilities: Display detailed views, handle complex interactions not suited to panels

## Error Handling

**Strategy:** Defensive error handling with user-facing notifications via MatSnackBar

**Patterns:**
- Service methods check preconditions before modifying state
- Math operations on game numbers use safe boundaries (e.g., min/max caps)
- localStorage failures handled gracefully with console error logging
- Dialog interactions use confirmation prompts for destructive actions (e.g., "Join the Gods")
- Death events trigger offline mode modal if player has been away

**Example Error Recovery:**
```typescript
// In CharacterService
if (newTime - this.lastTime > 168 * 60 * 60 * 1000) {
  // Cap offline progression to avoid infinite progression exploit
  this.earnedTicks = (3 * 168 * 60 * 60 * 1000 + newTime - this.lastTime) / (TICK_INTERVAL_MS * this.offlineDivider * 4);
}
```

## Cross-Cutting Concerns

**Logging:**
- Approach: `LogService` collects game events into story/combat/crafting/follower topics
- Implementation: Log messages pushed to `storyLog` array, filtered by topic preferences, merged if identical messages occur within 5 second window
- Access: `LogPanelComponent` displays logs, `LogFilterPanelComponent` manages visibility

**Validation:**
- Approach: Service-layer validation before state changes
- Implementation: Each service validates preconditions (e.g., enough gold before purchase, character alive before activity)
- No client-side form validation library; validation embedded in service method guards

**Authentication:**
- Not applicable. Single-player offline game. State persisted to browser localStorage only.

**Time Progression:**
- Approach: MainLoopService emits ticks based on system clock, scaled by user-controlled multiplier
- Implementation: Configurable `tickDivider` (1-40) scales game time relative to real time
- Offline support: Earning "banked ticks" based on time away, cap applied to prevent exploitation

**Persistence:**
- Approach: Manual serialization via `GameStateService` save/load methods
- Implementation: Single localStorage key `immortalityIdleGameState` stores entire game state as JSON
- Trigger: Manual saves on panel drag/resize, auto-save disabled (TODO in code)

---

*Architecture analysis: 2026-01-29*
