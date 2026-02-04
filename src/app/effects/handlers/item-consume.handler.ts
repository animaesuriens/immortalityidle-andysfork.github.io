/**
 * ItemConsumeEffect handler for the declarative effects system.
 * Consumes items from inventory, optionally storing the consumed item's grade.
 * Supports abort-on-failure (default onError='abort') for conditional chains.
 */

import { EffectHandler } from './handler.interface';
import { ItemConsumeEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { RenderedEffect } from '../types/render.types';

/**
 * Handler for ItemConsumeEffect.
 * Consumes items by type, stores grade if storeGradeAs is set, emits itemConsumed event.
 */
export const itemConsumeHandler: EffectHandler<ItemConsumeEffect> = {
  execute(effect: ItemConsumeEffect, context: EffectContext): void {
    const quantity = effect.quantity ?? 1;
    const grade = context.consumeItem(effect.itemType, quantity, effect.minGrade);

    if (grade === 0) {
      // Item not found or insufficient quantity
      const errorMode = effect.onError ?? 'abort';
      if (errorMode === 'abort') {
        throw new Error(`Failed to consume ${quantity} ${effect.itemType}: insufficient items`);
      }
      // 'continue' or 'skip' - just return without consuming
      return;
    }

    // Store grade as variable if requested
    if (effect.storeGradeAs) {
      context.setVariable(effect.storeGradeAs, grade);
    }

    // Emit event
    context.emitEvent({ kind: 'itemConsumed', itemType: effect.itemType, grade });
  },

  render(effect: ItemConsumeEffect, _context: EffectContext): RenderedEffect {
    const quantity = effect.quantity ?? 1;
    const displayName = formatItemName(effect.itemType);

    return {
      kind: 'item',
      visible: true,
      positive: false,
      short: {
        sign: '-',
        amount: quantity,
        label: displayName,
      },
      long: {
        verb: 'Consumes',
        amount: quantity,
        name: displayName,
      },
      formula: { type: 'fixed', base: quantity },
    };
  },
};

/**
 * Format an item type string for display.
 * Capitalizes first letter of each word.
 */
function formatItemName(itemType: string): string {
  return itemType
    .split(/(?=[A-Z])|[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
