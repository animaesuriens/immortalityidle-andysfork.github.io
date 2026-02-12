/**
 * Condition types for the declarative effects system.
 * Conditions are used in ConditionalEffect to control effect execution.
 */

import { AttributeType, StatusType } from '../../game-state/character';
import { Formula } from './formula.types';
import { FurnitureSlot } from './context.types';

/**
 * Flag-based conditions (boolean properties on character state).
 */
export interface HasFlag {
  readonly kind: 'HasFlag';
  readonly flag: string;
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
  readonly left: 'yin' | 'yang' | 'health' | 'stamina' | 'qi' | 'nourishment';
  readonly operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  readonly right: 'yin' | 'yang' | 'health' | 'stamina' | 'qi' | 'nourishment' | number;
}

/**
 * Furniture check conditions.
 */
export interface HasFurniture {
  readonly kind: 'HasFurniture';
  readonly slot: FurnitureSlot;
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
 * Check if no enemies currently exist.
 */
export interface NoEnemies {
  readonly kind: 'NoEnemies';
}

/**
 * Generic property path comparison for extensible game state checks.
 * Path format: 'furniture.workbench.id', 'followerCount.builder', etc.
 */
export interface CompareProperty {
  readonly kind: 'CompareProperty';
  readonly path: string;
  readonly operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  readonly value: string | number | boolean;
}

/**
 * Union of all condition types (11 variants).
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
  | Not
  | NoEnemies
  | CompareProperty;
