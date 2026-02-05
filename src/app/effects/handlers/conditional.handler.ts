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
 * Human-readable property names for CompareProperty conditions.
 */
const PROPERTY_DISPLAY_NAMES: Record<string, string> = {
  'followerCount.builder': 'Builders',
  'followerCount.hunter': 'Hunters',
  'followerCount.farmer': 'Farmers',
  'followerCount.soldier': 'Soldiers',
  'followerCount.researcher': 'Researchers',
};

/**
 * Human-readable operator text for condition rendering.
 */
const OPERATOR_TEXT: Record<string, string> = {
  '>=': 'at least',
  '>': 'more than',
  '<=': 'at most',
  '<': 'fewer than',
  '==': 'exactly',
  '!=': 'not',
};

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
    case 'HasInventory': {
      if (condition.check === 'hasSlots') return 'inventory has open slots';
      const itemName = (condition.itemId ?? 'item').replace(/([A-Z])/g, ' $1').trim();
      const displayName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
      const qty = condition.quantity ?? 1;
      return qty > 1 ? `have ${qty}+ ${displayName}` : `have ${displayName}`;
    }
    case 'And': {
      const parts = condition.conditions.map(c => renderCondition(c));
      if (parts.length <= 2) {
        return parts.join(' and ');
      }
      // Oxford comma: "a, b, and c"
      return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
    }
    case 'Or':
      return condition.conditions.map(c => renderCondition(c)).join(' or ');
    case 'Not':
      return `don't ${renderCondition(condition.condition)}`;
    case 'NoEnemies':
      return 'no enemies';
    case 'CompareProperty': {
      const name = PROPERTY_DISPLAY_NAMES[condition.path] ?? condition.path;
      const op = OPERATOR_TEXT[condition.operator] ?? condition.operator;
      return `have ${op} ${condition.value} ${name}`;
    }
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
    const conditionStr = `If you ${renderCondition(effect.condition)}`;

    const results: RenderedEffect[] = [];

    // Render 'then' branch effects
    for (const nested of effect.then) {
      const rendered = flattenEffects(renderEffect(nested, context));
      for (const r of rendered) {
        results.push({
          ...r,
          // Show ALL branches always - user sees all possible outcomes
          visible: r.visible,
          // Add condition hint
          condition: conditionStr,
          // Pass through path type and hide flags for display grouping
          pathType: effect.pathType,
          hideWhenUnmet: effect.hideWhenUnmet,
          conditionMet,
        });
      }
    }

    // Render 'else' branch effects if present
    if (effect.else && effect.else.length > 0) {
      const elseConditionStr = `If you don't ${renderCondition(effect.condition)}`;
      for (const nested of effect.else) {
        const rendered = flattenEffects(renderEffect(nested, context));
        for (const r of rendered) {
          results.push({
            ...r,
            // Show ALL branches always - user sees all possible outcomes
            visible: r.visible,
            condition: elseConditionStr,
            // Else branch has opposite path type (if then is success, else is failure)
            pathType: effect.pathType === 'success' ? 'failure' : effect.pathType === 'failure' ? 'success' : undefined,
            hideWhenUnmet: effect.hideWhenUnmet,
            conditionMet: !conditionMet,
          });
        }
      }
    }

    return results;
  },
};
