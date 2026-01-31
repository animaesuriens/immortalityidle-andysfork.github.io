/**
 * ProgressEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 */

import { EffectHandler, RenderFormat } from './handler.interface';
import { ProgressEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

/**
 * Handler for ProgressEffect.
 * Stub - not implemented until Phase 4.
 */
export const progressHandler: EffectHandler<ProgressEffect> = {
  execute(_effect: ProgressEffect, _context: EffectContext): void {
    throw new Error('ProgressHandler not implemented - Phase 4');
  },
  render(_effect: ProgressEffect, _context: EffectContext, _format: RenderFormat): string {
    throw new Error('ProgressHandler not implemented - Phase 4');
  },
};
