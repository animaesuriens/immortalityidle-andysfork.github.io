/**
 * YinYangEffect handler for the declarative effects system.
 * Modifies yin/yang values or balances them.
 */

import { EffectHandler, RenderFormat } from './handler.interface';
import { YinYangEffect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { renderFormulaLong } from '../utils/render-helpers';

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

  render(effect: YinYangEffect, context: EffectContext, format: RenderFormat): string {
    const amount = effect.amount ?? 1;
    const sign = amount >= 0 ? '+' : '';
    // YinYang effects currently only support fixed amounts
    const formulaStr = renderFormulaLong(amount, {} as any);

    switch (format) {
      case 'short':
        switch (effect.modify) {
          case 'yin':
            return `${sign}${amount} Yin`;
          case 'yang':
            return `${sign}${amount} Yang`;
          case 'balance':
            return `Balance Yin/Yang`;
        }
        break;
      case 'long':
        switch (effect.modify) {
          case 'yin':
            return `<span class="effect-positive">Increases Yin by ${Math.abs(amount)}.</span> <span class="effect-formula">(${formulaStr})</span>`;
          case 'yang':
            return `<span class="effect-positive">Increases Yang by ${Math.abs(amount)}.</span> <span class="effect-formula">(${formulaStr})</span>`;
          case 'balance':
            return `<span class="effect-positive">Balances Yin and Yang (increases the lower value).</span> <span class="effect-formula">(${formulaStr})</span>`;
        }
        break;
      case 'formula':
        return String(amount);
    }
  },
};
