/**
 * SpawnEnemyEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 */

import { EffectHandler, RenderFormat } from './handler.interface';
import { SpawnEnemyEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

/**
 * Handler for SpawnEnemyEffect.
 * Stub - not implemented until Phase 4.
 */
export const spawnEnemyHandler: EffectHandler<SpawnEnemyEffect> = {
  execute(_effect: SpawnEnemyEffect, _context: EffectContext): void {
    throw new Error('SpawnEnemyHandler not implemented - Phase 4');
  },
  render(_effect: SpawnEnemyEffect, _context: EffectContext, _format: RenderFormat): string {
    throw new Error('SpawnEnemyHandler not implemented - Phase 4');
  },
};
