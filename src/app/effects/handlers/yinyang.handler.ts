/**
 * YinYangEffect handler for the declarative effects system.
 * Modifies yin/yang values or balances them.
 */

import { EffectHandler } from './handler.interface';
import { YinYangEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

/**
 * Handler for YinYangEffect.
 * Supports three modes:
 * - 'yin': Increase yin by amount
 * - 'yang': Increase yang by amount
 * - 'balance': Increase whichever is lower
 */
export const yinyangHandler: EffectHandler<YinYangEffect> = {
  execute(effect: YinYangEffect, context: EffectContext): void {
    const amount = effect.amount ?? 1;

    switch (effect.modify) {
      case 'yin':
        context.modifyYinYang('yin', amount);
        break;
      case 'yang':
        context.modifyYinYang('yang', amount);
        break;
      case 'balance':
        if (context.yin <= context.yang) {
          context.modifyYinYang('yin', amount);
        } else {
          context.modifyYinYang('yang', amount);
        }
        break;
    }
  },
};
