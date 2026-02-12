/**
 * Handler interface for the declarative effects system.
 * Each effect type has exactly one handler that implements execute().
 * Rendering is handled by the universal effect parser (parser/effect-parser.ts).
 */

import { Effect, EffectKind } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

/**
 * Interface that all effect handlers must implement.
 *
 * Effect handlers are responsible for executing the effect (modifying game state).
 * Rendering is handled centrally by the universal effect parser.
 *
 * @template T The specific effect type this handler processes
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
