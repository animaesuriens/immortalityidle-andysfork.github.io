# Testing Patterns

**Analysis Date:** 2026-01-29

## Test Framework

**Runner:**
- Karma ~6.3.0 with Jasmine ~4.0.0
- Config: `karma.conf.js` at project root
- Browser: Chrome (headless and interactive)

**Assertion Library:**
- Jasmine built-in matchers (expect() syntax)

**Run Commands:**
```bash
ng test                 # Run all tests in watch mode
ng test --watch=false  # Run tests once
npm run test           # Alias for ng test
```

**Coverage:**
```bash
ng test --code-coverage  # Generate coverage report
# Output location: ./coverage/immortalityidle/
```

## Test File Organization

**Location:**
- Co-located with source files (spec files in same directory as source)
- Examples:
  - `src/app/app.component.ts` → `src/app/app.component.spec.ts`
  - `src/app/activity-panel/activity-panel.component.ts` → `src/app/activity-panel/activity-panel.component.spec.ts`
  - `src/app/game-state/achievement.service.ts` → `src/app/game-state/achievement.service.spec.ts`

**Naming:**
- Pattern: `{filename}.spec.ts`
- Total count: 46 spec files in codebase
- All major components and services have corresponding spec files

**Structure:**
```
src/app/
├── app.component.ts
├── app.component.spec.ts
├── activity-panel/
│   ├── activity-panel.component.ts
│   └── activity-panel.component.spec.ts
└── game-state/
    ├── achievement.service.ts
    └── achievement.service.spec.ts
```

## Test Structure

**Suite Organization:**
Jasmine's `describe()` blocks organized by component/service name

**Pattern:**
```typescript
describe('ActivityPanelComponent', () => {
  let component: ActivityPanelComponent;
  let fixture: ComponentFixture<ActivityPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActivityPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

**Setup Pattern:**
- First `beforeEach` with `async` keyword: Configures TestBed with module declarations/imports
- Second `beforeEach`: Creates component fixture, initializes component instance, triggers change detection
- Separation allows for different configuration in different test groups

**Teardown Pattern:** Not explicitly used; TestBed cleanup happens automatically

**Assertion Pattern:**
- Simple toBeTruthy() checks for component creation
- Property equality checks (e.g., `expect(app.title).toEqual('immortalityidle')`)
- DOM content checks (e.g., `expect(compiled.querySelector(...).textContent).toContain(...)`)

## Mocking

**Framework:** Not explicitly detected; uses Angular TestBed for dependency injection

**Patterns:**
- TestBed used for dependency resolution and service injection
- Services injected via `TestBed.inject(ServiceName)` in service specs

**Example from achievement.service.spec.ts:**
```typescript
describe('AchievementService', () => {
  let service: AchievementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AchievementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

**What to Mock:**
- Dependencies declared in TestBed.configureTestingModule()
- Services mocked via test module configuration

**What NOT to Mock:**
- Real service instances when testing service functionality
- Angular framework services when not explicitly mocking

## Fixtures and Factories

**Test Data:**
- No explicit factory pattern observed
- Simple object literals used for test data when needed

**Location:**
- Inline within test files
- No separate fixtures directory

## Coverage

**Requirements:** No specific coverage targets enforced; optional

**View Coverage:**
```bash
ng test --code-coverage
# View HTML report in: ./coverage/immortalityidle/index.html
```

**Reporter Configuration (karma.conf.js):**
```javascript
coverageReporter: {
  dir: require('path').join(__dirname, './coverage/immortalityidle'),
  subdir: '.',
  reporters: [
    { type: 'html' },      // HTML report
    { type: 'text-summary' } // Console summary
  ],
}
```

## Test Types

**Unit Tests:**
- Scope: Individual components and services
- Approach: Test creation and basic properties
- Coverage: Minimal; mostly smoke tests (creation checks)
- Example: `it('should create the app', ...)` - verifies component instantiation
- Services tested for injection: `it('should be created', ...)` - verifies service is injectable

**Integration Tests:**
- Scope: Not explicitly structured as separate integration tests
- Approach: Component specs may test with real dependencies if not overridden in TestBed
- Coverage: Limited integration testing observed

**E2E Tests:**
- Framework: Not detected in project
- Implementation: Not used

## Common Patterns

**Async Testing:**
```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({
    declarations: [ActivityPanelComponent],
  }).compileComponents();
});
```
- Used for module compilation in component tests
- Waits for async operations to complete before proceeding

**DOM Testing:**
```typescript
it('should render title', () => {
  const fixture = TestBed.createComponent(AppComponent);
  fixture.detectChanges();
  const compiled = fixture.nativeElement as HTMLElement;
  expect(compiled.querySelector('.content span')?.textContent).toContain('...');
});
```
- `fixture.detectChanges()` triggers Angular change detection
- `fixture.nativeElement` accesses raw DOM
- Optional chaining (`?.`) for safe DOM queries

**Error Testing:**
- Pattern not observed in current test suite
- No explicit error condition testing in examined specs

## Test Configuration Details

**Karma Configuration (karma.conf.js):**
- Base Path: Project root
- Framework: Jasmine with Angular Dev Kit integration
- Browser: Chrome (default)
- Auto-watch: Enabled (retests on file change)
- Single Run: `false` (watch mode by default)
- Plugins: karma-jasmine, karma-chrome-launcher, karma-coverage, karma-jasmine-html-reporter
- Reporting: Progress and kjhtml (Jasmine HTML reporter)
- Clear Context: False (keeps Jasmine output visible)

**TypeScript Configuration (tsconfig.json):**
- Strict mode enabled
- Type definitions include jasmine types
- Target: ES2022
- Strict injection parameters in Angular compiler

## Test Execution

**CLI Commands:**
```bash
npm test                    # Run tests in watch mode via ng
ng test                     # Direct Angular CLI test command
ng test --watch=false      # Single run
ng test --browsers=Chrome  # Specify browser
ng test --include='**/*.component.spec.ts'  # Run specific tests
```

## Test Coverage Gaps

**Untested Patterns:**
- Error conditions and exception handling
- Complex service interactions
- Async operations (Promises, Observables)
- RxJS Subject subscriptions in services
- Large state management flows
- Dialog and Modal interactions
- Local storage operations
- Animation and drag-drop interactions

**Risk Areas:**
- `src/app/game-state/*.service.ts`: Complex business logic with minimal test coverage
- `src/app/*/*.component.ts`: Mostly creation tests only; no behavior testing
- Complex calculations and state mutations in services

**Current Coverage Philosophy:**
- Minimal smoke testing (creation checks)
- Focus on preventing build failures rather than behavior validation
- Not a TDD-driven codebase

---

*Testing analysis: 2026-01-29*
