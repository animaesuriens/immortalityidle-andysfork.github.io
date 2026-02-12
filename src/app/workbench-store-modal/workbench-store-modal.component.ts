import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoreService } from '../game-state/store.service';
import { HomeService, FurniturePosition } from '../game-state/home.service';
import { Furniture } from '../game-state/inventory.service';

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
    return `Workbench Shop ${num || '1'}`;
  }

  getWorkbenchSlots(): FurniturePosition[] {
    return this.homeService.home.furnitureSlots.filter(
      slot => slot.startsWith('workbench')
    ) as FurniturePosition[];
  }

  previousShop(): void {
    const slots = this.getWorkbenchSlots();
    const currentIndex = slots.indexOf(this.slot);
    const prevIndex = (currentIndex - 1 + slots.length) % slots.length;
    this.slot = slots[prevIndex];
  }

  nextShop(): void {
    const slots = this.getWorkbenchSlots();
    const currentIndex = slots.indexOf(this.slot);
    const nextIndex = (currentIndex + 1) % slots.length;
    this.slot = slots[nextIndex];
  }

  hasMultipleShops(): boolean {
    return this.getWorkbenchSlots().length > 1;
  }

  getCategories(): string[] {
    return this.storeService.getWorkbenchCategories();
  }

  getFurnitureForCategory(category: string): Furniture[] {
    return this.storeService.getWorkbenchFurnitureByCategory(category);
  }

  hasItemsInCategory(category: string): boolean {
    return this.getFurnitureForCategory(category).length > 0;
  }
}
