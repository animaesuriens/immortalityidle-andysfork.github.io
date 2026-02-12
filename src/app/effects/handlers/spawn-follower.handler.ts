/**
 * SpawnFollowerEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 * Rendering is handled by the universal effect parser.
 */

import { EffectHandler } from './handler.interface';
import { SpawnFollowerEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

/**
 * Handler for SpawnFollowerEffect.
 * Stub - not implemented until Phase 4.
 */
export const spawnFollowerHandler: EffectHandler<SpawnFollowerEffect> = {
  execute(_effect: SpawnFollowerEffect, _context: EffectContext): void {
    throw new Error('SpawnFollowerHandler not implemented - Phase 4');
  },
};
