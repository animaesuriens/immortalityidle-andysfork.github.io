import { Injectable } from '@angular/core';
import { MainLoopService } from './main-loop.service';

const LOG_MERGE_INTERVAL_MS = 5000;
type AllTopicProperties = { [key: string]: TopicProperties };

export enum LogType {
  Standard = 'STANDARD',
  Injury = 'INJURY',
}

export interface Log {
  message: string;
  type: LogType;
  topics: LogTopic[];
  timestamp: number;
  repeat?: number;
}

export interface LogProperties {
  logTopics: Uppercase<LogTopic>[];
  storyLog: Log[];
}

export enum LogTopic {
  MILESTONE = 'Milestone',
  IMPROVEMENT = 'Improvements',
  UNLOCK = 'Unlocks',
  COMBAT = 'Combat',
  DAMAGE = 'Misc. Damage',
  CRAFTING = 'Crafting',
  FOLLOWER = 'Follower',
  HOME = 'Home',
  INVENTORY = 'Inventory',
  BLOCKED = 'Blocked',
  DEATH = 'Death',
  HELL = 'Hell',
  IMPOSSIBLE_TASK = 'Impossible Task',
}

// Migration mapping from old topics to new topics
const LEGACY_TOPIC_MIGRATION: Record<string, LogTopic> = {
  STORY: LogTopic.MILESTONE,
  EVENT: LogTopic.BLOCKED,
  COMBAT: LogTopic.COMBAT,
  CRAFTING: LogTopic.CRAFTING,
  FOLLOWER: LogTopic.FOLLOWER,
};

export interface TopicProperties {
  enabled: boolean;
  hasNewMessages: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LogService {
  topicProperties: AllTopicProperties = Object.values(LogTopic).reduce(
    (result, topic) => ({
      ...result,
      [topic]: {
        enabled: [LogTopic.MILESTONE, LogTopic.IMPROVEMENT, LogTopic.UNLOCK, LogTopic.BLOCKED, LogTopic.DEATH, LogTopic.IMPOSSIBLE_TASK, LogTopic.HELL].includes(topic),
        hasNewMessages: false,
      },
    }),
    {} as AllTopicProperties
  );

  logs: Record<LogTopic, Log[]> = Object.values(LogTopic).reduce(
    (result, topic) => ({ ...result, [topic]: [] }),
    {} as Record<LogTopic, Log[]>
  );

  currentLog: Log[] = [];

  constructor(mainLoopService: MainLoopService) {
    mainLoopService.frameSubject.subscribe(() => {
      this.updateLogTopics();
    });
    this.log(
      LogTopic.MILESTONE,
      'Once in a very long while, a soul emerges from the chaos that is destined for immortality. You are such a soul.'
    );
    this.log(
      LogTopic.MILESTONE,
      'Your journey to immortality begins as a humble youth leaves home to experience the world. Choose the activities that will help you cultivate the attributes of an immortal.'
    );
    this.log(
      LogTopic.MILESTONE,
      'It may take you many reincarnations before you achieve your goals, but with each new life you will rise with greater aptitudes that allow you to learn and grow faster.'
    );
    this.log(LogTopic.MILESTONE, 'Be careful, the world can be a dangerous place.');
  }

  /** Log a standard message with one or more topics */
  log(topics: LogTopic | LogTopic[], message: string): void {
    this.fullLog(topics, LogType.Standard, message);
  }

  /** Log an injury message with one or more topics */
  injury(topics: LogTopic | LogTopic[], message: string): void {
    this.fullLog(topics, LogType.Injury, message);
  }

  fullLog(topicsInput: LogTopic | LogTopic[], type: LogType, message: string): void {
    const topics = Array.isArray(topicsInput) ? topicsInput : [topicsInput];
    const primaryTopic = topics[0];
    const log = this.logs[primaryTopic];
    const timestamp = Date.now();
    if (this.isRepeat(message, timestamp, log)) {
      log[log.length - 1].repeat = (log[log.length - 1].repeat || 1) + 1;
    } else {
      log.push({
        message: message,
        type: type,
        topics: topics,
        timestamp: timestamp,
      });
    }

    // Mark all topics with new message indicator if disabled
    for (const topic of topics) {
      if (!this.topicProperties[topic].enabled) {
        this.topicProperties[topic].hasNewMessages = true;
      }
    }
  }

  isRepeat(message: string, timestamp: number, log: Log[]): boolean {
    return (
      log.length > 0 &&
      timestamp - log[log.length - 1].timestamp <= LOG_MERGE_INTERVAL_MS &&
      message === log[log.length - 1].message
    );
  }

  getProperties(): LogProperties {
    return {
      logTopics: Object.entries(this.topicProperties)
        .filter(entry => entry[1].enabled)
        .map(entry => entry[0] as LogTopic)
        .map(topic => topic.toUpperCase() as Uppercase<LogTopic>),
      storyLog: this.logs[LogTopic.MILESTONE],
    };
  }

  setProperties(properties: LogProperties) {
    // Migrate old logs that have 'topic' instead of 'topics'
    const storyLog = (properties.storyLog || []).map(log => ({
      ...log,
      topics: log.topics || [(log as unknown as { topic: LogTopic }).topic || LogTopic.MILESTONE],
    }));
    this.logs[LogTopic.MILESTONE] = storyLog;

    if (properties.logTopics) {
      // Reset all to disabled, then enable only saved topics
      for (const topic of Object.values(LogTopic)) {
        this.topicProperties[topic].enabled = false;
      }
      properties.logTopics.forEach(topic => {
        // Check if this is a legacy topic that needs migration
        const legacyTopic = LEGACY_TOPIC_MIGRATION[topic];
        if (legacyTopic) {
          this.topicProperties[legacyTopic].enabled = true;
        } else if (LogTopic[topic as keyof typeof LogTopic]) {
          // It's a current topic
          this.topicProperties[LogTopic[topic as keyof typeof LogTopic]].enabled = true;
        }
      });
    } else {
      // Default enabled topics for new games
      this.topicProperties[LogTopic.MILESTONE].enabled = true;
      this.topicProperties[LogTopic.IMPROVEMENT].enabled = true;
      this.topicProperties[LogTopic.UNLOCK].enabled = true;
      this.topicProperties[LogTopic.BLOCKED].enabled = true;
      this.topicProperties[LogTopic.DEATH].enabled = true;
      this.topicProperties[LogTopic.IMPOSSIBLE_TASK].enabled = true;
      this.topicProperties[LogTopic.HELL].enabled = true;
    }

    this.updateLogTopics();
  }

  enableLogTopic(topic: LogTopic, enabled: boolean) {
    this.topicProperties[topic].enabled = enabled;
    this.updateLogTopics();
  }

  updateLogTopics() {
    Object.values(LogTopic).forEach(topic => {
      if (topic !== LogTopic.MILESTONE) {
        this.logs[topic] = this.logs[topic].slice(-300);
      }
      if (this.topicProperties[topic].enabled) {
        this.topicProperties[topic].hasNewMessages = false;
      }
    });

    // Collect all logs and filter by whether ANY of their topics are enabled
    this.currentLog = Object.values(this.logs)
      .flat()
      .filter(log => log.topics.some(topic => this.topicProperties[topic].enabled))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 299);
  }
}
