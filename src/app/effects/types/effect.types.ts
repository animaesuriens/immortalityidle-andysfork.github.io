/**
 * Effect types for the declarative effects system.
 * This is the single source of truth for all effect definitions.
 */

import { Formula } from './formula.types';
import { Condition } from './condition.types';
import { AttributeType, StatusType } from '../../game-state/character';

/**
 * Base effect properties (optional, for metadata).
 */
interface BaseEffect {
  /** Optional description for debugging/logging */
  readonly description?: string;
  /** Override default error handling for this effect */
  readonly onError?: 'continue' | 'abort' | 'skip';
}

/**
 * Attribute modification effect.
 */
export interface AttributeEffect extends BaseEffect {
  readonly kind: 'attribute';
  readonly attribute: AttributeType;
  readonly amount: number | Formula;
  /** If true, modifies aptitude instead of value */
  readonly aptitude?: boolean;
}

/**
 * Status modification effect (health, stamina, qi, nourishment).
 */
export interface StatusEffect extends BaseEffect {
  readonly kind: 'status';
  readonly status: StatusType;
  readonly amount: number | Formula;
  /** If true, modifies max instead of current value */
  readonly modifyMax?: boolean;
}

/**
 * Money effect.
 */
export interface MoneyEffect extends BaseEffect {
  readonly kind: 'money';
  readonly amount: number | Formula;
}

/**
 * Add item to inventory effect.
 */
export interface ItemAddEffect extends BaseEffect {
  readonly kind: 'item.add';
  readonly itemId: string;
  readonly quantity?: number | Formula;
}

/**
 * Consume item from inventory effect.
 */
export interface ItemConsumeEffect extends BaseEffect {
  readonly kind: 'item.consume';
  readonly itemType: string;
  readonly minGrade?: number;
  /** Variable name to store consumed item's grade */
  readonly storeGradeAs?: string;
}

/**
 * Generate equipment or consumable effect.
 */
export interface ItemGenerateEffect extends BaseEffect {
  readonly kind: 'item.generate';
  readonly category: 'weapon' | 'armor' | 'potion' | 'pill';
  readonly grade: number | Formula;
  readonly material?: string;
}

/**
 * Conditional effect - executes effects based on condition.
 */
export interface ConditionalEffect extends BaseEffect {
  readonly kind: 'conditional';
  readonly condition: Condition;
  readonly then: Effect[];
  readonly else?: Effect[];
}

/**
 * Probability effect - executes effects based on chance.
 */
export interface ChanceEffect extends BaseEffect {
  readonly kind: 'chance';
  readonly probability: number | Formula;
  readonly effects: Effect[];
}

/**
 * Progress counter effect.
 */
export interface ProgressEffect extends BaseEffect {
  readonly kind: 'progress';
  /** Matches ImpossibleTaskType or field work identifier */
  readonly progressType: string;
  readonly amount?: number | Formula;
}

/**
 * Enemy configuration for spawn effects.
 * Defined here to avoid circular dependencies with context.types.ts.
 */
export interface EnemyConfig {
  readonly name: string;
  readonly health: number;
  readonly attack: number;
  readonly defense: number;
  readonly loot?: string[];
}

/**
 * Spawn enemy effect.
 */
export interface SpawnEnemyEffect extends BaseEffect {
  readonly kind: 'spawn.enemy';
  readonly enemyConfig: EnemyConfig;
}

/**
 * Spawn follower effect.
 */
export interface SpawnFollowerEffect extends BaseEffect {
  readonly kind: 'spawn.follower';
}

/**
 * Yin/Yang modification effect.
 */
export interface YinYangEffect extends BaseEffect {
  readonly kind: 'yinyang';
  readonly modify: 'yin' | 'yang' | 'balance';
  readonly amount?: number;
}

/**
 * Trigger battle effect.
 */
export interface TriggerBattleEffect extends BaseEffect {
  readonly kind: 'trigger.battle';
}

/**
 * Lifespan modification effect.
 */
export interface LifespanEffect extends BaseEffect {
  readonly kind: 'lifespan';
  readonly amount: number | Formula;
  readonly cap?: number;
}

/**
 * Union of all effect types (14 variants).
 * TypeScript enforces exhaustive handling in switch statements.
 */
export type Effect =
  | AttributeEffect
  | StatusEffect
  | MoneyEffect
  | ItemAddEffect
  | ItemConsumeEffect
  | ItemGenerateEffect
  | ConditionalEffect
  | ChanceEffect
  | ProgressEffect
  | SpawnEnemyEffect
  | SpawnFollowerEffect
  | YinYangEffect
  | TriggerBattleEffect
  | LifespanEffect;

/**
 * Extract effect kind literals for registry typing.
 */
export type EffectKind = Effect['kind'];
