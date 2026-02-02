import { Equipment } from './inventory.service';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { BigNumberPipe, CamelToTitlePipe } from '../app.component';
import { LifeSummaryComponent } from '../life-summary/life-summary.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  ConsumableCounters,
  createEmptyConsumableCounters,
  ConsumableId,
  EffectType,
  CONSUMABLE_IDS,
  BonusFoodId,
  BonusType,
  PotionAttribute,
  PillEffect,
  potionId,
  pillId,
} from './consumable-tracking';

export type CharacterAttribute = {
  [key: string]: number | undefined;
  strength?: number;
  toughness?: number;
  speed?: number;
  intelligence?: number;
  charisma?: number;
  spirituality?: number;
  earthLore?: number;
  metalLore?: number;
  woodLore?: number;
  waterLore?: number;
  fireLore?: number;
  animalHandling?: number;
  combatMastery?: number;
  magicMastery?: number;
};

export type AttributeType =
  | 'strength'
  | 'toughness'
  | 'speed'
  | 'intelligence'
  | 'charisma'
  | 'spirituality'
  | 'earthLore'
  | 'metalLore'
  | 'woodLore'
  | 'waterLore'
  | 'fireLore'
  | 'animalHandling'
  | 'combatMastery'
  | 'magicMastery';

type AttributeObject = {
  [key in AttributeType]: {
    description: string;
    value: number;
    lifeStartValue: number;
    aptitude: number;
    aptitudeMult: number;
    icon: string;
  };
};

export type AttributeUpdates = {
  [key in AttributeType]: number;
};

export type EquipmentPosition = 'head' | 'feet' | 'body' | 'legs' | 'leftHand' | 'rightHand';

export type EquipmentSlots = { [key in EquipmentPosition]: Equipment | null };

export type StatusType = 'health' | 'stamina' | 'qi' | 'nourishment';
type CharacterStatus = { [key in StatusType]: { description: string; value: number; max: number } };

export interface CharacterProperties {
  attributes: AttributeObject;
  money: number;
  stashedMoney: number;
  hellMoney: number;
  equipment: EquipmentSlots;
  stashedEquipment: EquipmentSlots;
  age: number;
  status: CharacterStatus;
  baseLifespan: number;
  foodLifespan: number;
  alchemyLifespan: number;
  statLifespan: number;
  spiritualityLifespan: number;
  magicLifespan: number;
  cultivationLifespanSources: Record<string, number>;
  attributeScalingLimit: number;
  attributeSoftCap: number;
  aptitudeGainDivider: number;
  condenseSoulCoreCost: number;
  reinforceMeridiansCost: number;
  bloodlineRank: number;
  qiUnlocked: boolean;
  totalLives: number;
  healthBonusFood: number;
  healthBonusBath: number;
  healthBonusCultivation: number;
  healthBonusSoul: number;
  staminaBonusFood: number;
  staminaBonusCultivation: number;
  qiBonusCultivation: number;
  nourishmentBonusFood: number;
  empowermentFactor: number;
  immortal: boolean;
  god: boolean;
  hasEnteredHell: boolean;
  easyMode: boolean;
  highestMoney: number;
  highestAge: number;
  highestHealth: number;
  highestStamina: number;
  highestQi: number;
  highestAttributes: { [key: string]: number };
  yinYangUnlocked: boolean;
  yin: number;
  yang: number;
  righteousWrathUnlocked: boolean;
  bonusMuscles: boolean;
  bonusBrains: boolean;
  bonusHealth: boolean;
  showLifeSummary: boolean;
  showTips: boolean;
  showUpdateAnimations: boolean;
  lastCauseOfDeath: string;
  lastAttributeGains: string;
  consumableCounters: ConsumableCounters;
}

// Age and Lifespan
const INITIAL_AGE = 18 * 365;
export const BASE_LIFESPAN_YEARS = 30;
const BASE_LIFESPAN = BASE_LIFESPAN_YEARS * 365;
export const MAX_BASE_LIFESPAN_YEARS = 70;
export const DAYS_PER_LIFESPAN_BONUS = 3650; // 1 day bonus per 10 years lived

// Starvation
export const STARVATION_DAMAGE_PERCENT = 0.2;
export const STARVATION_DAMAGE_MIN = 20;
export const STARVATION_SPIRITUALITY_GAIN = 0.1;

// Spirit Projection
export const SPIRIT_PROJECTION_QI_COST = 5;

// Base Status Values
export const BASE_HEALTH = 100;
export const BASE_STAMINA = 100;
export const BASE_NOURISHMENT = 14;
export const BASE_QI = 1;
const STARTING_NOURISHMENT = 7;
const STARTING_MONEY = 300;

// Limits and Caps
const MAX_MONEY = 9.9999e23;
const ATTRIBUTE_SCALING_LIMIT = 10;
const ATTRIBUTE_SOFT_CAP = 100000;
const ATTRIBUTE_HARD_CAP = 365000;

// Bonus Caps
const HEALTH_BONUS_FOOD_CAP = 1900;
const HEALTH_BONUS_BATH_CAP = 8000;
const HEALTH_BONUS_CULTIVATION_CAP = 10000;
const HEALTH_BONUS_SOUL_CAP = 20000;
const STAMINA_MAX_CAP = 1000000;
const QI_MAX_CAP = 1000000;
const NOURISHMENT_MAX_CAP = 1000;

// Cost Base Values
const CONDENSE_SOUL_CORE_BASE_COST = 10;
const REINFORCE_MERIDIANS_BASE_COST = 1000;
const BLOODLINE_BASE_COST = 1000;

// Multipliers
const BONUS_ATTRIBUTE_MULTIPLIER = 1000;
const EASY_MODE_MULTIPLIER = 100;
const APTITUDE_DAILY_DIVISOR = 1e7;
const APTITUDE_DAILY_DIVISOR_SLOW = 1e14;

export class Character {
  constructor(
    private logService: LogService,
    private camelToTitlePipe: CamelToTitlePipe,
    private bigNumberPipe: BigNumberPipe,
    public mainLoopService: MainLoopService,
    private dialog: MatDialog
  ) {
    mainLoopService.frameSubject.subscribe(() => {
      this.empowermentMult = this.getEmpowermentMult();
      const keys = Object.keys(this.attributes) as AttributeType[];
      for (const key in keys) {
        this.attributes[keys[key]].aptitudeMult = this.getAptitudeMultipier(this.attributes[keys[key]].aptitude);
        if ((keys[key] === 'strength' || keys[key] === 'speed' || keys[key] === 'toughness') && this.bonusMuscles) {
          this.attributes[keys[key]].aptitudeMult *= BONUS_ATTRIBUTE_MULTIPLIER;
        }
        if ((keys[key] === 'intelligence' || keys[key] === 'charisma') && this.bonusBrains) {
          this.attributes[keys[key]].aptitudeMult *= BONUS_ATTRIBUTE_MULTIPLIER;
        }
      }
    });
    this.attributeUpdates = {
      strength: 0,
      toughness: 0,
      speed: 0,
      intelligence: 0,
      charisma: 0,
      spirituality: 0,
      earthLore: 0,
      metalLore: 0,
      woodLore: 0,
      waterLore: 0,
      fireLore: 0,
      animalHandling: 0,
      combatMastery: 0,
      magicMastery: 0,
    };
  }

  maxMoney = MAX_MONEY;
  totalLives = 1;
  dead = false;
  attributeScalingLimit = ATTRIBUTE_SCALING_LIMIT;
  attributeSoftCap = ATTRIBUTE_SOFT_CAP;
  aptitudeGainDivider = 5 * Math.pow(1.5, 9); // Exponential Soul Core ranks, up to 20%
  condenseSoulCoreCost = CONDENSE_SOUL_CORE_BASE_COST;
  condenseSoulCoreOriginalCost = CONDENSE_SOUL_CORE_BASE_COST;
  reinforceMeridiansCost = REINFORCE_MERIDIANS_BASE_COST;
  reinforceMeridiansOriginalCost = REINFORCE_MERIDIANS_BASE_COST;
  bloodlineCost = BLOODLINE_BASE_COST;
  bloodlineRank = 0;
  qiUnlocked = false;
  accuracy = 1;
  attackPower = 0;
  defense = 0;
  healthBonusFood = 0;
  healthBonusBath = 0;
  healthBonusCultivation = 0;
  healthBonusSoul = 0;
  staminaBonusFood = 0;
  staminaBonusCultivation = 0;
  qiBonusCultivation = 0;
  nourishmentBonusFood = 0;
  empowermentFactor = 1;
  empowermentMult = 1;
  imperial = false;
  immortal = false;
  god = false;
  hasEnteredHell = false;
  easyMode = false;
  ascensionUnlocked = false;
  yinYangUnlocked = false;
  yin = 1;
  yang = 1;
  yinYangBalance = 0;
  righteousWrathUnlocked = false;
  bonusMuscles = false;
  bonusBrains = false;
  bonusHealth = false;
  showLifeSummary = true;
  showTips = false;
  showUpdateAnimations = true;
  lastCauseOfDeath = '';
  lastAttributeGains = '';
  consumableCounters: ConsumableCounters = createEmptyConsumableCounters();
  dialogRef: MatDialogRef<LifeSummaryComponent> | null = null;
  attributeUpdates: AttributeUpdates;
  moneyUpdates = 0;
  statusToFlash: string[] = [];

  attributes: AttributeObject = {
    strength: {
      description: 'An immortal must have raw physical power.',
      value: 1,
      lifeStartValue: 1,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'fitness_center',
    },
    toughness: {
      description: 'An immortal must develop resilience to endure hardship.',
      value: 1,
      lifeStartValue: 1,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'castle',
    },
    speed: {
      description: 'An immortal must be quick of foot and hand.',
      value: 1,
      lifeStartValue: 1,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'directions_run',
    },
    intelligence: {
      description: 'An immortal must understand the workings of the universe.',
      value: 1,
      lifeStartValue: 1,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'local_library',
    },
    charisma: {
      description: 'An immortal must influence the hearts and minds of others.',
      value: 1,
      lifeStartValue: 1,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'forum',
    },
    spirituality: {
      description: 'An immortal must find deep connections to the divine.',
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'auto_awesome',
    },
    earthLore: {
      description: 'Understanding the earth and how to draw power and materials from it.',
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'landslide',
    },
    metalLore: {
      description: 'Understanding metals and how to forge and use them.',
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'hardware',
    },
    woodLore: {
      description: 'Understanding plants and how to grow and care for them.',
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'forest',
    },
    waterLore: {
      description: 'Understanding potions and pills and how to make and use them.',
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'emoji_food_beverage',
    },
    fireLore: {
      description: 'Burn! Burn! BURN!!!',
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'local_fire_department',
    },
    animalHandling: {
      description: 'Skill in working with animals and monsters.',
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'pets',
    },
    combatMastery: {
      description: 'Mastery of combat skills.',
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'sports_martial_arts',
    },
    magicMastery: {
      description: 'Mastery of magical skills.',
      value: 0,
      lifeStartValue: 0,
      aptitude: 1,
      aptitudeMult: 1,
      icon: 'self_improvement',
    },
  };
  status: CharacterStatus = {
    health: {
      description: 'Physical well-being. Take too much damage and you will die.',
      value: 100,
      max: 100,
    },
    stamina: {
      description:
        'Physical energy to accomplish tasks. Most activities use stamina, and if you let yourself run down you could get sick and have to stay in bed for a few days.',
      value: 100,
      max: 100,
    },
    qi: {
      description: 'Spiritual energy required for cultivation activities.',
      value: 0,
      max: 0,
    },
    nourishment: {
      description:
        'Eating is essential to life. You will automatically eat whatever food you have available when you are hungry. If you run out of food you will automatically spend your money on a bowl of rice each day.',
      value: STARTING_NOURISHMENT,
      max: BASE_NOURISHMENT,
    },
  };
  money = STARTING_MONEY;
  stashedMoney = 0;
  hellMoney = 0;
  // age in days
  age = INITIAL_AGE;
  baseLifespan = BASE_LIFESPAN;
  foodLifespan = 0; // bonus to lifespan based on food you've eaten
  alchemyLifespan = 0; // bonus to lifespan based on pills you've eaten
  statLifespan = 0; // bonus to lifespan based on base stat aptitudes
  spiritualityLifespan = 0; // bonus to lifespan based on spirituality
  magicLifespan = 0; // kept for backward compatibility, use cultivationLifespanSources instead
  cultivationLifespanSources: Record<string, number> = {}; // tracks lifespan bonus by activity name
  lifespan =
    this.baseLifespan +
    this.foodLifespan +
    this.alchemyLifespan +
    this.statLifespan +
    this.spiritualityLifespan +
    this.magicLifespan;
  equipment: EquipmentSlots = {
    head: null,
    body: null,
    leftHand: null,
    rightHand: null,
    legs: null,
    feet: null,
  };
  stashedEquipment: EquipmentSlots = {
    head: null,
    body: null,
    leftHand: null,
    rightHand: null,
    legs: null,
    feet: null,
  };
  highestMoney = 0;
  highestAge = 0;
  highestHealth = 0;
  highestStamina = 0;
  highestQi = 0;
  highestAttributes: { [key: string]: number } = {};

  // reset everything but increase aptitudes
  reincarnate(causeOfDeath: string): void {
    this.totalLives++;

    let attributeGains = '';

    const keys = Object.keys(this.attributes) as AttributeType[];
    for (const key in keys) {
      if (this.attributes[keys[key]].value > 0) {
        // gain aptitude based on last life's value
        const addedValue =
          (this.attributes[keys[key]].value - (this.attributes[keys[key]].lifeStartValue || 0)) /
          this.aptitudeGainDivider;
        if (addedValue > 0) {
          // never reduce aptitudes during reincarnation
          this.attributes[keys[key]].aptitude += addedValue;
          const message =
            'Your aptitude for ' +
            this.camelToTitlePipe.transform(keys[key]) +
            ' increased by ' +
            this.bigNumberPipe.transform(addedValue) +
            '\n    New aptitude: ' +
            this.bigNumberPipe.transform(this.attributes[keys[key]].aptitude);
          this.logService.log(LogTopic.MILESTONE, message);
          attributeGains +=
            message +
            '\n    New starting value: ' +
            this.bigNumberPipe.transform(
              this.getAttributeStartingValue(this.attributes[keys[key]].value, this.attributes[keys[key]].aptitude)
            ) +
            '\n';
        }
        // start at the aptitude value
        this.attributes[keys[key]].value = this.getAttributeStartingValue(
          this.attributes[keys[key]].value,
          this.attributes[keys[key]].aptitude
        );
        this.attributes[keys[key]].lifeStartValue = this.attributes[keys[key]].value;
      }
    }

    this.lastCauseOfDeath = causeOfDeath;
    this.lastAttributeGains = attributeGains;

    if (this.showLifeSummary) {
      if (this.dialogRef) {
        this.dialogRef.close();
      }
      this.dialogRef = this.dialog.open(LifeSummaryComponent, {
        width: '600px',
        data: { causeOfDeath: causeOfDeath, attributeGains: attributeGains },
        autoFocus: false,
      });
    }

    this.status.health.value = BASE_HEALTH;
    this.status.health.max = BASE_HEALTH;
    this.status.stamina.value = BASE_STAMINA;
    this.status.stamina.max = BASE_STAMINA;
    this.status.nourishment.value = STARTING_NOURISHMENT;
    this.status.nourishment.max = BASE_NOURISHMENT;
    if (this.qiUnlocked) {
      this.status.qi.max = BASE_QI;
      this.status.qi.value = BASE_QI;
    } else {
      this.status.qi.max = 0;
      this.status.qi.value = 0;
    }

    this.healthBonusFood = 0;
    this.healthBonusBath = 0;
    this.healthBonusCultivation = 0;
    this.staminaBonusFood = 0;
    this.staminaBonusCultivation = 0;
    this.qiBonusCultivation = 0;
    this.nourishmentBonusFood = 0;

    // Reset currentLife consumable counters (allTime persists)
    for (const id of CONSUMABLE_IDS) {
      this.consumableCounters[id].consumed.currentLife = 0;
      for (const effectKey of Object.keys(this.consumableCounters[id].effects)) {
        this.consumableCounters[id].effects[effectKey as EffectType]!.currentLife = 0;
      }
    }

    // age in days
    this.age = INITIAL_AGE;
    this.foodLifespan = 0;
    this.alchemyLifespan = 0;
    this.spiritualityLifespan = 0;
    this.magicLifespan = 0;
    this.cultivationLifespanSources = {};
    let totalAptitude = 0;
    totalAptitude +=
      this.attributes.strength.aptitude +
      this.attributes.toughness.aptitude +
      this.attributes.speed.aptitude +
      this.attributes.intelligence.aptitude +
      this.attributes.charisma.aptitude;
    this.statLifespan = this.getAptitudeMultipier(totalAptitude / 5);
    if (this.bloodlineRank < 5) {
      this.statLifespan *= 0.1;
    } else {
      this.statLifespan *= 5;
    }

    if (this.money < 0) {
      //sanity check that we're not persisting/growing debt at higher bloodline levels
      this.money = 0;
    }
    if (this.bloodlineRank < 3) {
      this.money = 0;
    } else if (this.bloodlineRank < 4) {
      this.money = this.money / 8;
    } else {
      this.money = 4 * this.money;
    }
    if (this.money > this.maxMoney) {
      this.money = this.maxMoney;
    }
    this.hellMoney = 0;
    this.recalculateDerivedStats();
    if (this.bloodlineRank === 0) {
      this.equipment = {
        head: null,
        body: null,
        leftHand: null,
        rightHand: null,
        legs: null,
        feet: null,
      };
    } else if (this.bloodlineRank <= 1) {
      this.equipment.body = null;
      this.equipment.head = null;
      this.equipment.legs = null;
      this.equipment.feet = null;
    }
  }

  getAttributeStartingValue(value: number, aptitude: number): number {
    if (value <= 0) {
      return 0;
    }
    if (aptitude < 0) {
      aptitude = 0;
    }
    if (value < 1) {
      return value / 10;
    }
    if (aptitude < this.attributeSoftCap) {
      return 1 + aptitude / 10;
    }
    return this.attributeSoftCap / 10 + Math.log2(aptitude - (this.attributeSoftCap - 1));
  }

  recalculateDerivedStats(): void {
    let bonusFactor = 1;
    if (this.bonusHealth) {
      bonusFactor = 5;
    }
    this.status.health.max =
      (BASE_HEALTH +
        this.healthBonusFood +
        this.healthBonusBath +
        this.healthBonusCultivation +
        this.healthBonusSoul +
        Math.floor(Math.log2(this.attributes.toughness.value + 2) * 5)) *
      bonusFactor;
    this.status.stamina.max = BASE_STAMINA + this.staminaBonusFood + this.staminaBonusCultivation;
    this.status.nourishment.max = BASE_NOURISHMENT + this.nourishmentBonusFood;
    if (this.qiUnlocked) {
      this.status.qi.max = BASE_QI + this.qiBonusCultivation;
    }
    if (this.money > this.maxMoney) {
      this.money = this.maxMoney;
    }
    if (this.hellMoney > this.maxMoney) {
      this.hellMoney = this.maxMoney;
    }
    const keys = Object.keys(this.attributes) as AttributeType[];
    for (const key in keys) {
      this.attributes[keys[key]].aptitudeMult = this.getAptitudeMultipier(this.attributes[keys[key]].aptitude);
    }
    this.spiritualityLifespan = this.getAptitudeMultipier(this.attributes.spirituality.value, true) * 5; // No empowerment for lifespan
    this.lifespan =
      this.baseLifespan +
      this.foodLifespan +
      this.alchemyLifespan +
      this.statLifespan +
      this.spiritualityLifespan +
      this.magicLifespan;
    let leftHand = 1;
    let rightHand = 1;
    let head = 1;
    let body = 1;
    let legs = 1;
    let feet = 1;
    if (this.equipment.leftHand) {
      leftHand = this.equipment.leftHand.weaponStats?.baseDamage || 1;
    }
    if (this.equipment.rightHand) {
      rightHand = this.equipment.rightHand.weaponStats?.baseDamage || 1;
    }
    if (this.equipment.head) {
      head = this.equipment.head.armorStats?.defense || 1;
    }
    if (this.equipment.body) {
      body = this.equipment.body.armorStats?.defense || 1;
    }
    if (this.equipment.legs) {
      legs = this.equipment.legs.armorStats?.defense || 1;
    }
    if (this.equipment.feet) {
      feet = this.equipment.feet.armorStats?.defense || 1;
    }
    const strengthPower = Math.sqrt(this.attributes.strength.value) || 1;
    this.attackPower = Math.floor(strengthPower * Math.sqrt(rightHand * leftHand)) || 1;
    if (this.attributes.combatMastery.value > 1) {
      // multiply by log base 100 of combatMastery
      // Math.log(100)=4.605170185988092
      this.attackPower *= Math.log(this.attributes.combatMastery.value + 100) / 4.605170185988092;
    }
    if (this.righteousWrathUnlocked) {
      this.attackPower *= 2;
    }
    const toughnessDefense = Math.sqrt(this.attributes.toughness.value) || 1;
    this.defense = Math.floor(toughnessDefense * (head + body + legs + feet)) || 1;
    if (this.righteousWrathUnlocked) {
      this.defense *= 2;
    }
    if (this.yinYangUnlocked) {
      // calculate yin/yang balance bonus, 1 for perfect balance, 0 at worst
      this.yinYangBalance = Math.max(1 - Math.abs(this.yang - this.yin) / ((this.yang + this.yin) / 2), 0);
    }
  }

  getEmpowermentMult(): number {
    const max = 99;
    const empowermentFactor = this.empowermentFactor - 1;
    let returnValue = 1 + (2 * max) / (1 + Math.pow(1.02, -empowermentFactor / 3)) - max;
    if (this.easyMode) {
      returnValue *= EASY_MODE_MULTIPLIER;
    }
    return returnValue;
  }

  getEmpowermentExplanation(pillCount?: number, multiplier?: number): string {
    if (pillCount !== undefined && multiplier !== undefined) {
      return `You have consumed ${Math.round(pillCount)} Empowerment Pills which multiplies all your attribute gains by ${multiplier.toFixed(3)}. You will always keep this bonus, even after ascending.`;
    }
    return 'Consuming Empowerment Pills multiplies all your attribute gains. You will always keep this bonus, even after ascending.';
  }

  //TODO: double check the math here and maybe cache the results on aptitude change instead of recalculating regularly
  getAptitudeMultipier(aptitude: number, noEmpowerment = false): number {
    if (aptitude < 0) {
      // should not happen, but sanity check it
      aptitude = 0;
    }
    const empowermentFactor = noEmpowerment ? 1 : this.empowermentMult;
    let x = 1;
    if (aptitude < this.attributeScalingLimit) {
      // linear up to the scaling limit
      x = aptitude * empowermentFactor;
    } else if (aptitude < this.attributeScalingLimit * 10) {
      // from the limit to 10x the limit, change growth rate to 1/4
      x = (this.attributeScalingLimit + (aptitude - this.attributeScalingLimit) / 4) * empowermentFactor;
    } else if (aptitude < this.attributeScalingLimit * 100) {
      // from the 10x limit to 100x the limit, change growth rate to 1/20
      x =
        (this.attributeScalingLimit +
          (this.attributeScalingLimit * 9) / 4 +
          (aptitude - this.attributeScalingLimit * 10) / 20) *
        empowermentFactor;
    } else if (aptitude <= this.attributeSoftCap) {
      // from the 100x limit to softcap, change growth rate to 1/100
      x =
        (this.attributeScalingLimit +
          (this.attributeScalingLimit * 9) / 4 +
          (this.attributeScalingLimit * 90) / 20 +
          (aptitude - this.attributeScalingLimit * 100) / 100) *
        empowermentFactor;
    } else {
      const d =
        this.attributeScalingLimit +
        (this.attributeScalingLimit * 9) / 4 +
        (this.attributeScalingLimit * 90) / 20 +
        (this.attributeSoftCap - this.attributeScalingLimit * 100) / 100; // Pre-softcap
      x =
        (Math.pow((aptitude - this.attributeSoftCap) * Math.pow(this.attributeScalingLimit / 1e13, 0.15), 0.5) + d) *
        empowermentFactor; // Softcap
    }
    if (this.bloodlineRank >= 8) {
      return x;
    }
    let c = ATTRIBUTE_HARD_CAP;
    if (this.yinYangUnlocked) {
      // calculate balance bonus, 1 for perfect balance, 0 at worst
      const yinYangBalance = Math.max(1 - Math.abs(this.yang - this.yin) / ((this.yang + this.yin) / 2), 0);
      // apply bonus to hardcap value
      // TODO: tune this
      c += yinYangBalance * c;
    }
    return c / (-1 - Math.log((x + c) / c)) + c; // soft-hardcap math
  }

  getCultivationLifespan(): number {
    return Object.values(this.cultivationLifespanSources).reduce((sum, val) => sum + val, 0);
  }

  addCultivationLifespan(source: string, amount: number): void {
    this.cultivationLifespanSources[source] = (this.cultivationLifespanSources[source] || 0) + amount;
    this.magicLifespan = this.getCultivationLifespan(); // Keep magicLifespan in sync for backward compatibility
  }

  updateMoney(amount: number) {
    this.money += amount;
    if (this.showUpdateAnimations) {
      this.moneyUpdates += amount;
    }
  }

  flashStatus(statusToFlash: string) {
    if (!this.statusToFlash.includes(statusToFlash)) {
      this.statusToFlash.push(statusToFlash);
    }
  }

  increaseAttribute(attribute: AttributeType, amount: number): number {
    let increaseAmount = amount * this.attributes[attribute].aptitudeMult;
    // sanity check that gain is never less than base gain
    if (increaseAmount < amount) {
      increaseAmount = amount;
    }
    this.attributes[attribute].value += increaseAmount;
    if (!this.highestAttributes[attribute] || this.highestAttributes[attribute] < this.attributes[attribute].value) {
      this.highestAttributes[attribute] = this.attributes[attribute].value;
    }
    if (this.showUpdateAnimations) {
      this.attributeUpdates[attribute] += increaseAmount;
    }
    return increaseAmount;
  }

  increaseAptitudeDaily(days: number) {
    const keys = Object.keys(this.attributes) as AttributeType[];
    const slowGrowers = ['combatMastery', 'magicMastery'];
    for (const key in keys) {
      if (slowGrowers.includes(key)) {
        this.attributes[keys[key]].aptitude += (this.attributes[keys[key]].value / APTITUDE_DAILY_DIVISOR_SLOW) * days;
      } else {
        this.attributes[keys[key]].aptitude += (this.attributes[keys[key]].value / APTITUDE_DAILY_DIVISOR) * days;
      }
    }
  }

  /**increase in days
   *
   * limit in years
   *
   * returns false if limit is reached.
   */
  increaseBaseLifespan(increase: number, limit: number): boolean {
    if (this.baseLifespan + increase < limit * 365) {
      this.baseLifespan += increase;
      return true;
    } else if (this.baseLifespan < limit * 365) {
      this.baseLifespan = limit * 365;
    }
    return false;
  }

  /**
   * Track consumption of a bonus food item.
   * Call this when food is eaten, regardless of whether bonuses trigger.
   * @param foodId - Must be a valid BonusFoodId (TypeScript enforces this)
   * @param quantity - Number consumed
   */
  trackConsumableUsed(id: ConsumableId, quantity: number): void {
    this.consumableCounters[id].consumed.currentLife += quantity;
    this.consumableCounters[id].consumed.allTime += quantity;
  }

  /**
   * Track when an effect triggers from a consumable.
   * For foods: call when bonus triggers (health, stamina, etc.)
   * For potions/pills: call with 'gained' and the total effect amount
   */
  trackConsumableEffect(id: ConsumableId, effectType: EffectType, amount: number): void {
    if (!this.consumableCounters[id].effects[effectType]) {
      this.consumableCounters[id].effects[effectType] = { currentLife: 0, allTime: 0 };
    }
    this.consumableCounters[id].effects[effectType]!.currentLife += amount;
    this.consumableCounters[id].effects[effectType]!.allTime += amount;
  }

  // Convenience methods for backwards compatibility
  trackBonusFoodEaten(foodId: BonusFoodId, quantity: number): void {
    this.trackConsumableUsed(foodId, quantity);
  }

  trackBonusFoodTrigger(foodId: BonusFoodId, bonusType: BonusType, quantity: number): void {
    this.trackConsumableEffect(foodId, bonusType, quantity);
  }

  trackPotionUsed(attribute: PotionAttribute, quantity: number, totalGained: number): void {
    this.trackConsumableUsed(potionId(attribute), quantity);
    this.trackConsumableEffect(potionId(attribute), 'gained', totalGained);
  }

  trackPillUsed(effect: PillEffect, quantity: number, totalGained: number): void {
    this.trackConsumableUsed(pillId(effect), quantity);
    this.trackConsumableEffect(pillId(effect), 'gained', totalGained);
  }

  checkOverage() {
    this.recalculateDerivedStats();
    if (this.healthBonusFood > HEALTH_BONUS_FOOD_CAP) {
      this.healthBonusFood = HEALTH_BONUS_FOOD_CAP;
    }
    if (this.healthBonusBath > HEALTH_BONUS_BATH_CAP) {
      this.healthBonusBath = HEALTH_BONUS_BATH_CAP;
    }
    let healthBonusCultivationCap = HEALTH_BONUS_CULTIVATION_CAP;
    let healthBonusSoulCap = HEALTH_BONUS_SOUL_CAP;
    if (this.yinYangUnlocked) {
      healthBonusCultivationCap += 2 * this.yinYangBalance * healthBonusCultivationCap;
      healthBonusSoulCap += 2 * this.yinYangBalance * healthBonusSoulCap;
    }
    if (this.healthBonusCultivation > healthBonusCultivationCap) {
      this.healthBonusCultivation = healthBonusCultivationCap;
    }
    if (this.healthBonusSoul > healthBonusSoulCap) {
      this.healthBonusSoul = healthBonusSoulCap;
    }
    if (this.status.stamina.max > STAMINA_MAX_CAP) {
      this.status.stamina.max = STAMINA_MAX_CAP;
    }
    if (this.status.qi.max > QI_MAX_CAP) {
      this.status.qi.max = QI_MAX_CAP;
    }
    if (this.status.nourishment.max > NOURISHMENT_MAX_CAP) {
      this.status.nourishment.max = NOURISHMENT_MAX_CAP;
    }
    if (this.status.health.value > this.status.health.max) {
      this.status.health.value = this.status.health.max;
    }
    if (this.status.stamina.value > this.status.stamina.max) {
      this.status.stamina.value = this.status.stamina.max;
    }
    if (this.status.nourishment.value > this.status.nourishment.max) {
      this.status.nourishment.value = this.status.nourishment.max;
    }
    if (this.status.qi.value > this.status.qi.max) {
      this.status.qi.value = this.status.qi.max;
    }
    if (this.money > this.maxMoney) {
      this.money = this.maxMoney;
    }
    if (this.hellMoney > this.maxMoney) {
      this.hellMoney = this.maxMoney;
    }
  }

  getProperties(): CharacterProperties {
    return {
      attributes: this.attributes,
      money: this.money,
      stashedMoney: this.stashedMoney,
      hellMoney: this.hellMoney,
      equipment: this.equipment,
      stashedEquipment: this.stashedEquipment,
      age: this.age,
      status: this.status,
      baseLifespan: this.baseLifespan,
      foodLifespan: this.foodLifespan,
      alchemyLifespan: this.alchemyLifespan,
      statLifespan: this.statLifespan,
      spiritualityLifespan: this.spiritualityLifespan,
      magicLifespan: this.magicLifespan,
      cultivationLifespanSources: this.cultivationLifespanSources,
      attributeScalingLimit: this.attributeScalingLimit,
      attributeSoftCap: this.attributeSoftCap,
      aptitudeGainDivider: this.aptitudeGainDivider,
      condenseSoulCoreCost: this.condenseSoulCoreCost,
      reinforceMeridiansCost: this.reinforceMeridiansCost,
      bloodlineRank: this.bloodlineRank,
      qiUnlocked: this.qiUnlocked,
      totalLives: this.totalLives,
      healthBonusFood: this.healthBonusFood,
      healthBonusBath: this.healthBonusBath,
      healthBonusCultivation: this.healthBonusCultivation,
      healthBonusSoul: this.healthBonusSoul,
      staminaBonusFood: this.staminaBonusFood,
      staminaBonusCultivation: this.staminaBonusCultivation,
      qiBonusCultivation: this.qiBonusCultivation,
      nourishmentBonusFood: this.nourishmentBonusFood,
      empowermentFactor: this.empowermentFactor,
      immortal: this.immortal,
      god: this.god,
      hasEnteredHell: this.hasEnteredHell,
      easyMode: this.easyMode,
      highestMoney: this.highestMoney,
      highestAge: this.highestAge,
      highestHealth: this.highestHealth,
      highestStamina: this.highestStamina,
      highestQi: this.highestQi,
      highestAttributes: this.highestAttributes,
      yinYangUnlocked: this.yinYangUnlocked,
      yin: this.yin,
      yang: this.yang,
      righteousWrathUnlocked: this.righteousWrathUnlocked,
      bonusMuscles: this.bonusMuscles,
      bonusBrains: this.bonusBrains,
      bonusHealth: this.bonusHealth,
      showLifeSummary: this.showLifeSummary,
      showTips: this.showTips,
      showUpdateAnimations: this.showUpdateAnimations,
      lastCauseOfDeath: this.lastCauseOfDeath,
      lastAttributeGains: this.lastAttributeGains,
      consumableCounters: this.consumableCounters,
    };
  }

  setProperties(properties: CharacterProperties): void {
    this.attributes = properties.attributes;
    this.money = properties.money;
    this.stashedMoney = properties.stashedMoney || 0;
    this.hellMoney = properties.hellMoney || 0;
    if (this.money > this.maxMoney) {
      this.money = this.maxMoney;
    }
    if (this.hellMoney > this.maxMoney) {
      this.hellMoney = this.maxMoney;
    }
    this.equipment = properties.equipment;
    this.stashedEquipment = properties.stashedEquipment || {
      head: null,
      body: null,
      leftHand: null,
      rightHand: null,
      legs: null,
      feet: null,
    };
    this.age = properties.age || INITIAL_AGE;
    this.status = properties.status;
    // Migration: old saves have 'mana' key, new code uses 'qi'
    if (!this.status.qi && (this.status as any).mana) {
      this.status.qi = (this.status as any).mana;
      delete (this.status as any).mana;
    }
    this.baseLifespan = properties.baseLifespan;
    this.foodLifespan = properties.foodLifespan || 0;
    this.alchemyLifespan = properties.alchemyLifespan || 0;
    this.statLifespan = properties.statLifespan || 0;
    this.spiritualityLifespan = properties.spiritualityLifespan || 0;
    this.magicLifespan = properties.magicLifespan || 0;
    // Migrate old saves: if cultivationLifespanSources is empty but magicLifespan has a value,
    // attribute it to 'Extending Life' (the original/only source)
    this.cultivationLifespanSources = properties.cultivationLifespanSources || {};
    if (Object.keys(this.cultivationLifespanSources).length === 0 && this.magicLifespan > 0) {
      this.cultivationLifespanSources['Extending Life'] = this.magicLifespan;
    }
    this.condenseSoulCoreCost = properties.condenseSoulCoreCost;
    // This is derived to avoid save issues. Calculate rank and subtract from power to reduce the exponential aptitude divider.
    this.aptitudeGainDivider =
      5 * Math.pow(1.5, 9 - Math.log10(this.condenseSoulCoreCost / this.condenseSoulCoreOriginalCost));
    this.reinforceMeridiansCost = properties.reinforceMeridiansCost;
    // Similarly here, 10 * 2 ^ rank.
    this.attributeScalingLimit =
      10 * Math.pow(2, Math.log10(this.reinforceMeridiansCost / this.reinforceMeridiansOriginalCost));
    this.attributeSoftCap = properties.attributeSoftCap;
    this.bloodlineRank = properties.bloodlineRank;
    this.bloodlineCost = 1000 * Math.pow(100, this.bloodlineRank); // This is derived to avoid save issues.
    this.qiUnlocked = properties.qiUnlocked || false;
    this.totalLives = properties.totalLives || 1;
    this.healthBonusFood = properties.healthBonusFood || 0;
    this.healthBonusBath = properties.healthBonusBath || 0;
    this.healthBonusCultivation = properties.healthBonusCultivation || 0;
    this.healthBonusSoul = properties.healthBonusSoul || 0;
    this.staminaBonusFood = properties.staminaBonusFood || 0;
    this.staminaBonusCultivation = properties.staminaBonusCultivation || 0;
    this.qiBonusCultivation = properties.qiBonusCultivation || 0;
    this.nourishmentBonusFood = properties.nourishmentBonusFood || 0;

    // Migration: if counters don't account for saved max, attribute difference to primary counter
    const expectedStaminaMax = BASE_STAMINA + this.staminaBonusFood + this.staminaBonusCultivation;
    if (this.status.stamina.max > expectedStaminaMax) {
      this.staminaBonusFood += this.status.stamina.max - expectedStaminaMax;
    }
    const expectedNourishmentMax = BASE_NOURISHMENT + this.nourishmentBonusFood;
    if (this.status.nourishment.max > expectedNourishmentMax) {
      this.nourishmentBonusFood += this.status.nourishment.max - expectedNourishmentMax;
    }
    const expectedQiMax = this.qiUnlocked ? BASE_QI + this.qiBonusCultivation : 0;
    if (this.status.qi.max > expectedQiMax && this.qiUnlocked) {
      this.qiBonusCultivation += this.status.qi.max - expectedQiMax;
    }
    this.empowermentFactor = properties.empowermentFactor || 1;
    this.immortal = properties.immortal || false;
    this.god = properties.god || false;
    this.hasEnteredHell = properties.hasEnteredHell || false;
    this.easyMode = properties.easyMode || false;
    this.highestMoney = properties.highestMoney || 0;
    this.highestAge = properties.highestAge || 0;
    this.highestHealth = properties.highestHealth || 0;
    this.highestStamina = properties.highestStamina || 0;
    this.highestQi = properties.highestQi || 0;
    this.highestAttributes = properties.highestAttributes || {};
    this.yinYangUnlocked = properties.yinYangUnlocked || false;
    this.yin = properties.yin || 1;
    this.yang = properties.yang || 1;
    this.righteousWrathUnlocked = properties.righteousWrathUnlocked || false;
    this.bonusMuscles = properties.bonusMuscles || false;
    this.bonusBrains = properties.bonusBrains || false;
    this.bonusHealth = properties.bonusHealth || false;
    this.showLifeSummary = properties.showLifeSummary ?? true;
    this.showTips = properties.showTips || false;
    this.showUpdateAnimations = properties.showUpdateAnimations ?? true;
    this.lastCauseOfDeath = properties.lastCauseOfDeath || '';
    this.lastAttributeGains = properties.lastAttributeGains || '';
    this.consumableCounters = properties.consumableCounters || createEmptyConsumableCounters();

    // add attributes that were added after release if needed
    if (!this.attributes.combatMastery) {
      this.attributes.combatMastery = {
        description: 'Mastery of combat skills.',
        value: 0,
        lifeStartValue: 0,
        aptitude: 1,
        aptitudeMult: 1,
        icon: 'sports_martial_arts',
      };
    }
    if (!this.attributes.magicMastery) {
      this.attributes.magicMastery = {
        description: 'Mastery of magical skills.',
        value: 0,
        lifeStartValue: 0,
        aptitude: 1,
        aptitudeMult: 1,
        icon: 'self_improvement',
      };
    }
    this.recalculateDerivedStats();
  }
}
