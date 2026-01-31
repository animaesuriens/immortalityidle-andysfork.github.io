/**
 * Formula types for the declarative effects system.
 * Formulas can be evaluated to numbers and rendered to display strings.
 */

import { AttributeType, StatusType } from '../../game-state/character';

/**
 * Context provided to formula evaluation and rendering.
 * Read-only snapshot of game state values.
 */
export interface FormulaContext {
  readonly attributes: Record<AttributeType, number>;
  readonly status: Record<StatusType, { value: number; max: number }>;
  readonly money: number;
  /** Custom variables set during effect execution (e.g., consumed item grade) */
  readonly variables: Record<string, number>;
}

/**
 * Render format for formula output.
 * - 'value': Just the computed number (e.g., "127")
 * - 'formula': The formula expression (e.g., "log2(Cha) + Water Lore x 5")
 * - 'both': Value with formula (e.g., "127 (log2(Cha) + Water Lore x 5)")
 */
export type FormulaRenderFormat = 'value' | 'formula' | 'both';

/**
 * A formula that can be evaluated to a number and rendered to a string.
 * This is the core abstraction for the "single source of truth" requirement.
 */
export interface Formula {
  /**
   * Evaluate the formula to a number.
   * @param context Game state values for variable substitution
   */
  evaluate(context: FormulaContext): number;

  /**
   * Render the formula to a display string.
   * @param context Game state values (for 'value' format)
   * @param format Output format
   */
  render(context: FormulaContext, format: FormulaRenderFormat): string;
}
