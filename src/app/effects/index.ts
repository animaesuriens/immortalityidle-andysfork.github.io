/**
 * Declarative Effects System - Public API
 *
 * This module provides a type-safe, compile-time exhaustive system for
 * defining and handling activity effects. The core abstraction is:
 *
 * 1. Define effects declaratively using typed structures
 * 2. Execute effects using registered handlers
 * 3. Render effects to display strings using the same handlers
 *
 * This achieves "single source of truth" - change the definition once,
 * both execution and display update automatically.
 *
 * @example
 * import { Effect, attr, mult, EffectHandler, EffectContext } from './effects';
 *
 * // Define an effect
 * const effect: Effect = {
 *   kind: 'attribute',
 *   attribute: 'strength',
 *   amount: mult(attr('intelligence'), 0.1)  // Str += Int * 0.1
 * };
 *
 * // Execute it
 * handler.execute(effect, context);
 *
 * // Render it for display
 * const text = handler.render(effect, context, 'short');  // "+10 Str"
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Effect types (14 variants)
export * from './types/effect.types';

// Condition types (9 variants)
export * from './types/condition.types';

// Formula interface and context
export * from './types/formula.types';

// Effect execution context
export * from './types/context.types';

// =============================================================================
// FORMULA BUILDERS
// =============================================================================

// Formula builder functions (attr, add, mult, log2, etc.)
export * from './formulas/formula.builders';

// =============================================================================
// HANDLER INTERFACE AND REGISTRY
// =============================================================================

// EffectHandler interface, RenderFormat, HandlerRegistry
export * from './handlers/handler.interface';

// Handler registry (all 14 handlers)
export { handlerRegistry } from './handlers/handler-registry';

// =============================================================================
// CONTEXT
// =============================================================================

// GameContext (concrete EffectContext implementation)
export { GameContext } from './context/game-context';

// =============================================================================
// SERVICES
// =============================================================================

// Effect execution service
export { EffectExecutorService } from './executor/effect-executor.service';

// Effect rendering service
export { EffectRendererService } from './renderer/effect-renderer.service';

// =============================================================================
// ANGULAR PIPES
// =============================================================================

// Thin pipes for template use
export { EffectShortPipe } from './pipes/effect-short.pipe';
export { EffectLongPipe } from './pipes/effect-long.pipe';
export { EffectFormulaPipe } from './pipes/effect-formula.pipe';

// =============================================================================
// UTILITIES
// =============================================================================

// Exhaustive type checking helper
export * from './utils/exhaustive';

// Abbreviations for attribute and status rendering
export * from './utils/abbreviations';
