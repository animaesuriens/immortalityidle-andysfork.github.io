import { CharacterAttribute, StatusType } from '../game-state/character';
import { Effect } from '../effects';

export enum ActivityType {
  OddJobs,
  Resting,
  Begging,
  Blacksmithing,
  GatherHerbs,
  ChopWood,
  Woodworking,
  Leatherworking,
  Farming,
  Mining,
  Smelting,
  Hunting,
  Fishing,
  Alchemy,
  Burning,
  BalanceChi,
  BodyCultivation,
  MindCultivation,
  CoreCultivation,
  SoulCultivation,
  InfuseBody,
  InfuseEquipment,
  ExtendLife,
  Recruiting,
  TrainingFollowers,
  Swim,
  ForgeChains,
  AttachChains,
  MakeBrick,
  MakeMortar,
  MakeScaffold,
  BuildTower,
  ResearchWind,
  TameWinds,
  LearnToFly,
  OfferDragonFood,
  OfferDragonWealth,
  TalkToDragon,
  GatherArmies,
  ConquerTheWorld,
  MoveStars,
  Taunting,
  EscapeHell,
  HellRecruiting,
  BurnMoney,
  HonorAncestors,
  CombatTraining,
  Rehabilitation,
  CopperMining,
  ForgeHammer,
  ClimbMountain,
  AttackClimbers,
  MeltMountain,
  HealAnimals,
  PetRecruiting,
  PetTraining,
  LiftBoulder,
  SearchForExit,
  TeachTheWay,
  Interrogate,
  RecoverTreasure,
  ReplaceTreasure,
  PurifyGems,
  Endure,
  FreezeMountain,
  ExamineContracts,
  FinishHell,
  Hell, // hell needs to be last for indexing purposes
}

export type ActivityResource = {
  [key in StatusType]?: number;
};

/**
 * Base activity properties shared by both declarative and legacy activities.
 */
interface BaseActivity {
  name: string[];
  imageBaseName?: string;
  level: number;
  activityType: ActivityType;
  duration: number;
  description: string[];
  requirements: CharacterAttribute[];
  landRequirements?: number;
  unlocked: boolean;
  discovered?: boolean;
  skipApprenticeshipLevel: number;
  lastIncome?: number;
  resourceUse?: ActivityResource[];
  projectionOnly?: boolean;
  portal?: boolean;
}

/**
 * Declarative activity using the new effects system.
 * Effects are defined as typed objects executed by EffectExecutorService.
 */
export interface DeclarativeActivity extends BaseActivity {
  /** Effects by level: { [level: number]: Effect[] } */
  effects: { [level: number]: Effect[] };
  /** Prevent mixing declarative and legacy in same activity */
  consequence?: never;
  consequenceDescription?: never;
  effectsLegacy?: never;
}

/**
 * Legacy activity using imperative consequence functions.
 * These will be migrated to declarative over time.
 */
export interface LegacyActivity extends BaseActivity {
  /** Array of imperative functions, one per level */
  consequence: (() => void)[];
  /** Display text for each level */
  consequenceDescription: string[];
  /** Short effects shown on activity cards (renamed from effects to avoid collision) */
  effectsLegacy?: string[];
  /** Prevent mixing declarative and legacy in same activity */
  effects?: never;
}

/**
 * Activity is either declarative or legacy.
 * TypeScript enforces that you cannot have both effects and consequence.
 */
export type Activity = DeclarativeActivity | LegacyActivity;

/**
 * Type guard to check if an activity uses the declarative effects system.
 *
 * @param activity The activity to check
 * @returns true if the activity has declarative effects
 */
export function isDeclarativeActivity(activity: Activity): activity is DeclarativeActivity {
  return 'effects' in activity && activity.effects !== undefined && typeof activity.effects === 'object' && !Array.isArray(activity.effects);
}

export interface ActivityLoopEntry {
  activity: ActivityType;
  repeatTimes: number;
  disabled?: boolean;
}
