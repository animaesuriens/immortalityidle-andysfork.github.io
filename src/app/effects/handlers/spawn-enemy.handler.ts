/**
 * SpawnEnemyEffect handler for the declarative effects system.
 * Adds enemies to battle queue.
 * Supports inline config or named enemy reference.
 * Renders as "attract [Enemy] trouble" format.
 */

import { EffectHandler } from './handler.interface';
import { SpawnEnemyEffect, EnemyConfig } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { RenderedEffect } from '../types/render.types';

/**
 * Simple enemy lookup for named references.
 * Supports both inline enemy config and named IDs.
 */
function lookupEnemy(enemyId: string | undefined): EnemyConfig | undefined {
  if (!enemyId) return undefined;

  const enemies: Record<string, EnemyConfig> = {
    wolf: {
      name: 'a hungry wolf',
      health: 20,
      attack: 5,
      defense: 5,
      loot: ['hide'],
    },
  };

  return enemies[enemyId];
}

/**
 * Handler for SpawnEnemyEffect.
 * Gets enemy config from inline definition or named lookup, then spawns.
 */
export const spawnEnemyHandler: EffectHandler<SpawnEnemyEffect> = {
  execute(effect: SpawnEnemyEffect, context: EffectContext): void {
    const enemyConfig = effect.enemy ?? lookupEnemy(effect.enemyId);
    if (!enemyConfig) {
      console.warn(`Unknown enemy: ${effect.enemyId}`);
      return;
    }

    context.spawnEnemy(enemyConfig);
  },

  render(effect: SpawnEnemyEffect, _context: EffectContext): RenderedEffect {
    const enemyConfig = effect.enemy ?? lookupEnemy(effect.enemyId);
    const enemyName = enemyConfig?.name ?? effect.enemyId ?? 'unknown enemy';

    return {
      kind: 'spawn',
      visible: true,
      positive: false,
      short: {
        sign: '',
        amount: 0,
        label: `attract ${enemyName}`,
      },
      long: {
        verb: 'May attract',
        amount: 0,
        name: enemyName,
      },
    };
  },
};
