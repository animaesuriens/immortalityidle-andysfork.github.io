/**
 * Condition types for the declarative effects system.
 * Conditions are used in ConditionalEffect to control effect execution.
 */

import { AttributeType, StatusType } from '../../game-state/character';
import { Formula } from './formula.types';

/**
 * Flag-based conditions (boolean properties on character state).
 */
export interface HasFlag {
  readonly kind: 'HasFlag';
  readonly flag: 'manaUnlocked' | 'yinYangUnlocked' | 'immortal' | 'god';
  readonly negate?: boolean;
}

/**
 * Attribute comparison conditions.
 */
export interface CompareAttribute {
  readonly kind: 'CompareAttribute';
  readonly attribute: AttributeType;
  readonly operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  readonly value: number | Formula;
}

/**
 * Status comparison conditions.
 */
export interface CompareStatus {
  readonly kind: 'CompareStatus';
  readonly status: StatusType;
  readonly operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  readonly value: number | Formula;
}

/**
 * Compare two game values (for yin/yang balance logic).
 */
export interface CompareValues {
  readonly kind: 'CompareValues';
  readonly left: 'yin' | 'yang' | 'health' | 'stamina' | 'mana' | 'nourishment';
  readonly operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  readonly right: 'yin' | 'yang' | 'health' | 'stamina' | 'mana' | 'nourishment' | number;
}

/**
 * Furniture check conditions.
 */
export interface HasFurniture {
  readonly kind: 'HasFurniture';
  readonly slot: 'workbench' | 'bed' | 'bathtub' | 'kitchen' | 'storage';
  /** Specific furniture ID; if omitted, checks if slot has any furniture */
  readonly furnitureId?: string;
}

/**
 * Inventory conditions.
 */
export interface HasInventory {
  readonly kind: 'HasInventory';
  readonly check: 'hasSlots' | 'hasItem';
  readonly itemId?: string;
  readonly quantity?: number;
}

/**
 * Logical AND combinator.
 */
export interface And {
  readonly kind: 'And';
  readonly conditions: Condition[];
}

/**
 * Logical OR combinator.
 */
export interface Or {
  readonly kind: 'Or';
  readonly conditions: Condition[];
}

/**
 * Logical NOT combinator.
 */
export interface Not {
  readonly kind: 'Not';
  readonly condition: Condition;
}

/**
 * Union of all condition types (9 variants).
 */
export type Condition =
  | HasFlag
  | CompareAttribute
  | CompareStatus
  | CompareValues
  | HasFurniture
  | HasInventory
  | And
  | Or
  | Not;
