import { Component } from '@angular/core';
import { ActivityService } from '../game-state/activity.service';
import { TIME_PANEL } from '../game-state/tooltips';

@Component({
  selector: 'app-time-options-panel',
  templateUrl: './time-options-panel.component.html',
  styleUrls: ['./time-options-panel.component.less', '../app.component.less'],
})
export class TimeOptionsPanelComponent {
  tooltips = TIME_PANEL;

  constructor(public activityService: ActivityService) {}

  pauseOnDeath(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.activityService.pauseOnDeath = event.target.checked;
  }

  pauseBeforeDeath(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.activityService.pauseBeforeDeath = event.target.checked;
  }
}
