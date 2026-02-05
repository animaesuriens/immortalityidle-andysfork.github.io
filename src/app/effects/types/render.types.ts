/**
 * Structured data types for effect rendering.
 *
 * Instead of returning HTML strings from handlers, we return structured data
 * that Angular templates can format using pipes and bindings. This approach:
 *
 * - Separates data from presentation
 * - Allows templates to apply | bigNumber pipe directly
 * - Enables proper CSS class bindings
 * - Removes innerHTML usage for better security
 */

/**
 * Effect kinds for rendering categorization.
 */
export type RenderedEffectKind =
  | 'status'
  | 'attribute'
  | 'yinyang'
  | 'conditional'
  | 'money'
  | 'lifespan'
  | 'item'
  | 'progress'
  | 'spawn'
  | 'battle'
  | 'log';

/**
 * Formula breakdown for showing calculations in long format.
 */
export interface FormulaBreakdown {
  /** Type of formula: 'fixed' for constants, 'formula' for dynamic formulas */
  type: 'fixed' | 'formula';

  /** Base value (used by 'fixed' type) */
  base?: number;

  /** Final result after calculation (used by 'formula' type) */
  result?: number;

  /** Symbolic formula with variable names (e.g., "3 + log2(Cha)") - used by 'formula' type */
  symbolic?: string;

  /** Formula with values substituted (e.g., "3 + log2(5.44)") - used by 'formula' type */
  substituted?: string;
}

/**
 * Short format data for compact display (activity cards).
 */
export interface ShortFormatData {
  /** Sign prefix ('+' or '-') */
  sign: string;

  /** Raw numeric amount (use | bigNumber in template) */
  amount: number;

  /** Abbreviated label (e.g., 'Sta', 'Spi', 'HP') */
  label: string;
}

/**
 * Long format data for detailed display (tooltips/modals).
 */
export interface LongFormatData {
  /** Action verb (e.g., 'Restores', 'Increases', 'Decreases', 'Balances') */
  verb: string;

  /** Raw numeric amount (use | bigNumber in template) */
  amount: number;

  /** Full name (e.g., 'Stamina', 'Spirituality') */
  name: string;

  /** Optional suffix (e.g., 'aptitude', 'max') */
  suffix?: string;
}

/**
 * Structured representation of a rendered effect.
 *
 * Handlers return this structure instead of HTML strings.
 * Templates iterate over RenderedEffect[] and apply formatting.
 */
export interface RenderedEffect {
  /** Effect kind for categorization/styling */
  kind: RenderedEffectKind;

  /** Whether this effect should be displayed (false for unmet conditional effects) */
  visible: boolean;

  /** Whether this is a positive effect (for CSS class: effect-positive/effect-negative) */
  positive: boolean;

  /** Short format data for activity cards */
  short: ShortFormatData;

  /** Long format data for tooltips/modals */
  long: LongFormatData;

  /** Optional formula breakdown for transparency */
  formula?: FormulaBreakdown;

  /** Optional condition hint (e.g., "if Yin/Yang unlocked") */
  condition?: string;

  /** Path type for grouping success/failure paths in display */
  pathType?: 'success' | 'failure';

  /** If true and condition is unmet, this effect should be hidden entirely (for feature unlocks) */
  hideWhenUnmet?: boolean;

  /** Whether the condition for this effect is currently met (used with hideWhenUnmet) */
  conditionMet?: boolean;
}

/**
 * Helper to create a basic RenderedEffect with defaults.
 */
export function createRenderedEffect(
  kind: RenderedEffectKind,
  amount: number,
  options: {
    shortLabel: string;
    longName: string;
    verb?: string;
    suffix?: string;
    formula?: FormulaBreakdown;
    condition?: string;
    visible?: boolean;
  }
): RenderedEffect {
  const positive = amount >= 0;
  const sign = positive ? '+' : '';
  const absAmount = Math.abs(amount);

  return {
    kind,
    visible: options.visible ?? true,
    positive,
    short: {
      sign,
      amount: absAmount,
      label: options.shortLabel,
    },
    long: {
      verb: options.verb ?? (positive ? 'Increases' : 'Decreases'),
      amount: absAmount,
      name: options.longName,
      suffix: options.suffix,
    },
    formula: options.formula,
    condition: options.condition,
  };
}
