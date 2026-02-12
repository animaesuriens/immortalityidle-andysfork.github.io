/**
 * AttributeEffect handler for the declarative effects system.
 * Modifies character attributes (strength, intelligence, etc.).
 */

import { EffectHandler } from './handler.interface';
import { AttributeEffect } from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { evaluateAmount } from '../utils/render-helpers';

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
};
