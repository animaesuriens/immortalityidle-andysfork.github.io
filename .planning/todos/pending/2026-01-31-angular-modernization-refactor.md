---
created: 2026-01-31T07:25
title: Angular modernization refactor
area: ui
files:
  - src/app/app.module.ts
  - src/app/**/*.component.ts
---

## Problem

During a code audit for outdated syntax, identified three major Angular modernization opportunities that were deferred due to their scope:

1. **NgModule → Standalone Components**: The app uses traditional NgModule pattern (app.module.ts declares 30+ components). Angular 18 supports standalone components which simplify the module structure and improve tree-shaking.

2. **Constructor DI → inject() function**: All services use constructor-based dependency injection. Modern Angular prefers the `inject()` function which enables better type inference and works in functional contexts.

3. **@Input/@Output → Signal-based inputs/outputs**: All component communication uses decorators. Angular 18 signals provide fine-grained reactivity and better change detection.

These are architectural changes affecting the entire codebase - not quick syntax fixes.

## Solution

TBD - Requires dedicated refactoring effort:

1. Start with standalone components migration (can be done incrementally)
2. Then migrate to inject() function
3. Finally adopt signals for inputs/outputs

Consider using Angular CLI schematics:
- `ng generate @angular/core:standalone`
- May need to batch by component type (modals, panels, pipes)
