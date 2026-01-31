/**
 * EffectLongPipe - Thin pipe for long format effect rendering.
 *
 * Usage in templates:
 *   {{ effects | effectLong }}
 *
 * Delegates to EffectRendererService with 'long' format.
 * Impure because effects array reference may not change but level does.
 */

import { Pipe, PipeTransform, inject } from '@angular/core';
import { EffectRendererService } from '../renderer/effect-renderer.service';
import { Effect } from '../types/effect.types';

@Pipe({
  name: 'effectLong',
  standalone: true,
  pure: false, // Effects array reference may not change but level does
})
export class EffectLongPipe implements PipeTransform {
  private readonly renderer = inject(EffectRendererService);

  transform(effects: Effect[] | undefined): string {
    if (!effects || effects.length === 0) {
      return '';
    }
    return this.renderer.renderEffects(effects, 'long');
  }
}
