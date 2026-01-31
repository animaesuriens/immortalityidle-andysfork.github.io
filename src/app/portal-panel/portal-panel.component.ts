import { Component, inject } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { ActivityService } from '../game-state/activity.service';
import { CharacterService } from '../game-state/character.service';
import { Activity, isDeclarativeActivity } from '../game-state/activity';
import { Character } from '../game-state/character';
import { HellService } from '../game-state/hell.service';
import { TextPanelComponent } from '../text-panel/text-panel.component';
import { MatDialog } from '@angular/material/dialog';
import { ImpossibleTaskService } from '../game-state/impossibleTask.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { EffectExecutorService, EffectShortPipe } from '../effects';

@Component({
  selector: 'app-portal-panel',
  templateUrl: './portal-panel.component.html',
  styleUrls: ['./portal-panel.component.less', '../app.component.less'],
})
export class PortalPanelComponent {
  character: Character;
  Math: Math;
  dragPositionX = 0;
  dragPositionY = 0;
  private readonly effectExecutor = inject(EffectExecutorService);
  private readonly effectShortPipe = inject(EffectShortPipe);

  constructor(
    public gameStateService: GameStateService,
    public activityService: ActivityService,
    public characterService: CharacterService,
    public hellService: HellService,
    public impossibleTaskService: ImpossibleTaskService,
    public dialog: MatDialog,
    public mainLoopService: MainLoopService
  ) {
    this.Math = Math;
    this.character = characterService.characterState;
  }

  doActivity(activity: Activity) {
    if (isDeclarativeActivity(activity)) {
      const effects = activity.effects[activity.level] ?? [];
      this.effectExecutor.executeEffects(effects);
    } else {
      activity.consequence[activity.level]();
      this.characterService.characterState.checkOverage();
    }
  }

  showActivity(event: MouseEvent, activity: Activity) {
    event.stopPropagation();
    let effectsText: string;
    if (isDeclarativeActivity(activity)) {
      const effects = activity.effects[activity.level] ?? [];
      effectsText = this.effectShortPipe.transform(effects);
    } else {
      effectsText = activity.consequenceDescription[activity.level];
    }
    const bodyString = activity.description[activity.level] + '\n\n' + effectsText;

    const dialogProperties = { titleText: activity.name[activity.level], bodyText: bodyString, imageFile: '' };
    if (activity.imageBaseName) {
      dialogProperties.imageFile = 'assets/images/activities/' + activity.imageBaseName + activity.level + '.png';
    }
    this.dialog.open(TextPanelComponent, {
      width: '400px',
      data: dialogProperties,
      autoFocus: false,
    });
  }
}
