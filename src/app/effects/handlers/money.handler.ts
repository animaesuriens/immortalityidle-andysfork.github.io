/**
 * Money effect handler - adds or subtracts currency.
 * Amount can be a number or Formula for dynamic calculations.
 */

import { EffectHandler } from './handler.interface';
import { MoneyEffect } from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { RenderedEffect, FormulaBreakdown } from '../types/render.types';
import { evaluateAmount, renderFormulaOnly, renderFormulaSubstituted } from '../utils/render-helpers';

export const moneyHandler: EffectHandler<MoneyEffect> = {
  execute(effect: MoneyEffect, context: EffectContext): void {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    const rounded = Math.floor(amount);

    context.updateMoney(rounded);
    context.emitEvent({ kind: 'moneyEarned', amount: rounded });
  },

  render(effect: MoneyEffect, context: EffectContext): RenderedEffect {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    const rounded = Math.floor(amount);
    const positive = rounded >= 0;

    let formula: FormulaBreakdown;
    if (typeof effect.amount === 'number') {
      formula = { type: 'fixed', base: effect.amount };
    } else {
      // Use 'formula' type for complex formulas - cleaner display
      formula = {
        type: 'formula',
        symbolic: renderFormulaOnly(effect.amount, formulaContext),
        substituted: renderFormulaSubstituted(effect.amount, formulaContext),
        result: rounded,
      };
    }

    return {
      kind: 'money',
      visible: true,
      positive,
      short: {
        sign: positive ? '+' : '',
        amount: Math.abs(rounded),
        label: 'Coins',
      },
      long: {
        verb: positive ? 'Earns' : 'Costs',
        amount: Math.abs(rounded),
        name: 'coins',
      },
      formula,
    };
  },
};
