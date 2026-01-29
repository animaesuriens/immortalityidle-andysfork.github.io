import { Component } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { GameStateService } from '../game-state/game-state.service';
import { FieldBatch, HomeService } from '../game-state/home.service';

export interface DisplayBatch {
  count: number;
  cropName: string;
  yield: number;
  daysToHarvest: number;
}

@Component({
  selector: 'app-farm-panel',
  templateUrl: './farm-panel.component.html',
  styleUrls: ['./farm-panel.component.less', '../app.component.less'],
})
export class FarmPanelComponent {
  constructor(
    public homeService: HomeService,
    private characterService: CharacterService,
    public gameStateService: GameStateService
  ) {}

  getFieldBatches(): DisplayBatch[] {
    const batchMap = new Map<string, DisplayBatch>();

    // Add individual fields (first 300)
    for (const field of this.homeService.fields) {
      const key = `${field.cropName}|${field.yield}|${field.daysToHarvest}`;
      const existing = batchMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        batchMap.set(key, {
          count: 1,
          cropName: field.cropName,
          yield: field.yield,
          daysToHarvest: field.daysToHarvest,
        });
      }
    }

    // Add field batches (fields beyond 300)
    for (const batch of this.homeService.fieldBatches) {
      const key = `${batch.cropName}|${batch.yield}|${batch.daysToHarvest}`;
      const existing = batchMap.get(key);
      if (existing) {
        existing.count += batch.count;
      } else {
        batchMap.set(key, {
          count: batch.count,
          cropName: batch.cropName,
          yield: batch.yield,
          daysToHarvest: batch.daysToHarvest,
        });
      }
    }

    // Sort by days to harvest, then by crop name
    return Array.from(batchMap.values()).sort((a, b) => {
      if (a.daysToHarvest !== b.daysToHarvest) {
        return a.daysToHarvest - b.daysToHarvest;
      }
      return a.cropName.localeCompare(b.cropName);
    });
  }

  clearClicked(event: MouseEvent) {
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

  resetFieldsClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const totalFields = this.homeService.fields.length + this.homeService.extraFields;
    if (totalFields > 0) {
      this.homeService.clearField(-1); // Clear all
      this.homeService.addField(totalFields); // Replant the same number
    }
  }
}
