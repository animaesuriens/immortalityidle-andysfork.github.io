import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { GameStateService, PanelIndex } from './game-state/game-state.service';
import { MainLoopService } from './game-state/main-loop.service';
import { ManualStoreModalComponent } from './manual-store-modal/manual-store-modal.component';
import { OptionsModalComponent } from './options-modal/options-modal.component';
import { AscensionStoreModalComponent } from './ascension-store-modal/ascension-store-modal.component';
import { HostListener } from '@angular/core';
import { StoreService } from './game-state/store.service';
import { CharacterService } from './game-state/character.service';
import { AchievementPanelComponent } from './achievement-panel/achievement-panel.component';
import { ImpossibleTaskService } from './game-state/impossibleTask.service';
import { ImpossibleTaskPanelComponent } from './impossible-task-panel/impossible-task-panel.component';
import { environment } from '../environments/environment';
import { TutorialPanelComponent } from './tutorial-panel/tutorial-panel.component';
import { ChangelogPanelComponent } from './changelog-panel/changelog-panel.component';
import { StatisticsPanelComponent } from './statistics-panel/statistics-panel.component';
import { HellService } from './game-state/hell.service';
import { StatisticsService } from './game-state/statistics.service';
import { CdkDragEnd, CdkDragStart, Point } from '@angular/cdk/drag-drop';
import { KtdGridLayout } from '@katoid/angular-grid-layout';
import { ViewportScroller } from '@angular/common';
import { FollowersService } from './game-state/followers.service';
import { HomeService } from './game-state/home.service';
import { InventoryService, Item, Equipment, Furniture, Pill } from './game-state/inventory.service';

@Pipe({ name: 'floor' })
export class FloorPipe implements PipeTransform {
  /**
   *
   * @param value
   * @returns {number}
   */
  transform(value: number): number {
    return Math.floor(value);
  }
}

@Pipe({ name: 'camelToTitle' })
export class CamelToTitlePipe implements PipeTransform {
  /**
   *
   * @param value
   * @returns {string}
   */
  transform(value: string): string {
    value = value.split(/(?=[A-Z])/).join(' ');
    value = value[0].toUpperCase() + value.slice(1);
    return value;
  }
}

@Pipe({ name: 'bigNumber' })
export class BigNumberPipe implements PipeTransform {
  constructor(public mainLoopService: MainLoopService) {}

  /**
   *
   * @param value
   * @returns {string}
   */
  transform(value: number): string {
    if (!this.mainLoopService.scientificNotation) {
      let unsignedValue = value;
      let returnValue = '';
      if (value < 0) {
        unsignedValue = 0 - value;
      }
      const suffixArray = ['', 'k', 'M', 'B', 'T', 'q', 'Q', 's'];
      if (unsignedValue < 100 && !Number.isInteger(unsignedValue)) {
        returnValue = unsignedValue.toFixed(2) + '';
      } else if (unsignedValue < 10000) {
        returnValue = Math.round(unsignedValue) + '';
      } else if (unsignedValue >= Math.pow(10, suffixArray.length * 3)) {
        returnValue = unsignedValue.toPrecision(3);
      } else {
        const numberPower = Math.floor(Math.log10(unsignedValue));
        const numStr = Math.floor(unsignedValue / Math.pow(10, numberPower - (numberPower % 3) - 2)) / 100;
        returnValue = numStr + suffixArray[Math.floor(numberPower / 3)];
      }
      if (value < 0) {
        return '-' + returnValue;
      } else {
        return returnValue;
      }
    } else {
      return value.toPrecision(3);
    }
  }
}

@Pipe({ name: 'itemTooltip' })
export class ItemTooltipPipe implements PipeTransform {
  private titleCasePipe = new TitleCasePipe();

  constructor(private bigNumberPipe: BigNumberPipe, private characterService: CharacterService) {}

  transform(item: Item | null | undefined): string {
    if (!item) {
      return '';
    }

    const equipment = item as Equipment;
    const isWeapon = !!equipment.weaponStats;
    const isArmor = !!equipment.armorStats;

    if (isWeapon || isArmor) {
      return this.formatEquipmentTooltip(equipment, isWeapon);
    }

    return this.formatItemTooltip(item);
  }

  private formatItemTooltip(item: Item): string {
    const name = this.titleCasePipe.transform(item.name);
    const lines: string[] = [name, '', item.description];

    // Add stats section
    const statLines: string[] = [];

    // Type
    if (item.type) {
      // Add spaces before capitals in camelCase, then title case
      const formattedType = item.type.replace(/([a-z])([A-Z])/g, '$1 $2');
      statLines.push(`• Type: ${this.titleCasePipe.transform(formattedType)}`);
    }

    // Value
    if (item.value !== undefined && isFinite(item.value)) {
      statLines.push(`• Value: ${this.bigNumberPipe.transform(item.value)} taels`);
    }

    // Furniture stats
    const furniture = item as Furniture;
    if (furniture.slot && item.type === 'furniture') {
      statLines.push(`• Slot: ${this.titleCasePipe.transform(furniture.slot)}`);
      if (furniture.effects) {
        statLines.push(`• Bonus: ${furniture.effects}`);
      }
    }

    if (statLines.length > 0) {
      lines.push('', ...statLines);
    }

    // Effects section (for usable items)
    const pill = item as Pill;
    if (pill.effect === 'Empowerment') {
      // Generate Empowerment Pill effects dynamically
      lines.push('', 'Effects:');
      lines.push('• Multiplies attribute gains.');
      const pillCount = (this.characterService.characterState.empowermentFactor - 1) * 100;
      const multiplier = this.characterService.characterState.getEmpowermentMult();
      lines.push('', this.characterService.characterState.getEmpowermentExplanation(pillCount, multiplier));
    } else if (pill.effect === 'Longevity') {
      // Generate Longevity Pill effects dynamically
      lines.push('', 'Effects:');
      const years = Math.floor(pill.power / 365);
      const days = pill.power % 365;
      let timeStr = '';
      if (years > 0) {
        timeStr += `${years} year${years !== 1 ? 's' : ''}`;
      }
      if (days > 0) {
        if (years > 0) timeStr += ' ';
        timeStr += `${days} day${days !== 1 ? 's' : ''}`;
      }
      if (!timeStr) timeStr = '0 days';
      lines.push(`• +${timeStr} alchemy lifespan (max 100 years).`);

      // Calculate effective value accounting for cap
      const maxLifespan = 36500;
      const currentLifespan = this.characterService.characterState.alchemyLifespan;
      const effectiveGain = Math.max(0, Math.min(pill.power, maxLifespan - currentLifespan));
      const effectiveYears = Math.floor(effectiveGain / 365);
      const effectiveDays = effectiveGain % 365;
      let effectiveStr = '';
      if (effectiveYears > 0) {
        effectiveStr += `${effectiveYears} year${effectiveYears !== 1 ? 's' : ''}`;
      }
      if (effectiveDays > 0) {
        if (effectiveYears > 0) effectiveStr += ' ';
        effectiveStr += `${effectiveDays} day${effectiveDays !== 1 ? 's' : ''}`;
      }
      if (!effectiveStr) effectiveStr = '0 days';
      lines.push('', `The effective value of taking this pill will be +${effectiveStr}.`);
    } else if (item.useDescription) {
      lines.push('', 'Effects:');
      const effects = this.parseEffects(item.useDescription);
      effects.forEach(effect => {
        lines.push(`• ${effect}`);
      });
    }

    return lines.join('\n');
  }

  private parseEffects(useDescription: string): string[] {
    const effects: string[] = [];

    // Split by period to separate guaranteed effects from chance effects
    const parts = useDescription.split(/\.\s*/).filter(p => p.trim());

    for (const part of parts) {
      // Check if this is a chance-based effect (contains "% chance:")
      if (part.includes('% chance:')) {
        effects.push(part + '.');
      } else {
        // Split comma-separated effects into individual bullets
        const subEffects = part.split(/,\s*/).filter(e => e.trim());
        subEffects.forEach(e => {
          effects.push(e.trim() + (e.trim().endsWith('.') ? '' : '.'));
        });
      }
    }

    return effects;
  }

  private formatEquipmentTooltip(equipment: Equipment, isWeapon: boolean): string {
    const name = this.titleCasePipe.transform(equipment.name);
    const isArmor = !isWeapon;
    const stats = isWeapon ? equipment.weaponStats! : equipment.armorStats!;

    // Build flavor text
    let effectString = '';
    if (stats.effect) {
      effectString = ' and imbued with the power of ' + stats.effect;
    }
    const flavorText = `A unique ${isWeapon ? 'weapon' : 'piece of armor'} made of ${stats.material}${effectString}.`;

    // Build stats list
    const statLines: string[] = [];
    if (isWeapon && equipment.weaponStats) {
      statLines.push(`• Base Damage: ${this.bigNumberPipe.transform(equipment.weaponStats.baseDamage)}`);
    }
    if (isArmor && equipment.armorStats) {
      statLines.push(`• Defense: ${this.bigNumberPipe.transform(equipment.armorStats.defense)}`);
    }
    statLines.push(`• Durability: ${this.bigNumberPipe.transform(stats.durability)}`);
    statLines.push(`• Value: ${this.bigNumberPipe.transform(equipment.value)}`);

    // Merge instructions
    const mergeInstructions = `Drag and drop onto similar ${isWeapon ? 'weapons' : 'armor'} to merge them into something better.`;

    // Durability disclaimer
    const durabilityDisclaimer = "The durability and value of equipment degrades with use. Be careful when merging powerful items that have seen a lot of wear, the product may be even lower quality than the original if the item's value is low.";

    return `${name}\n\n${flavorText}\n\n${statLines.join('\n')}\n\n${mergeInstructions}\n\n${durabilityDisclaimer}`;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit {
  doingPanelDrag = false;
  doingBodyDrag = false;
  panelIndex: typeof PanelIndex = PanelIndex;
  resizingPanel = -1;
  previousPoint: Point = { x: 0, y: 0 };

  // Grid snap size in pixels
  readonly GRID_SIZE = 20;

  // Snap a value to the nearest grid point
  snapToGrid(value: number): number {
    return Math.round(value / this.GRID_SIZE) * this.GRID_SIZE;
  }

  // Constrain drag position to grid during drag
  dragConstrainPosition = (point: Point): Point => {
    return {
      x: this.snapToGrid(point.x),
      y: this.snapToGrid(point.y)
    };
  };

  title = 'immortalityidle';
  applicationVersion = environment.appVersion;

  activateSliders = false;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.code === 'Space') {
      this.mainLoopService.pause = !this.mainLoopService.pause;
      event.preventDefault();
    } else if ((event.code === 'Enter' || event.code === 'NumpadEnter') && this.mainLoopService.pause) {
      this.mainLoopService.tick();
      event.preventDefault();
    } else if ((event.altKey || event.metaKey) && (event.code === 'Digit0' || event.code === 'Numpad0')) {
      this.mainLoopService.pause = true;
    } else if ((event.altKey || event.metaKey) && (event.code === 'Digit1' || event.code === 'Numpad1')) {
      this.mainLoopService.pause = false;
      this.mainLoopService.tickDivider = 40;
    } else if ((event.altKey || event.metaKey) && (event.code === 'Digit2' || event.code === 'Numpad2')) {
      this.mainLoopService.pause = false;
      this.mainLoopService.tickDivider = 10;
    } else if (
      (event.altKey || event.metaKey) &&
      (event.code === 'Digit3' || event.code === 'Numpad3') &&
      this.mainLoopService.unlockFastSpeed
    ) {
      this.mainLoopService.pause = false;
      this.mainLoopService.tickDivider = 5;
    } else if (
      (event.altKey || event.metaKey) &&
      (event.code === 'Digit4' || event.code === 'Numpad4') &&
      this.mainLoopService.unlockFasterSpeed
    ) {
      this.mainLoopService.pause = false;
      this.mainLoopService.tickDivider = 2;
    } else if (
      (event.altKey || event.metaKey) &&
      (event.code === 'Digit5' || event.code === 'Numpad5') &&
      this.mainLoopService.unlockFastestSpeed
    ) {
      this.mainLoopService.pause = false;
      this.mainLoopService.tickDivider = 1;
    }
  }

  constructor(
    private scroller: ViewportScroller,
    public mainLoopService: MainLoopService,
    public gameStateService: GameStateService,
    public followersService: FollowersService,
    public statisticsService: StatisticsService, // Want to start this ASAP so we start getting statistics immediately.
    public storeService: StoreService,
    public characterService: CharacterService,
    public impossibleTaskService: ImpossibleTaskService,
    public hellService: HellService,
    public inventoryService: InventoryService,
    public homeService: HomeService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.gameStateService.loadFromLocalStorage();
    this.mainLoopService.start();
    this.setPanelPositions();
  }

  dragStart(event: CdkDragStart, panelIndex: number) {
    this.doingPanelDrag = true;
    const originalZIndex = this.gameStateService.panelZIndex[panelIndex];
    for (const index in this.panelIndex) {
      if (isNaN(Number(index))) {
        continue;
      }
      if (this.gameStateService.panelZIndex[index] > originalZIndex) {
        this.gameStateService.panelZIndex[index]--;
        this.gameStateService.panelZIndex[panelIndex]++;
      }
    }
    event.source.element.nativeElement.style.zIndex = this.gameStateService.panelZIndex[panelIndex] + '';
  }

  dragEnd(event: CdkDragEnd, panelIndex: number) {
    // Snap position to grid
    this.gameStateService.panelPositions[panelIndex].x = this.snapToGrid(event.source.getFreeDragPosition().x);
    this.gameStateService.panelPositions[panelIndex].y = this.snapToGrid(event.source.getFreeDragPosition().y);
    // always save when the player moves the windows around
    this.gameStateService.savetoLocalStorage();
    this.doingPanelDrag = false;
  }

  setPanelPositions() {
    for (const index in this.panelIndex) {
      if (isNaN(Number(index))) {
        continue;
      }
      this.gameStateService.panelPositions[index] = {
        x: this.gameStateService.panelPositions[index].x,
        y: this.gameStateService.panelPositions[index].y,
      };
    }
  }

  onBodyMouseMove(event: MouseEvent) {
    if (this.doingPanelDrag) {
      return;
    }
    if (this.gameStateService.dragging) {
      // don't do this if dragging from other panels is going on
      return;
    }
    if (event.buttons !== 1) {
      this.doingPanelDrag = false;
      this.doingBodyDrag = false;
      if (this.resizingPanel !== -1) {
        // just released a panel resize
        this.resizingPanel = -1;
        // always save when the player moves the windows around
        this.gameStateService.savetoLocalStorage();
      }
      return;
    }
    if (this.resizingPanel !== -1) {
      const newWidth = this.gameStateService.panelSizes[this.resizingPanel].x + event.movementX;
      this.gameStateService.panelSizes[this.resizingPanel].x = this.snapToGrid(newWidth);
      const newHeight = this.gameStateService.panelSizes[this.resizingPanel].y + event.movementY;
      this.gameStateService.panelSizes[this.resizingPanel].y = this.snapToGrid(newHeight);
      return;
    }
    if (event.target instanceof Element && event.target.classList.contains('panelResizeHandle')) {
      if (this.gameStateService.lockPanels) {
        return;
      }
      if (this.resizingPanel === -1) {
        if (event.target.parentElement) {
          this.resizingPanel = parseInt(event.target.parentElement.id);
        }
      }
    }
    if (this.doingBodyDrag || (event.target instanceof Element && event.target.classList.contains('bodyContainer'))) {
      const x = this.scroller.getScrollPosition()[0] - event.movementX;
      const y = this.scroller.getScrollPosition()[1] - event.movementY;
      this.scroller.scrollToPosition([x, y]);
      this.doingBodyDrag = true;
    }
  }

  onBodyTouchStart(event: TouchEvent) {
    this.previousPoint.x = event.touches[0].pageX;
    this.previousPoint.y = event.touches[0].pageY;
  }

  onBodyTouchEnd() {
    if (this.resizingPanel !== -1) {
      // just released a panel resize
      this.resizingPanel = -1;
      // always save when the player moves the windows around
      this.gameStateService.savetoLocalStorage();
    }
  }

  onBodyTouchMove(event: TouchEvent) {
    if (this.gameStateService.lockPanels) {
      return;
    }

    if (this.doingPanelDrag) {
      event.preventDefault();
      return;
    }
    if (this.resizingPanel !== -1) {
      const movementX = event.touches[0].pageX - this.previousPoint.x;
      const movementY = event.touches[0].pageY - this.previousPoint.y;
      const newWidth = this.gameStateService.panelSizes[this.resizingPanel].x + movementX;
      this.gameStateService.panelSizes[this.resizingPanel].x = this.snapToGrid(newWidth);
      const newHeight = this.gameStateService.panelSizes[this.resizingPanel].y + movementY;
      this.gameStateService.panelSizes[this.resizingPanel].y = this.snapToGrid(newHeight);
      this.previousPoint.x = event.touches[0].pageX;
      this.previousPoint.y = event.touches[0].pageY;
      event.preventDefault();
      return;
    }
    if (event.target instanceof Element && event.target.classList.contains('panelResizeHandle')) {
      if (this.resizingPanel === -1) {
        if (event.target.parentElement) {
          this.resizingPanel = parseInt(event.target.parentElement.id);
          event.preventDefault();
        }
      }
    }
  }

  storeClicked(): void {
    this.dialog.open(ManualStoreModalComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  storeOptionsClicked(): void {
    this.dialog.open(OptionsModalComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  ascensionStoreClicked() {
    this.storeService.updateAscensions();
    this.dialog.open(AscensionStoreModalComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  tutorialClicked() {
    this.dialog.open(TutorialPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  statisticsClicked() {
    this.dialog.open(StatisticsPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  changelogClicked() {
    this.dialog.open(ChangelogPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  achievementsClicked() {
    this.dialog.open(AchievementPanelComponent, {
      width: '750px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  impossibleTasksClicked() {
    this.dialog.open(ImpossibleTaskPanelComponent, {
      width: '500px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }

  lockPanelsToggle() {
    this.gameStateService.lockPanels = !this.gameStateService.lockPanels;
  }

  onLayoutUpdated(layout: KtdGridLayout) {
    this.gameStateService.onLayoutUpdated(layout);
  }

  getFilteredLayout(): KtdGridLayout {
    return this.gameStateService.layout.filter(item => {
      switch (item.id) {
        case 'timePanel':
          return this.mainLoopService.timeUnlocked;
        case 'followersPanel':
          return this.followersService.followersUnlocked;
        case 'petsPanel':
          return this.followersService.petsEnabled;
        case 'portalPanel':
          return this.hellService.inHell;
        case 'equipmentPanel':
          return this.inventoryService.equipmentUnlocked;
        case 'homePanel':
          return this.homeService.homeUnlocked;
        default:
          return true;
      }
    });
  }
}
