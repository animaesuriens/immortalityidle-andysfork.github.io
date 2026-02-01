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
  topic: LogTopic;
  timestamp: number;
  repeat?: number;
}

export interface LogProperties {
  logTopics: Uppercase<LogTopic>[];
  storyLog: Log[];
}

export enum LogTopic {
  MILESTONE = 'Milestone',
  COMBAT = 'Combat',
  DAMAGE = 'Damage',
  CRAFTING = 'Crafting',
  FOLLOWER = 'Follower',
  HOME = 'Home',
  INVENTORY = 'Inventory',
  BLOCKED = 'Blocked',
  DEATH = 'Death',
  HELL = 'Hell',
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
        enabled: [LogTopic.MILESTONE, LogTopic.BLOCKED, LogTopic.DEATH].includes(topic),
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

  log(topic: LogTopic, message: string): void {
    this.fullLog(topic, LogType.Standard, message);
  }

  injury(topic: LogTopic, message: string): void {
    this.fullLog(topic, LogType.Injury, message);
  }

  fullLog(topic: LogTopic, type: LogType, message: string): void {
    const log = this.logs[topic];
    const timestamp = Date.now();
    if (this.isRepeat(message, timestamp, log)) {
      log[log.length - 1].repeat = (log[log.length - 1].repeat || 1) + 1;
    } else {
      log.push({
        message: message,
        type: type,
        topic: topic,
        timestamp: timestamp,
      });
    }

    if (!this.topicProperties[topic].enabled) {
      this.topicProperties[topic].hasNewMessages = true;
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
    this.logs[LogTopic.MILESTONE] = properties.storyLog || [];

    if (properties.logTopics) {
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
      this.topicProperties[LogTopic.BLOCKED].enabled = true;
      this.topicProperties[LogTopic.DEATH].enabled = true;
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

    this.currentLog = Object.keys(this.logs)
      .map(topic => topic as LogTopic)
      .filter(topic => this.topicProperties[topic].enabled)
      .flatMap(topic => this.logs[topic])
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 299);
  }
}
