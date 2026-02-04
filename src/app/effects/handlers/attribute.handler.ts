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
  renderFormulaSubstituted,
  getAttributeDisplayName,
  formatNumber,
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
    const baseAmount = evaluateAmount(effect.amount, formulaContext);
    const abbrev = ABBREVIATIONS.attributes[effect.attribute];
    const aptSuffix = effect.aptitude ? ' Apt' : '';
    const name = getAttributeDisplayName(effect.attribute);

    // Build formula breakdown and calculate display amount
    let formula: FormulaBreakdown;
    let displayAmount: number;

    if (effect.aptitude) {
      // Aptitude changes are not multiplied
      displayAmount = baseAmount;
      if (typeof effect.amount === 'number') {
        formula = { type: 'fixed', base: effect.amount };
      } else {
        formula = {
          type: 'formula',
          symbolic: renderFormulaOnly(effect.amount, formulaContext),
          substituted: renderFormulaSubstituted(effect.amount, formulaContext),
          result: baseAmount,
        };
      }
    } else {
      // Attribute gains are multiplied by gain multiplier
      const gainMult = context.attributes[effect.attribute].aptitudeMult;
      const baseStr = renderFormulaOnly(effect.amount, formulaContext);
      const substitutedBase = renderFormulaSubstituted(effect.amount, formulaContext);
      displayAmount = baseAmount * gainMult;

      formula = {
        type: 'formula',
        symbolic: `${baseStr} × ${name} Gain Multiplier`,
        substituted: `${substitutedBase} × ${formatNumber(gainMult)}`,
        result: displayAmount,
      };
    }

    const positive = displayAmount >= 0;

    return {
      kind: 'attribute',
      visible: true,
      positive,
      short: {
        sign: positive ? '+' : '',
        amount: Math.abs(displayAmount),
        label: `${abbrev}${aptSuffix}`,
      },
      long: {
        verb: positive ? 'Increases' : 'Decreases',
        amount: Math.abs(displayAmount),
        name,
        suffix: effect.aptitude ? 'aptitude' : undefined,
      },
      formula,
    };
  },
};
