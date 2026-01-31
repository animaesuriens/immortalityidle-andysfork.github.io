/**
 * SpawnFollowerEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 */

import { EffectHandler } from './handler.interface';
import { SpawnFollowerEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { RenderedEffect } from '../types/render.types';

/**
 * Handler for SpawnFollowerEffect.
 * Stub - not implemented until Phase 4.
 */
export const spawnFollowerHandler: EffectHandler<SpawnFollowerEffect> = {
  execute(_effect: SpawnFollowerEffect, _context: EffectContext): void {
    throw new Error('SpawnFollowerHandler not implemented - Phase 4');
  },
  render(_effect: SpawnFollowerEffect, _context: EffectContext): RenderedEffect {
    throw new Error('SpawnFollowerHandler not implemented - Phase 4');
  },
};
