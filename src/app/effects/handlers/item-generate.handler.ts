/**
 * ItemGenerateEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 * Rendering is handled by the universal effect parser.
 */

import { EffectHandler } from './handler.interface';
import { ItemGenerateEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

/**
 * Handler for ItemGenerateEffect.
 * Stub - not implemented until Phase 4.
 */
export const itemGenerateHandler: EffectHandler<ItemGenerateEffect> = {
  execute(_effect: ItemGenerateEffect, _context: EffectContext): void {
    throw new Error('ItemGenerateHandler not implemented - Phase 4');
  },
};
