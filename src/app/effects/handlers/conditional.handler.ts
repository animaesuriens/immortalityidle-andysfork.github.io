/**
 * ConditionalEffect handler for the declarative effects system.
 * Evaluates conditions and executes 'then' or 'else' effects.
 */

import { EffectHandler, HandlerRegistry } from './handler.interface';
import { ConditionalEffect, Effect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { RenderedEffect } from '../types/render.types';
import { evaluateCondition } from '../conditions/condition-evaluator';
import { FLAG_DISPLAY_NAMES } from '../utils/render-helpers';

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
 * Render a single effect using the registry, returning structured data.
 */
function renderEffect(effect: Effect, context: EffectContext): RenderedEffect | RenderedEffect[] {
  if (!registryRef) {
    throw new Error('Handler registry not initialized');
  }
  const handler = registryRef[effect.kind] as EffectHandler<typeof effect>;
  return handler.render(effect, context);
}

/**
 * Render a condition to a human-readable string.
 */
function renderCondition(condition: ConditionalEffect['condition']): string {
  switch (condition.kind) {
    case 'HasFlag': {
      const name = FLAG_DISPLAY_NAMES[condition.flag] ?? condition.flag;
      return condition.negate ? `not ${name}` : name;
    }
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
      return condition.conditions.map(c => renderCondition(c)).join(' and ');
    case 'Or':
      return condition.conditions.map(c => renderCondition(c)).join(' or ');
    case 'Not':
      return `not (${renderCondition(condition.condition)})`;
  }
}

/**
 * Flatten a RenderedEffect or array of RenderedEffect into an array.
 */
function flattenEffects(effect: RenderedEffect | RenderedEffect[]): RenderedEffect[] {
  return Array.isArray(effect) ? effect : [effect];
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

  render(effect: ConditionalEffect, context: EffectContext): RenderedEffect[] {
    const conditionMet = evaluateCondition(effect.condition, context);
    const conditionStr = `if ${renderCondition(effect.condition)}`;

    const results: RenderedEffect[] = [];

    // Render 'then' branch effects
    for (const nested of effect.then) {
      const rendered = flattenEffects(renderEffect(nested, context));
      for (const r of rendered) {
        results.push({
          ...r,
          // Show effect only if condition is met
          visible: conditionMet && r.visible,
          // Add condition hint
          condition: conditionStr,
        });
      }
    }

    // Render 'else' branch effects if present
    if (effect.else && effect.else.length > 0) {
      const elseConditionStr = `if not ${renderCondition(effect.condition)}`;
      for (const nested of effect.else) {
        const rendered = flattenEffects(renderEffect(nested, context));
        for (const r of rendered) {
          results.push({
            ...r,
            // Show effect only if condition is NOT met
            visible: !conditionMet && r.visible,
            condition: elseConditionStr,
          });
        }
      }
    }

    return results;
  },
};
