/**
 * AttributeEffect handler for the declarative effects system.
 * Modifies character attributes (strength, intelligence, etc.).
 */

import { EffectHandler, RenderFormat } from './handler.interface';
import { AttributeEffect } from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { ABBREVIATIONS } from '../utils/abbreviations';
import {
  evaluateAmount,
  renderFormulaLong,
  renderGainMultiplierFormula,
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

  render(effect: AttributeEffect, context: EffectContext, format: RenderFormat): string {
    const formulaContext = toFormulaContext(context);
    const amount = evaluateAmount(effect.amount, formulaContext);
    const sign = amount >= 0 ? '+' : '';
    const abbrev = ABBREVIATIONS.attributes[effect.attribute];
    const aptSuffix = effect.aptitude ? ' Apt' : '';

    switch (format) {
      case 'short':
        return `${sign}${context.formatNumber(amount)} ${abbrev}${aptSuffix}`;
      case 'long': {
        const verb = amount >= 0 ? 'Increases' : 'Decreases';
        const name = getAttributeDisplayName(effect.attribute);
        const aptWord = effect.aptitude ? ' aptitude' : '';
        let formulaStr: string;
        if (effect.aptitude) {
          // Aptitude changes are not multiplied
          formulaStr = renderFormulaLong(effect.amount, formulaContext);
        } else {
          // Attribute gains are multiplied by gain multiplier
          const gainMult = context.attributes[effect.attribute].aptitudeMult;
          formulaStr = renderGainMultiplierFormula(effect.amount, name, gainMult, formulaContext, v => context.formatNumber(v));
        }
        const cssClass = amount >= 0 ? 'effect-positive' : 'effect-negative';
        return `<span class="${cssClass}">${verb} ${name}${aptWord} by ${context.formatNumber(Math.abs(amount))}.</span> <span class="effect-formula">(${formulaStr})</span>`;
      }
      case 'formula':
        return typeof effect.amount === 'number'
          ? String(effect.amount)
          : effect.amount.render(formulaContext, 'formula');
    }
  },
};
