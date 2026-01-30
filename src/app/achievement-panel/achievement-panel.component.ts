import { Component } from '@angular/core';
import { AchievementService } from '../game-state/achievement.service';
import { CharacterService } from '../game-state/character.service';

@Component({
  selector: 'app-achievement-panel',
  templateUrl: './achievement-panel.component.html',
  styleUrls: ['./achievement-panel.component.less'],
})
export class AchievementPanelComponent {
  constructor(
    public achievementService: AchievementService,
    public characterService: CharacterService
  ) {}
}
