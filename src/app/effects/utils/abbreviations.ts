/**
 * Abbreviations for attributes and status values.
 * Used by formula builders for short-format rendering.
 */

export const ABBREVIATIONS = {
  attributes: {
    strength: 'Str',
    toughness: 'Tou',
    speed: 'Spd',
    intelligence: 'Int',
    charisma: 'Cha',
    spirituality: 'Spi',
    earthLore: 'Earth',
    metalLore: 'Metal',
    woodLore: 'Wood',
    waterLore: 'Water',
    fireLore: 'Fire',
    animalHandling: 'Animals',
    combatMastery: 'Combat',
    magicMastery: 'Magic',
  },
  status: {
    health: 'HP',
    stamina: 'Sta',
    qi: 'Qi',
    nourishment: 'Food',
  },
} as const;
