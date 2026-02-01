import { Component } from '@angular/core';
import { Character, EquipmentPosition } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { Equipment, InventoryService, instanceOfEquipment, Item } from '../game-state/inventory.service';
import { GameStateService } from '../game-state/game-state.service';
import { CdkDragMove, CdkDragRelease } from '@angular/cdk/drag-drop';
import { ItemRepoService } from '../game-state/item-repo.service';
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

  constructor(
    private characterService: CharacterService,
    public inventoryService: InventoryService,
    public gameStateService: GameStateService,
    public itemRepoService: ItemRepoService
  ) {
    this.character = characterService.characterState;
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
