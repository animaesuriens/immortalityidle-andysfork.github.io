/**
 * ChanceEffect handler for the declarative effects system.
 * Executes nested effects with probability-based gating.
 * Probability can be a number (0-1) or Formula for dynamic calculation.
 * Rendering is handled by the universal effect parser.
 *
 * Uses the same late-bound registry pattern as conditional.handler.ts
 * to break circular dependency between handler and registry.
 */

import { EffectHandler, HandlerRegistry } from './handler.interface';
import { ChanceEffect, Effect } from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { evaluateAmount } from '../utils/render-helpers';

/**
 * Late-bound reference to the handler registry.
 * Set by handler-registry.ts after all handlers are created.
 * This breaks the circular dependency between chance.handler and registry.
 */
let registryRef: HandlerRegistry | null = null;

/**
 * Set the handler registry reference for nested effect execution.
 * Called by handler-registry.ts after registry creation.
 */
export function setChanceRegistryRef(registry: HandlerRegistry): void {
  registryRef = registry;
}

/**
 * Execute a single nested effect using the registry.
 */
function executeNestedEffect(effect: Effect, context: EffectContext): void {
  if (!registryRef) {
    throw new Error('Handler registry not initialized for chance handler');
  }
  const handler = registryRef[effect.kind] as EffectHandler<typeof effect>;
  handler.execute(effect, context);
}

/**
 * Handler for ChanceEffect.
 * Evaluates probability, rolls dice, and executes nested effects.
 */
export const chanceHandler: EffectHandler<ChanceEffect> = {
  execute(effect: ChanceEffect, context: EffectContext): void {
    const formulaContext = toFormulaContext(context);
    const probability = evaluateAmount(effect.probability, formulaContext);

    // Roll the dice - single roll per execution
    if (Math.random() >= probability) {
      return; // Failed roll
    }

    // Success - execute nested effects
    for (const nested of effect.effects) {
      try {
        executeNestedEffect(nested, context);
      } catch (error) {
        const errorBehavior = nested.onError ?? 'continue';
        if (errorBehavior === 'abort') throw error;
        console.error(`Nested effect error in chance: ${nested.kind}`, error);
      }
    }
  },
};
