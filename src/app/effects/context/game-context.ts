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
import { ItemRepoService } from '../../game-state/item-repo.service';
import { BattleService } from '../../game-state/battle.service';
import { FollowersService } from '../../game-state/followers.service';
import { HomeService } from '../../game-state/home.service';
import { ImpossibleTaskService, ImpossibleTaskType } from '../../game-state/impossibleTask.service';
import { AttributeType, StatusType, EquipmentPosition } from '../../game-state/character';
import { LogTopic } from '../../game-state/log.service';
import { EnemyConfig } from '../types/effect.types';
import { EffectEvent } from '../types/event.types';

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
    private readonly battleService: BattleService,
    private readonly followersService: FollowersService,
    private readonly homeService: HomeService,
    private readonly impossibleTaskService: ImpossibleTaskService,
    private readonly itemRepoService: ItemRepoService,
    private readonly eventEmitter: (event: EffectEvent) => void,
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
      qi: { value: state.status.qi.value, max: state.status.qi.max },
      nourishment: { value: state.status.nourishment.value, max: state.status.nourishment.max },
    };
  }

  get money(): number {
    return this.characterService.characterState.money;
  }

  get features(): Readonly<Record<string, boolean>> {
    const state = this.characterService.characterState;
    return {
      qiUnlocked: state.qiUnlocked,
      yinYangUnlocked: state.yinYangUnlocked,
      immortal: state.immortal,
      god: state.god,
    };
  }

  get qiUnlocked(): boolean {
    return this.characterService.characterState.qiUnlocked;
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
    // Special case: 'hide' uses tiered hide system based on animalHandling
    if (itemId === 'hide') {
      const hide = this.inventoryService.getHide();
      this.inventoryService.addItem(hide, quantity);
      return;
    }

    const item = this.itemRepoService.getItemById(itemId);
    if (!item) {
      console.warn(`GameContext.addItem: unknown item ID '${itemId}'`);
      return;
    }
    this.inventoryService.addItem(item, quantity);
  }

  consumeItem(itemType: string, quantity = 1, minGrade = 0): number {
    // Uses inventory service's consume method
    // Returns the grade/value of the consumed item, or 0 if none found
    const value = this.inventoryService.consume(itemType, quantity, false);
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

  hasItem(itemType: string, quantity = 1): boolean {
    return this.inventoryService.getQuantityByType(itemType) >= quantity;
  }

  // ============================================================
  // PROGRESS OPERATIONS
  // ============================================================

  incrementProgress(progressType: string, amount = 1): void {
    const taskType = this.resolveProgressType(progressType);
    if (taskType !== null) {
      const progress = this.impossibleTaskService.taskProgress[taskType];
      if (progress) {
        progress.progress += amount;
        this.emitEvent({ kind: 'progressUpdated', progressType, amount });
      }
    }
  }

  private resolveProgressType(progressType: string): ImpossibleTaskType | null {
    // Map string names to enum values
    const mapping: Record<string, ImpossibleTaskType> = {
      'Swim': ImpossibleTaskType.Swim,
      'RaiseIsland': ImpossibleTaskType.RaiseIsland,
      'BuildTower': ImpossibleTaskType.BuildTower,
      'TameWinds': ImpossibleTaskType.TameWinds,
      'LearnToFly': ImpossibleTaskType.LearnToFly,
      'BefriendDragon': ImpossibleTaskType.BefriendDragon,
      'ConquerTheWorld': ImpossibleTaskType.ConquerTheWorld,
      'RearrangeTheStars': ImpossibleTaskType.RearrangeTheStars,
      'OvercomeDeath': ImpossibleTaskType.OvercomeDeath,
    };
    return mapping[progressType] ?? null;
  }

  checkProgressCompletion(): void {
    this.impossibleTaskService.checkCompletion();
  }

  // ============================================================
  // SPAWN OPERATIONS
  // ============================================================

  spawnEnemy(config: EnemyConfig): void {
    this.battleService.addEnemy({
      name: config.name,
      baseName: config.name, // Use name as baseName
      health: config.health,
      maxHealth: config.health,
      accuracy: config.accuracy ?? 0.5,
      attack: config.attack,
      defense: config.defense,
      loot: [], // Loot items are handled separately by the game
    });
    this.emitEvent({ kind: 'enemySpawned', enemyName: config.name });
  }

  spawnFollower(): void {
    this.followersService.generateFollower();
  }

  spawnPet(): void {
    this.followersService.generateFollower(true);
  }

  triggerBattle(): void {
    // Add ticks to the battle counter to trigger a combat round
    this.battleService.tickCounter += this.battleService.ticksPerFight;
  }

  // ============================================================
  // HOME/FURNITURE CHECKS
  // ============================================================

  hasFurniture(slot: FurnitureSlot, furnitureId?: string): boolean {
    const furniture = this.homeService.furniture[slot];
    if (!furniture) return false;
    if (furnitureId) return furniture.id === furnitureId;
    return true;
  }

  getFurnitureId(slot: FurnitureSlot): string | undefined {
    return this.homeService.furniture[slot]?.id;
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
  // PHASE 4 ADDITIONS - QUERY METHODS
  // ============================================================

  getEnemyCount(): number {
    return this.battleService.enemies.length;
  }

  getFollowerCount(job: string): number {
    return this.followersService.followers.filter(f => f.job === job).length;
  }

  getFollowerPower(job: string): number {
    const jobData = this.followersService.jobs[job];
    return jobData?.totalPower ?? 0;
  }

  getPropertyValue(path: string): unknown {
    const parts = path.split('.');
    let current: unknown = this.getPropertyRoot(parts[0]);
    for (let i = 1; i < parts.length && current != null; i++) {
      current = (current as Record<string, unknown>)[parts[i]];
    }
    return current;
  }

  private getPropertyRoot(root: string): unknown {
    switch (root) {
      case 'furniture': return this.homeService.furniture;
      case 'followerCount': {
        // Build a count object for follower jobs
        const counts: Record<string, number> = {};
        for (const f of this.followersService.followers) {
          counts[f.job] = (counts[f.job] ?? 0) + 1;
        }
        return counts;
      }
      case 'immortal': return this.characterService.characterState.immortal;
      case 'god': return this.characterService.characterState.god;
      default: return undefined;
    }
  }

  emitEvent(event: EffectEvent): void {
    this.eventEmitter(event);
  }
}
