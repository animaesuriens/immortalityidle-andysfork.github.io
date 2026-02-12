import { Component } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { CharacterService } from '../game-state/character.service';
import { InventoryService } from '../game-state/inventory.service';
import { AttributeType } from '../game-state/character';
import { HomeService, HomeType } from '../game-state/home.service';
import { ActivityService } from '../game-state/activity.service';
import { ImpossibleTaskService, ImpossibleTaskType } from '../game-state/impossibleTask.service';
import { FollowersService } from '../game-state/followers.service';
import { ItemRepoService } from '../game-state/item-repo.service';

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

  // Home editor
  selectedHomeType: HomeType = HomeType.SquatterTent;

  constructor(
    public gameStateService: GameStateService,
    public characterService: CharacterService,
    public inventoryService: InventoryService,
    public homeService: HomeService,
    public activityService: ActivityService,
    public impossibleTaskService: ImpossibleTaskService,
    public followersService: FollowersService,
    public itemRepoService: ItemRepoService
  ) {
    this.selectedHomeType = this.homeService.homeValue;
  }

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

  updateHome(): void {
    const home = this.homeService.getHomeFromValue(this.selectedHomeType);
    this.homeService.setCurrentHome(home);
  }

  loadCurrentHomeValue(): void {
    this.selectedHomeType = this.homeService.homeValue;
  }

  toggleImmortal(): void {
    this.characterService.characterState.immortal = !this.characterService.characterState.immortal;
  }

  unlockFollowers(): void {
    this.followersService.followersUnlocked = true;
  }

  boostMaxStats(): void {
    const cs = this.characterService.characterState;
    cs.healthBonusCultivation += 10000;
    cs.staminaBonusCultivation += 10000;
    cs.qiUnlocked = true;
    cs.qiBonusCultivation += 10000;
    cs.recalculateDerivedStats();
  }

  learnAllManuals(): void {
    for (const key of Object.keys(this.itemRepoService.items)) {
      const item = this.itemRepoService.items[key];
      if (item.type === 'manual' && item.use) {
        item.use();
      }
    }
  }

  boostAllAttributes(): void {
    for (const attr of this.attributeTypes) {
      this.characterService.characterState.attributes[attr].value += 1e21;
    }
  }

  addMoney(): void {
    this.characterService.characterState.updateMoney(1e21);
  }

  maxStats(): void {
    const status = this.characterService.characterState.status;
    status.health.value = status.health.max;
    status.stamina.value = status.stamina.max;
    status.qi.value = status.qi.max;
  }

  activateBuildTower(): void {
    // Mark prior tasks as complete so nextTask points to BuildTower
    for (let i = 0; i < ImpossibleTaskType.BuildTower; i++) {
      this.impossibleTaskService.taskProgress[i].complete = true;
      this.impossibleTaskService.taskProgress[i].progress =
        this.impossibleTaskService.tasks[i].progressRequired;
    }
    this.impossibleTaskService.impossibleTasksUnlocked = true;
    this.impossibleTaskService.nextTask = ImpossibleTaskType.BuildTower;
    this.impossibleTaskService.startTask();
  }

  addBuilders(count: number): void {
    for (let i = 0; i < count; i++) {
      this.followersService.generateFollower(false, 'builder');
    }
  }

  addBuildTowerMaterials(): void {
    this.inventoryService.addItem(this.itemRepoService.items['scaffolding']);
    for (let i = 0; i < 100; i++) {
      this.inventoryService.addItem(this.itemRepoService.items['everlastingMortar']);
    }
    for (let i = 0; i < 1000; i++) {
      this.inventoryService.addItem(this.itemRepoService.items['everlastingBrick']);
    }
  }
}
