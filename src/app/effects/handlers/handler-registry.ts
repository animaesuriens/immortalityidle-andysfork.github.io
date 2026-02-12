/**
 * Handler registry for the declarative effects system.
 * Maps each effect kind to its handler implementation.
 *
 * TypeScript enforces exhaustive registration - if a new effect kind
 * is added to the Effect union, this file will fail to compile until
 * a handler is added to the registry.
 */

import { HandlerRegistry } from './handler.interface';
import { statusHandler } from './status.handler';
import { attributeHandler } from './attribute.handler';
import { yinyangHandler } from './yinyang.handler';
import { conditionalHandler, setRegistryRef } from './conditional.handler';
import { moneyHandler } from './money.handler';
import { itemAddHandler } from './item-add.handler';
import { itemConsumeHandler } from './item-consume.handler';
import { itemGenerateHandler } from './item-generate.handler';
import { chanceHandler, setChanceRegistryRef } from './chance.handler';
import { progressHandler } from './progress.handler';
import { spawnEnemyHandler } from './spawn-enemy.handler';
import { spawnFollowerHandler } from './spawn-follower.handler';
import { triggerBattleHandler } from './trigger-battle.handler';
import { lifespanHandler } from './lifespan.handler';

/**
 * Complete registry of all 14 effect handlers.
 *
 * Handlers are organized by implementation status:
 * - Implemented (4): status, attribute, yinyang, conditional
 * - Stub (10): money, item.*, chance, progress, spawn.*, trigger.battle, lifespan
 *
 * The HandlerRegistry type ensures each EffectKind has exactly one handler.
 */
export const handlerRegistry: HandlerRegistry = {
  // Implemented handlers (Phase 3)
  status: statusHandler,
  attribute: attributeHandler,
  yinyang: yinyangHandler,
  conditional: conditionalHandler,

  // Stub handlers (Phase 4)
  money: moneyHandler,
  'item.add': itemAddHandler,
  'item.consume': itemConsumeHandler,
  'item.generate': itemGenerateHandler,
  chance: chanceHandler,
  progress: progressHandler,
  'spawn.enemy': spawnEnemyHandler,
  'spawn.follower': spawnFollowerHandler,
  'trigger.battle': triggerBattleHandler,
  lifespan: lifespanHandler,
};

// Initialize registry references for handlers that need nested effect execution
setRegistryRef(handlerRegistry);
setChanceRegistryRef(handlerRegistry);
