/**
 * ProgressEffect handler for the declarative effects system.
 * Increments progress counters for ImpossibleTask types and checks completion.
 */

import { EffectHandler } from './handler.interface';
import { ProgressEffect } from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { RenderedEffect } from '../types/render.types';
import { evaluateAmount } from '../utils/render-helpers';

/**
 * Handler for ProgressEffect.
 * Integrates with ImpossibleTaskService via context.incrementProgress() and checkProgressCompletion().
 */
export const progressHandler: EffectHandler<ProgressEffect> = {
  execute(effect: ProgressEffect, context: EffectContext): void {
    const formulaContext = toFormulaContext(context);
    const amount = effect.amount != null ? evaluateAmount(effect.amount, formulaContext) : 1;
    const rounded = Math.floor(amount);

    context.incrementProgress(effect.progressType, rounded);
    context.checkProgressCompletion();
  },

  render(effect: ProgressEffect, context: EffectContext): RenderedEffect {
    const formulaContext = toFormulaContext(context);
    const amount = effect.amount != null ? evaluateAmount(effect.amount, formulaContext) : 1;
    const rounded = Math.floor(amount);

    // Format the progress type for display (e.g., 'BuildTower' -> 'Tower Progress')
    const displayName = formatProgressName(effect.progressType);

    return {
      kind: 'progress',
      visible: true,
      positive: true,
      short: {
        sign: '+',
        amount: rounded,
        label: displayName,
      },
      long: {
        verb: 'Advances',
        amount: rounded,
        name: displayName,
      },
      formula: { type: 'fixed', base: rounded },
    };
  },
};

/**
 * Convert a progress type identifier to a human-readable display name.
 * e.g., 'BuildTower' -> 'Tower Progress', 'Swim' -> 'Swim Progress'
 */
function formatProgressName(progressType: string): string {
  const names: Record<string, string> = {
    Swim: 'Swim Progress',
    RaiseIsland: 'Island Progress',
    BuildTower: 'Tower Progress',
    TameWinds: 'Wind Progress',
    LearnToFly: 'Flight Progress',
    BefriendDragon: 'Dragon Progress',
    ConquerTheWorld: 'Conquest Progress',
    RearrangeTheStars: 'Star Progress',
    OvercomeDeath: 'Death Progress',
  };
  return names[progressType] ?? `${progressType} Progress`;
}
