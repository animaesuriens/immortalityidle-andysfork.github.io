/**
 * ConditionalEffect handler for the declarative effects system.
 * Evaluates conditions and executes 'then' or 'else' effects.
 */

import { EffectHandler, RenderFormat, HandlerRegistry } from './handler.interface';
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
 * Render a single effect using the registry.
 */
function renderEffect(effect: Effect, context: EffectContext, format: RenderFormat): string {
  if (!registryRef) {
    throw new Error('Handler registry not initialized');
  }
  const handler = registryRef[effect.kind] as EffectHandler<typeof effect>;
  return handler.render(effect, context, format);
}

/**
 * Render a condition to a human-readable string.
 */
function renderCondition(condition: ConditionalEffect['condition']): string {
  switch (condition.kind) {
    case 'HasFlag':
      return condition.negate ? `!${condition.flag}` : condition.flag;
    case 'CompareValues':
      return `${condition.left} ${condition.operator} ${condition.right}`;
    case 'CompareAttribute':
      return `${condition.attribute} ${condition.operator} ${condition.value}`;
    case 'CompareStatus':
      return `${condition.status} ${condition.operator} ${condition.value}`;
    case 'HasFurniture':
      return condition.furnitureId ? `has ${condition.furnitureId}` : `has ${condition.slot}`;
    case 'HasInventory':
      return condition.check === 'hasSlots' ? 'has slots' : `has ${condition.itemId}`;
    case 'And':
      return condition.conditions.map(c => renderCondition(c)).join(' AND ');
    case 'Or':
      return condition.conditions.map(c => renderCondition(c)).join(' OR ');
    case 'Not':
      return `NOT (${renderCondition(condition.condition)})`;
  }
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

  render(effect: ConditionalEffect, context: EffectContext, format: RenderFormat): string {
    const conditionStr = renderCondition(effect.condition);

    switch (format) {
      case 'short': {
        // Render the 'then' effects with condition hint
        const thenParts = effect.then.map(e => renderEffect(e, context, 'short'));
        return `${thenParts.join(', ')} (if ${conditionStr})`;
      }
      case 'long': {
        const thenParts = effect.then.map(e => renderEffect(e, context, 'long'));
        let result = `If ${conditionStr}: ${thenParts.join(' ')}`;
        if (effect.else && effect.else.length > 0) {
          const elseParts = effect.else.map(e => renderEffect(e, context, 'long'));
          result += ` Otherwise: ${elseParts.join(' ')}`;
        }
        return result;
      }
      case 'formula': {
        const thenParts = effect.then.map(e => renderEffect(e, context, 'formula'));
        return `if(${conditionStr}) { ${thenParts.join('; ')} }`;
      }
    }
  },
};
