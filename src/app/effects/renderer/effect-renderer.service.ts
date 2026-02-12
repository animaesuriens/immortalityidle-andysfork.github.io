/**
 * EffectRendererService - Renders declarative effects to structured data.
 *
 * This service generates RenderedEffect[] data for effects. Templates iterate
 * over this array and apply formatting using pipes like | bigNumber.
 *
 * Error handling is non-blocking - if one effect fails to render, it's skipped.
 */

import { Injectable, inject } from '@angular/core';
import { CharacterService } from '../../game-state/character.service';
import { InventoryService } from '../../game-state/inventory.service';
import { BattleService } from '../../game-state/battle.service';
import { FollowersService } from '../../game-state/followers.service';
import { HomeService } from '../../game-state/home.service';
import { ImpossibleTaskService } from '../../game-state/impossibleTask.service';
import { ItemRepoService } from '../../game-state/item-repo.service';
import { GameContext } from '../context/game-context';
import { handlerRegistry } from '../handlers/handler-registry';
import { Effect } from '../types/effect.types';
import { EffectContext } from '../types/context.types';
import { RenderedEffect } from '../types/render.types';
import { EffectHandler } from '../handlers/handler.interface';

@Injectable({
  providedIn: 'root',
})
export class EffectRendererService {
  private readonly characterService = inject(CharacterService);
  private readonly inventoryService = inject(InventoryService);
  private readonly battleService = inject(BattleService);
  private readonly followersService = inject(FollowersService);
  private readonly homeService = inject(HomeService);
  private readonly impossibleTaskService = inject(ImpossibleTaskService);
  private readonly itemRepoService = inject(ItemRepoService);

  /**
   * Render all effects to structured data.
   *
   * @param effects Array of effects to render
   * @returns Array of RenderedEffect data for template iteration
   */
  renderEffects(effects: Effect[]): RenderedEffect[] {
    const context = this.createContext();

    const results: RenderedEffect[] = [];

    for (const effect of effects) {
      try {
        const rendered = this.renderEffect(effect, context);
        // Flatten array results (from conditional handlers)
        if (Array.isArray(rendered)) {
          results.push(...rendered);
        } else {
          results.push(rendered);
        }
      } catch (error) {
        console.error(`Effect render error for ${effect.kind}:`, error);
        // Skip failed effects
      }
    }

    return results;
  }

  /**
   * Render a single effect using the appropriate handler.
   *
   * @param effect The effect to render
   * @param context The execution context
   * @returns RenderedEffect or array of RenderedEffect (for conditionals)
   */
  renderEffect(effect: Effect, context: EffectContext): RenderedEffect | RenderedEffect[] {
    const handler = handlerRegistry[effect.kind] as EffectHandler<typeof effect>;
    return handler.render(effect, context);
  }

  /**
   * Create a fresh GameContext for this rendering.
   * Note: Events emitted during rendering are discarded (noop emitter).
   */
  private createContext(): GameContext {
    return new GameContext(
      this.characterService,
      this.inventoryService,
      this.battleService,
      this.followersService,
      this.homeService,
      this.impossibleTaskService,
      this.itemRepoService,
      () => {} // Noop emitter for rendering
    );
  }
}
