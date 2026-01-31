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
}

/**
 * Attribute modification effect.
 */
export interface AttributeEffect extends BaseEffect {
  readonly type: 'attribute';
  readonly attribute: AttributeType;
  readonly value: number | Formula;
  /** If true, modifies aptitude instead of value */
  readonly aptitude?: boolean;
}

/**
 * Status modification effect (health, stamina, mana, nourishment).
 */
export interface StatusEffect extends BaseEffect {
  readonly type: 'status';
  readonly status: StatusType;
  readonly change: number | Formula;
  /** If true, modifies max instead of current value */
  readonly modifyMax?: boolean;
}

/**
 * Money effect.
 */
export interface MoneyEffect extends BaseEffect {
  readonly type: 'money';
  readonly amount: number | Formula;
}

/**
 * Add item to inventory effect.
 */
export interface ItemAddEffect extends BaseEffect {
  readonly type: 'item.add';
  readonly itemId: string;
  readonly quantity?: number | Formula;
}

/**
 * Consume item from inventory effect.
 */
export interface ItemConsumeEffect extends BaseEffect {
  readonly type: 'item.consume';
  readonly itemType: string;
  readonly minGrade?: number;
  /** Variable name to store consumed item's grade */
  readonly storeGradeAs?: string;
}

/**
 * Generate equipment or consumable effect.
 */
export interface ItemGenerateEffect extends BaseEffect {
  readonly type: 'item.generate';
  readonly category: 'weapon' | 'armor' | 'potion' | 'pill';
  readonly grade: number | Formula;
  readonly material?: string;
}

/**
 * Conditional effect - executes effects based on condition.
 */
export interface ConditionalEffect extends BaseEffect {
  readonly type: 'conditional';
  readonly condition: Condition;
  readonly then: Effect[];
  readonly else?: Effect[];
}

/**
 * Probability effect - executes effects based on chance.
 */
export interface ChanceEffect extends BaseEffect {
  readonly type: 'chance';
  readonly probability: number | Formula;
  readonly effects: Effect[];
}

/**
 * Progress counter effect.
 */
export interface ProgressEffect extends BaseEffect {
  readonly type: 'progress';
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
  readonly type: 'spawn.enemy';
  readonly enemyConfig: EnemyConfig;
}

/**
 * Spawn follower effect.
 */
export interface SpawnFollowerEffect extends BaseEffect {
  readonly type: 'spawn.follower';
}

/**
 * Yin/Yang modification effect.
 */
export interface YinYangEffect extends BaseEffect {
  readonly type: 'yinyang';
  readonly modify: 'yin' | 'yang' | 'balance';
  readonly amount?: number;
}

/**
 * Trigger battle effect.
 */
export interface TriggerBattleEffect extends BaseEffect {
  readonly type: 'trigger.battle';
}

/**
 * Lifespan modification effect.
 */
export interface LifespanEffect extends BaseEffect {
  readonly type: 'lifespan';
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
 * Extract effect type literals for registry typing.
 */
export type EffectType = Effect['type'];
