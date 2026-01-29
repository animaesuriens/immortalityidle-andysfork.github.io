# Technology Stack

**Analysis Date:** 2026-01-29

## Languages

**Primary:**
- TypeScript 5.4.2 - All application logic and components
- HTML5 - Component templates and UI markup
- LESS - Stylesheet preprocessing and component styling

**Secondary:**
- JavaScript - Build scripts and configuration
- JSON - Configuration and data files

## Runtime

**Environment:**
- Node.js v12 (specified in `.nvmrc`)

**Browser Support:**
- ES2020 module syntax
- ES2022 target compilation

**Package Manager:**
- npm (with lockfile: `package-lock.json` present)

## Frameworks

**Core:**
- Angular 18.0.0 - Main application framework
- RxJS ~7.5.0 - Reactive programming library for Observables
- Zone.js ~0.14.4 - Angular's zone management

**UI/Components:**
- @angular/material 17.3.0 - Material Design components (dialogs, icons, tabs, tooltips)
- @angular/cdk 17.3.0 - Component Dev Kit for drag-drop and layout
- @katoid/angular-grid-layout 2.2.0 - Draggable grid layout system

**Routing & Forms:**
- @angular/router 18.0.0 - Application routing
- @angular/forms 18.0.0 - Form handling (FormsModule)

**Animation & Platform:**
- @angular/animations 18.0.0 - Animation framework
- @angular/platform-browser 18.0.0 - Browser platform module
- @angular/platform-browser-dynamic 18.0.0 - Dynamic module loading

**Testing:**
- Jasmine ~4.0.0 - Testing framework
- Karma ~6.3.0 - Test runner
- karma-jasmine ~4.0.0 - Jasmine adapter
- karma-chrome-launcher ~3.1.0 - Chrome launcher for tests
- karma-coverage ~2.1.0 - Coverage reporting

## Key Dependencies

**Critical:**
- @angular/core 18.0.0 - Core Angular framework functionality
- @angular/common 18.0.0 - Common Angular utilities (CommonModule, pipes)
- @angular/compiler 18.0.0 - Angular template compiler
- tslib 2.3.0 - TypeScript runtime library

**Build & Development:**
- @angular/cli 18.0.1 - Angular command-line interface
- @angular-devkit/build-angular 18.0.1 - Angular build system
- @angular/compiler-cli 18.0.0 - TypeScript compilation for Angular

## Code Quality

**Linting:**
- ESLint 8.57.0 - JavaScript linter
- @angular-eslint/eslint-plugin 18.0.0-alpha.16 - Angular-specific rules
- @angular-eslint/template-parser 18.0.0-alpha.16 - HTML template parsing
- @typescript-eslint/eslint-plugin 7.2.0 - TypeScript-specific rules
- @typescript-eslint/parser 7.2.0 - TypeScript parser

**Formatting:**
- Prettier 2.8.4 - Code formatter
- eslint-config-prettier 8.6.0 - ESLint + Prettier integration
- eslint-plugin-prettier 4.2.1 - Prettier as ESLint plugin
- prettier-eslint 15.0.1 - Prettier + ESLint combined

**Type Checking:**
- @types/jasmine ~3.10.0 - Jasmine type definitions
- @types/node 12.20.55 - Node.js type definitions

## Configuration

**TypeScript Compiler:**
- Config: `tsconfig.json` (base), `tsconfig.app.json` (application)
- Target: ES2022
- Module: es2020
- Strict mode enabled
- Source maps enabled in development
- Strict type checking with `noImplicitReturns`, `noFallthroughCasesInSwitch`

**Build Configuration:**
- File: `angular.json`
- Default output: `docs/` directory (GitHub Pages deployment)
- Supports alternate builds: `docs/experimental/`, `docs/experimental2/`
- Inline styles: LESS
- Budgets: 1MB initial (warning), 2MB (error); 2KB component styles (warning), 4KB (error)
- Output hashing enabled in production

**Development Server:**
- Port: 4200 (default ng serve)
- Development mode with source maps and unoptimized builds

**Test Configuration:**
- Framework: Karma with Jasmine
- Config: `karma.conf.js`
- Browser: Chrome
- Coverage reporting enabled

**Code Style:**
- File: `.prettierrc.json`
- Tab width: 2 spaces
- Single quotes
- Semicolons required
- Bracket spacing enabled
- Arrow function params: avoid parentheses for single params
- Trailing commas: ES5 style
- Print width: 120 characters

**Linting Configuration:**
- File: `.eslintrc.json`
- Rules: Strict equality check (`eqeqeq`), component/directive selectors enforced
- Component selector style: kebab-case
- Directive selector style: camelCase

**Asset Management:**
- Assets location: `src/assets/`
- Material theme: indigo-pink prebuilt theme
- Global styles: `src/styles.less`

## Platform Requirements

**Development:**
- Node.js v12+
- npm 6.0+
- Angular CLI 18.x
- TypeScript 5.4+

**Production:**
- Modern browsers supporting ES2020
- No backend server required (runs entirely in browser)
- Deployed to GitHub Pages at `https://immortalityidle.github.io/`

---

*Stack analysis: 2026-01-29*
