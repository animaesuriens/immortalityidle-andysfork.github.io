/**
 * ItemConsumeEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 */

import { EffectHandler, RenderFormat } from './handler.interface';
import { ItemConsumeEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

/**
 * Handler for ItemConsumeEffect.
 * Stub - not implemented until Phase 4.
 */
export const itemConsumeHandler: EffectHandler<ItemConsumeEffect> = {
  execute(_effect: ItemConsumeEffect, _context: EffectContext): void {
    throw new Error('ItemConsumeHandler not implemented - Phase 4');
  },
  render(_effect: ItemConsumeEffect, _context: EffectContext, _format: RenderFormat): string {
    throw new Error('ItemConsumeHandler not implemented - Phase 4');
  },
};
