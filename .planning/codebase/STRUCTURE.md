# Codebase Structure

**Analysis Date:** 2026-01-29

## Directory Layout

```
D:\Immortality Idle/
├── src/
│   ├── app/
│   │   ├── game-state/              # Core game logic and state management
│   │   ├── *-panel/                 # Draggable UI panels (12 types)
│   │   ├── *-modal/                 # Dialog modals (5 types)
│   │   ├── app.component.*           # Root component and shared pipes
│   │   ├── app.module.ts            # Module declarations
│   │   └── app-routing.module.ts    # Routing config
│   ├── assets/                       # Game images and music
│   ├── environments/                 # Environment config (dev/prod)
│   ├── index.html                   # HTML entry point
│   ├── main.ts                      # Bootstrap entry point
│   ├── polyfills.ts                 # Browser polyfills
│   ├── styles.less                  # Global styles
│   └── test.ts                      # Test configuration
├── angular.json                     # Angular CLI configuration
├── tsconfig.json                    # TypeScript configuration
├── karma.conf.js                    # Test runner configuration
├── package.json                     # NPM dependencies
└── README.md
```

## Directory Purposes

**src/app/game-state/:**
- Purpose: All game logic, state management, and data persistence
- Contains: Service classes (activity, battle, character management), model classes (Character, Activity), data resources (itemResources, followerResources, textResources)
- Key files:
  - `game-state.service.ts` - Central coordinator
  - `main-loop.service.ts` - Game clock and tick emission
  - `character.service.ts`, `activity.service.ts`, `battle.service.ts` - Domain logic
  - `inventory.service.ts`, `store.service.ts`, `item-repo.service.ts` - Inventory/equipment
  - `followers.service.ts`, `home.service.ts`, `hell.service.ts` - Progression systems
  - `achievement.service.ts`, `impossibleTask.service.ts` - Meta-progression
  - `log.service.ts` - Game event logging
  - `reincarnation.service.ts` - Rebirth trigger

**src/app/*-panel/:**
- Purpose: Draggable UI panels that render game state and accept user input
- Contains: Component logic (`.ts`), template (`.html`), component styles (`.less`), test spec (`.spec.ts`)
- Pattern: Each panel directory is self-contained with all its assets
- Key panels:
  - `activity-panel/` - Activity loop interface
  - `attributes-panel/` - Character stat display
  - `battle-panel/` - Combat UI
  - `equipment-panel/` - Equipment management
  - `inventory-panel/` - Item display
  - `health-panel/` - Status effects and health
  - `home-panel/` - Home upgrades
  - `followers-panel/` - Follower management UI
  - `pets-panel/` - Pet interface
  - `portal-panel/` - Hell progression (ascension/reincarnation)
  - `time-panel/` - Game speed controls
  - `log-panel/` - Game event display
- Notes: Panels are positioned by `AppComponent` using KtdGrid library for drag/resize

**src/app/*-modal/:**
- Purpose: Dialog modals for complex interactions
- Contains: Component logic, template, styles, spec
- Key modals:
  - `manual-store-modal/` - Purchase skill manuals
  - `ascension-store-modal/` - Purchase ascension techniques
  - `furniture-store-modal/` - Purchase home furnishings
  - `options-modal/` - Game settings and options
  - `offline-modal/` - Offline progression notification
  - `save-modal/` - Save game data export/import
- Pattern: Opened via `MatDialog.open()` from various components
- Additional dialog-like panels:
  - `achievement-panel/` - Achievement viewer
  - `tutorial-panel/` - Game tutorial
  - `changelog-panel/` - Version history
  - `statistics-panel/` - Game statistics
  - `impossible-task-panel/` - Special tasks list

**src/assets/:**
- Purpose: Static game assets
- Contains:
  - `images/activities/` - Activity icon sprites
  - `images/items/` - Item icon sprites
  - `images/monsters/` - Monster/enemy sprites
  - `music/` - Game soundtrack (1 music file)
  - `favicon.png` - Browser tab icon

**src/environments/:**
- Purpose: Environment-specific configuration
- Contains: `environment.ts` (development), `environment.prod.ts` (production)
- Key configs: `appVersion` string

**src/app/ Root:**
- `app.component.ts` - Root component: grid layout, panel positioning, keyboard shortcuts, dialog triggers. Also contains 3 shared pipes (`FloorPipe`, `BigNumberPipe`, `CamelToTitlePipe`)
- `app.component.html` - Grid layout template using KtdGrid, panel routing
- `app.component.less` - Global panel styling (all panels inherit common styles)
- `app.module.ts` - Module declarations (all components), Material imports, provider configuration
- `app-routing.module.ts` - Routing (currently empty, app is single-page)

## Key File Locations

**Entry Points:**
- `src/index.html` - HTML page with `<app-root>` element
- `src/main.ts` - Bootstrap Angular platform and load AppModule
- `src/app/app.component.ts` - Root component initialization

**Configuration:**
- `angular.json` - Build targets, output path (docs/), asset configuration
- `tsconfig.json` - Strict mode enabled, target ES2022
- `tsconfig.app.json` - App-specific compiler options
- `karma.conf.js` - Test runner config (Chrome, coverage)
- `package.json` - Dependencies (Angular 18, Material, RxJS, Prettier, ESLint)

**Core Logic:**
- `src/app/game-state/game-state.service.ts` - Central state coordinator and save/load logic
- `src/app/game-state/main-loop.service.ts` - Game loop, tick emission, time scaling
- `src/app/game-state/character.ts` + `character.service.ts` - Character model and lifecycle
- `src/app/game-state/activity.ts` + `activity.service.ts` - Activity system and progression
- `src/app/game-state/inventory.service.ts` - Item and equipment management
- `src/app/game-state/battle.service.ts` - Combat system

**Testing:**
- `src/test.ts` - Test initialization
- `**/*.spec.ts` - Component and service unit tests (uses Jasmine/Karma)
- Coverage via `ng test` command

**Styling:**
- `src/styles.less` - Global styles, Material theme, variables
- `src/app/app.component.less` - Panel common styles, grid container, drag/resize handles
- `src/app/*-panel/*.less` - Panel-specific styles
- `src/app/*-modal/*.less` - Modal-specific styles
- Material theme: `node_modules/@angular/material/prebuilt-themes/indigo-pink.css`

## Naming Conventions

**Files:**
- Services: `{domain}.service.ts` (e.g., `activity.service.ts`, `character.service.ts`)
- Models/Data Classes: `{name}.ts` (e.g., `character.ts`, `activity.ts`)
- Components: `{name}.component.ts` (e.g., `app.component.ts`, `activity-panel.component.ts`)
- Templates: `{name}.component.html`
- Styles: `{name}.component.less` (LESS, not CSS)
- Tests: `{name}.spec.ts`
- Resources/Constants: `{type}Resources.ts` (e.g., `itemResources.ts`, `textResources.ts`, `followerResources.ts`)
- Pipes: Defined in `app.component.ts` (shared pipes)

**Directories:**
- Panel components: `{feature}-panel/` (kebab-case, e.g., `activity-panel/`, `health-panel/`)
- Modal components: `{feature}-modal/` (e.g., `manual-store-modal/`, `options-modal/`)
- Services/logic: `game-state/` (singular, not plural)
- Assets: `assets/` with subdirectories by type (`images/`, `music/`)

**TypeScript Classes:**
- PascalCase: `GameStateService`, `ActivityService`, `Character`, `Activity`
- Enums: PascalCase (e.g., `ActivityType`, `AttributeType`, `LogTopic`, `PanelIndex`)
- Interfaces: PascalCase with optional `Properties` suffix (e.g., `ActivityProperties`, `CharacterProperties`, `MainLoopProperties`)
- Service suffix: All services named `{Domain}Service` (e.g., `CharacterService`, `BattleService`)

**CSS Classes:**
- BEM-style: `.panelComponent`, `.panelResizeHandle`, `.grid-container`, `.bodyContainer`
- Modifier classes: `.darkMode`, `.highlighted`
- Angular CDK classes: `.cdk-drag-handle`, `.cdk-drop-list`

## Where to Add New Code

**New Feature (e.g., crafting system):**
- Primary code: `src/app/game-state/crafting.service.ts` (service logic and state)
- Model: `src/app/game-state/crafting.ts` (if complex state)
- UI: `src/app/crafting-panel/crafting-panel.component.ts` (component)
- Tests: `src/app/game-state/crafting.service.spec.ts`, `src/app/crafting-panel/crafting-panel.component.spec.ts`
- Integration: Register service in `AppModule.ts` providers (if not using providedIn: 'root'), add component to declarations
- Register panel in `AppComponent.html` switch statement and `GameStateService.panels` array

**New Component/Module (e.g., utility panel):**
- Implementation: `src/app/{feature}-panel/{feature}-panel.component.ts` (+ html, less, spec)
- Register in `AppModule.ts` declarations
- Add to `AppComponent.html` grid layout and switch statement
- Add to `GameStateService.layout` default layout array
- Register in `PanelIndex` enum if it should be tracked in position/z-index arrays

**New Service (e.g., analytics tracking):**
- Implementation: `src/app/game-state/{domain}.service.ts`
- Import in `AppComponent` or relevant service for dependency injection
- Mark with `@Injectable({ providedIn: 'root' })` for tree-shaking
- Add properties interface and getProperties/setProperties methods if state should be persisted

**Utilities & Helpers:**
- Shared pipes: Add to `src/app/app.component.ts` and export from `AppComponent` class
- Resource constants: Create `{type}Resources.ts` in `src/app/game-state/`
- Reusable components: Create in `src/app/` root (e.g., `text-panel/`, `life-summary/`)

**Styling:**
- Global variables/mixins: `src/styles.less`
- Panel/component-specific: `src/app/{component-name}/{component-name}.component.less`
- Shared panel styles: `src/app/app.component.less`
- Material overrides: Global styles or component-level via `::ng-deep`

## Special Directories

**src/.angular/:**
- Purpose: Angular CLI build cache
- Generated: Yes
- Committed: No (in .gitignore)
- Notes: Safe to delete, rebuilt on next `ng build/serve`

**docs/:**
- Purpose: Production build output
- Generated: Yes (by `ng build`)
- Committed: Yes (contains GitHub Pages deployed app)
- Notes: Update required for releases; see `build-new-release.sh`

**node_modules/:**
- Purpose: NPM package dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in .gitignore)

**dist/:**
- Purpose: Development build output
- Generated: Yes (by `ng build`)
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-01-29*
