/**
 * Universal Effect Parser.
 *
 * Walks the effect tree and produces RenderedEffect[] from configurable display rules.
 * Replaces all handler render() methods and the per-handler rendering logic.
 *
 * Leaf effects (status, attribute, money, etc.) are rendered via display rules.
 * Structural effects (conditional, chance) are tree-walking logic that recurse.
 */

import {
  Effect,
  AttributeEffect,
  StatusEffect,
  MoneyEffect,
  YinYangEffect,
  ItemAddEffect,
  ItemConsumeEffect,
  ItemGenerateEffect,
  ChanceEffect,
  ConditionalEffect,
  ProgressEffect,
  SpawnEnemyEffect,
  SpawnFollowerEffect,
  TriggerBattleEffect,
  LifespanEffect,
  EnemyConfig,
} from '../types/effect.types';
import { EffectContext, toFormulaContext } from '../types/context.types';
import { RenderedEffect, FormulaBreakdown } from '../types/render.types';
import { evaluateCondition } from '../conditions/condition-evaluator';
import { ABBREVIATIONS } from '../utils/abbreviations';
import {
  evaluateAmount,
  renderFormulaOnly,
  renderFormulaSubstituted,
  getAttributeDisplayName,
  getStatusDisplayName,
  formatNumber,
  FLAG_DISPLAY_NAMES,
} from '../utils/render-helpers';
import { Formula, FormulaContext } from '../types/formula.types';

// ============================================================
// GROUP ID COUNTER
// ============================================================

let nextGroupId = 1;

function resetGroupIdCounter(): void {
  nextGroupId = 1;
}

// ============================================================
// CONDITION RENDERING (moved from conditional.handler.ts)
// ============================================================

const PROPERTY_DISPLAY_NAMES: Record<string, string> = {
  'followerCount.builder': 'Builders',
  'followerCount.hunter': 'Hunters',
  'followerCount.farmer': 'Farmers',
  'followerCount.soldier': 'Soldiers',
  'followerCount.researcher': 'Researchers',
};

const OPERATOR_TEXT: Record<string, string> = {
  '>=': 'at least',
  '>': 'more than',
  '<=': 'at most',
  '<': 'fewer than',
  '==': 'exactly',
  '!=': 'not',
};

function renderCondition(condition: ConditionalEffect['condition']): string {
  switch (condition.kind) {
    case 'HasFlag': {
      const name = FLAG_DISPLAY_NAMES[condition.flag] ?? condition.flag;
      return condition.negate ? `don't have ${name}` : `have ${name}`;
    }
    case 'CompareValues':
      return `${condition.left} ${condition.operator} ${condition.right}`;
    case 'CompareAttribute':
      return `${condition.attribute} ${condition.operator} ${condition.value}`;
    case 'CompareStatus':
      return `${condition.status} ${condition.operator} ${condition.value}`;
    case 'HasFurniture':
      return condition.furnitureId ? `have ${condition.furnitureId}` : `have ${condition.slot}`;
    case 'HasInventory': {
      if (condition.check === 'hasSlots') return 'have open inventory slots';
      const itemName = (condition.itemId ?? 'item').replace(/([A-Z])/g, ' $1').trim();
      const displayName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
      const qty = condition.quantity ?? 1;
      return qty > 1 ? `have ${qty}+ ${displayName}` : `have ${displayName}`;
    }
    case 'And': {
      const parts = condition.conditions.map(c => renderCondition(c));
      if (parts.length <= 2) {
        return parts.join(' and ');
      }
      return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
    }
    case 'Or':
      return condition.conditions.map(c => renderCondition(c)).join(' or ');
    case 'Not':
      return `don't ${renderCondition(condition.condition)}`;
    case 'NoEnemies':
      return 'have no enemies';
    case 'CompareProperty': {
      const name = PROPERTY_DISPLAY_NAMES[condition.path] ?? condition.path;
      const op = OPERATOR_TEXT[condition.operator] ?? condition.operator;
      return `have ${op} ${condition.value} ${name}`;
    }
  }
}

// ============================================================
// HELPER: Build formula breakdown
// ============================================================

function buildFormulaBreakdown(
  amount: number | Formula,
  formulaContext: FormulaContext,
  result: number,
): FormulaBreakdown {
  if (typeof amount === 'number') {
    return { type: 'fixed', base: amount };
  }
  return {
    type: 'formula',
    symbolic: renderFormulaOnly(amount, formulaContext),
    substituted: renderFormulaSubstituted(amount, formulaContext),
    result,
  };
}

// ============================================================
// LEAF EFFECT PARSERS
// ============================================================

function parseAttribute(effect: AttributeEffect, context: EffectContext): RenderedEffect {
  const formulaContext = toFormulaContext(context);
  const baseAmount = evaluateAmount(effect.amount, formulaContext);
  const abbrev = ABBREVIATIONS.attributes[effect.attribute];
  const aptSuffix = effect.aptitude ? ' Apt' : '';
  const name = getAttributeDisplayName(effect.attribute);

  let formula: FormulaBreakdown;
  let displayAmount: number;

  if (effect.aptitude) {
    displayAmount = baseAmount;
    formula = buildFormulaBreakdown(effect.amount, formulaContext, baseAmount);
  } else {
    const gainMult = context.attributes[effect.attribute].aptitudeMult;
    const baseStr = renderFormulaOnly(effect.amount, formulaContext);
    const substitutedBase = renderFormulaSubstituted(effect.amount, formulaContext);
    displayAmount = baseAmount * gainMult;

    formula = {
      type: 'formula',
      symbolic: `${baseStr} × ${name} Gain Multiplier`,
      substituted: `${substitutedBase} × ${formatNumber(gainMult)}`,
      result: displayAmount,
    };
  }

  const positive = displayAmount >= 0;

  return {
    kind: 'attribute',
    visible: true,
    positive,
    short: {
      sign: positive ? '+' : '',
      amount: Math.abs(displayAmount),
      label: `${abbrev}${aptSuffix}`,
    },
    long: {
      verb: positive ? 'Increases' : 'Decreases',
      amount: Math.abs(displayAmount),
      name,
      suffix: effect.aptitude ? 'aptitude' : undefined,
    },
    formula,
  };
}

function parseStatus(effect: StatusEffect, context: EffectContext): RenderedEffect {
  const formulaContext = toFormulaContext(context);
  const amount = evaluateAmount(effect.amount, formulaContext);
  const positive = amount >= 0;
  const abbrev = ABBREVIATIONS.status[effect.status];
  const maxSuffix = effect.modifyMax ? ' Max' : '';
  const name = getStatusDisplayName(effect.status);

  return {
    kind: 'status',
    visible: true,
    positive,
    short: {
      sign: positive ? '+' : '',
      amount: Math.abs(Math.floor(amount)),
      label: `${abbrev}${maxSuffix}`,
    },
    long: {
      verb: positive ? 'Restores' : 'Reduces',
      amount: Math.abs(Math.floor(amount)),
      name,
      suffix: effect.modifyMax ? 'max' : undefined,
    },
    formula: buildFormulaBreakdown(effect.amount, formulaContext, Math.floor(amount)),
  };
}

function parseMoney(effect: MoneyEffect, context: EffectContext): RenderedEffect {
  const formulaContext = toFormulaContext(context);
  const amount = evaluateAmount(effect.amount, formulaContext);
  const rounded = Math.floor(amount);
  const positive = rounded >= 0;

  return {
    kind: 'money',
    visible: true,
    positive,
    short: {
      sign: positive ? '+' : '',
      amount: Math.abs(rounded),
      label: 'Coins',
    },
    long: {
      verb: positive ? 'Earns' : 'Costs',
      amount: Math.abs(rounded),
      name: 'coins',
    },
    formula: buildFormulaBreakdown(effect.amount, formulaContext, rounded),
  };
}

function parseYinYang(effect: YinYangEffect, _context: EffectContext): RenderedEffect {
  const amount = effect.amount ?? 1;
  const positive = amount >= 0;

  switch (effect.modify) {
    case 'yin':
      return {
        kind: 'yinyang',
        visible: true,
        positive,
        short: { sign: positive ? '+' : '', amount: Math.abs(amount), label: 'Yin' },
        long: { verb: 'Increases', amount: Math.abs(amount), name: 'Yin' },
        formula: { type: 'fixed', base: amount },
      };
    case 'yang':
      return {
        kind: 'yinyang',
        visible: true,
        positive,
        short: { sign: positive ? '+' : '', amount: Math.abs(amount), label: 'Yang' },
        long: { verb: 'Increases', amount: Math.abs(amount), name: 'Yang' },
        formula: { type: 'fixed', base: amount },
      };
    case 'balance':
      return {
        kind: 'yinyang',
        visible: true,
        positive: true,
        short: { sign: '', amount: amount, label: 'Balance Yin/Yang' },
        long: { verb: 'Balances', amount: amount, name: 'Yin and Yang (increases the lower value)' },
        formula: { type: 'fixed', base: amount },
      };
  }
}

function parseItemAdd(effect: ItemAddEffect, context: EffectContext): RenderedEffect {
  const formulaContext = toFormulaContext(context);

  if (effect.itemId) {
    const quantity = effect.quantity
      ? Math.floor(evaluateAmount(effect.quantity, formulaContext))
      : 1;
    const itemName = formatItemName(effect.itemId);

    return {
      kind: 'item',
      visible: true,
      positive: true,
      short: { sign: '+', amount: quantity, label: itemName },
      long: { verb: 'Adds', amount: quantity, name: itemName.toLowerCase() },
      formula: typeof effect.quantity === 'object'
        ? {
            type: 'formula' as const,
            result: quantity,
            symbolic: (effect.quantity as Formula).render(formulaContext, 'formula'),
            substituted: (effect.quantity as Formula).render(formulaContext, 'substituted'),
          }
        : { type: 'fixed' as const, base: quantity },
    };
  } else if (effect.factory) {
    const factoryName = formatFactoryName(effect.factory);
    return {
      kind: 'item',
      visible: true,
      positive: true,
      short: { sign: '+', amount: 1, label: factoryName },
      long: { verb: 'Creates', amount: 1, name: factoryName.toLowerCase() },
      condition: 'if materials',
    };
  }

  return {
    kind: 'item',
    visible: false,
    positive: true,
    short: { sign: '', amount: 0, label: '' },
    long: { verb: '', amount: 0, name: '' },
  };
}

function parseItemConsume(effect: ItemConsumeEffect, _context: EffectContext): RenderedEffect {
  const quantity = effect.quantity ?? 1;
  const displayName = formatItemTypeName(effect.itemType);

  return {
    kind: 'item',
    visible: true,
    positive: false,
    short: { sign: '-', amount: quantity, label: displayName },
    long: { verb: 'Consumes', amount: quantity, name: displayName },
    formula: { type: 'fixed', base: quantity },
  };
}

function parseProgress(effect: ProgressEffect, context: EffectContext): RenderedEffect {
  const formulaContext = toFormulaContext(context);
  const amount = effect.amount != null ? evaluateAmount(effect.amount, formulaContext) : 1;
  const rounded = Math.floor(amount);
  const displayName = formatProgressName(effect.progressType);

  return {
    kind: 'progress',
    visible: true,
    positive: true,
    short: { sign: '+', amount: rounded, label: displayName },
    long: { verb: 'Advances', amount: rounded, name: displayName },
    formula: { type: 'fixed', base: rounded },
  };
}

function parseSpawnEnemy(effect: SpawnEnemyEffect, _context: EffectContext): RenderedEffect {
  const enemyConfig = effect.enemy ?? lookupEnemy(effect.enemyId);
  const enemyName = enemyConfig?.name ?? effect.enemyId ?? 'unknown enemy';

  return {
    kind: 'spawn',
    visible: true,
    positive: false,
    short: { sign: '', amount: 0, label: `attract ${enemyName}` },
    long: { verb: 'May attract', amount: 0, name: enemyName },
  };
}

function parseLifespan(effect: LifespanEffect, context: EffectContext): RenderedEffect {
  const formulaContext = toFormulaContext(context);
  const amount = evaluateAmount(effect.amount, formulaContext);
  const positive = amount >= 0;

  return {
    kind: 'lifespan',
    visible: true,
    positive,
    short: { sign: positive ? '+' : '', amount: Math.abs(Math.floor(amount)), label: 'Lifespan' },
    long: { verb: positive ? 'Extends' : 'Reduces', amount: Math.abs(Math.floor(amount)), name: 'lifespan' },
    formula: buildFormulaBreakdown(effect.amount, formulaContext, Math.floor(amount)),
  };
}

// Stub parsers for unimplemented effect types
function parseItemGenerate(_effect: ItemGenerateEffect, _context: EffectContext): RenderedEffect {
  return {
    kind: 'item',
    visible: false,
    positive: true,
    short: { sign: '', amount: 0, label: 'Generated Item' },
    long: { verb: 'Generates', amount: 0, name: 'item' },
  };
}

function parseSpawnFollower(_effect: SpawnFollowerEffect, _context: EffectContext): RenderedEffect {
  return {
    kind: 'spawn',
    visible: true,
    positive: true,
    short: { sign: '', amount: 0, label: 'Recruit follower' },
    long: { verb: 'May recruit', amount: 0, name: 'a follower' },
  };
}

function parseTriggerBattle(_effect: TriggerBattleEffect, _context: EffectContext): RenderedEffect {
  return {
    kind: 'battle',
    visible: true,
    positive: false,
    short: { sign: '', amount: 0, label: 'Battle' },
    long: { verb: 'Triggers', amount: 0, name: 'a battle round' },
  };
}

// ============================================================
// STRUCTURAL EFFECT PARSERS (tree-walking)
// ============================================================

function parseConditional(effect: ConditionalEffect, context: EffectContext): RenderedEffect[] {
  const conditionMet = evaluateCondition(effect.condition, context);
  const conditionStr = `If you ${renderCondition(effect.condition)}`;
  const groupId = nextGroupId++;

  const results: RenderedEffect[] = [];

  // Render 'then' branch effects
  for (const nested of effect.then) {
    const rendered = parseEffect(nested, context);
    for (const r of rendered) {
      results.push({
        ...r,
        visible: r.visible,
        condition: r.condition ? `${conditionStr}, ${r.condition}` : conditionStr,
        pathType: effect.pathType,
        hideWhenUnmet: effect.hideWhenUnmet,
        conditionMet,
        groupId: r.groupId ?? groupId,
      });
    }
  }

  // Render 'else' branch effects if present
  if (effect.else && effect.else.length > 0) {
    const elseConditionStr = `If you don't ${renderCondition(effect.condition)}`;
    for (const nested of effect.else) {
      const rendered = parseEffect(nested, context);
      for (const r of rendered) {
        results.push({
          ...r,
          visible: r.visible,
          condition: r.condition ? `${elseConditionStr}, ${r.condition}` : elseConditionStr,
          pathType: effect.pathType === 'success' ? 'failure' : effect.pathType === 'failure' ? 'success' : undefined,
          hideWhenUnmet: effect.hideWhenUnmet,
          conditionMet: !conditionMet,
          groupId: r.groupId ?? groupId,
        });
      }
    }
  }

  return results;
}

function parseChance(effect: ChanceEffect, context: EffectContext): RenderedEffect[] {
  const formulaContext = toFormulaContext(context);
  const probability = evaluateAmount(effect.probability, formulaContext);
  const percentStr = `${Math.round(probability * 100)}%`;
  const groupId = nextGroupId++;

  const results: RenderedEffect[] = [];
  for (const nested of effect.effects) {
    const rendered = parseEffect(nested, context);
    for (const r of rendered) {
      results.push({
        ...r,
        condition: r.condition ? `${percentStr} ${r.condition}` : `${percentStr}`,
        groupId: r.groupId ?? groupId,
      });
    }
  }
  return results;
}

// ============================================================
// MAIN PARSER
// ============================================================

/**
 * Parse a single effect into RenderedEffect[].
 * Returns an array because structural effects (conditional, chance) produce multiple entries.
 */
function parseEffect(effect: Effect, context: EffectContext): RenderedEffect[] {
  switch (effect.kind) {
    case 'attribute':
      return [parseAttribute(effect, context)];
    case 'status':
      return [parseStatus(effect, context)];
    case 'money':
      return [parseMoney(effect, context)];
    case 'yinyang':
      return [parseYinYang(effect, context)];
    case 'item.add':
      return [parseItemAdd(effect, context)];
    case 'item.consume':
      return [parseItemConsume(effect, context)];
    case 'item.generate':
      return [parseItemGenerate(effect, context)];
    case 'progress':
      return [parseProgress(effect, context)];
    case 'spawn.enemy':
      return [parseSpawnEnemy(effect, context)];
    case 'spawn.follower':
      return [parseSpawnFollower(effect, context)];
    case 'trigger.battle':
      return [parseTriggerBattle(effect, context)];
    case 'lifespan':
      return [parseLifespan(effect, context)];
    case 'conditional':
      return parseConditional(effect, context);
    case 'chance':
      return parseChance(effect, context);
  }
}

/**
 * Parse an array of effects into a flat RenderedEffect[].
 * This is the single entry point for all effect rendering.
 *
 * @param effects Array of effects to parse
 * @param context The effect context providing game state access
 * @returns Flat array of RenderedEffect with groupId for chance/conditional blocks
 */
export function parseEffects(effects: Effect[], context: EffectContext): RenderedEffect[] {
  resetGroupIdCounter();

  const results: RenderedEffect[] = [];
  for (const effect of effects) {
    try {
      results.push(...parseEffect(effect, context));
    } catch (error) {
      console.error(`Effect parse error for ${effect.kind}:`, error);
    }
  }
  return results;
}

// ============================================================
// DISPLAY HELPERS (moved from individual handlers)
// ============================================================

function formatItemName(itemId: string): string {
  return itemId.charAt(0).toUpperCase() + itemId.slice(1);
}

function formatFactoryName(factory: string): string {
  const mappings: Record<string, string> = {
    'generateWeapon': 'Weapon',
    'generateArmor': 'Armor',
    'generatePotion': 'Potion',
    'generatePill': 'Pill',
  };
  return mappings[factory] ?? factory;
}

function formatItemTypeName(itemType: string): string {
  return itemType
    .split(/(?=[A-Z])|[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatProgressName(progressType: string): string {
  const names: Record<string, string> = {
    Swim: 'Swim Progress',
    RaiseIsland: 'Island Progress',
    BuildTower: 'Tower Progress',
    TameWinds: 'Wind Progress',
    LearnToFly: 'Flight Progress',
    BefriendDragon: 'Dragon Progress',
    ConquerTheWorld: 'Conquest Progress',
    RearrangeTheStars: 'Star Progress',
    OvercomeDeath: 'Death Progress',
  };
  return names[progressType] ?? `${progressType} Progress`;
}

function lookupEnemy(enemyId: string | undefined): EnemyConfig | undefined {
  if (!enemyId) return undefined;
  const enemies: Record<string, EnemyConfig> = {
    wolf: {
      name: 'a hungry wolf',
      health: 20,
      attack: 5,
      defense: 5,
      loot: ['hide'],
    },
  };
  return enemies[enemyId];
}
