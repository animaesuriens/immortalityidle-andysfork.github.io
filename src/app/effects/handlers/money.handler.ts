/**
 * MoneyEffect handler for the declarative effects system.
 * Stub implementation - Phase 4.
 */

import { EffectHandler, RenderFormat } from './handler.interface';
import { MoneyEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

/**
 * Handler for MoneyEffect.
 * Stub - not implemented until Phase 4.
 */
export const moneyHandler: EffectHandler<MoneyEffect> = {
  execute(_effect: MoneyEffect, _context: EffectContext): void {
    throw new Error('MoneyHandler not implemented - Phase 4');
  },
  render(_effect: MoneyEffect, _context: EffectContext, _format: RenderFormat): string {
    throw new Error('MoneyHandler not implemented - Phase 4');
  },
};
