/**
 * EffectShortPipe - Pipe for rendering effects to structured data.
 *
 * Usage in templates:
 *   @for (effect of (effects | effectShort); track $index) { ... }
 *
 * Returns RenderedEffect[] for template iteration with short format display.
 * Impure because effects array reference may not change but level does.
 */

import { Pipe, PipeTransform, inject } from '@angular/core';
import { EffectRendererService } from '../renderer/effect-renderer.service';
import { Effect } from '../types/effect.types';
import { RenderedEffect } from '../types/render.types';

@Pipe({
  name: 'effectShort',
  standalone: true,
  pure: false, // Effects array reference may not change but level does
})
export class EffectShortPipe implements PipeTransform {
  private readonly renderer = inject(EffectRendererService);

  transform(effects: Effect[] | undefined): RenderedEffect[] {
    if (!effects || effects.length === 0) {
      return [];
    }
    return this.renderer.renderEffects(effects);
  }
}
