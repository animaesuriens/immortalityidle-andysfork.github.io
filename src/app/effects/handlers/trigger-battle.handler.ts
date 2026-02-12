/**
 * TriggerBattleEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 * Rendering is handled by the universal effect parser.
 */

import { EffectHandler } from './handler.interface';
import { TriggerBattleEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

/**
 * Handler for TriggerBattleEffect.
 * Stub - not implemented until Phase 4.
 */
export const triggerBattleHandler: EffectHandler<TriggerBattleEffect> = {
  execute(_effect: TriggerBattleEffect, _context: EffectContext): void {
    throw new Error('TriggerBattleHandler not implemented - Phase 4');
  },
};
