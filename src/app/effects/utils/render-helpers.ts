/**
 * Rendering helper utilities for effect handlers.
 * Provides consistent formatting across all handlers.
 */

import { Formula, FormulaContext } from '../types/formula.types';

/**
 * Render a formula with values substituted at leaf nodes.
 * - Numbers render as the number itself
 * - Formulas render using their render() method with 'substituted' format
 */
export function renderFormulaSubstituted(amount: number | Formula, context: FormulaContext): string {
  if (typeof amount === 'number') {
    return String(amount);
  }
  return amount.render(context, 'substituted');
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
 * Human-readable names for condition flags.
 */
export const FLAG_DISPLAY_NAMES: Record<string, string> = {
  qiUnlocked: 'Qi unlocked',
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
    qi: 'Qi',
    nourishment: 'Nourishment',
  };
  return names[status] ?? status;
}

/**
 * Format a number for display with reasonable precision.
 * Removes excessive decimal places while keeping meaningful precision.
 */
export function formatNumber(value: number): string {
  // For integers or near-integers, show as integer
  if (Math.abs(value - Math.round(value)) < 0.001) {
    return String(Math.round(value));
  }
  // For small decimals, show 2 decimal places
  if (Math.abs(value) < 100) {
    return value.toFixed(2).replace(/\.?0+$/, '');
  }
  // For larger numbers, show fewer decimals
  return value.toFixed(1).replace(/\.?0+$/, '');
}
