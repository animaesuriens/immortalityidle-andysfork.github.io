/**
 * EffectShortPipe - Thin pipe for short format effect rendering.
 *
 * Usage in templates:
 *   {{ effects | effectShort }}
 *
 * Delegates to EffectRendererService with 'short' format.
 * Impure because effects array reference may not change but level does.
 */

import { Pipe, PipeTransform, inject } from '@angular/core';
import { EffectRendererService } from '../renderer/effect-renderer.service';
import { Effect } from '../types/effect.types';

@Pipe({
  name: 'effectShort',
  standalone: true,
  pure: false, // Effects array reference may not change but level does
})
export class EffectShortPipe implements PipeTransform {
  private readonly renderer = inject(EffectRendererService);

  transform(effects: Effect[] | undefined): string {
    if (!effects || effects.length === 0) {
      return '';
    }
    return this.renderer.renderEffects(effects, 'short');
  }
}
