/**
 * StatusEffect handler for the declarative effects system.
 * Modifies status values (health, stamina, qi, nourishment).
 */

import { EffectHandler } from './handler.interface';
import { StatusEffect } from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { RenderedEffect, FormulaBreakdown } from '../types/render.types';
import { ABBREVIATIONS } from '../utils/abbreviations';
import {
  evaluateAmount,
  renderFormulaOnly,
  renderFormulaSubstituted,
  getStatusDisplayName,
} from '../utils/render-helpers';

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

  render(effect: StatusEffect, context: EffectContext): RenderedEffect {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    const positive = amount >= 0;
    const abbrev = ABBREVIATIONS.status[effect.status];
    const maxSuffix = effect.modifyMax ? ' Max' : '';
    const name = getStatusDisplayName(effect.status);

    // Build formula breakdown
    let formula: FormulaBreakdown;
    if (typeof effect.amount === 'number') {
      formula = { type: 'fixed', base: effect.amount };
    } else {
      formula = {
        type: 'formula',
        symbolic: renderFormulaOnly(effect.amount, formulaContext),
        substituted: renderFormulaSubstituted(effect.amount, formulaContext),
        result: Math.floor(amount),
      };
    }

    return {
      kind: 'status',
      visible: true,
      positive,
      short: {
        sign: positive ? '+' : '',
        amount: Math.abs(Math.floor(amount)),
        label: `${abbrev}${maxSuffix}`,
      },
      long: {
        verb: positive ? 'Restores' : 'Reduces',
        amount: Math.abs(Math.floor(amount)),
        name,
        suffix: effect.modifyMax ? 'max' : undefined,
      },
      formula,
    };
  },
};
