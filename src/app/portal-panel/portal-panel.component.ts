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
import { EffectExecutorService, EffectShortPipe, EffectLongPipe, RenderedEffect } from '../effects';
import { BigNumberPipe } from '../app.component';

@Component({
  selector: 'app-portal-panel',
  templateUrl: './portal-panel.component.html',
  styleUrls: ['./portal-panel.component.less', '../app.component.less'],
  providers: [EffectShortPipe, EffectLongPipe],
})
export class PortalPanelComponent {
  character: Character;
  Math: Math;
  dragPositionX = 0;
  dragPositionY = 0;
  private readonly effectExecutor = inject(EffectExecutorService);
  private readonly effectShortPipe = inject(EffectShortPipe);
  private readonly effectLongPipe = inject(EffectLongPipe);

  constructor(
    public gameStateService: GameStateService,
    public activityService: ActivityService,
    public characterService: CharacterService,
    public hellService: HellService,
    public impossibleTaskService: ImpossibleTaskService,
    public dialog: MatDialog,
    public mainLoopService: MainLoopService,
    private bigNumberPipe: BigNumberPipe
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
      const rendered = this.effectLongPipe.transform(effects);
      effectsText = this.formatEffectsLong(rendered);
    } else {
      effectsText = activity.consequenceDescription[activity.level];
    }
    const bodyString = activity.description[activity.level] + '<br><br>' + effectsText;

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
}
