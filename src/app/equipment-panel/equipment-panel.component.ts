import { Component } from '@angular/core';
import { Character, EquipmentPosition } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { Equipment, InventoryService, instanceOfEquipment, Item } from '../game-state/inventory.service';
import { GameStateService } from '../game-state/game-state.service';
import { CdkDragMove, CdkDragRelease } from '@angular/cdk/drag-drop';
import { ItemRepoService } from '../game-state/item-repo.service';
import { BattleService } from '../game-state/battle.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { BigNumberPipe } from '../app.component';
import { PANEL_HELP, COMBAT, EQUIPMENT } from '../game-state/tooltips';

@Component({
  selector: 'app-equipment-panel',
  templateUrl: './equipment-panel.component.html',
  styleUrls: ['./equipment-panel.component.less', '../app.component.less'],
})
export class EquipmentPanelComponent {
  character: Character;
  dragPositionX = 0;
  dragPositionY = 0;
  panelHelp = PANEL_HELP.equipment;
  tooltips = { combat: COMBAT, equipment: EQUIPMENT };
  private bigNumberPipe: BigNumberPipe;

  constructor(
    private characterService: CharacterService,
    public inventoryService: InventoryService,
    public gameStateService: GameStateService,
    public itemRepoService: ItemRepoService,
    private battleService: BattleService,
    mainLoopService: MainLoopService
  ) {
    this.character = characterService.characterState;
    this.bigNumberPipe = new BigNumberPipe(mainLoopService);
  }

  private fmt(n: number): string {
    return this.bigNumberPipe.transform(n);
  }

  getAccuracyTooltip(): string {
    const state = this.character;
    const troubleKills = this.battleService.troubleKills;
    const speed = state.attributes.speed.value;
    const sqrtSpeed = Math.sqrt(speed);

    const lines: string[] = [
      COMBAT.accuracy,
      '',
      'Your chance to hit monsters when you attack them.',
      '',
      'Formula: min((troubleKills + √speed) / troubleKills / 2, 1)',
      '',
      `Trouble Kills: ${this.fmt(troubleKills)}`,
      `Speed: ${this.fmt(speed)}`,
      `√Speed: ${this.fmt(sqrtSpeed)}`,
      '',
      `(${this.fmt(troubleKills)} + ${this.fmt(sqrtSpeed)}) / ${this.fmt(troubleKills)} / 2`,
      `= ${(state.accuracy * 100).toFixed(1)}%`,
    ];

    return lines.join('\n');
  }

  getAttackPowerTooltip(): string {
    const state = this.character;
    const leftHand = state.equipment.leftHand?.weaponStats?.baseDamage || 1;
    const rightHand = state.equipment.rightHand?.weaponStats?.baseDamage || 1;
    const strength = state.attributes.strength.value;
    const combatMastery = state.attributes.combatMastery.value;
    const sqrtStrength = Math.sqrt(strength) || 1;
    const sqrtWeapons = Math.sqrt(leftHand * rightHand);
    let baseAttack = Math.floor(sqrtStrength * sqrtWeapons) || 1;

    const lines: string[] = [
      COMBAT.attackPower,
      '',
      'The damage you will do when you hit a monster.',
      '',
      'Formula: floor(√strength × √(leftHand × rightHand))',
    ];

    if (combatMastery > 1) {
      lines.push('  × log₁₀₀(combatMastery + 100)');
    }
    if (state.righteousWrathUnlocked) {
      lines.push('  × 2 (Righteous Wrath)');
    }

    lines.push('');
    lines.push(`Strength: ${this.fmt(strength)}`);
    lines.push(`Left Hand Damage: ${this.fmt(leftHand)}`);
    lines.push(`Right Hand Damage: ${this.fmt(rightHand)}`);

    lines.push('');
    lines.push(`√${this.fmt(strength)} × √(${this.fmt(leftHand)} × ${this.fmt(rightHand)})`);
    lines.push(`= ${this.fmt(sqrtStrength)} × ${this.fmt(sqrtWeapons)}`);
    lines.push(`= ${this.fmt(baseAttack)}`);

    if (combatMastery > 1) {
      const masteryMult = Math.log(combatMastery + 100) / 4.605170185988092;
      baseAttack *= masteryMult;
      lines.push(`× ${masteryMult.toFixed(3)} (Combat Mastery: ${this.fmt(combatMastery)})`);
      lines.push(`= ${this.fmt(Math.floor(baseAttack))}`);
    }

    if (state.righteousWrathUnlocked) {
      lines.push(`× 2 (Righteous Wrath)`);
      lines.push(`= ${this.fmt(state.attackPower)}`);
    }

    // Show effective damage with active skills
    const activeSkills: string[] = [];
    let effectiveDamage = state.attackPower;

    if (this.battleService.enableQiAttack && this.battleService.qiAttackUnlocked) {
      effectiveDamage *= 2;
      activeSkills.push('× 2 (Qi Attack)');
    }

    if (this.battleService.enableMetalFist && this.battleService.metalFistUnlocked) {
      let metalMult = Math.log(state.attributes.metalLore.value) / Math.log(50);
      metalMult = Math.max(1, Math.min(100, metalMult));
      effectiveDamage *= metalMult;
      activeSkills.push(`× ${metalMult.toFixed(2)} (Metal Fist)`);
    }

    if (this.battleService.enablePyroclasm && this.battleService.pyroclasmUnlocked) {
      let fireMult = Math.log(state.attributes.fireLore.value) / Math.log(100);
      fireMult = Math.max(1, Math.min(10, fireMult));
      effectiveDamage *= fireMult;
      activeSkills.push(`× ${fireMult.toFixed(2)} (Pyroclasm)`);
    }

    if (state.yinYangUnlocked) {
      const yinYangMult = 1 + state.yinYangBalance;
      effectiveDamage *= yinYangMult;
      activeSkills.push(`× ${yinYangMult.toFixed(2)} (Yin/Yang Balance: ${(state.yinYangBalance * 100).toFixed(0)}%)`);
    }

    // Corruption effects
    const leftCorruption = state.equipment.leftHand?.weaponStats?.effect === 'corruption';
    const rightCorruption = state.equipment.rightHand?.weaponStats?.effect === 'corruption';
    const headCorruption = state.equipment.head?.armorStats?.effect === 'corruption';
    const bodyCorruption = state.equipment.body?.armorStats?.effect === 'corruption';
    const legsCorruption = state.equipment.legs?.armorStats?.effect === 'corruption';
    const feetCorruption = state.equipment.feet?.armorStats?.effect === 'corruption';

    if (leftCorruption) {
      effectiveDamage *= 10;
      activeSkills.push('× 10 (Corruption: Left Hand)');
    }
    if (rightCorruption) {
      effectiveDamage *= 10;
      activeSkills.push('× 10 (Corruption: Right Hand)');
    }
    if (headCorruption) {
      effectiveDamage *= 2;
      activeSkills.push('× 2 (Corruption: Head)');
    }
    if (bodyCorruption) {
      effectiveDamage *= 2;
      activeSkills.push('× 2 (Corruption: Body)');
    }
    if (legsCorruption) {
      effectiveDamage *= 2;
      activeSkills.push('× 2 (Corruption: Legs)');
    }
    if (feetCorruption) {
      effectiveDamage *= 2;
      activeSkills.push('× 2 (Corruption: Feet)');
    }

    if (activeSkills.length > 0) {
      lines.push('');
      lines.push('With Active Skills:');
      for (const skill of activeSkills) {
        lines.push(`  ${skill}`);
      }
      lines.push(`  = ${this.fmt(Math.floor(effectiveDamage))} effective damage`);
    }

    return lines.join('\n');
  }

  getDefenseTooltip(): string {
    const state = this.character;
    const head = state.equipment.head?.armorStats?.defense || 1;
    const body = state.equipment.body?.armorStats?.defense || 1;
    const legs = state.equipment.legs?.armorStats?.defense || 1;
    const feet = state.equipment.feet?.armorStats?.defense || 1;
    const toughness = state.attributes.toughness.value;
    const sqrtToughness = Math.sqrt(toughness) || 1;
    const armorSum = head + body + legs + feet;
    let baseDefense = Math.floor(sqrtToughness * armorSum) || 1;

    const lines: string[] = [
      COMBAT.defense,
      '',
      'Reduces damage when a monster hits you.',
      '',
      'Formula: floor(√toughness × (head + body + legs + feet))',
    ];

    if (state.righteousWrathUnlocked) {
      lines.push('  × 2 (Righteous Wrath)');
    }

    lines.push('');
    lines.push(`Toughness: ${this.fmt(toughness)}`);
    lines.push(`Head Armor: ${this.fmt(head)}`);
    lines.push(`Body Armor: ${this.fmt(body)}`);
    lines.push(`Legs Armor: ${this.fmt(legs)}`);
    lines.push(`Feet Armor: ${this.fmt(feet)}`);

    lines.push('');
    lines.push(`√${this.fmt(toughness)} × (${this.fmt(head)} + ${this.fmt(body)} + ${this.fmt(legs)} + ${this.fmt(feet)})`);
    lines.push(`= ${this.fmt(sqrtToughness)} × ${this.fmt(armorSum)}`);
    lines.push(`= ${this.fmt(baseDefense)}`);

    if (state.righteousWrathUnlocked) {
      lines.push(`× 2 (Righteous Wrath)`);
      lines.push(`= ${this.fmt(state.defense)}`);
    }

    // Show damage reduction with active skills
    const activeSkills: string[] = [];
    let damageReduction = 1;

    if (this.battleService.enableQiShield && this.battleService.qiShieldUnlocked) {
      damageReduction *= 0.5;
      activeSkills.push('÷ 2 (Qi Shield)');
    }

    if (this.battleService.enableFireShield && this.battleService.fireShieldUnlocked) {
      let fireDivisor = Math.log(state.attributes.fireLore.value) / Math.log(100);
      fireDivisor = Math.max(1, Math.min(10, fireDivisor));
      damageReduction /= fireDivisor;
      activeSkills.push(`÷ ${fireDivisor.toFixed(2)} (Fire Shield)`);
    }

    if (this.battleService.enableIceShield && this.battleService.iceShieldUnlocked) {
      let waterDivisor = Math.log(state.attributes.waterLore.value) / Math.log(100);
      waterDivisor = Math.max(1, Math.min(10, waterDivisor));
      damageReduction /= waterDivisor;
      activeSkills.push(`÷ ${waterDivisor.toFixed(2)} (Ice Shield)`);
    }

    if (activeSkills.length > 0) {
      lines.push('');
      lines.push('Damage Reduction from Active Skills:');
      for (const skill of activeSkills) {
        lines.push(`  ${skill}`);
      }
      lines.push(`  = ${((1 - damageReduction) * 100).toFixed(1)}% damage reduced`);
    }

    return lines.join('\n');
  }

  slotDoubleClicked(slot: EquipmentPosition, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const item = this.characterService.characterState.equipment[slot];
    // check for existence and make sure there's an empty slot for it
    if (item && this.inventoryService.openInventorySlots() > 0) {
      this.inventoryService.addItem(item as Item);
      this.characterService.characterState.equipment[slot] = null;
      this.inventoryService.selectedItem = null;
    }
  }

  unequipAll(): void {
    const equipment = this.characterService.characterState.equipment;
    const slots: EquipmentPosition[] = ['leftHand', 'rightHand', 'head', 'body', 'legs', 'feet'];

    for (const slot of slots) {
      const item = equipment[slot];
      if (item && this.inventoryService.openInventorySlots() > 0) {
        this.inventoryService.addItem(item as Item);
        equipment[slot] = null;
      }
    }
    this.inventoryService.selectedItem = null;
  }

  hasAnyEquipment(): boolean {
    const equipment = this.characterService.characterState.equipment;
    return !!(equipment.leftHand || equipment.rightHand || equipment.head || equipment.body || equipment.legs || equipment.feet);
  }

  getSelectedItemSlot() {
    const item = this.inventoryService.selectedItem?.item;
    if (!item || !instanceOfEquipment(item)) {
      return null;
    }
    return item?.slot;
  }

  dragStart() {
    this.gameStateService.dragging = true;
  }

  dragEnd() {
    this.gameStateService.dragging = false;
  }

  dragMoved(event: CdkDragMove) {
    this.dragPositionX = event.pointerPosition.x;
    this.dragPositionY = event.pointerPosition.y;
  }

  // this function feels super hacky and I kind of hate it, but it was the only way I could get the angular drag and drop stuff to do what I wanted
  dragReleased(event: CdkDragRelease) {
    let x: number;
    let y: number;
    if (event.event instanceof MouseEvent) {
      x = event.event.clientX;
      y = event.event.clientY;
    } else if (event.event instanceof TouchEvent) {
      x = this.dragPositionX;
      y = this.dragPositionY;
    } else {
      return;
    }

    const sourceItem = event.source.data;
    if (!sourceItem) {
      return;
    }

    let destinationItemIndex: number = -1;
    const elements = document.elementsFromPoint(x, y);
    for (const element of elements) {
      if (element.id.startsWith('itemIndex')) {
        destinationItemIndex = parseInt(element.id.substring('itemIndex'.length));
      }
    }
    if (destinationItemIndex === -1) {
      return;
    }

    for (const element of elements) {
      if (element.id.startsWith('itemIndex')) {
        const destinationItemIndex = parseInt(element.id.substring('itemIndex'.length));
        if (destinationItemIndex >= 0 && destinationItemIndex < this.inventoryService.itemStacks.length) {
          const destinationItemStack = this.inventoryService.itemStacks[destinationItemIndex];
          if (destinationItemStack) {
            // there's something there, see if we can merge
            if (instanceOfEquipment(destinationItemStack.item) && destinationItemStack.item.slot === sourceItem.slot) {
              // Check if manual merge is allowed (prevents favorite -> non-favorite)
              if (!this.inventoryService.canManualMerge(sourceItem, destinationItemStack.item)) {
                return;
              }
              // clear out the destination slot and merge
              this.inventoryService.itemStacks[destinationItemIndex] = null;
              this.inventoryService.mergeEquipment(destinationItemStack.item, sourceItem, destinationItemIndex);
              this.characterService.characterState.equipment[destinationItemStack.item.slot] = null;
            }
          } else {
            this.inventoryService.addItem(sourceItem as Item, 1, destinationItemIndex);
            const equipmentSlot: EquipmentPosition = sourceItem.slot as EquipmentPosition;
            this.characterService.characterState.equipment[equipmentSlot] = null;
          }
        }
      }
    }
  }

  getEffectClass(slot: string): string {
    let effect;
    if (slot === 'leftHand' || slot === 'rightHand') {
      effect = this.character.equipment[slot]?.weaponStats?.effect;
    } else if (slot === 'head' || slot === 'body' || slot === 'legs' || slot === 'feet') {
      effect = this.character.equipment[slot]?.armorStats?.effect;
    }
    if (effect) {
      return 'effect' + effect;
    }
    return '';
  }

  getQualityTier(equipment: Equipment | null): { prefix: string; tier: number; colorIndex: number } | null {
    if (!equipment || equipment.value <= 0) {
      return null;
    }
    const maxColors = this.itemRepoService.colorByRank.length;
    // log10(1) = 0, log10(1e10) = 10, spread across 18 tiers
    const logValue = Math.log10(Math.max(1, equipment.value));
    const tier = Math.min(maxColors, Math.max(1, Math.ceil(logValue * maxColors / 10)));
    const colorIndex = tier - 1;
    return { prefix: 'T', tier, colorIndex };
  }

  getTierStyle(equipment: Equipment | null): { [klass: string]: string } | null {
    const tierInfo = this.getQualityTier(equipment);
    if (!tierInfo) {
      return null;
    }
    const bgColor = this.itemRepoService.colorByRank[tierInfo.colorIndex];
    const textColor = this.getContrastColor(bgColor);
    return {
      'background-color': bgColor,
      'color': textColor
    };
  }

  private getContrastColor(color: string): string {
    const darkColors: { [key: string]: boolean } = {
      darkgray: true,
      gray: true,
      darkgreen: true,
      darkblue: true,
      blue: true,
      darkviolet: true,
      purple: true,
      darkorange: true,
      red: true
    };
    return darkColors[color] ? 'white' : 'black';
  }

  /** Check if equipment in a slot is broken (has 0 durability) */
  isBroken(slot: EquipmentPosition): boolean {
    const equipment = this.character.equipment[slot];
    if (!equipment) {
      return false;
    }
    const armorDurability = equipment.armorStats?.durability ?? 0;
    const weaponDurability = equipment.weaponStats?.durability ?? 0;
    // If it has stats, check durability. If no stats, it's not breakable.
    if (equipment.armorStats || equipment.weaponStats) {
      return armorDurability <= 0 && weaponDurability <= 0;
    }
    return false;
  }
}
