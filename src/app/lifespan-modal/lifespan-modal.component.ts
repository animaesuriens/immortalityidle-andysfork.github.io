import { Component } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { LIFESPAN } from '../game-state/tooltips';
import { BASE_LIFESPAN_YEARS, MAX_BASE_LIFESPAN_YEARS, DAYS_PER_LIFESPAN_BONUS } from '../game-state/character';

@Component({
  selector: 'app-lifespan-modal',
  templateUrl: './lifespan-modal.component.html',
  styleUrls: ['./lifespan-modal.component.less', '../app.component.less'],
})
export class LifespanModalComponent {
  BASE_LIFESPAN_YEARS = BASE_LIFESPAN_YEARS;
  MAX_BASE_LIFESPAN_YEARS = MAX_BASE_LIFESPAN_YEARS;
  YEARS_PER_BONUS_DAY = DAYS_PER_LIFESPAN_BONUS / 365;

  constructor(
    public characterService: CharacterService,
    public mainLoopService: MainLoopService
  ) {}

  get baseLifespanFormatted(): string {
    return this.characterService.formatDays(this.characterService.characterState.baseLifespan, 'long');
  }

  get totalYearsLivedFormatted(): string {
    return this.characterService.formatDays(this.mainLoopService.totalTicks, 'long');
  }

  get currentBonusFormatted(): string {
    return this.characterService.formatDays(this.characterService.characterState.baseLifespan - BASE_LIFESPAN_YEARS * 365, 'long');
  }

  get isBonusMaxed(): boolean {
    return this.characterService.characterState.baseLifespan >= MAX_BASE_LIFESPAN_YEARS * 365;
  }

  getBaseLifespanTooltip(): string {
    const state = this.characterService.characterState;
    const baseYears = Math.floor(state.baseLifespan / 365);
    const baseDays = Math.floor(state.baseLifespan % 365);
    const totalYears = Math.floor(this.mainLoopService.totalTicks / 365).toLocaleString();
    const totalDays = Math.floor(this.mainLoopService.totalTicks % 365).toFixed(0);
    const bonusYears = Math.floor((state.baseLifespan - 30 * 365) / 365);
    const bonusDays = Math.floor((state.baseLifespan - 30 * 365) % 365);

    return LIFESPAN.template(baseYears, baseDays, totalYears, totalDays, bonusYears, bonusDays);
  }
}
