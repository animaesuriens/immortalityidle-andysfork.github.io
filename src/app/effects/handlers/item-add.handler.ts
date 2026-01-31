/**
 * ItemAddEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 */

import { EffectHandler } from './handler.interface';
import { ItemAddEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { RenderedEffect } from '../types/render.types';

/**
 * Handler for ItemAddEffect.
 * Stub - not implemented until Phase 4.
 */
export const itemAddHandler: EffectHandler<ItemAddEffect> = {
  execute(_effect: ItemAddEffect, _context: EffectContext): void {
    throw new Error('ItemAddHandler not implemented - Phase 4');
  },
  render(_effect: ItemAddEffect, _context: EffectContext): RenderedEffect {
    throw new Error('ItemAddHandler not implemented - Phase 4');
  },
};
