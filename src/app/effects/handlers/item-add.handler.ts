/**
 * ItemAddEffect handler for the declarative effects system.
 * Adds items to inventory.
 * Supports simple item lookup by ID, quantity formulas, and factory generation.
 * Silently fails if no inventory space.
 * Rendering is handled by the universal effect parser.
 */

import { EffectHandler } from './handler.interface';
import { ItemAddEffect, FactoryArg } from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { evaluateAmount } from '../utils/render-helpers';
import { Formula } from '../types/formula.types';

/**
 * Handler for ItemAddEffect.
 * Supports itemId path (simple lookup) and factory path (generated items).
 */
export const itemAddHandler: EffectHandler<ItemAddEffect> = {
  execute(effect: ItemAddEffect, context: EffectContext): void {
    // Silently fail if no inventory space
    if (!context.hasInventorySlots()) {
      return;
    }

    const formulaContext = toFormulaContext(context);

    if (effect.itemId) {
      // Simple item lookup path
      const quantity = effect.quantity
        ? Math.floor(evaluateAmount(effect.quantity, formulaContext))
        : 1;

      if (quantity > 0) {
        context.addItem(effect.itemId, quantity);
        context.emitEvent({ kind: 'itemAdded', itemId: effect.itemId, quantity });
      }
    } else if (effect.factory) {
      // Factory-generated item path
      const args = resolveFactoryArgs(effect.args ?? [], context, formulaContext);
      callFactory(effect.factory, args, context);
    }
  },
};

/**
 * Resolve factory arguments from mixed types to numbers.
 */
function resolveFactoryArgs(
  args: FactoryArg[],
  context: EffectContext,
  formulaContext: ReturnType<typeof toFormulaContext>
): number[] {
  return args.map(arg => {
    if (typeof arg === 'number') return arg;
    if (typeof arg === 'object' && 'ref' in arg && arg.ref === 'variable') {
      return context.variables[arg.name] ?? 0;
    }
    // Formula
    return evaluateAmount(arg as Formula, formulaContext);
  });
}

/**
 * Call a factory function to generate an item.
 */
function callFactory(factory: string, args: number[], context: EffectContext): void {
  switch (factory) {
    case 'generateWeapon':
      context.generateWeapon(args[0] ?? 1, args[1]?.toString() ?? 'metal');
      context.emitEvent({ kind: 'itemAdded', itemId: 'weapon', quantity: 1 });
      break;
    case 'generateArmor':
      context.generateArmor(args[0] ?? 1, 'body' as any);
      context.emitEvent({ kind: 'itemAdded', itemId: 'armor', quantity: 1 });
      break;
    case 'generatePotion':
      context.generatePotion(args[0] ?? 1);
      context.emitEvent({ kind: 'itemAdded', itemId: 'potion', quantity: 1 });
      break;
    case 'generatePill':
      context.generatePill(args[0] ?? 1);
      context.emitEvent({ kind: 'itemAdded', itemId: 'pill', quantity: 1 });
      break;
    default:
      console.warn(`Unknown factory: ${factory}`);
  }
}
