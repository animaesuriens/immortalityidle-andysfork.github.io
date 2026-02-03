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
import { ABBREVIATIONS } from '../utils/abbreviations';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

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
          return String(value);
        case 'formula':
          return abbrev;
        case 'both':
          return `${abbrev} (${value})`;
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
          return String(value);
        case 'formula':
          return abbrev;
        case 'both':
          return `${abbrev} (${value})`;
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
          return String(value);
        case 'formula':
          return abbrev;
        case 'both':
          return `${abbrev} (${value})`;
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
      return String(value);
    },
  };
}

/**
 * Reference a runtime variable (set during effect execution).
 *
 * Evaluates to: context.variables[name]
 * Renders to: variable name or descriptive text like "Grade"
 *
 * Variables are set during execution, e.g., when consuming an item
 * the consumed item's grade can be stored and referenced.
 *
 * @param name The variable name to reference
 * @returns A formula that evaluates to the variable's value
 *
 * @example
 * // In an effect that consumes an item and stores its grade:
 * variable('consumedGrade')  // Evaluates to stored grade, renders as "Grade"
 */
export function variable(name: string): Formula {
  return {
    evaluate(context: FormulaContext): number {
      return context.variables[name] ?? 0;
    },
    render(context: FormulaContext, format: FormulaRenderFormat): string {
      const value = context.variables[name] ?? 0;
      // Display name: capitalize and remove "consumed" prefix if present
      const displayName = name.replace(/^consumed/, '').replace(/^./, c => c.toUpperCase());
      switch (format) {
        case 'value':
          return String(value);
        case 'formula':
          return displayName;
        case 'both':
          return `${displayName} (${value})`;
      }
    },
  };
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
        return String(this.evaluate(context));
      }
      const parts = formulas.map(f => f.render(context, format));
      const expr = parts.join(' + ');
      if (format === 'both') {
        return `${this.evaluate(context)} (${expr})`;
      }
      return expr;
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
        return String(this.evaluate(context));
      }
      const leftStr = leftFormula.render(context, format);
      const rightStr = rightFormula.render(context, format);
      const expr = `${leftStr} - ${rightStr}`;
      if (format === 'both') {
        return `${this.evaluate(context)} (${expr})`;
      }
      return expr;
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
        return String(this.evaluate(context));
      }
      const parts = formulas.map(f => f.render(context, format));
      const expr = parts.join(' x ');
      if (format === 'both') {
        return `${this.evaluate(context)} (${expr})`;
      }
      return expr;
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
        return String(this.evaluate(context));
      }
      const leftStr = leftFormula.render(context, format);
      const rightStr = rightFormula.render(context, format);
      const expr = `${leftStr} / ${rightStr}`;
      if (format === 'both') {
        return `${this.evaluate(context)} (${expr})`;
      }
      return expr;
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
        return String(this.evaluate(context));
      }
      const inner = formula.render(context, format);
      const expr = `log2(${inner})`;
      if (format === 'both') {
        return `${this.evaluate(context)} (${expr})`;
      }
      return expr;
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
        return String(this.evaluate(context));
      }
      const inner = formula.render(context, format);
      const expr = `ln(${inner})`;
      if (format === 'both') {
        return `${this.evaluate(context)} (${expr})`;
      }
      return expr;
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
        return String(this.evaluate(context));
      }
      const inner = formula.render(context, format);
      const expr = `sqrt(${inner})`;
      if (format === 'both') {
        return `${this.evaluate(context)} (${expr})`;
      }
      return expr;
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
        return String(this.evaluate(context));
      }
      const inner = formula.render(context, format);
      const expr = `floor(${inner})`;
      if (format === 'both') {
        return `${this.evaluate(context)} (${expr})`;
      }
      return expr;
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
        return String(this.evaluate(context));
      }
      const baseStr = baseFormula.render(context, format);
      const expStr = expFormula.render(context, format);
      const expr = `${baseStr}^${expStr}`;
      if (format === 'both') {
        return `${this.evaluate(context)} (${expr})`;
      }
      return expr;
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
        return String(this.evaluate(context));
      }
      const inner = formula.render(context, format);
      const expr = `e^${inner}`;
      if (format === 'both') {
        return `${this.evaluate(context)} (${expr})`;
      }
      return expr;
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
        return String(this.evaluate(context));
      }
      const parts = formulas.map(f => f.render(context, format));
      const expr = `min(${parts.join(', ')})`;
      if (format === 'both') {
        return `${this.evaluate(context)} (${expr})`;
      }
      return expr;
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
        return String(this.evaluate(context));
      }
      const parts = formulas.map(f => f.render(context, format));
      const expr = `max(${parts.join(', ')})`;
      if (format === 'both') {
        return `${this.evaluate(context)} (${expr})`;
      }
      return expr;
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
          return String(value);
        case 'formula':
          return `${job} power`;
        case 'both':
          return `${job} power (${value})`;
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
          return String(value);
        case 'formula':
          return `${job} count`;
        case 'both':
          return `${job} count (${value})`;
      }
    },
  };
}
