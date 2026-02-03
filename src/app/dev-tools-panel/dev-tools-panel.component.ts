import { Component } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { CharacterService } from '../game-state/character.service';
import { InventoryService } from '../game-state/inventory.service';
import { AttributeType } from '../game-state/character';

@Component({
  selector: 'app-dev-tools-panel',
  templateUrl: './dev-tools-panel.component.html',
  styleUrls: ['./dev-tools-panel.component.less', '../app.component.less'],
})
export class DevToolsPanelComponent {
  panelHelp = 'Developer tools for testing. Add functions here as needed.';

  // Attribute editor
  attributeTypes: AttributeType[] = [
    'strength', 'toughness', 'speed', 'intelligence', 'charisma', 'spirituality',
    'earthLore', 'metalLore', 'woodLore', 'waterLore', 'fireLore',
    'animalHandling', 'combatMastery', 'magicMastery'
  ];
  selectedAttribute: AttributeType = 'strength';
  attributeValue: number = 0;

  constructor(
    public gameStateService: GameStateService,
    public characterService: CharacterService,
    public inventoryService: InventoryService
  ) {}

  addWoodenSword(): void {
    const sword = this.inventoryService.generateWeapon(1, 'wood', false, 'sword');
    this.inventoryService.addItem(sword);
  }

  updateAttribute(): void {
    this.characterService.characterState.attributes[this.selectedAttribute].value = this.attributeValue;
  }

  loadCurrentAttributeValue(): void {
    this.attributeValue = this.characterService.characterState.attributes[this.selectedAttribute].value;
  }
}
