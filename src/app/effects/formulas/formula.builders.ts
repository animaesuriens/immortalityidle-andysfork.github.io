/**
 * Formula builder functions for the declarative effects system.
 *
 * These builders provide a DSL for constructing formulas that can be
 * both evaluated (to a number) and rendered (to a display string).
 *
 * @example
 * // Express: log2(Charisma) + Water Lore x 5
 * const formula = add(log2(attr('charisma')), mult(attr('waterLore'), 5));
 *
 * // Later, evaluate and render from the same definition:
 * const value = formula.evaluate(context);  // e.g., 127
 * const text = formula.render(context, 'formula');  // "log2(Cha) + Water x 5"
 */

import { AttributeType, StatusType } from '../../game-state/character';
import { Formula, FormulaContext, FormulaRenderFormat } from '../types/formula.types';
import { VariableRef } from '../types/effect.types';
import { ABBREVIATIONS } from '../utils/abbreviations';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Format a number for display with compact notation for large values.
 * Uses suffixes (k, M, B, T) to keep numbers readable.
 */
function formatValue(value: number): string {
  const suffixes = ['', 'k', 'M', 'B', 'T', 'q', 'Q', 's'];
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  // Small numbers: show with precision
  if (absValue < 100 && !Number.isInteger(absValue)) {
    return sign + absValue.toFixed(2).replace(/\.?0+$/, '');
  }

  // Under 10k: show as integer with commas
  if (absValue < 10000) {
    return sign + Math.round(absValue).toLocaleString();
  }

  // Large numbers: use suffix notation
  if (absValue >= Math.pow(10, suffixes.length * 3)) {
    return sign + absValue.toPrecision(3);
  }

  const numberPower = Math.floor(Math.log10(absValue));
  const numStr = Math.floor(absValue / Math.pow(10, numberPower - (numberPower % 3) - 2)) / 100;
  return sign + numStr + suffixes[Math.floor(numberPower / 3)];
}

/**
 * Convert a Formula | number to a Formula.
 */
function toFormula(value: Formula | number): Formula {
  return typeof value === 'number' ? fixed(value) : value;
}

/**
 * Get attribute abbreviation or capitalize first letter of name.
 */
function attrAbbrev(attribute: AttributeType): string {
  return ABBREVIATIONS.attributes[attribute] ?? attribute;
}

/**
 * Get status abbreviation or capitalize first letter of name.
 */
function statusAbbrev(statusType: StatusType): string {
  return ABBREVIATIONS.status[statusType] ?? statusType;
}

// ============================================================
// VALUE REFERENCES
// ============================================================

/**
 * Reference an attribute value.
 *
 * Evaluates to: context.attributes[attribute]
 * Renders to: "Str", "Cha", "Metal Lore", etc.
 *
 * @param attribute The attribute type to reference
 * @returns A formula that evaluates to the attribute's current value
 *
 * @example
 * attr('strength')  // Evaluates to strength value, renders as "Str"
 */
export function attr(attribute: AttributeType): Formula {
  return {
    evaluate(context: FormulaContext): number {
      return context.attributes[attribute];
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      const value = context.attributes[attribute];
      const abbrev = attrAbbrev(attribute);
      switch (format) {
        case 'value':
        case 'substituted':
          return formatValue(value);
        case 'formula':
          return abbrev;
      }
    },
  };
}

/**
 * Reference a status value.
 *
 * Evaluates to: context.status[status].value
 * Renders to: "HP", "Sta", "Qi", etc.
 *
 * @param statusType The status type to reference
 * @returns A formula that evaluates to the status's current value
 *
 * @example
 * status('health')  // Evaluates to current health, renders as "HP"
 */
export function status(statusType: StatusType): Formula {
  return {
    evaluate(context: FormulaContext): number {
      return context.status[statusType].value;
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      const value = context.status[statusType].value;
      const abbrev = statusAbbrev(statusType);
      switch (format) {
        case 'value':
        case 'substituted':
          return formatValue(value);
        case 'formula':
          return abbrev;
      }
    },
  };
}

/**
 * Reference a status max value.
 *
 * Evaluates to: context.status[status].max
 * Renders to: "Max HP", "Max Sta", etc.
 *
 * @param statusType The status type to reference
 * @returns A formula that evaluates to the status's maximum value
 *
 * @example
 * statusMax('health')  // Evaluates to max health, renders as "Max HP"
 */
export function statusMax(statusType: StatusType): Formula {
  return {
    evaluate(context: FormulaContext): number {
      return context.status[statusType].max;
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      const value = context.status[statusType].max;
      const abbrev = `Max ${statusAbbrev(statusType)}`;
      switch (format) {
        case 'value':
        case 'substituted':
          return formatValue(value);
        case 'formula':
          return abbrev;
      }
    },
  };
}

/**
 * A fixed numeric constant.
 *
 * Evaluates to: value
 * Renders to: "5", "0.1", etc.
 *
 * @param value The constant value
 * @returns A formula that always evaluates to the given value
 *
 * @example
 * fixed(5)  // Evaluates to 5, renders as "5"
 */
export function fixed(value: number): Formula {
  return {
    evaluate(): number {
      return value;
    },
    render(_context: FormulaContext, _format: FormulaRenderFormat): string {
      return formatValue(value);
    },
  };
}

/**
 * Create a variable reference for use in factory args.
 * Resolves to the value of a context variable at execution time.
 *
 * Used in consume-then-generate workflows where one effect stores
 * a value (e.g., consumed item grade) and a later effect uses it.
 *
 * @param name The variable name to reference
 * @returns A VariableRef object: { ref: 'variable', name }
 *
 * @example
 * // Consume metal, store grade, then generate weapon using that grade:
 * { kind: 'item.consume', itemType: 'metal', storeGradeAs: 'metalGrade' }
 * { kind: 'item.add', factory: 'generateWeapon', args: [variable('metalGrade')] }
 */
export function variable(name: string): VariableRef {
  return { ref: 'variable', name };
}

// ============================================================
// ARITHMETIC OPERATIONS
// ============================================================

/**
 * Add operands together.
 *
 * Evaluates to: sum of all operands
 * Renders to: "a + b + c"
 *
 * @param operands The values to add (formulas or numbers)
 * @returns A formula that evaluates to the sum
 *
 * @example
 * add(attr('strength'), 5)  // Str + 5
 * add(1, 2, 3)  // 1 + 2 + 3 = 6
 */
export function add(...operands: (Formula | number)[]): Formula {
  const formulas = operands.map(toFormula);
  return {
    evaluate(context: FormulaContext): number {
      return formulas.reduce((sum, f) => sum + f.evaluate(context), 0);
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      if (format === 'value') {
        return formatValue(this.evaluate(context));
      }
      // 'formula' and 'substituted' both render children with the same format
      const parts = formulas.map(f => f.render(context, format));
      return parts.join(' + ');
    },
  };
}

/**
 * Subtract right from left.
 *
 * Evaluates to: left - right
 * Renders to: "a - b"
 *
 * @param left The value to subtract from
 * @param right The value to subtract
 * @returns A formula that evaluates to the difference
 *
 * @example
 * sub(attr('health'), 10)  // HP - 10
 */
export function sub(left: Formula | number, right: Formula | number): Formula {
  const leftFormula = toFormula(left);
  const rightFormula = toFormula(right);
  return {
    evaluate(context: FormulaContext): number {
      return leftFormula.evaluate(context) - rightFormula.evaluate(context);
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      if (format === 'value') {
        return formatValue(this.evaluate(context));
      }
      const leftStr = leftFormula.render(context, format);
      const rightStr = rightFormula.render(context, format);
      return `${leftStr} - ${rightStr}`;
    },
  };
}

/**
 * Multiply operands together.
 *
 * Evaluates to: product of all operands
 * Renders to: "a x b x c"
 *
 * @param operands The values to multiply (formulas or numbers)
 * @returns A formula that evaluates to the product
 *
 * @example
 * mult(attr('waterLore'), 5)  // Water Lore x 5
 * mult(2, 3, 4)  // 2 x 3 x 4 = 24
 */
export function mult(...operands: (Formula | number)[]): Formula {
  const formulas = operands.map(toFormula);
  return {
    evaluate(context: FormulaContext): number {
      return formulas.reduce((product, f) => product * f.evaluate(context), 1);
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      if (format === 'value') {
        return formatValue(this.evaluate(context));
      }
      const parts = formulas.map(f => f.render(context, format));
      return parts.join(' × ');
    },
  };
}

/**
 * Divide left by right.
 *
 * Evaluates to: left / right
 * Renders to: "a / b"
 *
 * @param left The dividend
 * @param right The divisor
 * @returns A formula that evaluates to the quotient
 * @throws Error if divisor evaluates to 0
 *
 * @example
 * div(attr('intelligence'), 10)  // Int / 10
 */
export function div(left: Formula | number, right: Formula | number): Formula {
  const leftFormula = toFormula(left);
  const rightFormula = toFormula(right);
  return {
    evaluate(context: FormulaContext): number {
      const divisor = rightFormula.evaluate(context);
      if (divisor === 0) {
        throw new Error('Division by zero');
      }
      return leftFormula.evaluate(context) / divisor;
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      if (format === 'value') {
        return formatValue(this.evaluate(context));
      }
      const leftStr = leftFormula.render(context, format);
      const rightStr = rightFormula.render(context, format);
      return `${leftStr} / ${rightStr}`;
    },
  };
}

// ============================================================
// MATHEMATICAL FUNCTIONS
// ============================================================

/**
 * Logarithm base 2.
 *
 * Evaluates to: Math.log2(operand)
 * Renders to: "log2(operand)"
 *
 * @param operand The value to take the log of
 * @returns A formula that evaluates to log base 2
 *
 * @example
 * log2(attr('charisma'))  // log2(Cha)
 */
export function log2(operand: Formula | number): Formula {
  const formula = toFormula(operand);
  return {
    evaluate(context: FormulaContext): number {
      return Math.log2(formula.evaluate(context));
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      if (format === 'value') {
        return formatValue(this.evaluate(context));
      }
      const inner = formula.render(context, format);
      return `log2(${inner})`;
    },
  };
}

/**
 * Natural logarithm (base e).
 *
 * Evaluates to: Math.log(operand)
 * Renders to: "ln(operand)"
 *
 * @param operand The value to take the log of
 * @returns A formula that evaluates to natural log
 *
 * @example
 * ln(attr('spirituality'))  // ln(Spi)
 */
export function ln(operand: Formula | number): Formula {
  const formula = toFormula(operand);
  return {
    evaluate(context: FormulaContext): number {
      return Math.log(formula.evaluate(context));
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      if (format === 'value') {
        return formatValue(this.evaluate(context));
      }
      const inner = formula.render(context, format);
      return `ln(${inner})`;
    },
  };
}

/**
 * Square root.
 *
 * Evaluates to: Math.sqrt(operand)
 * Renders to: "sqrt(operand)"
 *
 * @param operand The value to take the square root of
 * @returns A formula that evaluates to square root
 *
 * @example
 * sqrt(attr('strength'))  // sqrt(Str)
 */
export function sqrt(operand: Formula | number): Formula {
  const formula = toFormula(operand);
  return {
    evaluate(context: FormulaContext): number {
      return Math.sqrt(formula.evaluate(context));
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      if (format === 'value') {
        return formatValue(this.evaluate(context));
      }
      const inner = formula.render(context, format);
      return `√(${inner})`;
    },
  };
}

/**
 * Floor (round down).
 *
 * Evaluates to: Math.floor(operand)
 * Renders to: "floor(operand)"
 *
 * @param operand The value to floor
 * @returns A formula that evaluates to the floored value
 *
 * @example
 * floor(div(attr('intelligence'), 10))  // floor(Int / 10)
 */
export function floor(operand: Formula | number): Formula {
  const formula = toFormula(operand);
  return {
    evaluate(context: FormulaContext): number {
      return Math.floor(formula.evaluate(context));
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      if (format === 'value') {
        return formatValue(this.evaluate(context));
      }
      const inner = formula.render(context, format);
      return `floor(${inner})`;
    },
  };
}

/**
 * Power (exponentiation).
 *
 * Evaluates to: Math.pow(base, exponent)
 * Renders to: "base^exponent"
 *
 * @param base The base value
 * @param exponent The exponent value
 * @returns A formula that evaluates to base raised to exponent
 *
 * @example
 * pow(2, attr('magicMastery'))  // 2^Magic Mastery
 */
export function pow(base: Formula | number, exponent: Formula | number): Formula {
  const baseFormula = toFormula(base);
  const expFormula = toFormula(exponent);
  return {
    evaluate(context: FormulaContext): number {
      return Math.pow(baseFormula.evaluate(context), expFormula.evaluate(context));
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      if (format === 'value') {
        return formatValue(this.evaluate(context));
      }
      const baseStr = baseFormula.render(context, format);
      const expStr = expFormula.render(context, format);
      return `${baseStr}^${expStr}`;
    },
  };
}

/**
 * Exponential (e raised to power).
 *
 * Evaluates to: Math.exp(operand)
 * Renders to: "e^operand"
 *
 * @param operand The exponent value
 * @returns A formula that evaluates to e^operand
 *
 * @example
 * exp(attr('spirituality'))  // e^Spi
 */
export function exp(operand: Formula | number): Formula {
  const formula = toFormula(operand);
  return {
    evaluate(context: FormulaContext): number {
      return Math.exp(formula.evaluate(context));
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      if (format === 'value') {
        return formatValue(this.evaluate(context));
      }
      const inner = formula.render(context, format);
      return `e^${inner}`;
    },
  };
}

// ============================================================
// COMPARISON / CONDITIONAL
// ============================================================

/**
 * Minimum of operands.
 *
 * Evaluates to: Math.min(...operands)
 * Renders to: "min(a, b, ...)"
 *
 * @param operands The values to find minimum of
 * @returns A formula that evaluates to the minimum value
 *
 * @example
 * min(attr('strength'), 100)  // min(Str, 100) - caps at 100
 */
export function min(...operands: (Formula | number)[]): Formula {
  const formulas = operands.map(toFormula);
  return {
    evaluate(context: FormulaContext): number {
      const values = formulas.map(f => f.evaluate(context));
      return Math.min(...values);
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      if (format === 'value') {
        return formatValue(this.evaluate(context));
      }
      const parts = formulas.map(f => f.render(context, format));
      return `min(${parts.join(', ')})`;
    },
  };
}

/**
 * Maximum of operands.
 *
 * Evaluates to: Math.max(...operands)
 * Renders to: "max(a, b, ...)"
 *
 * @param operands The values to find maximum of
 * @returns A formula that evaluates to the maximum value
 *
 * @example
 * max(attr('health'), 0)  // max(HP, 0) - ensures non-negative
 */
export function max(...operands: (Formula | number)[]): Formula {
  const formulas = operands.map(toFormula);
  return {
    evaluate(context: FormulaContext): number {
      const values = formulas.map(f => f.evaluate(context));
      return Math.max(...values);
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      if (format === 'value') {
        return formatValue(this.evaluate(context));
      }
      const parts = formulas.map(f => f.render(context, format));
      return `max(${parts.join(', ')})`;
    },
  };
}

// ============================================================
// PHASE 4 - FOLLOWER FORMULAS
// ============================================================

/**
 * Get total power of followers with a specific job.
 *
 * Evaluates to: context.getFollowerPower(job)
 * Renders to: "hunter power", "builder power", etc.
 *
 * @param job The follower job to query
 * @returns A formula that evaluates to the job's total power
 *
 * @example
 * followerPower('hunter')  // Evaluates to hunter total power
 */
export function followerPower(job: string): Formula {
  return {
    evaluate(context: FormulaContext): number {
      return context.getFollowerPower?.(job) ?? 0;
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      const value = context.getFollowerPower?.(job) ?? 0;
      switch (format) {
        case 'value':
        case 'substituted':
          return formatValue(value);
        case 'formula':
          return `${job} power`;
      }
    },
  };
}

/**
 * Get count of followers with a specific job.
 *
 * Evaluates to: context.getFollowerCount(job)
 * Renders to: "hunter count", "builder count", etc.
 *
 * @param job The follower job to query
 * @returns A formula that evaluates to the number of followers with that job
 *
 * @example
 * followerCount('builder')  // Evaluates to number of builders
 */
export function followerCount(job: string): Formula {
  return {
    evaluate(context: FormulaContext): number {
      return context.getFollowerCount?.(job) ?? 0;
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      const value = context.getFollowerCount?.(job) ?? 0;
      switch (format) {
        case 'value':
        case 'substituted':
          return formatValue(value);
        case 'formula':
          return `${job} count`;
      }
    },
  };
}

// ============================================================
// PHASE 4 - FURNITURE AND CONDITIONAL FORMULAS
// ============================================================

/**
 * Check if specific furniture exists in a workbench slot.
 * Returns 1 if present, 0 if not.
 *
 * Evaluates to: context.hasFurniture('workbench', furnitureId) ? 1 : 0
 * Renders to: "has dogKennel (yes/no)"
 *
 * @param furnitureId The furniture ID to check for
 * @returns A formula that evaluates to 1 or 0
 *
 * @example
 * hasFurniture('dogKennel')  // 1 if dog kennel is installed, 0 otherwise
 */
export function hasFurniture(furnitureId: string): Formula {
  return {
    evaluate(context: FormulaContext): number {
      return context.hasFurniture?.('workbench', furnitureId) ? 1 : 0;
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      const has = context.hasFurniture?.('workbench', furnitureId) ?? false;
      switch (format) {
        case 'value':
        case 'substituted':
          return has ? '1' : '0';
        case 'formula':
          return `has ${furnitureId}`;
      }
    },
  };
}

/**
 * Conditional formula: if condition formula > 0, return thenValue, else elseValue.
 * Useful for furniture bonuses: conditional(hasFurniture('dogKennel'), 0.4, 0)
 *
 * @param condition Formula that acts as the condition (> 0 = true)
 * @param thenValue Value when condition is true (Formula or number)
 * @param elseValue Value when condition is false (Formula or number)
 * @returns A formula that evaluates conditionally
 *
 * @example
 * conditional(hasFurniture('dogKennel'), fixed(0.4), fixed(0))
 * // Returns 0.4 if dog kennel exists, 0 otherwise
 */
export function conditional(
  condition: Formula,
  thenValue: Formula | number,
  elseValue: Formula | number
): Formula {
  return {
    evaluate(context: FormulaContext): number {
      const condResult = condition.evaluate(context);
      if (condResult > 0) {
        return typeof thenValue === 'number' ? thenValue : thenValue.evaluate(context);
      }
      return typeof elseValue === 'number' ? elseValue : elseValue.evaluate(context);
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      const condResult = condition.evaluate(context);
      const result = condResult > 0
        ? (typeof thenValue === 'number' ? thenValue : thenValue.evaluate(context))
        : (typeof elseValue === 'number' ? elseValue : elseValue.evaluate(context));

      switch (format) {
        case 'value':
        case 'substituted':
          return formatValue(result);
        case 'formula':
          return `conditional`;
      }
    },
  };
}
