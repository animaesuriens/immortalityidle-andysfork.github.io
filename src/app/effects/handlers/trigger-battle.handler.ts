/**
 * TriggerBattleEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 */

import { EffectHandler } from './handler.interface';
import { TriggerBattleEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { RenderedEffect } from '../types/render.types';

/**
 * Handler for TriggerBattleEffect.
 * Stub - not implemented until Phase 4.
 */
export const triggerBattleHandler: EffectHandler<TriggerBattleEffect> = {
  execute(_effect: TriggerBattleEffect, _context: EffectContext): void {
    throw new Error('TriggerBattleHandler not implemented - Phase 4');
  },
  render(_effect: TriggerBattleEffect, _context: EffectContext): RenderedEffect {
    throw new Error('TriggerBattleHandler not implemented - Phase 4');
  },
};
