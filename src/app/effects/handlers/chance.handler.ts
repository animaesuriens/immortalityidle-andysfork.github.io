/**
 * ChanceEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 */

import { EffectHandler, RenderFormat } from './handler.interface';
import { ChanceEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

/**
 * Handler for ChanceEffect.
 * Stub - not implemented until Phase 4.
 */
export const chanceHandler: EffectHandler<ChanceEffect> = {
  execute(_effect: ChanceEffect, _context: EffectContext): void {
    throw new Error('ChanceHandler not implemented - Phase 4');
  },
  render(_effect: ChanceEffect, _context: EffectContext, _format: RenderFormat): string {
    throw new Error('ChanceHandler not implemented - Phase 4');
  },
};
