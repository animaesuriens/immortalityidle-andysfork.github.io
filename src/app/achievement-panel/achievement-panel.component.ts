import { Component } from '@angular/core';
import { AchievementService } from '../game-state/achievement.service';
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-achievement-panel',
  templateUrl: './achievement-panel.component.html',
  styleUrls: ['./achievement-panel.component.less'],
})
export class AchievementPanelComponent {
  constructor(
    public achievementService: AchievementService,
    public gameStateService: GameStateService
  ) {}
}
