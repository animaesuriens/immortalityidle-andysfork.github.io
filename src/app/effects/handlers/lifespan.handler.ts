/**
 * LifespanEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 */

import { EffectHandler } from './handler.interface';
import { LifespanEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { RenderedEffect } from '../types/render.types';

/**
 * Handler for LifespanEffect.
 * Stub - not implemented until Phase 4.
 */
export const lifespanHandler: EffectHandler<LifespanEffect> = {
  execute(_effect: LifespanEffect, _context: EffectContext): void {
    throw new Error('LifespanHandler not implemented - Phase 4');
  },
  render(_effect: LifespanEffect, _context: EffectContext): RenderedEffect {
    throw new Error('LifespanHandler not implemented - Phase 4');
  },
};
