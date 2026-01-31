/**
 * StatusEffect handler for the declarative effects system.
 * Modifies status values (health, stamina, mana, nourishment).
 */

import { EffectHandler, RenderFormat } from './handler.interface';
import { StatusEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { Formula } from '../types/formula.types';
import { ABBREVIATIONS } from '../utils/abbreviations';

/**
 * Evaluate an amount that may be a number or a formula.
 */
function evaluateAmount(amount: number | Formula, context: EffectContext): number {
  return typeof amount === 'number' ? amount : amount.evaluate(context);
}

/**
 * Get the full name for a status type.
 */
function getStatusName(status: keyof typeof ABBREVIATIONS.status): string {
  switch (status) {
    case 'health':
      return 'Health';
    case 'stamina':
      return 'Stamina';
    case 'mana':
      return 'Mana';
    case 'nourishment':
      return 'Nourishment';
    default:
      return status;
  }
}

/**
 * Handler for StatusEffect.
 * Modifies status current value or max based on effect.modifyMax flag.
 */
export const statusHandler: EffectHandler<StatusEffect> = {
  execute(effect: StatusEffect, context: EffectContext): void {
    const amount = evaluateAmount(effect.amount, context);
    if (effect.modifyMax) {
      context.modifyStatusMax(effect.status, amount);
    } else {
      context.modifyStatus(effect.status, amount);
    }
  },

  render(effect: StatusEffect, context: EffectContext, format: RenderFormat): string {
    const amount = evaluateAmount(effect.amount, context);
    const sign = amount >= 0 ? '+' : '';
    const abbrev = ABBREVIATIONS.status[effect.status];
    const maxSuffix = effect.modifyMax ? ' Max' : '';

    switch (format) {
      case 'short':
        return `${sign}${Math.floor(amount)} ${abbrev}${maxSuffix}`;
      case 'long': {
        const verb = amount >= 0 ? 'Restores' : 'Uses';
        const name = getStatusName(effect.status);
        const maxWord = effect.modifyMax ? ' max' : '';
        return `${verb} ${Math.abs(Math.floor(amount))}${maxWord} ${name}.`;
      }
      case 'formula':
        return typeof effect.amount === 'number'
          ? String(effect.amount)
          : effect.amount.render(context, 'formula');
    }
  },
};
