import { Component } from '@angular/core';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';
import { MatDialog } from '@angular/material/dialog';
import { StoreService } from '../game-state/store.service';
import { FurnitureStoreModalComponent } from '../furniture-store-modal/furniture-store-modal.component';
import { WorkbenchStoreModalComponent } from '../workbench-store-modal/workbench-store-modal.component';
import { FarmPanelComponent } from '../farm-panel/farm-panel.component';
import { FollowersService } from '../game-state/followers.service';
import { BigNumberPipe } from '../app.component';
import { HellService } from '../game-state/hell.service';
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-home-panel',
  templateUrl: './home-panel.component.html',
  styleUrls: ['./home-panel.component.less', '../app.component.less'],
})
export class HomePanelComponent {
  character: Character;
  Math: Math;

  constructor(
    public characterService: CharacterService,
    public homeService: HomeService,
    public followerService: FollowersService,
    public hellService: HellService,
    public dialog: MatDialog,
    private storeService: StoreService,
    public gameStateService: GameStateService,
    private bignumber: BigNumberPipe
  ) {
    this.character = characterService.characterState;
    this.Math = Math;
  }

  buildTimeYears(): string {
    const builderPower = 1 + this.followerService.jobs['builder'].totalPower;
    return (
      this.bignumber.transform(
        ((1 - this.homeService.houseBuildingProgress) * this.homeService.nextHome.daysToBuild) / builderPower / 365
      ) + ' years'
    );
  }

  getLandPrice(count: number): string {
    const price = this.homeService.landPrice * count + 10 * ((count * (count - 1)) / 2);
    return this.bignumber.transform(price);
  }

  getHalfAffordableLand(): string {
    const max = this.homeService.calculateAffordableLand(this.characterService.characterState.money);
    return this.bignumber.transform(Math.floor(max / 2));
  }

  storeClicked(): void {
    this.storeService.setStoreInventory();
    this.dialog.open(FurnitureStoreModalComponent, {
      width: '600px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  farmClicked(): void {
    this.storeService.setStoreInventory();
    this.dialog.open(FarmPanelComponent, {
      width: '800px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  buyClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
      this.homeService.buyLand(100);
    } else if (event.shiftKey || event.altKey) {
      this.homeService.buyLand(10);
    } else if (event.ctrlKey || event.metaKey) {
      this.homeService.buyLand(-1);
    } else {
      this.homeService.buyLand(1);
    }
  }

  plowClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
      this.homeService.addField(100);
    } else if (event.shiftKey || event.altKey) {
      this.homeService.addField(10);
    } else if (event.ctrlKey || event.metaKey) {
      this.homeService.addField(-1);
    } else {
      this.homeService.addField();
    }
  }

  clearClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
      this.homeService.clearField(100);
    } else if (event.shiftKey || event.altKey) {
      this.homeService.clearField(10);
    } else if (event.ctrlKey || event.metaKey) {
      this.homeService.clearField(-1);
    } else {
      this.homeService.clearField();
    }
  }

  getActiveFurnitureEffects(): { name: string; count: number; effects: string }[] {
    // Count furniture by name and track their effects
    const counts: { [name: string]: { count: number; effects: string } } = {};
    for (const slot of this.homeService.furniturePositionsArray) {
      const furniture = this.homeService.furniture[slot];
      if (furniture?.effects) {
        if (counts[furniture.name]) {
          counts[furniture.name].count++;
        } else {
          counts[furniture.name] = { count: 1, effects: furniture.effects };
        }
      }
    }

    // Build result with multiplied effects
    const result: { name: string; count: number; effects: string }[] = [];
    for (const name in counts) {
      const { count, effects } = counts[name];
      // Parse and multiply effect values (e.g., "+0.01 animal handling" -> "+0.02 animal handling")
      const multipliedEffects = effects.replace(/([+-]?\d+\.?\d*)/g, (match) => {
        const hasPlus = match.startsWith('+');
        const num = parseFloat(match) * count;
        // Format: if it's a whole number, show as integer, otherwise show decimal
        const formatted = num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
        // Preserve the + sign if original had it
        return (hasPlus && num >= 0 ? '+' : '') + formatted;
      });
      result.push({ name, count, effects: multipliedEffects });
    }
    return result;
  }

  getSlotDisplayName(slot: string): string {
    if (slot.startsWith('workbench')) {
      const num = slot.replace('workbench', '');
      return num ? `workbench ${num}` : 'workbench';
    }
    return slot;
  }

  getBasicFurnitureSlots(): string[] {
    return this.homeService.home.furnitureSlots.filter(
      slot => !slot.startsWith('workbench')
    );
  }

  getWorkbenchSlots(): string[] {
    return this.homeService.home.furnitureSlots.filter(
      slot => slot.startsWith('workbench')
    );
  }

  workbenchStoreClicked(slot: string): void {
    this.storeService.setStoreInventory();
    this.dialog.open(WorkbenchStoreModalComponent, {
      width: '600px',
      data: { slot: slot },
      autoFocus: false,
    });
  }
}
