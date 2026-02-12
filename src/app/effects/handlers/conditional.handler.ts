/**
 * ConditionalEffect handler for the declarative effects system.
 * Evaluates conditions and executes 'then' or 'else' effects.
 * Rendering is handled by the universal effect parser.
 */

import { EffectHandler, HandlerRegistry } from './handler.interface';
import { ConditionalEffect, Effect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { evaluateCondition } from '../conditions/condition-evaluator';

/**
 * Late-bound reference to the handler registry.
 * Set by handler-registry.ts after all handlers are created.
 * This breaks the circular dependency between conditional.handler and registry.
 */
let registryRef: HandlerRegistry | null = null;

/**
 * Set the handler registry reference for nested effect execution.
 * Called by handler-registry.ts after registry creation.
 */
export function setRegistryRef(registry: HandlerRegistry): void {
  registryRef = registry;
}

/**
 * Execute a single effect using the registry.
 */
function executeEffect(effect: Effect, context: EffectContext): void {
  if (!registryRef) {
    throw new Error('Handler registry not initialized');
  }
  const handler = registryRef[effect.kind] as EffectHandler<typeof effect>;
  handler.execute(effect, context);
}

/**
 * Handler for ConditionalEffect.
 * Evaluates the condition and executes 'then' effects if true,
 * 'else' effects if false (when provided).
 */
export const conditionalHandler: EffectHandler<ConditionalEffect> = {
  execute(effect: ConditionalEffect, context: EffectContext): void {
    const result = evaluateCondition(effect.condition, context);

    if (result) {
      for (const nested of effect.then) {
        executeEffect(nested, context);
      }
    } else if (effect.else) {
      for (const nested of effect.else) {
        executeEffect(nested, context);
      }
    }
  },
};
