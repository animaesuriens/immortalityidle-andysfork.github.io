/**
 * Event types emitted during effect execution for tracking/statistics.
 * Subscribers can filter by kind for specific tracking needs.
 */

export interface MoneyEarnedEvent {
  readonly kind: 'moneyEarned';
  readonly amount: number;
}

export interface ItemAddedEvent {
  readonly kind: 'itemAdded';
  readonly itemId: string;
  readonly quantity: number;
}

export interface ItemConsumedEvent {
  readonly kind: 'itemConsumed';
  readonly itemType: string;
  readonly grade: number;
}

export interface EnemySpawnedEvent {
  readonly kind: 'enemySpawned';
  readonly enemyName: string;
}

export interface ProgressUpdatedEvent {
  readonly kind: 'progressUpdated';
  readonly progressType: string;
  readonly amount: number;
}

export type EffectEvent =
  | MoneyEarnedEvent
  | ItemAddedEvent
  | ItemConsumedEvent
  | EnemySpawnedEvent
  | ProgressUpdatedEvent;
