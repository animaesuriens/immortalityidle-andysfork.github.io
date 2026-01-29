# External Integrations

**Analysis Date:** 2026-01-29

## APIs & External Services

**None detected** - This is a fully client-side application with no backend API integration.

## Data Storage

**Browsers Local Storage:**
- Method: HTML5 `window.localStorage`
- Key prefix: `immortalityIdleGameState` (with deployment flavor suffix)
- Storage locations: `src/app/game-state/game-state.service.ts`
- Data stored:
  - Complete game state serialization (achievements, character, inventory, home, activities, battles, followers, logs, autobuy settings, main loop state, impossible tasks, hell progress)
  - UI state (panel positions, Z-index, sizes, layout grid)
  - Game configuration (dark mode, easy mode flag, game start timestamp, save interval)
  - Save slot metadata and backup data

**No Database:**
- No backend database integration
- No network persistence
- All game progress is stored locally in the browser

**No File Storage:**
- Local filesystem not accessed
- No cloud storage integration

**No Caching Layer:**
- No Redis or memcached
- No HTTP caching headers used

## Authentication & Identity

**No Authentication:**
- No login system
- No user accounts
- No identity provider integration (OAuth, SAML, etc.)
- Single-player local experience

## Monitoring & Observability

**Error Tracking:**
- No error tracking service (Sentry, Rollbar, etc.)
- Errors logged to browser console only

**Logs:**
- In-game logging system implemented via `LogService` at `src/app/game-state/log.service.ts`
- Logs stored in memory and game state
- Topics supported: various game events (activities, battles, items, etc.)
- Browser console logging via `console.error()` for critical failures

**Analytics:**
- No analytics tracking
- Angular CLI analytics disabled (`"analytics": false` in `angular.json`)

## CI/CD & Deployment

**Hosting:**
- GitHub Pages at `https://immortalityidle.github.io/`
- Primary build output: `docs/` directory
- Alternate experimental builds: `docs/experimental/`, `docs/experimental2/`

**CI Pipeline:**
- No CI/CD system detected (no GitHub Actions, Jenkins, GitLab CI, etc.)
- Manual build and commit process via `build-new-release.sh`

**Deployment Method:**
- Static site generation with Angular CLI
- Output to `docs/` directory for GitHub Pages
- Deployment via git push to repository

## Environment Configuration

**Required env vars:**
- None - Application is fully static

**Secrets location:**
- No secrets or sensitive data stored in codebase
- No environment variables used for configuration

**Configuration Sources:**
- `src/environments/environment.ts` (development) - reads package.json version
- `src/environments/environment.prod.ts` (production) - reads package.json version
- Both environments use the same version extraction method

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Client-Side Features Detected

**Offline Support:**
- Full offline functionality after initial load
- Offline detection modal at `src/app/offline-modal/offline-modal.component.ts`
- Automatic time compensation for offline periods

**Local State Management:**
- No centralized state management library (NgRx, Akita, etc.)
- Services handle state directly:
  - `GameStateService` - central game state
  - `CharacterService` - character attributes and properties
  - `InventoryService` - item management
  - `HomeService` - home/property management
  - `BattleService` - combat system
  - `ActivityService` - activity tracking
  - `AchievementService` - achievement tracking
  - `FollowersService` - follower management
  - `LogService` - event logging
  - `MainLoopService` - game loop tick engine

**Deployment Flavor Detection:**
- URL-based detection to identify deployment variant (localhost, main, experimental, experimental2)
- Allows separate save slots for different builds
- Implementation: `src/app/game-state/game-state.service.ts` lines 455-461

---

*Integration audit: 2026-01-29*
