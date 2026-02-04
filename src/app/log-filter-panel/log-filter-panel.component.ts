import { Component } from '@angular/core';
import { LogService, LogTopic } from '../game-state/log.service';
import { ImpossibleTaskService } from '../game-state/impossibleTask.service';
import { HellService } from '../game-state/hell.service';

@Component({
  selector: 'app-log-filter-panel',
  templateUrl: './log-filter-panel.component.html',
  styleUrls: ['./log-filter-panel.component.less'],
})
export class LogFilterPanelComponent {
  readonly LogTopic = LogTopic;

  // Grouped topics for better organization
  storyTopics = [LogTopic.MILESTONE, LogTopic.IMPROVEMENT, LogTopic.UNLOCK, LogTopic.BLOCKED, LogTopic.DEATH];
  combatTopics = [LogTopic.COMBAT, LogTopic.DAMAGE];
  activityTopics = [LogTopic.CRAFTING, LogTopic.FOLLOWER, LogTopic.HOME, LogTopic.INVENTORY];
  otherTopics = [LogTopic.IMPOSSIBLE_TASK, LogTopic.HELL];

  constructor(
    public logService: LogService,
    public impossibleTaskService: ImpossibleTaskService,
    public hellService: HellService,
  ) {}

  topicFilter(event: Event, topic: string) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.enableLogTopic(topic as LogTopic, event.target.checked);
  }
}
