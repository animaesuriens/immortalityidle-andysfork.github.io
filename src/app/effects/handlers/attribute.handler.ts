/**
 * AttributeEffect handler for the declarative effects system.
 * Modifies character attributes (strength, intelligence, etc.).
 */

import { EffectHandler, RenderFormat } from './handler.interface';
import { AttributeEffect } from '../types/effect.types';
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
 * Get the full name for an attribute type.
 */
function getAttributeName(attribute: keyof typeof ABBREVIATIONS.attributes): string {
  switch (attribute) {
    case 'strength':
      return 'Strength';
    case 'toughness':
      return 'Toughness';
    case 'speed':
      return 'Speed';
    case 'intelligence':
      return 'Intelligence';
    case 'charisma':
      return 'Charisma';
    case 'spirituality':
      return 'Spirituality';
    case 'earthLore':
      return 'Earth Lore';
    case 'metalLore':
      return 'Metal Lore';
    case 'woodLore':
      return 'Wood Lore';
    case 'waterLore':
      return 'Water Lore';
    case 'fireLore':
      return 'Fire Lore';
    case 'animalHandling':
      return 'Animal Handling';
    case 'combatMastery':
      return 'Combat Mastery';
    case 'magicMastery':
      return 'Magic Mastery';
    default:
      return attribute;
  }
}

/**
 * Format a small number for display (preserves decimal places).
 */
function formatAmount(value: number): string {
  if (Math.abs(value) >= 1) {
    return String(Math.floor(value));
  }
  // For small values like 0.001, show decimal places
  return value.toFixed(3).replace(/\.?0+$/, '');
}

/**
 * Handler for AttributeEffect.
 * Uses context.increaseAttribute for aptitude-multiplied gains.
 * If effect.aptitude is true, modifies aptitude directly instead.
 */
export const attributeHandler: EffectHandler<AttributeEffect> = {
  execute(effect: AttributeEffect, context: EffectContext): void {
    const amount = evaluateAmount(effect.amount, context);
    if (effect.aptitude) {
      context.modifyAptitude(effect.attribute, amount);
    } else {
      context.increaseAttribute(effect.attribute, amount);
    }
  },

  render(effect: AttributeEffect, context: EffectContext, format: RenderFormat): string {
    const amount = evaluateAmount(effect.amount, context);
    const sign = amount >= 0 ? '+' : '';
    const abbrev = ABBREVIATIONS.attributes[effect.attribute];
    const aptSuffix = effect.aptitude ? ' Apt' : '';

    switch (format) {
      case 'short':
        return `${sign}${formatAmount(amount)} ${abbrev}${aptSuffix}`;
      case 'long': {
        const verb = amount >= 0 ? 'Increases' : 'Decreases';
        const name = getAttributeName(effect.attribute);
        const aptWord = effect.aptitude ? ' aptitude' : '';
        return `${verb} ${name}${aptWord} by ${formatAmount(Math.abs(amount))}.`;
      }
      case 'formula':
        return typeof effect.amount === 'number'
          ? String(effect.amount)
          : effect.amount.render(context, 'formula');
    }
  },
};
