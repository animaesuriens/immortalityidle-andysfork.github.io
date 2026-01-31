/**
 * StatusEffect handler for the declarative effects system.
 * Modifies status values (health, stamina, mana, nourishment).
 */

import { EffectHandler, RenderFormat } from './handler.interface';
import { StatusEffect } from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { ABBREVIATIONS } from '../utils/abbreviations';
import {
  evaluateAmount,
  renderFormulaLong,
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

  render(effect: StatusEffect, context: EffectContext, format: RenderFormat): string {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    const sign = amount >= 0 ? '+' : '';
    const abbrev = ABBREVIATIONS.status[effect.status];
    const maxSuffix = effect.modifyMax ? ' Max' : '';

    switch (format) {
      case 'short':
        return `${sign}${Math.floor(amount)} ${abbrev}${maxSuffix}`;
      case 'long': {
        const verb = amount >= 0 ? 'Restores' : 'Uses';
        const name = getStatusDisplayName(effect.status);
        const maxWord = effect.modifyMax ? ' max' : '';
        const formulaStr = renderFormulaLong(effect.amount, formulaContext);
        const cssClass = amount >= 0 ? 'effect-positive' : 'effect-negative';
        return `<span class="${cssClass}">${verb} ${Math.abs(Math.floor(amount))}${maxWord} ${name}.</span> <span class="effect-formula">(${formulaStr})</span>`;
      }
      case 'formula':
        return typeof effect.amount === 'number'
          ? String(effect.amount)
          : effect.amount.render(formulaContext, 'formula');
    }
  },
};
