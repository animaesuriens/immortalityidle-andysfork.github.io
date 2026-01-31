/**
 * Condition types for the declarative effects system.
 * Conditions are used in ConditionalEffect to control effect execution.
 */

import { AttributeType, StatusType } from '../../game-state/character';
import { Formula } from './formula.types';

/**
 * Flag-based conditions (boolean properties on character state).
 */
export interface FlagCondition {
  readonly type: 'flag';
  readonly flag: 'manaUnlocked' | 'yinYangUnlocked' | 'immortal' | 'god';
  readonly negate?: boolean;
}

/**
 * Attribute comparison conditions.
 */
export interface AttributeCondition {
  readonly type: 'attribute';
  readonly attribute: AttributeType;
  readonly operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  readonly value: number | Formula;
}

/**
 * Status comparison conditions.
 */
export interface StatusCondition {
  readonly type: 'status';
  readonly status: StatusType;
  readonly operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  readonly value: number | Formula;
}

/**
 * Furniture check conditions.
 */
export interface FurnitureCondition {
  readonly type: 'furniture';
  readonly slot: 'workbench' | 'bed' | 'bathtub' | 'kitchen' | 'storage';
  /** Specific furniture ID; if omitted, checks if slot has any furniture */
  readonly furnitureId?: string;
}

/**
 * Inventory conditions.
 */
export interface InventoryCondition {
  readonly type: 'inventory';
  readonly check: 'hasSlots' | 'hasItem';
  readonly itemId?: string;
  readonly quantity?: number;
}

/**
 * Logical AND combinator.
 */
export interface AndCondition {
  readonly type: 'and';
  readonly conditions: Condition[];
}

/**
 * Logical OR combinator.
 */
export interface OrCondition {
  readonly type: 'or';
  readonly conditions: Condition[];
}

/**
 * Logical NOT combinator.
 */
export interface NotCondition {
  readonly type: 'not';
  readonly condition: Condition;
}

/**
 * Union of all condition types (8 variants).
 */
export type Condition =
  | FlagCondition
  | AttributeCondition
  | StatusCondition
  | FurnitureCondition
  | InventoryCondition
  | AndCondition
  | OrCondition
  | NotCondition;
