/**
 * ConditionalEffect handler for the declarative effects system.
 * Evaluates conditions and executes 'then' or 'else' effects.
 */

import { EffectHandler, RenderFormat, HandlerRegistry } from './handler.interface';
import { ConditionalEffect, Effect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
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
    const conditionMet = evaluateCondition(effect.condition, context);
    const conditionStr = renderCondition(effect.condition);

    switch (format) {
      case 'short': {
        // Short format: Only show effects if condition is met, hide otherwise
        if (conditionMet) {
          const thenParts = effect.then.map(e => renderEffect(e, context, 'short')).filter(s => s);
          return thenParts.join(', ');
        } else if (effect.else && effect.else.length > 0) {
          const elseParts = effect.else.map(e => renderEffect(e, context, 'short')).filter(s => s);
          return elseParts.join(', ');
        }
        return ''; // Hide when condition not met and no else branch
      }
      case 'long': {
        // Long format: Append condition hint inside the formula parentheses
        // e.g., "(Fixed: 1)</span>" becomes "(Fixed: 1; if Yin/Yang unlocked)</span>"
        const conditionHint = `if ${conditionStr}`;
        const thenParts = effect.then.map(e => {
          const rendered = renderEffect(e, context, 'long');
          // Find the pattern ")</span>" at the end and insert before the ")"
          const endPattern = ')</span>';
          const endIdx = rendered.lastIndexOf(endPattern);
          if (endIdx !== -1) {
            return rendered.slice(0, endIdx) + `; ${conditionHint}` + rendered.slice(endIdx);
          }
          return rendered + ` <span class="effect-formula">(${conditionHint})</span>`;
        }).filter(s => s);

        let result = thenParts.join(' ');
        if (effect.else && effect.else.length > 0) {
          const elseParts = effect.else.map(e => renderEffect(e, context, 'long')).filter(s => s);
          if (elseParts.length > 0) {
            result += ` Otherwise: ${elseParts.join(' ')}`;
          }
        }
        return result;
      }
      case 'formula': {
        const thenParts = effect.then.map(e => renderEffect(e, context, 'formula')).filter(s => s);
        return `if(${conditionStr}) { ${thenParts.join('; ')} }`;
      }
    }
  },
};
