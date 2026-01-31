/**
 * Handler interface for the declarative effects system.
 * Each effect type has exactly one handler that implements execute() and render().
 */

import { Effect, EffectKind } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { RenderedEffect } from '../types/render.types';

/**
 * Interface that all effect handlers must implement.
 *
 * Effect handlers are responsible for:
 * 1. Executing the effect (modifying game state)
 * 2. Rendering the effect (generating structured display data)
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
 *   render(effect: AttributeEffect, context: EffectContext): RenderedEffect {
 *     const value = evaluateFormula(effect.value, context);
 *     return {
 *       kind: 'attribute',
 *       visible: true,
 *       positive: value >= 0,
 *       short: { sign: '+', amount: value, label: 'Str' },
 *       long: { verb: 'Increases', amount: value, name: 'Strength' },
 *     };
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
   * Render the effect to structured display data.
   *
   * Returns a RenderedEffect (or array for conditional effects) that contains:
   * - Short format: compact data for activity cards (sign, amount, label)
   * - Long format: full sentence data for tooltips (verb, amount, name)
   * - Formula breakdown: optional calculation details
   * - Condition hint: optional condition text for conditional effects
   *
   * Templates use this data with pipes like | bigNumber to format numbers.
   *
   * @param effect The effect definition to render
   * @param context Access to game state for value computation
   * @returns Structured display data for UI (single effect or array for conditionals)
   */
  render(effect: T, context: EffectContext): RenderedEffect | RenderedEffect[];
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
  [K in EffectKind]: EffectHandler<Extract<Effect, { kind: K }>>;
};
