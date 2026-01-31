/**
 * SpawnEnemyEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 */

import { EffectHandler } from './handler.interface';
import { SpawnEnemyEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { RenderedEffect } from '../types/render.types';

/**
 * Handler for SpawnEnemyEffect.
 * Stub - not implemented until Phase 4.
 */
export const spawnEnemyHandler: EffectHandler<SpawnEnemyEffect> = {
  execute(_effect: SpawnEnemyEffect, _context: EffectContext): void {
    throw new Error('SpawnEnemyHandler not implemented - Phase 4');
  },
  render(_effect: SpawnEnemyEffect, _context: EffectContext): RenderedEffect {
    throw new Error('SpawnEnemyHandler not implemented - Phase 4');
  },
};
