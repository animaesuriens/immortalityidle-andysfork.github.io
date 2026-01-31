# Phase 1: Duration Foundation - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a `duration` field to the Activity interface and all ~50 activity definitions. All activities get `duration: 1` (one day). No behavioral changes — the game runs exactly as before. This lays the foundation for multi-day activities in later phases.

</domain>

<decisions>
## Implementation Decisions

### Duration field typing
- Required field on all activities (not optional with default)
- Type is `number` representing whole days
- Integers only — no fractional durations (0.5, 1.5, etc.)
- All activities get explicit `duration: 1`

### Field placement
- Place `duration` field before effects/consequence fields
- Group with behavior-related fields since duration affects how effects apply

### Claude's Discretion
- Exact position within the "before effects" region
- Whether to add TypeScript comment documenting the field
- Order of editing activity files (alphabetical, by file, etc.)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — straightforward field addition across all activities.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-duration-foundation*
*Context gathered: 2026-01-31*
