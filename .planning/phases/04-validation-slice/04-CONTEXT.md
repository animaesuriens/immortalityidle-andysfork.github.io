# Phase 4: Validation Slice - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert 4 diverse activities (Begging, Blacksmithing, Hunting, BuildTower) to declarative effects, stress-testing handlers not exercised by Resting in Phase 3. This validates the architecture handles all effect complexity before full migration.

</domain>

<decisions>
## Implementation Decisions

### Activity Selection

**Decision 1: Begging instead of OddJobs**
- User explicitly chose "Begging" when asked about formula-based money testing
- Begging tests formula-based money effects
- User's exact answer: "Begging"

**Decision 2: Keep Blacksmithing**
- Tests item consumption, equipment generation with probability
- User's exact answer: "Keep Blacksmithing but do Hunting as well for %chance item generation without item consumption"

**Decision 3: Keep Hunting for chance-based effects**
- User wanted Hunting for "%chance item generation without item consumption"
- Analysis of current code shows Hunting has BOTH:
  - Chance-based loot: 10% base + 40% with dog kennel for meat + hide
  - Enemy spawning: 1% chance to spawn wolf enemy
- User's exact answer: "Keep Blacksmithing but do Hunting as well for %chance item generation without item consumption"

**Decision 4: Keep BuildTower**
- Tests progress counters
- User's exact answer: "Keep BuildTower"

### Handler Implementation - Item Operations

**Decision 5: Item consume returns grade**
- `consume('ore')` returns the grade number
- Purpose: so subsequent effects can use it (e.g., to generate matching bar)
- User's exact answer: "Return grade"

**Decision 9: Variable capture for consume-then-generate workflow**
- consume() stores grade in context variable, generate() reads it
- Like writing a number on a sticky note, then reading it later
- Example:
  ```typescript
  { kind: 'item-consume', item: 'ore', storeGradeAs: 'oreGrade' },
  { kind: 'item-add', factory: 'getBar', args: [variable('oreGrade')] }
  ```
- Claude recommended after explaining options; user asked "most scalable" and accepted

**Decision 15: Item-add handler silently fails if no inventory space**
- Matches current behavior
- No explicit condition wrapper needed
- Handler checks internally
- User's exact answer: "Handler checks"

**Decision 17: Item-add supports BOTH item references AND factory functions**
- Three patterns supported:
  ```typescript
  { kind: 'item-add', itemId: 'meat' }  // Simple item lookup
  { kind: 'item-add', factory: 'getBar', args: [variable('oreGrade')] }  // Factory-generated
  { kind: 'item-add', itemId: 'hide', quantity: formula }  // With quantity
  ```
- Handler checks: if `itemId` exists, lookup; if `factory` exists, call it with args
- Claude recommended based on user's "most scalable" question

### Handler Implementation - Probability and Chance

**Decision 6: Chance probability is Formula-based**
- Format: `{ kind: 'chance', probability: formula, then: [...] }`
- Allows dynamic probability based on attributes, furniture, etc.
- User's exact answer: "Formula-based"

**Decision 11: Furniture/bonus sources handled via formulas**
- Hunting's dog kennel bonus expressed in the probability formula
- Example:
  ```typescript
  probability: add(fixed(0.1), conditional(hasFurniture('dogKennel'), fixed(0.4), fixed(0)))
  ```
- Claude recommended based on user's "most scalable" question

### Handler Implementation - Enemies and Combat

**Decision 7: Spawn-enemy supports BOTH inline definition AND named reference**
- Either: `{ kind: 'spawn-enemy', enemy: { name: 'wolf', health: 20, ... } }`
- Or: `{ kind: 'spawn-enemy', enemyId: 'wolf' }`
- User's exact answer: "Either/both"

**Decision 12: Spawn-enemy uses explicit condition for "only if no enemies exist"**
- New `NoEnemies` condition kind required
- Example:
  ```typescript
  {
    kind: 'conditional',
    condition: { kind: 'And', conditions: [
      { kind: 'CompareValues', left: 'random', operator: '<', right: fixed(0.01) },
      { kind: 'NoEnemies' }
    ]},
    then: [{ kind: 'spawn-enemy', enemy: wolfConfig }]
  }
  ```
- Claude recommended based on user's "most scalable" question

**Decision 14: Trigger-battle QUEUES enemy (not immediate)**
- Adds enemy to battleService.enemies
- Battle starts on next tick, NOT immediate pause
- User's exact answer: "Queue enemy"

### Handler Implementation - Progress and Money

**Decision 8: Progress tracking uses global progress registry**
- Named counters in a central registry
- Format: `{ kind: 'progress', counter: 'towerBuilt', amount: 1 }`
- User's exact answer: "Global progress registry"

**Decision 10: Money effects are Formula-based**
- `{ kind: 'money', amount: formula }`
- amount can be any Formula (e.g., `mult(attr('charisma'), fixed(10))`)
- Claude recommended based on user's "most scalable" question

### Handler Implementation - Lifespan

**Decision 13: Lifespan keeps separate handler**
- Use existing stub `lifespan.handler.ts` from Phase 3
- Implement when needed (Phase 4 if validation activity uses it, otherwise Phase 5)
- Claude recommended based on user's "most scalable" question

### Handler Implementation - Follower Integration

**Decision 16: Follower bonuses via EffectContext method**
- Add `getFollowerPower(job: string): number` to EffectContext interface
- Implement in GameContext
- Formulas can then use:
  ```typescript
  amount: mult(fixed(1), div(followerPower('hunter'), fixed(20)))  // floor(power/20) hides
  ```
- Claude recommended based on user's "most scalable" question

### Handler Implementation - Conditions

**Decision 18: Game feature checks use CompareProperty condition**
- New condition kind `CompareProperty`
- Example:
  ```typescript
  { kind: 'CompareProperty', path: 'furniture.workbench.id', operator: '==', value: 'dogKennel' }
  ```
- This is extensible to any game state without modifying condition types
- Claude recommended based on user's "most scalable" question

### Side Effect Tracking

**Decision 19: Side effect tracking uses RxJS Subject event system**
- In EffectExecutorService:
  ```typescript
  effectEvents$ = new Subject<EffectEvent>();
  ```
- Handler emits during execution:
  ```typescript
  this.effectEvents$.next({ kind: 'itemAdded', item: 'meat', quantity: 1 });
  ```
- Subscribers filter and track:
  ```typescript
  this.effectExecutor.effectEvents$.pipe(
    filter(e => e.kind === 'moneyEarned')
  ).subscribe(e => this.trackIncome(e.amount));
  ```
- User's exact answer when asked context accumulator vs event system: "Event system now"
- User's exact answer when asked Angular Signals vs RxJS vs custom: "What's the most scalable solution? What's the solution with the best performance?" → Claude recommended RxJS Subjects

### Error Handling

**Decision 20: Error handling is configurable by effect kind**
- Defaults by kind:
  | Effect Kind | Default on Failure | Rationale |
  |-------------|-------------------|-----------|
  | item-consume | abort | Don't give rewards if prerequisite missing |
  | item-add | continue | Full inventory shouldn't block attribute gains |
  | spawn-enemy | continue | Enemy limit shouldn't block other effects |
  | status/attribute | continue | Should rarely fail |
  | money | continue | Should rarely fail |
  | chance | continue | Low roll is expected, not failure |
- Individual effects can override with `onError: 'continue' | 'abort' | 'skip'`
- User's exact answer: "Configurable" then "By effect kind"

### Transaction Semantics

**Decision 21: No transaction semantics**
- Match current behavior
- Effects apply immediately with no rollback
- Partial completion is acceptable
- User's exact answer: "Match current"

### Rendering - Chance Effects

**Decision 22: Chance effects render with static evaluation**
- Evaluate probability formula at render time, show result
- Example: "35% Meat" (not "10-50% Meat")
- User's exact answer: "Static evaluation"

### Rendering - Item Costs

**Decision 23: Item consumption renders with negative prefix AND red coloring**
- Example: "-1 Ore" displayed in red
- User's exact answer: "Negative prefix with red coloring"

### Rendering - Factory Items

**Decision 24: Factory-generated items render with conditional format**
- Example: "+Metal Bar (if ore)"
- Shows the dependency on consumed item
- User's exact answer: "Conditional format"

### Rendering - Enemy Spawning

**Decision 25: Spawn-enemy renders as "X% attract [Enemy] trouble"**
- Example: "1% attract Wolf trouble"
- User's exact answer: ""1% attract Wolf trouble""

### Rendering - Progress

**Decision 26: Progress effects render as counter format**
- Example: "+1 Tower Progress" (like attribute gains)
- User's exact answer: "Counter format"

### Rendering - Formula Breakdown

**Decision 27: Formula format shows full breakdown**
- Example: "Charisma x 10 = 50 x 10 = 500 coins"
- User's exact answer: "Full breakdown"

### Migration Structure

**Decision 28: One plan per activity**
- 4 separate plans (04-01, 04-02, 04-03, 04-04)
- User's exact answer: "One plan per activity"

**Decision 29: Migration order based on handler coverage**
- User's exact answer: "Handler coverage"

**Decision 30: Migration order accepted**
- 04-01: Begging (money handler)
- 04-02: BuildTower (progress handler)
- 04-03: Hunting (chance handler, spawn-enemy handler, NoEnemies condition, CompareProperty condition)
- 04-04: Blacksmithing (item-consume handler, item-add with factory, variable capture)
- User's exact answer: "Accept order"

**Decision 31: Checkpoint each activity**
- Each of the 4 plans has human-verify at end (4 checkpoints total)
- User's exact answer: "Checkpoint each"

**Decision 32: Infrastructure built with first activity**
- Begging (04-01) includes all shared infrastructure: event system, new conditions, new context methods
- User's exact answer: "First activity includes it"

**Decision 33: Some parallel execution was considered**
- User initially said "Some parallel" when asked about parallelization
- BuildTower could potentially run with Begging (different handlers)
- User's exact answer: "Some parallel"

**Decision 34: Strict sequential execution chosen**
- After discussing that BuildTower needs event system too, user chose strict sequential
- All 4 plans run in order (04-01 → 04-02 → 04-03 → 04-04)
- Parallelization not worth the complexity
- User's exact answer: "Strict sequential"

### Claude's Discretion

- Exact implementation details of event system types
- How to structure the global progress registry internally
- Specific error messages for failure cases
- Unit test structure and coverage

</decisions>

<specifics>
## Specific Ideas

- Hunting's dog kennel bonus: 10% base + 40% with dog kennel (from code analysis)
- Hunting's wolf spawn: 1% chance, only if no enemies exist (from code analysis)
- Blacksmithing consume-then-generate: ore grade determines bar grade (from code analysis)
- User prefers "1% attract Wolf trouble" format for enemy spawn rendering

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

<cascading>
## Cascading Impacts - What These Decisions Require

### New Condition Kinds to Add:
- `NoEnemies` (Decision 12) - checks if battleService.enemies.length === 0
- `CompareProperty` (Decision 18) - generic game state path comparison

### New EffectContext Methods to Add:
- `getFollowerPower(job: string): number` (Decision 16)

### Type Changes Required:

**ItemAddEffect needs:**
- `itemId?: string` (Decision 17) - for simple item lookup
- `factory?: string` (Decision 17) - for generated items
- `args?: any[]` (Decision 17) - arguments for factory function
- `quantity?: Formula` (Decision 17) - optional quantity

**ItemConsumeEffect needs:**
- `storeGradeAs?: string` (Decision 9) - variable name to store consumed item grade

**All effects need:**
- `onError?: 'continue' | 'abort' | 'skip'` (Decision 20) - override default failure behavior

### New Infrastructure Required:
- `effectEvents$: Subject<EffectEvent>` in EffectExecutorService (Decision 19)
- EffectEvent type definition with kinds: itemAdded, moneyEarned, enemySpawned, progressUpdated, etc. (Decision 19)
- Global progress registry for named counters (Decision 8) - stores { [counterName: string]: number }

### Plan Structure:
| Plan | Activity | Implements | Checkpoint |
|------|----------|------------|------------|
| 04-01 | Begging | money handler, event system, NoEnemies condition, CompareProperty condition, getFollowerPower(), all type changes | Yes |
| 04-02 | BuildTower | progress handler, progress registry | Yes |
| 04-03 | Hunting | chance handler, spawn-enemy handler | Yes |
| 04-04 | Blacksmithing | item-consume handler (with storeGradeAs), item-add (with factory) | Yes |

### Execution:
- Strict sequential: 04-01 → 04-02 → 04-03 → 04-04
- Each plan waits for previous to complete
- Human checkpoint after each activity

</cascading>

---

*Phase: 04-validation-slice*
*Context gathered: 2026-02-03*
