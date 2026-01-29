# Coding Conventions

**Analysis Date:** 2026-01-29

## Naming Patterns

**Files:**
- Components: kebab-case with `.component.ts` suffix (e.g., `activity-panel.component.ts`)
- Services: kebab-case with `.service.ts` suffix (e.g., `game-state.service.ts`)
- Mixed convention: Some services use camelCase (e.g., `autoBuyer.service.ts`, `impossibleTask.service.ts`)
- Specs: Same filename with `.spec.ts` suffix (e.g., `app.component.spec.ts`)
- Pipes: Exported from components with PascalCase class names (e.g., `FloorPipe`, `BigNumberPipe`)

**Functions:**
- camelCase for all function names
- Method names in services and components use camelCase (e.g., `scheduleActivity()`, `getProperties()`)
- Private methods prefixed with `private` visibility modifier
- Event handlers follow camelCase pattern (e.g., `JoinTheGodsClick()`, `dragStart()`, `onBodyMouseMove()`)

**Variables:**
- camelCase for local variables and properties (e.g., `doingPanelDrag`, `resizingPanel`, `tickCount`)
- Constants use UPPER_CASE (e.g., `GRID_SIZE = 20`, `LOCAL_STORAGE_GAME_STATE_KEY`)
- Readonly properties use `readonly` keyword (e.g., `readonly GRID_SIZE = 20`)

**Types & Interfaces:**
- PascalCase for classes and interfaces (e.g., `Character`, `Achievement`, `Activity`)
- Interface properties use camelCase (e.g., `unlockFastSpeed: boolean`)
- Enum members use PascalCase (e.g., `enum PanelIndex { Attributes = 0, Health = 1 }`)

## Code Style

**Formatting:**
- Prettier configuration enforced with 120 character line width
- 2-space indentation (useTabs: false)
- Single quotes for strings (singleQuote: true)
- Semicolons required (semi: true)
- Trailing commas in ES5 compatible structures (trailingComma: 'es5')
- Bracket spacing enabled (bracketSpacing: true)
- Arrow functions without parentheses when single parameter (arrowParens: 'avoid')

**Linting:**
- ESLint with Angular-specific rules via `@angular-eslint/eslint-plugin`
- Strict equality enforcement (eqeqeq: 'error')
- TypeScript strict mode enabled in tsconfig.json
- Component selector naming: kebab-case for element selectors (e.g., `selector: 'app-activity-panel'`)
- Directive selector naming: attribute style with camelCase (e.g., prefix: 'app', style: 'camelCase')
- Warns on empty functions (no-empty-function: 'warn')
- Warns on `@ts-ignore` comments (ban-ts-comment: 'warn')

## Import Organization

**Order:**
1. Angular core imports (`@angular/core`, `@angular/common`, etc.)
2. Angular Material and third-party library imports (`@angular/material/*`, `@katoid/*`, `rxjs`)
3. Local service imports (from `./game-state/*`)
4. Local component/directive imports
5. Local model/interface imports (types and constants)
6. Remaining local imports

**Example from activity-panel.component.ts:**
```typescript
// Angular core
import { Component } from '@angular/core';
// Local services
import { GameStateService } from '../game-state/game-state.service';
import { ActivityService } from '../game-state/activity.service';
// Local types and constants
import { Activity, ActivityType } from '../game-state/activity';
// Local components
import { TextPanelComponent } from '../text-panel/text-panel.component';
// Third-party
import { MatDialog } from '@angular/material/dialog';
```

**Path Aliases:**
- No path aliases configured; uses relative imports throughout

## Error Handling

**Patterns:**
- Minimal try-catch usage observed; framework handles most errors
- Conditional checks for null/undefined before access (e.g., `if (this.characterState.immortal && this.characterState.status.health.value < 0)`)
- Safe navigation with optional chaining (e.g., `if (this.hellService?.inHell)`)
- Empty string checks for validation (e.g., `if (deathMessage !== '')`)
- Boolean flag checks for state validation (e.g., `if (!activity.unlocked)`)
- Guard patterns in event handlers with early returns

**Example from app.component.ts:**
```typescript
onBodyMouseMove(event: MouseEvent) {
  if (this.doingPanelDrag) {
    return; // Early return guard
  }
  if (this.gameStateService.dragging) {
    return; // Early return guard
  }
  // ... rest of logic
}
```

## Logging

**Framework:** `console` for direct logging; custom `LogService` for game events

**Patterns:**
- Game events logged via `LogService.log()`, `LogService.injury()`, etc.
- Topics defined in `LogTopic` enum for categorizing logs
- No explicit console.log observed in game logic; uses service-based logging
- Main loop uses RxJS Subjects to emit events (`tickSubject`, `longTickSubject`, etc.)

## Comments

**When to Comment:**
- Inline comments explain non-obvious logic (e.g., `// bonus day for living another 10 years, capped at 70 years`)
- TODO and FIXME comments used for future work (e.g., `//TODO: Create a downside to taking empowerment pills`)
- Comments explain magic numbers and constants

**JSDoc/TSDoc:**
- Some JSDoc present but sparse
- Simple parameter documentation (e.g., `@param value`, `@returns {number}`)
- Not comprehensive; focused on public method interfaces

**Example from app.component.ts:**
```typescript
/**
 *
 * @param value
 * @returns {number}
 */
transform(value: number): number {
  return Math.floor(value);
}
```

## Function Design

**Size:** Functions vary from short 2-3 line utility functions to large 100+ line methods in services

**Parameters:**
- Constructor injection for dependencies (Angular pattern)
- Event parameters typed (e.g., `event: MouseEvent`, `event: CdkDragEnd`)
- Multiple state parameters returned as interfaces/objects

**Return Values:**
- Services return typed properties and objects
- Event handlers typically return `void`
- Getter methods return typed values
- RxJS Subjects used for event-driven returns

## Module Design

**Exports:**
- Components exported from `app.module.ts` declarations array
- Pipes exported alongside app component
- Services provided at root level with `providedIn: 'root'` in Injectable decorator
- No barrel files observed

**Barrel Files:** Not used; imports reference specific files directly

**Service Pattern:**
- Services use `@Injectable({ providedIn: 'root' })` for dependency injection
- Services initialized via Injector for circular dependency avoidance (e.g., `this.injector.get(HellService)`)
- Services expose typed properties and methods for state management
- Complex services aggregate multiple other services

**Component Pattern:**
- Components use constructor injection for services
- Public service properties allow template access (e.g., `public gameStateService: GameStateService`)
- Lifecycle hooks used minimally (mostly `OnInit` for initialization)

---

*Convention analysis: 2026-01-29*
