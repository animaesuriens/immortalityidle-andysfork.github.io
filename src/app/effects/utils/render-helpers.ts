/**
 * Rendering helper utilities for effect handlers.
 * Provides consistent formatting across all handlers.
 */

import { Formula, FormulaContext } from '../types/formula.types';

/**
 * Render a formula or number for long format display.
 * - Numbers render as "Fixed: X"
 * - Formulas render using their render() method with 'both' format
 */
export function renderFormulaLong(amount: number | Formula, context: FormulaContext): string {
  if (typeof amount === 'number') {
    return `Fixed: ${amount}`;
  }
  return amount.render(context, 'both');
}

/**
 * Render a formula or number for formula-only display.
 * - Numbers render as the number itself
 * - Formulas render using their render() method with 'formula' format
 */
export function renderFormulaOnly(amount: number | Formula, context: FormulaContext): string {
  if (typeof amount === 'number') {
    return String(amount);
  }
  return amount.render(context, 'formula');
}

/**
 * Evaluate a formula or number to get the numeric result.
 */
export function evaluateAmount(amount: number | Formula, context: FormulaContext): number {
  if (typeof amount === 'number') {
    return amount;
  }
  return amount.evaluate(context);
}

/**
 * Render a gain multiplier formula for attribute effects.
 * Format: "base × {Attribute} Gain Multiplier = base × mult = result"
 *
 * @param formatNumber Function to format numbers (use context.formatNumber)
 */
export function renderGainMultiplierFormula(
  amount: number | Formula,
  attributeName: string,
  gainMultiplier: number,
  context: FormulaContext,
  formatNumber: (value: number) => string
): string {
  const baseAmount = evaluateAmount(amount, context);
  const baseStr = renderFormulaOnly(amount, context);
  const result = baseAmount * gainMultiplier;
  return `${baseStr} × ${attributeName} Gain Multiplier = ${baseStr} × ${formatNumber(gainMultiplier)} = ${formatNumber(result)}`;
}

/**
 * Human-readable names for condition flags.
 */
export const FLAG_DISPLAY_NAMES: Record<string, string> = {
  manaUnlocked: 'Mana unlocked',
  yinYangUnlocked: 'Yin/Yang unlocked',
  immortal: 'Immortal',
  god: 'God',
};

/**
 * Get display name for an attribute.
 */
export function getAttributeDisplayName(attribute: string): string {
  const names: Record<string, string> = {
    strength: 'Strength',
    toughness: 'Toughness',
    speed: 'Speed',
    intelligence: 'Intelligence',
    charisma: 'Charisma',
    spirituality: 'Spirituality',
    earthLore: 'Earth Lore',
    metalLore: 'Metal Lore',
    woodLore: 'Wood Lore',
    waterLore: 'Water Lore',
    fireLore: 'Fire Lore',
    animalHandling: 'Animal Handling',
    combatMastery: 'Combat Mastery',
    magicMastery: 'Magic Mastery',
  };
  return names[attribute] ?? attribute;
}

/**
 * Get display name for a status type.
 */
export function getStatusDisplayName(status: string): string {
  const names: Record<string, string> = {
    health: 'Health',
    stamina: 'Stamina',
    mana: 'Mana',
    nourishment: 'Nourishment',
  };
  return names[status] ?? status;
}
