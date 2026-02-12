/**
 * ProgressEffect handler for the declarative effects system.
 * Increments progress counters for ImpossibleTask types and checks completion.
 * Rendering is handled by the universal effect parser.
 */

import { EffectHandler } from './handler.interface';
import { ProgressEffect } from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
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
};
