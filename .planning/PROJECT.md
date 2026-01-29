# Immortality Idle - UI Improvements

## What This Is

An Angular 18 idle/incremental game with a cultivation theme. Currently working on UI improvements in quick-fix mode (no formal roadmap).

## Core Value

Improve panel usability and information display without breaking existing functionality.

## Requirements

### Validated

- Codebase mapped (`.planning/codebase/`)

### Active

- [ ] UI improvements (iterative, user-driven)

### Completed This Session

- [x] Added scrollbars to Home, Equipment, and Health panels (content scrolls, title bar stays fixed)
- [x] Fixed Equipment panel scrollbar to stick to panel edge (not content edge)
- [x] Fixed Equipment panel grid to not dynamically resize with wrapper
- [x] Fixed Home panel buttons to stick to bottom of panel
- [x] Added regen info (health, stamina, mana per day) to Home panel
- [x] Reordered Home panel: regen info now above cost info
- [x] Reduced spacing between "You live in a ***" and descriptive content
- [x] Added spacing (16px) between descriptive content and furniture slots

### Out of Scope

(None defined)

## Context

Working on branch: `v1-ui-improvements`

Files modified:
- `src/app/home-panel/home-panel.component.html` - Added regen display, reordered content
- `src/app/home-panel/home-panel.component.less` - Scrollbar, h3 margin, furniture spacing
- `src/app/equipment-panel/equipment-panel.component.html` - Added scroll wrapper
- `src/app/equipment-panel/equipment-panel.component.less` - Fixed grid sizing, scroll wrapper
- `src/app/health-panel/health-panel.component.less` - Added scrollbar support
- `src/app/game-state/home.service.ts` - Added healthRegen, staminaRegen, manaRegen to Home interface and all home definitions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Quick fixes mode | User prefers iterative fixes over formal planning | Working well |
| Add regen properties to Home interface | Needed to display regen info in panel | Done |

---
*Last updated: 2026-01-29 after UI improvements session*
