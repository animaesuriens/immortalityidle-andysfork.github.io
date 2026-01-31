/**
 * YinYangEffect handler for the declarative effects system.
 * Modifies yin/yang values or balances them.
 */

import { EffectHandler } from './handler.interface';
import { YinYangEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { RenderedEffect } from '../types/render.types';

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
        // Balance mode: increase whichever is lower
        if (context.yin <= context.yang) {
          context.modifyYinYang('yin', amount);
        } else {
          context.modifyYinYang('yang', amount);
        }
        break;
    }
  },

  render(effect: YinYangEffect, context: EffectContext): RenderedEffect {
    const amount = effect.amount ?? 1;
    const positive = amount >= 0;

    switch (effect.modify) {
      case 'yin':
        return {
          kind: 'yinyang',
          visible: true,
          positive,
          short: {
            sign: positive ? '+' : '',
            amount: Math.abs(amount),
            label: 'Yin',
          },
          long: {
            verb: 'Increases',
            amount: Math.abs(amount),
            name: 'Yin',
          },
          formula: { type: 'fixed', base: amount },
        };

      case 'yang':
        return {
          kind: 'yinyang',
          visible: true,
          positive,
          short: {
            sign: positive ? '+' : '',
            amount: Math.abs(amount),
            label: 'Yang',
          },
          long: {
            verb: 'Increases',
            amount: Math.abs(amount),
            name: 'Yang',
          },
          formula: { type: 'fixed', base: amount },
        };

      case 'balance':
        return {
          kind: 'yinyang',
          visible: true,
          positive: true,
          short: {
            sign: '',
            amount: amount,
            label: 'Balance Yin/Yang',
          },
          long: {
            verb: 'Balances',
            amount: amount,
            name: 'Yin and Yang (increases the lower value)',
          },
          formula: { type: 'fixed', base: amount },
        };
    }
  },
};
