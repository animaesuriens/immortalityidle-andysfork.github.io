/**
 * AttributeEffect handler for the declarative effects system.
 * Modifies character attributes (strength, intelligence, etc.).
 */

import { EffectHandler } from './handler.interface';
import { AttributeEffect } from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { RenderedEffect, FormulaBreakdown } from '../types/render.types';
import { ABBREVIATIONS } from '../utils/abbreviations';
import {
  evaluateAmount,
  renderFormulaOnly,
  getAttributeDisplayName,
} from '../utils/render-helpers';

/**
 * Handler for AttributeEffect.
 * Uses context.increaseAttribute for aptitude-multiplied gains.
 * If effect.aptitude is true, modifies aptitude directly instead.
 */
export const attributeHandler: EffectHandler<AttributeEffect> = {
  execute(effect: AttributeEffect, context: EffectContext): void {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    if (effect.aptitude) {
      context.modifyAptitude(effect.attribute, amount);
    } else {
      context.increaseAttribute(effect.attribute, amount);
    }
  },

  render(effect: AttributeEffect, context: EffectContext): RenderedEffect {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    const positive = amount >= 0;
    const abbrev = ABBREVIATIONS.attributes[effect.attribute];
    const aptSuffix = effect.aptitude ? ' Apt' : '';
    const name = getAttributeDisplayName(effect.attribute);

    // Build formula breakdown
    let formula: FormulaBreakdown;
    if (effect.aptitude) {
      // Aptitude changes are not multiplied
      if (typeof effect.amount === 'number') {
        formula = { type: 'fixed', base: effect.amount };
      } else {
        formula = {
          type: 'fixed',
          expression: effect.amount.render(formulaContext, 'both'),
        };
      }
    } else {
      // Attribute gains are multiplied by gain multiplier
      const gainMult = context.attributes[effect.attribute].aptitudeMult;
      const baseAmount = evaluateAmount(effect.amount, formulaContext);
      const baseStr = renderFormulaOnly(effect.amount, formulaContext);
      const result = baseAmount * gainMult;

      formula = {
        type: 'multiplied',
        base: baseAmount,
        multiplierName: `${name} Gain Multiplier`,
        multiplier: gainMult,
        result,
        expression: baseStr,
      };
    }

    return {
      kind: 'attribute',
      visible: true,
      positive,
      short: {
        sign: positive ? '+' : '',
        amount: Math.abs(amount),
        label: `${abbrev}${aptSuffix}`,
      },
      long: {
        verb: positive ? 'Increases' : 'Decreases',
        amount: Math.abs(amount),
        name,
        suffix: effect.aptitude ? 'aptitude' : undefined,
      },
      formula,
    };
  },
};
