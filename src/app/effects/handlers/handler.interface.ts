/**
 * Handler interface for the declarative effects system.
 * Each effect type has exactly one handler that implements execute() and render().
 */

import { Effect, EffectType } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

/**
 * Format for rendered effect text.
 *
 * - 'short': Compact format for activity cards (e.g., "+1 Str, -5 Sta")
 * - 'long': Full sentence for tooltips (e.g., "Increases Strength by 1")
 * - 'formula': Show the formula (e.g., "log2(Charisma) + 5")
 */
export type RenderFormat = 'short' | 'long' | 'formula';

/**
 * Interface that all effect handlers must implement.
 *
 * Effect handlers are responsible for:
 * 1. Executing the effect (modifying game state)
 * 2. Rendering the effect (generating display text)
 *
 * This separation allows the same effect definition to be used
 * for both execution and display - the "single source of truth"
 * requirement.
 *
 * @template T The specific effect type this handler processes
 *
 * @example
 * class AttributeHandler implements EffectHandler<AttributeEffect> {
 *   execute(effect: AttributeEffect, context: EffectContext): void {
 *     const value = evaluateFormula(effect.value, context);
 *     if (effect.aptitude) {
 *       context.modifyAptitude(effect.attribute, value);
 *     } else {
 *       context.increaseAttribute(effect.attribute, value);
 *     }
 *   }
 *
 *   render(effect: AttributeEffect, context: EffectContext, format: RenderFormat): string {
 *     const value = evaluateFormula(effect.value, context);
 *     switch (format) {
 *       case 'short': return `+${value} ${effect.attribute}`;
 *       case 'long': return `Increases ${effect.attribute} by ${value}`;
 *       case 'formula': return renderFormula(effect.value);
 *     }
 *   }
 * }
 */
export interface EffectHandler<T extends Effect = Effect> {
  /**
   * Execute the effect, modifying game state via the context.
   *
   * Handlers should:
   * - Evaluate any formulas using context values
   * - Apply changes via context mutation methods
   * - Set variables for use by subsequent effects if needed
   *
   * @param effect The effect definition to execute
   * @param context Access to game state and mutation methods
   */
  execute(effect: T, context: EffectContext): void;

  /**
   * Render the effect to a display string.
   *
   * Handlers should generate appropriate text based on format:
   * - 'short': Compact, for activity cards and lists
   * - 'long': Full sentences for tooltips and details
   * - 'formula': Show underlying calculation for transparency
   *
   * @param effect The effect definition to render
   * @param context Access to game state for value computation
   * @param format The output format
   * @returns Display string for UI
   */
  render(effect: T, context: EffectContext, format: RenderFormat): string;
}

/**
 * Registry type mapping each effect type to its handler.
 *
 * This type ensures exhaustive handler registration at compile time.
 * If a new effect type is added, TypeScript will error until its
 * handler is added to the registry.
 *
 * @example
 * const handlers: HandlerRegistry = {
 *   attribute: new AttributeHandler(),
 *   status: new StatusHandler(),
 *   money: new MoneyHandler(),
 *   // ... all 14 effect types must be present
 * };
 */
export type HandlerRegistry = {
  [K in EffectType]: EffectHandler<Extract<Effect, { type: K }>>;
};
