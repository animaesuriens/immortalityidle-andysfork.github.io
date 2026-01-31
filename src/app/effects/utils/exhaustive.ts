/**
 * Exhaustive type checking utility.
 *
 * When all cases of a discriminated union are handled in a switch statement,
 * TypeScript narrows the type to `never`. This function enforces that at
 * compile time - if you forget a case, TypeScript will error.
 *
 * @example
 * type Animal = { type: 'cat'; meow: boolean } | { type: 'dog'; bark: boolean };
 *
 * function handleAnimal(animal: Animal): string {
 *   switch (animal.type) {
 *     case 'cat':
 *       return 'meow';
 *     case 'dog':
 *       return 'bark';
 *     default:
 *       return assertNever(animal); // Compile error if case missing
 *   }
 * }
 *
 * // If you add { type: 'bird' } to Animal without adding a case,
 * // TypeScript will error: "Argument of type '{ type: 'bird' }' is
 * // not assignable to parameter of type 'never'."
 *
 * @example Effect system usage
 * function dispatchEffect(effect: Effect, context: EffectContext): void {
 *   switch (effect.type) {
 *     case 'attribute':
 *       // handle attribute effect
 *       break;
 *     case 'status':
 *       // handle status effect
 *       break;
 *     // ... all 14 effect types
 *     default:
 *       assertNever(effect); // Ensures all types handled
 *   }
 * }
 */

/**
 * Ensures exhaustive type checking in switch statements.
 *
 * @param x A value that should be of type `never` (all cases handled)
 * @param message Optional custom error message
 * @returns Never returns - always throws if called at runtime
 * @throws Error if called at runtime (indicates unhandled case)
 */
export function assertNever(x: never, message?: string): never {
  throw new Error(message ?? `Unexpected value: ${JSON.stringify(x)}`);
}
