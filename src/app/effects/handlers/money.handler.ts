/**
 * Money effect handler - adds or subtracts currency.
 * Amount can be a number or Formula for dynamic calculations.
 */

import { EffectHandler } from './handler.interface';
import { MoneyEffect } from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { evaluateAmount } from '../utils/render-helpers';

export const moneyHandler: EffectHandler<MoneyEffect> = {
  execute(effect: MoneyEffect, context: EffectContext): void {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    const rounded = Math.floor(amount);

    context.updateMoney(rounded);
    context.emitEvent({ kind: 'moneyEarned', amount: rounded });
  },
};
