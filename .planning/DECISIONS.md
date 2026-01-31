# Declarative Effects System - Decisions

Captured during questioning phase (conversation may compact).

## Scope

- **Activities only** - start narrow, expand to items/equipment/furniture later if it works
- **Rich type system** - support conditionals/probability in the declarative schema (no escape hatch for custom functions)
- **Big bang migration** - convert all activities at once, remove old system

## Display Format

- **Style**: Keep current compact style but add values: `+1 Str, +1 Spd`
- **Values**: Show current computed values (not formulas)
- **Furniture bonuses**: Show computed value based on whether equipped (e.g., `+Weapon (10%)` when anvil equipped, `+Weapon (5%)` otherwise)
- **Weakest stat**: Keep generic label `+Weakest Lore` (don't compute which stat)
- **Yin/Yang**: Show only when yin/yang system is unlocked
- **Enemy spawns**: Show with chance `Wolf (1%)`
- **Consume+produce**: Show both `-Metal, +Weapon (10%)`

## Architecture

- **Multi-level activities**: Parallel arrays `effectDefinitions[level]` - mirrors current structure
- **Apprenticeship**: Separate system, not part of declarative effects
- **Preconditions**: Add `requires` field for guards like `money >= 1M`
- **Day counters** (oddJobDays, beggingDays): Keep separate - statistics/achievements system
- **lastIncome**: Handled by statistics layer observing effect events (activity doesn't track itself)
- **Pipes**: Service + thin pipes pattern
  - `EffectRenderService` handles all rendering logic
  - Multiple thin pipes (`effectShort`, `effectLong`, `effectFormula`) delegate to service
  - Same effect data renders differently in cards vs detail modals

## Scalability & Extensibility

- **New effect types**: Extend the type system (add new types as needed, no escape hatch)
- **Handler registry pattern**: Each effect type is self-contained handler class with execute() + render()
  - Adding new type = create new handler, register it
  - Never modify core executor
- **TypeScript union types**: `Effect = AttributeEffect | ItemEffect | ...`
  - Compiler enforces exhaustive handling
  - Adding new type causes compile errors where handling is missing
- **Composable effects**: LEGO-block style primitives that combine
  - `conditional(hasFurniture('anvil'), probabilistic(0.1, giveItem('ore')))`
  - Fewer building blocks, infinite combinations
- **Formula builders**: Functions that can execute AND render
  - `add(log2(attr('charisma')), mult(attr('waterLore'), 5))`
  - Execute: computes 127
  - Render formula: "log2(Cha) + Water Lore x 5"
  - Render value: "127 Taels"
- **Service access**: Context object pattern
  - Handlers are plain classes (not Angular services)
  - Executor passes `EffectContext` with all services
  - Easy to test with mock context
- **Testing priority**: Very important - design for easy mocking

## Effect Types Identified

From audit of all consequence functions in activity.service.ts:

### 1. Attribute Changes
- `increaseAttribute('strength', 0.1)` - fixed value
- `increaseAttribute('charisma', formula)` - computed value
- `attributes.strength.aptitude += 0.1` - aptitude changes

### 2. Status Changes
- `status.stamina.value += 50` - restoration
- `status.mana.max++` - max stat increases
- `healthBonusSoul++` - special bonuses

### 3. Money
- `updateMoney(3)` - fixed amount
- `updateMoney(log2(charisma) + waterLore * 5)` - formula-based
- `updateMoney(-1000000)` - costs

### 4. Items
- Guaranteed: `addItem(items['meat'])`
- Probabilistic: `if (Math.random() < 0.5) addItem(getOre())`
- Generated: `generateWeapon(grade, 'metal')`, `generatePotion(grade)`
- Consumed as input: `consume('metal')` returns grade for crafting

### 5. Progress Counters
- `homeService.workFields(farmPower)` - field progress
- `impossibleTaskService.taskProgress[x].progress++` - task progress

### 6. Spawning
- Enemies: `battleService.addEnemy({...})` - hunting wolves
- Followers: `followerService.generateFollower()` - recruiting

### 7. Conditional Effects
- Feature checks: `if (manaUnlocked)`, `if (yinYangUnlocked)`
- Equipment: `if (furniture.workbench.id === 'anvil')`
- Probability: `if (Math.random() < 0.01)`
- Dynamic selection: "increase weakest lore" - picks lowest among 5 lores

### 8. Special/Unique
- Trigger battle: `battleService.tickCounter = ticksPerFight`
- Lifespan: `magicLifespan += 10` (with cap at 36500)
- Apprenticeship: `checkApprenticeship(ActivityType.X)` - separate system

## Multi-day Activities (New Feature)

- **Duration**: Base duration per activity + optional scaling modifier (faster as attributes improve)
- **Effect timing**: Effects apply once at completion (not per-day)
- **Interruption handling**:
  - `resetOnInterrupt: true/false` - per-activity flag for manual switches
  - `persistAcrossLives: true/false` - per-activity flag for death
- **Display**: Progress bar showing current/total days

## Schedule Rework (Time Panel)

- **Completion-based scheduling**: `repeatTimes` means completions, not days
  - "Blacksmithing x2" = complete twice (6 days if 3-day activity)
  - Schedule advances only after completions done
- **Display format**: "Blacksmithing x10 (30 days)" - show both completions and total time
- **No partial completions**: Schedule doesn't loop back mid-activity
- **Sequential execution**: Activities run in order, each completing before next starts

## Still To Discuss

(None pending)
