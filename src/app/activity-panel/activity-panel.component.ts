import { AfterViewInit, Component, ElementRef, inject, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameStateService } from '../game-state/game-state.service';
import { ActivityService } from '../game-state/activity.service';
import { CharacterService } from '../game-state/character.service';
import { Activity, ActivityType, isDeclarativeActivity } from '../game-state/activity';
import { Character } from '../game-state/character';
import { HellService } from '../game-state/hell.service';
import { TextPanelComponent } from '../text-panel/text-panel.component';
import { MatDialog } from '@angular/material/dialog';
import { JoinTheGodsText } from '../game-state/textResources';
import { InventoryService } from '../game-state/inventory.service';
import { FollowersService } from '../game-state/followers.service';
import { ImpossibleTaskService } from '../game-state/impossibleTask.service';
import { BigNumberPipe, CamelToTitlePipe } from '../app.component';
import { MainLoopService } from '../game-state/main-loop.service';
import { LogService, LogTopic } from '../game-state/log.service';
import { CdkDragMove, CdkDragRelease } from '@angular/cdk/drag-drop';
import { EffectShortPipe, EffectLongPipe, RenderedEffect } from '../effects';
import { PANEL_HELP, ACTIVITY } from '../game-state/tooltips';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

interface ActivityGroup {
  name: string;
  activities: Activity[];
}

@Component({
  selector: 'app-activity-panel',
  templateUrl: './activity-panel.component.html',
  styleUrls: ['./activity-panel.component.less', '../app.component.less'],
  providers: [EffectShortPipe, EffectLongPipe],
})
export class ActivityPanelComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('activityLabelText') activityLabelTexts!: QueryList<ElementRef<HTMLSpanElement>>;

  camelToTitle = new CamelToTitlePipe();
  character: Character;
  Math: Math;
  dragPositionX = 0;
  dragPositionY = 0;
  panelHelp = PANEL_HELP.activities;
  tooltips = ACTIVITY;
  private subscriptions: Subscription[] = [];
  private readonly effectShortPipe = inject(EffectShortPipe);
  private readonly effectLongPipe = inject(EffectLongPipe);

  // Activity type categories for grouping
  private readonly basicTypes = [ActivityType.OddJobs, ActivityType.Resting, ActivityType.Begging, ActivityType.Taunting, ActivityType.CombatTraining];
  private readonly craftingTypes = [ActivityType.Blacksmithing, ActivityType.Alchemy, ActivityType.Woodworking, ActivityType.Leatherworking];
  private readonly gatheringTypes = [ActivityType.GatherHerbs, ActivityType.ChopWood, ActivityType.Mining, ActivityType.Smelting, ActivityType.Hunting, ActivityType.Fishing, ActivityType.Farming, ActivityType.Burning];
  private readonly cultivationTypes = [ActivityType.BalanceChi, ActivityType.BodyCultivation, ActivityType.MindCultivation, ActivityType.CoreCultivation, ActivityType.SoulCultivation, ActivityType.InfuseBody, ActivityType.ExtendLife, ActivityType.InfuseEquipment];
  private readonly followerTypes = [ActivityType.Recruiting, ActivityType.TrainingFollowers, ActivityType.PetRecruiting, ActivityType.PetTraining];

  constructor(
    public gameStateService: GameStateService,
    public activityService: ActivityService,
    public characterService: CharacterService,
    public hellService: HellService,
    private inventoryService: InventoryService,
    private followerService: FollowersService,
    public impossibleTaskService: ImpossibleTaskService,
    public dialog: MatDialog,
    private bigNumberPipe: BigNumberPipe,
    public mainLoopService: MainLoopService,
    private logService: LogService
  ) {
    this.Math = Math;
    this.character = characterService.characterState;
  }

  getGroupedActivities(): ActivityGroup[] {
    const groups: ActivityGroup[] = [];
    const visibleActivities = this.activityService.activities.filter(
      a => !a.portal && (a.discovered || a.unlocked)
    );

    // Helper to get activities for a category
    const getActivitiesForTypes = (types: ActivityType[]): Activity[] => {
      return visibleActivities.filter(a => types.includes(a.activityType));
    };

    // Build groups - only include groups that have visible activities
    const basicActivities = getActivitiesForTypes(this.basicTypes);
    if (basicActivities.length > 0) {
      groups.push({ name: 'Basic', activities: basicActivities });
    }

    const gatheringActivities = getActivitiesForTypes(this.gatheringTypes);
    if (gatheringActivities.length > 0) {
      groups.push({ name: 'Gathering', activities: gatheringActivities });
    }

    const craftingActivities = getActivitiesForTypes(this.craftingTypes);
    if (craftingActivities.length > 0) {
      groups.push({ name: 'Crafting', activities: craftingActivities });
    }

    const cultivationActivities = getActivitiesForTypes(this.cultivationTypes);
    if (cultivationActivities.length > 0) {
      groups.push({ name: 'Cultivation', activities: cultivationActivities });
    }

    const followerActivities = getActivitiesForTypes(this.followerTypes);
    if (followerActivities.length > 0) {
      groups.push({ name: 'Followers & Pets', activities: followerActivities });
    }

    // Collect all categorized activity types
    const categorizedTypes = [
      ...this.basicTypes,
      ...this.gatheringTypes,
      ...this.craftingTypes,
      ...this.cultivationTypes,
      ...this.followerTypes
    ];

    // Other activities (impossible tasks, hell activities, etc.) go in their own section
    const otherActivities = visibleActivities.filter(a => !categorizedTypes.includes(a.activityType));
    if (otherActivities.length > 0) {
      groups.push({ name: 'Special', activities: otherActivities });
    }

    return groups;
  }

  ngAfterViewInit(): void {
    // Recalculate when the list of activity labels changes (activities added/removed)
    this.subscriptions.push(
      this.activityLabelTexts.changes.subscribe(() => {
        setTimeout(() => this.fitActivityLabels(), 0);
      })
    );

    // Recalculate periodically to handle activity level/name changes
    this.subscriptions.push(
      this.mainLoopService.longTickSubject.subscribe(() => {
        this.fitActivityLabels();
      })
    );

    // Initial calculation
    setTimeout(() => this.fitActivityLabels(), 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private fitActivityLabels(): void {
    if (!this.activityLabelTexts) return;

    const maxFontSize = 14; // Base font size in pixels
    const minFontSize = 9;  // Minimum readable font size

    this.activityLabelTexts.forEach(labelRef => {
      const span = labelRef.nativeElement;
      const container = span.parentElement;
      if (!container) return;

      // Get available width (container width minus padding)
      const containerStyle = getComputedStyle(container);
      const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
      const availableWidth = container.clientWidth - paddingLeft - paddingRight;

      // Reset to max font size to measure natural width
      span.style.fontSize = `${maxFontSize}px`;

      // Measure the text width at max font size
      const textWidth = span.scrollWidth;

      if (textWidth > availableWidth && availableWidth > 0) {
        // Calculate the scale factor needed
        const scaleFactor = availableWidth / textWidth;
        const newFontSize = Math.max(minFontSize, Math.floor(maxFontSize * scaleFactor));
        span.style.fontSize = `${newFontSize}px`;
      }
    });
  }

  JoinTheGodsClick() {
    // Pause time while showing confirmation, but ticks still accumulate
    const wasPaused = this.mainLoopService.pause;
    this.mainLoopService.pause = true;

    // Check if player has any food in inventory
    const hasFood = this.inventoryService.itemStacks.some(
      stack => stack?.item?.type === 'food'
    );

    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: 'You will need to leave all your money, mundane followers, and possessions behind as you leave this mortal realm. It will be a long journey with no place for rest, so make sure to bring a lot of food with you.\n\nAre you sure you are ready for this?',
        yesText: hasFood ? 'Yes, I am ready to manifest my destiny' : 'Yes, an Immortal has no need for food',
        noText: hasFood ? 'No, I still have unfinished business' : 'No, I need to prepare',
      },
      autoFocus: false,
      panelClass: 'golden-dialog',
    });

    confirmDialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        this.mainLoopService.pause = wasPaused;
        return;
      }

      const dialogRef = this.dialog.open(TextPanelComponent, {
        width: '700px',
        height: '80vh',
        data: { titleText: 'Joining the Gods', bodyText: JoinTheGodsText, milestone: true },
        autoFocus: false,
      });
      dialogRef.afterClosed().subscribe(() => {
        this.mainLoopService.pause = wasPaused;
        this.hellService.inHell = true;
        this.characterService.characterState.hasEnteredHell = true;
        this.characterService.characterState.money = 0;
        this.inventoryService.stashInventory();
        this.followerService.hellPurge();
        this.activityService.reloadActivities();
      });
    });
  }

  scheduleActivity(activity: Activity, event: MouseEvent): void {
    event.stopPropagation();
    if (!activity.unlocked) {
      return;
    }

    if (activity.projectionOnly) {
      this.activityService.spiritActivity = activity.activityType;
      return;
    }

    // Shift and Ctrl both multiply by 10x, combined does 100
    let repeat = 1;
    repeat *= event.shiftKey || event.altKey ? 10 : 1;
    repeat *= event.ctrlKey || event.metaKey ? 10 : 1;

    // Alt will put it at the top of the schedule, otherwise the bottom
    if (event.altKey) {
      this.activityService.activityLoop.unshift({
        activity: activity.activityType,
        repeatTimes: repeat,
      });
    } else {
      this.activityService.activityLoop.push({
        activity: activity.activityType,
        repeatTimes: repeat,
      });
    }
  }

  doActivity(activity: Activity) {
    if (!this.activityService.meetsRequirements(activity)) {
      this.logService.log(LogTopic.BLOCKED, activity.name[activity.level] + ' is unavailable now.');
      return;
    }

    if (activity.projectionOnly) {
      this.activityService.spiritActivity = activity.activityType;
      return;
    }

    const failedStatus = this.activityService.checkResourceUse(activity);
    if (failedStatus !== '') {
      this.characterService.characterState.flashStatus(failedStatus);
      this.logService.log(
        LogTopic.BLOCKED,
        "You don't meet the requirements to do " + activity.name[activity.level] + ' right now.'
      );
      return;
    }

    this.activityService.immediateActivity = activity;
    this.mainLoopService.tick();
    this.activityService.immediateActivity = null;
  }

  rightClick(activity: Activity, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.activityService.spiritActivity = activity.activityType;
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
    event.event.preventDefault();
    event.event.stopPropagation();

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

    const elements = document.elementsFromPoint(x, y);
    let destIndex = this.activityService.activityLoop.length;
    let acceptDrop = false;
    let spiritActivity = false;
    for (const element of elements) {
      if (element.id === 'activityDropDiv') {
        acceptDrop = true;
      } else if (element.id.startsWith('activityLoopIndex')) {
        destIndex = parseInt(element.id.substring('activityLoopIndex'.length + 1));
      } else if (element.id === 'spiritActivity') {
        spiritActivity = true;
      }
    }
    if (acceptDrop) {
      const activityType = event.source.data;
      if (this.activityService.getActivityByType(activityType)?.projectionOnly) {
        spiritActivity = true;
      }
      if (spiritActivity) {
        this.activityService.spiritActivity = activityType;
      } else {
        const newEntry = {
          activity: activityType,
          repeatTimes: 1,
        };
        if (destIndex >= this.activityService.activityLoop.length) {
          this.activityService.activityLoop.push(newEntry);
        } else {
          this.activityService.activityLoop.splice(destIndex, 0, newEntry);
        }
      }
    }
  }

  hellBoss() {
    this.hellService.fightHellBoss();
  }

  getActivityTooltip(activity: Activity, doNow = false) {
    if (activity.activityType >= ActivityType.Hell || activity.activityType === ActivityType.EscapeHell) {
      return '';
    } else if (activity.unlocked) {
      if (doNow) {
        return 'Spend a day doing this activity';
      } else {
        let projectionString = '';
        if (this.characterService.characterState.qiUnlocked) {
          projectionString = '\nRight-click to set this as your spriritual projection activity';
        }
        return (
          'Add this activity to your schedule\n\nShift- or Ctrl-click to repeat it 10x\nShift-Ctrl-click to repeat it 100x\nAlt-click to add it to the top' +
          projectionString
        );
      }
    } else {
      return [
        'This activity is locked until you have the attributes required for it. You will need:\n',
        ...Object.entries(activity.requirements[0]).map(entry =>
          entry[1] ? `${this.camelToTitle.transform(entry[0])}: ${this.bigNumberPipe.transform(entry[1])}` : undefined
        ),
      ]
        .filter(line => line)
        .join('\n');
    }
  }

  showActivity(event: MouseEvent, activity: Activity) {
    event.stopPropagation();
    let effectsText: string;
    if (isDeclarativeActivity(activity)) {
      const effects = activity.effects[activity.level] ?? [];
      const rendered = this.effectLongPipe.transform(effects);
      effectsText = this.formatEffectsLong(rendered);
    } else {
      effectsText = activity.consequenceDescription[activity.level];
    }
    let bodyString = activity.description[activity.level] + '<br><br>' + effectsText;
    if (activity.projectionOnly) {
      bodyString +=
        '\n\nThis activity can only be performed by a spiritual projection of yourself back in the mortal realm.';
    }

    const dialogProperties = { titleText: activity.name[activity.level], bodyText: bodyString, imageFile: '' };
    if (activity.imageBaseName) {
      dialogProperties.imageFile = 'assets/images/activities/' + activity.imageBaseName + activity.level + '.png';
    }
    this.dialog.open(TextPanelComponent, {
      width: 'auto',
      maxWidth: '90vw',
      data: dialogProperties,
      autoFocus: false,
    });
  }

  /**
   * Format RenderedEffect[] to HTML string for long format display.
   */
  formatEffectsLong(effects: RenderedEffect[]): string {
    return effects
      .filter(e => e.visible)
      .map(e => {
        const cssClass = e.positive ? 'effect-positive' : 'effect-negative';
        const suffix = e.long.suffix ? ` ${e.long.suffix}` : '';
        let text = `<span class="${cssClass}">${e.long.verb} ${e.long.name}${suffix} by ${this.bigNumberPipe.transform(e.long.amount)}.</span>`;

        // Add formula breakdown
        if (e.formula) {
          let formulaText: string;
          if (e.formula.type === 'fixed') {
            formulaText = e.formula.expression ?? `Fixed: ${e.formula.base}`;
          } else {
            // Multiplied formula
            const base = e.formula.expression ?? String(e.formula.base);
            formulaText = `${base} × ${e.formula.multiplierName} = ${base} × ${this.bigNumberPipe.transform(e.formula.multiplier ?? 1)} = ${this.bigNumberPipe.transform(e.formula.result ?? 0)}`;
          }
          if (e.condition) {
            formulaText += `; ${e.condition}`;
          }
          text += ` <span class="effect-formula">(${formulaText})</span>`;
        } else if (e.condition) {
          text += ` <span class="effect-formula">(${e.condition})</span>`;
        }

        return `• ${text}`;
      })
      .join('<br>');
  }

  getActivityCost(activity: Activity): string {
    const resourceUse = activity.resourceUse?.[activity.level];
    if (!resourceUse) return '';

    const costs: string[] = [];
    const resourceNames: Record<string, string> = {
      health: 'HP',
      stamina: 'Sta',
      qi: 'Qi',
      nourishment: 'Food'
    };

    for (const [key, value] of Object.entries(resourceUse)) {
      if (value && value > 0) {
        const name = resourceNames[key] || this.camelToTitle.transform(key);
        costs.push(`${this.bigNumberPipe.transform(value)} ${name}`);
      }
    }

    return costs.length > 0 ? costs.join(', ') : '';
  }

  /**
   * Get structured effect data for an activity.
   * Returns RenderedEffect[] for declarative activities, null for legacy.
   */
  getActivityEffects(activity: Activity): RenderedEffect[] | null {
    if (isDeclarativeActivity(activity)) {
      const effects = activity.effects[activity.level] ?? [];
      return this.effectShortPipe.transform(effects);
    }
    return null;
  }

  /**
   * Check if an activity has visible effects to display.
   */
  hasActivityEffects(activity: Activity): boolean {
    const effects = this.getActivityEffects(activity);
    if (effects !== null) {
      return effects.some(e => e.visible);
    }
    // Check legacy effects
    return !!(activity.effectsLegacy?.[activity.level] || activity.consequenceDescription?.[activity.level]);
  }

  /**
   * Get legacy effects string for non-declarative activities.
   */
  getLegacyEffects(activity: Activity): string {
    if (activity.effectsLegacy?.[activity.level]) {
      return activity.effectsLegacy[activity.level];
    }

    // Fallback: parse from consequenceDescription
    const description = activity.consequenceDescription?.[activity.level];
    if (!description) return '';

    let effects = description;

    // Remove cost mentions (already shown separately)
    effects = effects.replace(/Uses \d[\d,]* (Stamina|Health|Qi|Nourishment)\.?\s*/gi, '');
    effects = effects.replace(/Reduce health by \d[\d,]*\.?\s*/gi, '');

    return effects.trim();
  }

  /**
   * Format short effect for display.
   */
  formatEffectShort(effect: RenderedEffect): string {
    // Special case for balance effects
    if (effect.short.label === 'Balance Yin/Yang') {
      return 'Balance Yin/Yang';
    }
    return `${effect.short.sign}${this.bigNumberPipe.transform(effect.short.amount)} ${effect.short.label}`;
  }
}
