/**
 * EffectRendererService - Renders declarative effects for display.
 *
 * This service generates display text for effects in three formats:
 * - 'short': Compact format for activity cards (e.g., "+1 Str, -5 Sta")
 * - 'long': Full sentence for tooltips (e.g., "Increases Strength by 1")
 * - 'formula': Show the formula (e.g., "log2(Charisma) + 5")
 *
 * Error handling is non-blocking - if one effect fails to render, it returns empty string.
 */

import { Injectable, inject } from '@angular/core';
import { CharacterService } from '../../game-state/character.service';
import { InventoryService } from '../../game-state/inventory.service';
import { BigNumberPipe } from '../../app.component';
import { GameContext } from '../context/game-context';
import { handlerRegistry } from '../handlers/handler-registry';
import { Effect } from '../types/effect.types';
import { RenderFormat } from '../handlers/handler.interface';
import { EffectContext } from '../types/context.types';

@Injectable({
  providedIn: 'root',
})
export class EffectRendererService {
  private readonly characterService = inject(CharacterService);
  private readonly inventoryService = inject(InventoryService);
  private readonly bigNumberPipe = inject(BigNumberPipe);

  /**
   * Render all effects for display.
   *
   * @param effects Array of effects to render
   * @param format The output format ('short', 'long', or 'formula')
   * @returns Formatted string with all effects joined
   */
  renderEffects(effects: Effect[], format: RenderFormat): string {
    const context = this.createContext();

    const rendered = effects
      .map(effect => this.renderEffect(effect, context, format))
      .filter(text => text.length > 0);

    if (format === 'long') {
      // Bulleted list for readability (HTML format)
      return rendered.map(text => `• ${text}`).join('<br>');
    }
    return rendered.join(', ');
  }

  /**
   * Render a single effect using the appropriate handler.
   *
   * @param effect The effect to render
   * @param context The execution context
   * @param format The output format
   * @returns Rendered string, or empty string on error
   */
  renderEffect(effect: Effect, context: EffectContext, format: RenderFormat): string {
    try {
      const handler = handlerRegistry[effect.kind];
      // Type assertion needed because TypeScript can't narrow the union through index access
      return (handler.render as (e: Effect, c: EffectContext, f: RenderFormat) => string)(effect, context, format);
    } catch (error) {
      console.error(`Effect render error for ${effect.kind}:`, error);
      return '';
    }
  }

  /**
   * Create a fresh GameContext for this rendering.
   */
  private createContext(): GameContext {
    return new GameContext(this.characterService, this.inventoryService, this.bigNumberPipe);
  }
}
