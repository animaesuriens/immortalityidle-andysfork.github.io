/**
 * StatusEffect handler for the declarative effects system.
 * Modifies status values (health, stamina, qi, nourishment).
 */

import { EffectHandler } from './handler.interface';
import { StatusEffect } from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { evaluateAmount } from '../utils/render-helpers';

/**
 * Handler for StatusEffect.
 * Modifies status current value or max based on effect.modifyMax flag.
 */
export const statusHandler: EffectHandler<StatusEffect> = {
  execute(effect: StatusEffect, context: EffectContext): void {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    if (effect.modifyMax) {
      context.modifyStatusMax(effect.status, amount);
    } else {
      context.modifyStatus(effect.status, amount);
    }
  },
};
