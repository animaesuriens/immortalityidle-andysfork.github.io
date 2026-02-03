/**
 * EffectContext interface for the declarative effects system.
 * This is the bridge between pure effect handlers and Angular services.
 * Designed for testability: mock this interface for unit tests.
 */

import { AttributeType, StatusType, EquipmentPosition } from '../../game-state/character';
import { Equipment, Pill } from '../../game-state/inventory.service';
import { LogTopic } from '../../game-state/log.service';
import { EnemyConfig } from './effect.types';
import { FormulaContext } from './formula.types';
import { EffectEvent } from './event.types';

/**
 * Read-only view of attribute data.
 */
export interface AttributeValue {
  readonly value: number;
  readonly aptitude: number;
  readonly aptitudeMult: number;
}

/**
 * Read-only view of status data.
 */
export interface StatusValue {
  readonly value: number;
  readonly max: number;
}

/**
 * Furniture slot types.
 */
export type FurnitureSlot = 'workbench' | 'bed' | 'bathtub' | 'kitchen' | 'storage';

/**
 * Context object providing handlers access to game state.
 * This is the bridge between pure effect handlers and Angular services.
 *
 * Designed for testability: mock this interface for unit tests.
 */
export interface EffectContext {
  // ============================================================
  // READ-ONLY STATE ACCESS
  // ============================================================

  /** Character attributes (strength, charisma, etc.) */
  readonly attributes: Readonly<Record<AttributeType, AttributeValue>>;

  /** Character status (health, stamina, qi, nourishment) */
  readonly status: Readonly<Record<StatusType, StatusValue>>;

  /** Current money */
  readonly money: number;

  /** Feature unlock flags */
  readonly qiUnlocked: boolean;
  readonly yinYangUnlocked: boolean;
  readonly immortal: boolean;
  readonly god: boolean;

  /** Yin/Yang values */
  readonly yin: number;
  readonly yang: number;

  /** Variables set during effect execution (e.g., consumed item grade) */
  readonly variables: Record<string, number>;

  // ============================================================
  // MUTATION METHODS
  // ============================================================

  /**
   * Increase an attribute by the specified amount.
   * Applies aptitude multiplier automatically.
   * @returns The actual amount increased (after multiplier)
   */
  increaseAttribute(attribute: AttributeType, amount: number): number;

  /**
   * Modify an attribute's aptitude directly.
   */
  modifyAptitude(attribute: AttributeType, amount: number): void;

  /**
   * Add or subtract money.
   */
  updateMoney(amount: number): void;

  /**
   * Modify a status value (health, stamina, qi, nourishment).
   */
  modifyStatus(status: StatusType, change: number): void;

  /**
   * Modify a status max value.
   */
  modifyStatusMax(status: StatusType, change: number): void;

  /**
   * Modify yin or yang value.
   */
  modifyYinYang(which: 'yin' | 'yang', amount: number): void;

  /**
   * Modify lifespan.
   */
  modifyLifespan(amount: number, cap?: number): void;

  /**
   * Set a variable for use in subsequent formulas.
   */
  setVariable(name: string, value: number): void;

  // ============================================================
  // ITEM OPERATIONS
  // ============================================================

  /**
   * Add an item to inventory.
   */
  addItem(itemId: string, quantity?: number): void;

  /**
   * Consume an item by type (e.g., 'metal', 'wood').
   * @returns The grade of the consumed item, or 0 if none found
   */
  consumeItem(itemType: string, minGrade?: number): number;

  /**
   * Generate a weapon.
   * @returns The generated equipment (may also add to inventory)
   */
  generateWeapon(grade: number, material: string): Equipment;

  /**
   * Generate armor.
   */
  generateArmor(grade: number, slot: EquipmentPosition): Equipment;

  /**
   * Generate a potion.
   */
  generatePotion(grade: number): Pill;

  /**
   * Generate a pill.
   */
  generatePill(grade: number): Pill;

  /**
   * Check if inventory has open slots.
   */
  hasInventorySlots(): boolean;

  // ============================================================
  // PROGRESS OPERATIONS
  // ============================================================

  /**
   * Increment a progress counter.
   * @param progressType Identifier for the progress type (e.g., 'Swim', 'RaiseIsland')
   */
  incrementProgress(progressType: string, amount?: number): void;

  /**
   * Check and handle progress completion.
   */
  checkProgressCompletion(): void;

  // ============================================================
  // SPAWN OPERATIONS
  // ============================================================

  /**
   * Spawn an enemy for battle.
   */
  spawnEnemy(config: EnemyConfig): void;

  /**
   * Spawn a follower.
   */
  spawnFollower(): void;

  /**
   * Spawn a pet.
   */
  spawnPet(): void;

  /**
   * Trigger a battle tick.
   */
  triggerBattle(): void;

  // ============================================================
  // HOME/FURNITURE CHECKS
  // ============================================================

  /**
   * Check if a specific furniture is equipped in a slot.
   * @param slot The furniture slot to check
   * @param furnitureId Optional specific furniture ID; if omitted, checks if slot has any furniture
   */
  hasFurniture(slot: FurnitureSlot, furnitureId?: string): boolean;

  /**
   * Get the ID of furniture in a slot.
   * @returns The furniture ID, or undefined if empty
   */
  getFurnitureId(slot: FurnitureSlot): string | undefined;

  // ============================================================
  // LOGGING
  // ============================================================

  /**
   * Log a message.
   */
  log(topic: LogTopic, message: string): void;

  /**
   * Log an injury message (red color).
   */
  logInjury(topic: LogTopic, message: string): void;

  // ============================================================
  // PHASE 4 ADDITIONS - QUERY METHODS
  // ============================================================

  /**
   * Get the current number of enemies.
   */
  getEnemyCount(): number;

  /**
   * Get count of followers with a specific job.
   */
  getFollowerCount(job: string): number;

  /**
   * Get total power of followers with a specific job.
   */
  getFollowerPower(job: string): number;

  /**
   * Get a property value by path (e.g., 'furniture.workbench.id').
   */
  getPropertyValue(path: string): unknown;

  /**
   * Emit an event for tracking/statistics.
   */
  emitEvent(event: EffectEvent): void;

}

/**
 * Extract a FormulaContext from an EffectContext.
 * This creates a snapshot of values suitable for formula evaluation.
 */
export function toFormulaContext(ctx: EffectContext): FormulaContext {
  const attributes: Record<string, number> = {};
  for (const key of Object.keys(ctx.attributes) as AttributeType[]) {
    attributes[key] = ctx.attributes[key].value;
  }

  const status: Record<string, { value: number; max: number }> = {};
  for (const key of ['health', 'stamina', 'qi', 'nourishment'] as StatusType[]) {
    status[key] = { value: ctx.status[key].value, max: ctx.status[key].max };
  }

  return {
    attributes: attributes as Record<AttributeType, number>,
    status: status as Record<StatusType, { value: number; max: number }>,
    money: ctx.money,
    variables: ctx.variables,
  };
}
