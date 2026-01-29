import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoreService } from '../game-state/store.service';
import { HomeService, FurniturePosition } from '../game-state/home.service';

@Component({
  selector: 'app-workbench-store-modal',
  templateUrl: './workbench-store-modal.component.html',
  styleUrls: ['./workbench-store-modal.component.less'],
})
export class WorkbenchStoreModalComponent {
  slot: FurniturePosition;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { slot: string },
    public storeService: StoreService,
    public homeService: HomeService
  ) {
    this.slot = data.slot as FurniturePosition;
  }

  getSlotDisplayName(): string {
    const num = this.slot.replace('workbench', '');
    return num ? `Workbench ${num}` : 'Workbench';
  }
}
