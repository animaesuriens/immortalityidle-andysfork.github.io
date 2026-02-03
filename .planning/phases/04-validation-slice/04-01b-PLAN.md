---
phase: 04-validation-slice
plan: 01b
type: execute
wave: 2
depends_on: ["04-01a"]
files_modified:
  - src/app/effects/context/game-context.ts
  - src/app/effects/conditions/condition-evaluator.ts
  - src/app/effects/handlers/money.handler.ts
  - src/app/effects/executor/effect-executor.service.ts
  - src/app/game-state/activity.service.ts
autonomous: false

must_haves:
  truths:
    - "Begging activity executes with declarative effects"
    - "Money earned matches legacy behavior (3 + log2(charisma) for level 0)"
    - "Yin/yang increment works when unlocked"
    - "Effect events are emitted for money earned"
    - "Activity panel shows Begging effects correctly"
  artifacts:
    - path: "src/app/effects/handlers/money.handler.ts"
      provides: "Money effect execution and rendering"
      exports: ["moneyHandler"]
  key_links:
    - from: "src/app/effects/executor/effect-executor.service.ts"
      to: "effectEvents$"
      via: "RxJS Subject"
      pattern: "Subject<EffectEvent>"
    - from: "src/app/effects/handlers/money.handler.ts"
      to: "context.updateMoney"
      via: "execute method"
      pattern: "context\\.updateMoney"
---

<objective>
Implement context methods, condition evaluators, money handler, event system, and convert Begging activity.

Purpose: With types from 04-01a, this plan implements the actual behavior and converts the first validation activity.

Output: Working Begging activity with declarative effects, plus infrastructure ready for remaining activities.
</objective>

<execution_context>
@C:\Users\marce\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\marce\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04-validation-slice/04-CONTEXT.md
@.planning/phases/04-validation-slice/04-RESEARCH.md
@.planning/phases/04-validation-slice/04-01a-SUMMARY.md
@src/app/effects/handlers/attribute.handler.ts
@src/app/effects/executor/effect-executor.service.ts
@src/app/effects/context/game-context.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement Context Methods and Condition Evaluators</name>
  <files>
    src/app/effects/context/game-context.ts
    src/app/effects/conditions/condition-evaluator.ts
    src/app/effects/executor/effect-executor.service.ts
  </files>
  <action>
1. In `effect-executor.service.ts`:
   - Inject BattleService, FollowersService, HomeService
   - Add `import { Subject } from 'rxjs';`
   - Add `import { EffectEvent } from '../types/event.types';`
   - Add public Subject: `effectEvents$ = new Subject<EffectEvent>();`
   - Update createContext() to pass all services and event emitter callback:
   ```typescript
   private createContext(): GameContext {
     return new GameContext(
       this.characterService,
       this.inventoryService,
       this.battleService,
       this.followersService,
       this.homeService,
       (event) => this.effectEvents$.next(event)
     );
   }
   ```

2. In `game-context.ts`:
   - Add BattleService, FollowersService, HomeService to constructor parameters
   - Add private `_eventEmitter` callback field

   Implement new methods:
   ```typescript
   getEnemyCount(): number {
     return this.battleService.enemies.length;
   }

   getFollowerPower(job: string): number {
     return this.followersService.jobs[job]?.totalPower ?? 0;
   }

   getPropertyValue(path: string): unknown {
     const parts = path.split('.');
     let current: any = this.getPropertyRoot(parts[0]);
     for (let i = 1; i < parts.length && current != null; i++) {
       current = current[parts[i]];
     }
     return current;
   }

   private getPropertyRoot(root: string): unknown {
     switch (root) {
       case 'furniture': return this.homeService.furniture;
       case 'followerCount': return this.followersService.followerCounts;
       case 'immortal': return this.characterService.characterState.immortal;
       case 'god': return this.characterService.characterState.god;
       default: return undefined;
     }
   }

   emitEvent(event: EffectEvent): void {
     if (this._eventEmitter) {
       this._eventEmitter(event);
     }
   }
   ```

3. In `condition-evaluator.ts`:
   - Import NoEnemies, CompareProperty from types
   - Add case handlers:
   ```typescript
   case 'NoEnemies':
     return context.getEnemyCount() === 0;
   case 'CompareProperty':
     return evaluateCompareProperty(condition, context);
   ```

   Implement evaluateCompareProperty:
   ```typescript
   function evaluateCompareProperty(condition: CompareProperty, context: EffectContext): boolean {
     const actualValue = context.getPropertyValue(condition.path);
     const expectedValue = condition.value;
     switch (condition.operator) {
       case '==': return actualValue === expectedValue;
       case '!=': return actualValue !== expectedValue;
       case '>': return (actualValue as number) > (expectedValue as number);
       case '<': return (actualValue as number) < (expectedValue as number);
       case '>=': return (actualValue as number) >= (expectedValue as number);
       case '<=': return (actualValue as number) <= (expectedValue as number);
       default: return false;
     }
   }
   ```
  </action>
  <verify>
    Run `npx tsc --noEmit` - no errors. GameContext implements all EffectContext methods.
  </verify>
  <done>
    Context wired to services. Event system ready. Condition evaluators handle NoEnemies and CompareProperty.
  </done>
</task>

<task type="auto">
  <name>Task 2: Implement Money Handler and Convert Begging</name>
  <files>
    src/app/effects/handlers/money.handler.ts
    src/app/game-state/activity.service.ts
  </files>
  <action>
1. Implement `money.handler.ts` following attribute.handler.ts pattern:
   ```typescript
   export const moneyHandler: EffectHandler<MoneyEffect> = {
     execute(effect: MoneyEffect, context: EffectContext): void {
       const formulaContext = toFormulaContext(context);
       const amount = evaluateAmount(effect.amount, formulaContext);
       context.updateMoney(amount);
       context.emitEvent({ kind: 'moneyEarned', amount });
     },

     render(effect: MoneyEffect, context: EffectContext): RenderedEffect {
       const formulaContext = toFormulaContext(context);
       const amount = evaluateAmount(effect.amount, formulaContext);
       const positive = amount >= 0;

       let formula: FormulaBreakdown;
       if (typeof effect.amount === 'number') {
         formula = { type: 'fixed', base: effect.amount };
       } else {
         formula = {
           type: 'fixed',
           expression: effect.amount.render(formulaContext, 'both'),
         };
       }

       return {
         kind: 'money',
         visible: true,
         positive,
         short: {
           sign: positive ? '+' : '-',
           amount: Math.abs(Math.floor(amount)),
           label: 'Coins',
         },
         long: {
           verb: positive ? 'Earns' : 'Costs',
           amount: Math.abs(Math.floor(amount)),
           name: 'coins',
         },
         formula,
       };
     },
   };
   ```

2. In `activity.service.ts`, convert Begging to DeclarativeActivity:
   - Import Formula builders: `add`, `log2`, `attr`, `mult` from effects module
   - Add `effects` property with level-keyed Effect arrays as shown in original 04-01 plan
   - All 4 levels (0-3) with appropriate formulas:
     - Level 0: 3 + log2(charisma)
     - Level 1: 10 + log2(charisma)
     - Level 2: 20 + log2(charisma * 2)
     - Level 3: 30 + log2(charisma * 10)
  </action>
  <verify>
    Run `npx tsc --noEmit` - no errors. Money handler exports. Begging has effects property.
  </verify>
  <done>
    Money handler implemented. Begging converted to declarative with all 4 levels.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Begging activity with declarative effects:
    - Money handler (formula-based earnings)
    - Event system (RxJS Subject for tracking)
    - New conditions (NoEnemies, CompareProperty)
    - Extended GameContext with new methods
  </what-built>
  <how-to-verify>
    1. Start game with `ng serve`
    2. Create a new character or load existing save
    3. Set Begging as activity (requires 3 charisma)
    4. Watch daily tick execute
    5. Verify:
       - Stamina decreases by 5
       - Charisma increases
       - Money increases by 3 + log2(charisma)
       - If yin/yang unlocked, yang increases
    6. Open activity panel, verify Begging shows effects like "+0.1 Cha, +X Coins"
    7. Check console for no errors (especially no "not implemented" errors)
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues found</resume-signal>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes
- Begging activity executes without errors
- Money earned matches legacy formula
- Activity panel displays rendered effects
- No console errors about "not implemented"
</verification>

<success_criteria>
1. GameContext implements all new methods (getEnemyCount, getFollowerPower, getPropertyValue, emitEvent)
2. Condition evaluator handles NoEnemies and CompareProperty
3. Event system (Subject) wired up in executor
4. Money handler fully implemented
5. Begging converted to declarative with all 4 levels
6. Game behavior unchanged from legacy implementation
</success_criteria>

<output>
After completion, create `.planning/phases/04-validation-slice/04-01b-SUMMARY.md`
</output>
