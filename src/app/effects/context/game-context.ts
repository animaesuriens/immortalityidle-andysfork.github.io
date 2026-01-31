/**
 * GameContext - Implementation of EffectContext for the declarative effects system.
 *
 * This class wraps Angular services and provides a clean interface for effect handlers.
 * Variables are scoped to a single activity execution.
 *
 * Designed for testability: mock EffectContext for unit tests.
 */

import {
  EffectContext,
  AttributeValue,
  StatusValue,
  FurnitureSlot,
} from '../types/context.types';
import { CharacterService } from '../../game-state/character.service';
import { InventoryService, Equipment, Pill } from '../../game-state/inventory.service';
import { AttributeType, StatusType, EquipmentPosition } from '../../game-state/character';
import { LogTopic } from '../../game-state/log.service';
import { EnemyConfig } from '../types/effect.types';
import { BigNumberPipe } from '../../app.component';

/**
 * Concrete implementation of EffectContext that bridges effect handlers to Angular services.
 *
 * This class is instantiated fresh for each activity execution, ensuring variables
 * are scoped correctly and handlers have a consistent view of game state.
 */
export class GameContext implements EffectContext {
  private _variables: Record<string, number> = {};

  constructor(
    private readonly characterService: CharacterService,
    private readonly inventoryService: InventoryService,
    private readonly bigNumberPipe: BigNumberPipe,
  ) {}

  // ============================================================
  // READ-ONLY STATE ACCESS
  // ============================================================

  get attributes(): Readonly<Record<AttributeType, AttributeValue>> {
    const state = this.characterService.characterState;
    const result: Record<string, AttributeValue> = {};
    for (const key of Object.keys(state.attributes) as AttributeType[]) {
      result[key] = {
        value: state.attributes[key].value,
        aptitude: state.attributes[key].aptitude,
        aptitudeMult: state.attributes[key].aptitudeMult,
      };
    }
    return result as Record<AttributeType, AttributeValue>;
  }

  get status(): Readonly<Record<StatusType, StatusValue>> {
    const state = this.characterService.characterState;
    return {
      health: { value: state.status.health.value, max: state.status.health.max },
      stamina: { value: state.status.stamina.value, max: state.status.stamina.max },
      mana: { value: state.status.mana.value, max: state.status.mana.max },
      nourishment: { value: state.status.nourishment.value, max: state.status.nourishment.max },
    };
  }

  get money(): number {
    return this.characterService.characterState.money;
  }

  get manaUnlocked(): boolean {
    return this.characterService.characterState.manaUnlocked;
  }

  get yinYangUnlocked(): boolean {
    return this.characterService.characterState.yinYangUnlocked;
  }

  get immortal(): boolean {
    return this.characterService.characterState.immortal;
  }

  get god(): boolean {
    return this.characterService.characterState.god;
  }

  get yin(): number {
    return this.characterService.characterState.yin;
  }

  get yang(): number {
    return this.characterService.characterState.yang;
  }

  get variables(): Record<string, number> {
    return { ...this._variables };
  }

  // ============================================================
  // MUTATION METHODS
  // ============================================================

  increaseAttribute(attribute: AttributeType, amount: number): number {
    return this.characterService.characterState.increaseAttribute(attribute, amount);
  }

  modifyAptitude(attribute: AttributeType, amount: number): void {
    this.characterService.characterState.attributes[attribute].aptitude += amount;
  }

  updateMoney(amount: number): void {
    this.characterService.characterState.updateMoney(amount);
  }

  modifyStatus(status: StatusType, change: number): void {
    this.characterService.characterState.status[status].value += change;
  }

  modifyStatusMax(status: StatusType, change: number): void {
    this.characterService.characterState.status[status].max += change;
  }

  modifyYinYang(which: 'yin' | 'yang', amount: number): void {
    if (which === 'yin') {
      this.characterService.characterState.yin += amount;
    } else {
      this.characterService.characterState.yang += amount;
    }
  }

  modifyLifespan(amount: number, cap?: number): void {
    // Apply to alchemy lifespan (most common use case)
    this.characterService.characterState.alchemyLifespan += amount;
    if (cap !== undefined && this.characterService.characterState.alchemyLifespan > cap) {
      this.characterService.characterState.alchemyLifespan = cap;
    }
  }

  setVariable(name: string, value: number): void {
    this._variables[name] = value;
  }

  // ============================================================
  // ITEM OPERATIONS
  // ============================================================

  addItem(itemId: string, quantity = 1): void {
    // TODO: Implement in Phase 4 when item handlers are built
    console.warn(`GameContext.addItem not yet implemented: ${itemId} x${quantity}`);
  }

  consumeItem(itemType: string, minGrade = 0): number {
    // Uses inventory service's consume method
    // Returns the grade/value of the consumed item, or 0 if none found
    const value = this.inventoryService.consume(itemType, 1, false);
    if (value >= minGrade) {
      return value;
    }
    return 0;
  }

  generateWeapon(grade: number, material: string): Equipment {
    return this.inventoryService.generateWeapon(grade, material, true);
  }

  generateArmor(grade: number, slot: EquipmentPosition): Equipment {
    // Use 'hide' as default material for armor
    return this.inventoryService.generateArmor(grade, 'hide', slot, true);
  }

  generatePotion(grade: number): Pill {
    // Generate potion returns void; create a stub pill for the interface
    this.inventoryService.generatePotion(grade, false);
    // Return a minimal pill representation
    return {
      id: 'potion',
      name: 'Potion',
      description: 'A generated potion',
      value: grade,
      type: 'potion',
      effect: 'attribute',
      power: grade,
    };
  }

  generatePill(grade: number): Pill {
    this.inventoryService.generatePill(grade);
    // Return a minimal pill representation
    return {
      id: 'pill',
      name: 'Longevity Pill',
      description: 'A generated pill',
      value: grade * 10,
      type: 'pill',
      effect: 'Longevity',
      power: grade,
    };
  }

  hasInventorySlots(): boolean {
    return this.inventoryService.openInventorySlots() > 0;
  }

  // ============================================================
  // PROGRESS OPERATIONS
  // ============================================================

  incrementProgress(progressType: string, amount = 1): void {
    // TODO: Implement in Phase 4 when progress handler is built
    console.warn(`GameContext.incrementProgress not yet implemented: ${progressType} +${amount}`);
  }

  checkProgressCompletion(): void {
    // TODO: Implement in Phase 4 when progress handler is built
  }

  // ============================================================
  // SPAWN OPERATIONS
  // ============================================================

  spawnEnemy(config: EnemyConfig): void {
    // TODO: Implement in Phase 4 when spawn handlers are built
    console.warn('GameContext.spawnEnemy not yet implemented:', config);
  }

  spawnFollower(): void {
    // TODO: Implement in Phase 4 when spawn handlers are built
    console.warn('GameContext.spawnFollower not yet implemented');
  }

  spawnPet(): void {
    // TODO: Implement in Phase 4 when spawn handlers are built
    console.warn('GameContext.spawnPet not yet implemented');
  }

  triggerBattle(): void {
    // TODO: Implement in Phase 4 when battle handler is built
    console.warn('GameContext.triggerBattle not yet implemented');
  }

  // ============================================================
  // HOME/FURNITURE CHECKS
  // ============================================================

  hasFurniture(slot: FurnitureSlot, furnitureId?: string): boolean {
    // TODO: Implement when HomeService is wired up
    // For now, return false (no furniture)
    console.warn(`GameContext.hasFurniture not yet implemented: ${slot}, ${furnitureId}`);
    return false;
  }

  getFurnitureId(slot: FurnitureSlot): string | undefined {
    // TODO: Implement when HomeService is wired up
    console.warn(`GameContext.getFurnitureId not yet implemented: ${slot}`);
    return undefined;
  }

  // ============================================================
  // LOGGING
  // ============================================================

  log(topic: LogTopic, message: string): void {
    // TODO: Wire up LogService when needed
    console.log(`[${topic}] ${message}`);
  }

  logInjury(topic: LogTopic, message: string): void {
    // TODO: Wire up LogService when needed
    console.warn(`[${topic}] INJURY: ${message}`);
  }

  // ============================================================
  // FORMATTING
  // ============================================================

  formatNumber(value: number): string {
    return this.bigNumberPipe.transform(value);
  }
}
