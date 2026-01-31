/**
 * EffectExecutorService - Executes declarative effects for activities.
 *
 * This service is the main entry point for effect execution. It creates a
 * GameContext, executes all effects in order, then calls checkOverage to
 * clamp values to valid ranges.
 *
 * Error handling is non-blocking - if one effect fails, others continue.
 */

import { Injectable, inject } from '@angular/core';
import { CharacterService } from '../../game-state/character.service';
import { InventoryService } from '../../game-state/inventory.service';
import { GameContext } from '../context/game-context';
import { handlerRegistry } from '../handlers/handler-registry';
import { Effect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';

@Injectable({
  providedIn: 'root',
})
export class EffectExecutorService {
  private readonly characterService = inject(CharacterService);
  private readonly inventoryService = inject(InventoryService);

  /**
   * Execute all effects for an activity at its current level.
   * Creates context internally, executes effects in order, then calls checkOverage.
   *
   * @param effects Array of effects to execute
   */
  executeEffects(effects: Effect[]): void {
    const context = this.createContext();

    for (const effect of effects) {
      this.executeEffect(effect, context);
    }

    // After all effects, clamp values to valid ranges
    this.characterService.characterState.checkOverage();
  }

  /**
   * Execute a single effect using the appropriate handler.
   * Continues on error (logs but doesn't throw).
   *
   * @param effect The effect to execute
   * @param context The execution context
   */
  private executeEffect(effect: Effect, context: EffectContext): void {
    try {
      const handler = handlerRegistry[effect.kind];
      // Type assertion needed because TypeScript can't narrow the union through index access
      (handler.execute as (e: Effect, c: EffectContext) => void)(effect, context);
    } catch (error) {
      console.error(`Effect execution error for ${effect.kind}:`, error);
      // Non-blocking - continue to next effect per 03-CONTEXT.md
    }
  }

  /**
   * Create a fresh GameContext for this execution.
   */
  private createContext(): GameContext {
    return new GameContext(this.characterService, this.inventoryService);
  }
}
