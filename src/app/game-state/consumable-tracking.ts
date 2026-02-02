/**
 * Type-safe unified consumable tracking for food, potions, and pills.
 *
 * To add a new consumable:
 * 1. Add the consumable ID to CONSUMABLE_IDS
 * 2. TypeScript will then require you to add counters in createEmptyConsumableCounters()
 * 3. Call trackConsumableUsed() when consumed
 * 4. Call trackConsumableEffect() when an effect triggers (for foods with % chance)
 *
 * Consumable ID conventions:
 * - Foods: plain ID (e.g., 'cabbage', 'beans')
 * - Potions: 'potion:attribute' (e.g., 'potion:strength')
 * - Pills: 'pill:effect' (e.g., 'pill:longevity')
 */

export interface LifeAllTimeCounter {
  currentLife: number;
  allTime: number;
}

/**
 * All trackable consumable IDs.
 */
export const CONSUMABLE_IDS = [
  // Foods (14 bonus foods)
  'cabbage',
  'beans',
  'broccoli',
  'calabash',
  'taro',
  'pear',
  'melon',
  'plum',
  'apricot',
  'peach',
  'divinePeach',
  'meat',
  'spiritMeat',
  'carp',
  // Potions (5 attributes)
  'potion:strength',
  'potion:toughness',
  'potion:speed',
  'potion:intelligence',
  'potion:charisma',
  // Pills (2 effects)
  'pill:longevity',
  'pill:empowerment',
] as const;

export type ConsumableId = (typeof CONSUMABLE_IDS)[number];

/**
 * Effect types that can be tracked per consumable.
 * - Foods use: health, stamina, nourishment, lifespan (bonus triggers)
 * - Potions/Pills use: gained (total effect received)
 */
export const EFFECT_TYPES = ['health', 'stamina', 'nourishment', 'lifespan', 'gained'] as const;

export type EffectType = (typeof EFFECT_TYPES)[number];

/**
 * Counter for a single consumable.
 * - consumed: how many times the consumable was used
 * - effects: tracked effects (bonus triggers for food, total gained for potions/pills)
 */
export interface ConsumableCounter {
  consumed: LifeAllTimeCounter;
  effects: Partial<Record<EffectType, LifeAllTimeCounter>>;
}

/**
 * Type that requires a counter entry for every consumable ID.
 */
export type ConsumableCounters = {
  [K in ConsumableId]: ConsumableCounter;
};

function createEmptyCounter(): ConsumableCounter {
  return {
    consumed: { currentLife: 0, allTime: 0 },
    effects: {},
  };
}

/**
 * Creates an initialized ConsumableCounters object.
 * TypeScript ensures this has entries for all CONSUMABLE_IDS.
 */
export function createEmptyConsumableCounters(): ConsumableCounters {
  return {
    // Foods
    cabbage: createEmptyCounter(),
    beans: createEmptyCounter(),
    broccoli: createEmptyCounter(),
    calabash: createEmptyCounter(),
    taro: createEmptyCounter(),
    pear: createEmptyCounter(),
    melon: createEmptyCounter(),
    plum: createEmptyCounter(),
    apricot: createEmptyCounter(),
    peach: createEmptyCounter(),
    divinePeach: createEmptyCounter(),
    meat: createEmptyCounter(),
    spiritMeat: createEmptyCounter(),
    carp: createEmptyCounter(),
    // Potions
    'potion:strength': createEmptyCounter(),
    'potion:toughness': createEmptyCounter(),
    'potion:speed': createEmptyCounter(),
    'potion:intelligence': createEmptyCounter(),
    'potion:charisma': createEmptyCounter(),
    // Pills
    'pill:longevity': createEmptyCounter(),
    'pill:empowerment': createEmptyCounter(),
  };
}

// ============================================================================
// Helper types for backwards compatibility and convenience
// ============================================================================

/** Food IDs (subset of ConsumableId) */
export type BonusFoodId = Extract<ConsumableId,
  'cabbage' | 'beans' | 'broccoli' | 'calabash' | 'taro' | 'pear' |
  'melon' | 'plum' | 'apricot' | 'peach' | 'divinePeach' | 'meat' | 'spiritMeat' | 'carp'
>;

/** Food bonus types */
export type BonusType = 'health' | 'stamina' | 'nourishment' | 'lifespan';

/** Potion attribute types */
export type PotionAttribute = 'strength' | 'toughness' | 'speed' | 'intelligence' | 'charisma';

/** Pill effect types */
export type PillEffect = 'longevity' | 'empowerment';

/** Convert potion attribute to consumable ID */
export function potionId(attribute: PotionAttribute): ConsumableId {
  return `potion:${attribute}` as ConsumableId;
}

/** Convert pill effect to consumable ID */
export function pillId(effect: PillEffect): ConsumableId {
  return `pill:${effect}` as ConsumableId;
}
