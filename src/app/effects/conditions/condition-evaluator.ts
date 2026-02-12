/**
 * Condition evaluator for the declarative effects system.
 * Evaluates condition expressions against the current game state.
 */

import {
  Condition,
  HasFlag,
  CompareValues,
  CompareAttribute,
  CompareStatus,
  HasFurniture,
  HasInventory,
  NoEnemies,
  CompareProperty,
} from '../types/condition.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { assertNever } from '../utils/exhaustive';

/**
 * Comparison operator type.
 */
type ComparisonOperator = '>' | '<' | '>=' | '<=' | '==' | '!=';

/**
 * Compare two numbers using the specified operator.
 */
function compare(left: number, operator: ComparisonOperator, right: number): boolean {
  switch (operator) {
    case '>':
      return left > right;
    case '<':
      return left < right;
    case '>=':
      return left >= right;
    case '<=':
      return left <= right;
    case '==':
      return left === right;
    case '!=':
      return left !== right;
    default:
      return assertNever(operator);
  }
}

/**
 * Evaluate a HasFlag condition.
 * Checks context features map for boolean flags.
 */
function evaluateHasFlag(condition: HasFlag, context: EffectContext): boolean {
  const result = context.features[condition.flag] ?? false;
  return condition.negate ? !result : result;
}

/**
 * Get a game value by name.
 */
function getGameValue(
  name: 'yin' | 'yang' | 'health' | 'stamina' | 'qi' | 'nourishment',
  context: EffectContext
): number {
  switch (name) {
    case 'yin':
      return context.yin;
    case 'yang':
      return context.yang;
    case 'health':
      return context.status.health.value;
    case 'stamina':
      return context.status.stamina.value;
    case 'qi':
      return context.status.qi.value;
    case 'nourishment':
      return context.status.nourishment.value;
    default:
      return assertNever(name);
  }
}

/**
 * Evaluate a CompareValues condition.
 * Compares yin/yang/status values using the specified operator.
 */
function evaluateCompareValues(condition: CompareValues, context: EffectContext): boolean {
  const leftValue = getGameValue(condition.left, context);
  const rightValue =
    typeof condition.right === 'number' ? condition.right : getGameValue(condition.right, context);
  return compare(leftValue, condition.operator, rightValue);
}

/**
 * Evaluate a CompareAttribute condition.
 * Compares an attribute value to a threshold.
 */
function evaluateCompareAttribute(condition: CompareAttribute, context: EffectContext): boolean {
  const attrValue = context.attributes[condition.attribute].value;
  const threshold =
    typeof condition.value === 'number' ? condition.value : condition.value.evaluate(toFormulaContext(context));
  return compare(attrValue, condition.operator, threshold);
}

/**
 * Evaluate a CompareStatus condition.
 * Compares a status value (current or max) to a threshold.
 */
function evaluateCompareStatus(condition: CompareStatus, context: EffectContext): boolean {
  const statusValue = context.status[condition.status].value;
  const threshold =
    typeof condition.value === 'number' ? condition.value : condition.value.evaluate(toFormulaContext(context));
  return compare(statusValue, condition.operator, threshold);
}

/**
 * Evaluate a HasFurniture condition.
 * Stub returning true for now - Phase 4.
 */
function evaluateHasFurniture(condition: HasFurniture, context: EffectContext): boolean {
  return context.hasFurniture(condition.slot, condition.furnitureId);
}

/**
 * Evaluate a HasInventory condition.
 * Checks for open inventory slots or specific item types with quantity.
 */
function evaluateHasInventory(condition: HasInventory, context: EffectContext): boolean {
  switch (condition.check) {
    case 'hasSlots':
      return context.hasInventorySlots();
    case 'hasItem':
      return context.hasItem(condition.itemId ?? '', condition.quantity ?? 1);
    default:
      return assertNever(condition.check);
  }
}

/**
 * Evaluate a CompareProperty condition.
 * Generic property path comparison for extensible game state checks.
 */
function evaluateCompareProperty(condition: CompareProperty, context: EffectContext): boolean {
  const actualValue = context.getPropertyValue(condition.path);
  const expectedValue = condition.value;

  // Handle null/undefined
  if (actualValue === null || actualValue === undefined) {
    return condition.operator === '!=' ? expectedValue !== null && expectedValue !== undefined : false;
  }

  switch (condition.operator) {
    case '==': return actualValue === expectedValue;
    case '!=': return actualValue !== expectedValue;
    case '>': return (actualValue as number) > (expectedValue as number);
    case '<': return (actualValue as number) < (expectedValue as number);
    case '>=': return (actualValue as number) >= (expectedValue as number);
    case '<=': return (actualValue as number) <= (expectedValue as number);
    default: return false;
  }
}

/**
 * Evaluate a condition against the current game state.
 * Uses exhaustive switch on condition.kind with assertNever for type safety.
 *
 * @param condition The condition to evaluate
 * @param context The effect context providing game state access
 * @returns true if the condition is satisfied, false otherwise
 */
export function evaluateCondition(condition: Condition, context: EffectContext): boolean {
  switch (condition.kind) {
    case 'HasFlag':
      return evaluateHasFlag(condition, context);
    case 'CompareValues':
      return evaluateCompareValues(condition, context);
    case 'CompareAttribute':
      return evaluateCompareAttribute(condition, context);
    case 'CompareStatus':
      return evaluateCompareStatus(condition, context);
    case 'HasFurniture':
      return evaluateHasFurniture(condition, context);
    case 'HasInventory':
      return evaluateHasInventory(condition, context);
    case 'And':
      return condition.conditions.every(c => evaluateCondition(c, context));
    case 'Or':
      return condition.conditions.some(c => evaluateCondition(c, context));
    case 'Not':
      return !evaluateCondition(condition.condition, context);
    case 'NoEnemies':
      return context.getEnemyCount() === 0;
    case 'CompareProperty':
      return evaluateCompareProperty(condition, context);
    default:
      return assertNever(condition);
  }
}
