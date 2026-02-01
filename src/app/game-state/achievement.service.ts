import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { CharacterService } from './character.service';
import { InventoryService } from './inventory.service';
import { HomeService, HomeType } from './home.service';
import { ItemRepoService } from './item-repo.service';
import { StoreService } from './store.service';
import { MainLoopService } from './main-loop.service';
import { BattleService } from './battle.service';
import { GameStateService } from './game-state.service';
import { ActivityService } from './activity.service';
import { ActivityType } from './activity';
import { ImpossibleTaskService } from './impossibleTask.service';
import { FollowersService } from './followers.service';
import { HellService } from './hell.service';
import { BigNumberPipe } from '../app.component';

export interface Achievement {
  name: string;
  /**Necessary for name changes due to save structure using name (above) instead of ids */
  displayName?: string;
  description: string;
  hint: string;
  requirements: string;
  progress?: () => string;
  check: () => boolean;
  effect: () => void;
  unlocked: boolean;
}

export interface AchievementProperties {
  unlockedAchievements: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AchievementService {
  gameStateService?: GameStateService;
  unlockedAchievements: string[] = [];
  bigNumberPipe: BigNumberPipe;

  constructor(
    private mainLoopService: MainLoopService,
    private injector: Injector,
    private logService: LogService,
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    private itemRepoService: ItemRepoService,
    private storeService: StoreService,
    private battleService: BattleService,
    private homeService: HomeService,
    private activityService: ActivityService,
    private followerService: FollowersService,
    private impossibleTaskService: ImpossibleTaskService,
    private hellService: HellService
  ) {
    this.bigNumberPipe = this.injector.get(BigNumberPipe);
    this.mainLoopService.longTickSubject.subscribe(() => {
      for (const achievement of this.achievements) {
        if (!this.unlockedAchievements.includes(achievement.name)) {
          if (achievement.check()) {
            this.unlockAchievement(achievement, true);
          }
        }
      }
    });
  }

  // important: achievement effects must be idempotent as they may be called multiple times
  achievements: Achievement[] = [
    {
      name: 'One Week',
      description: 'You survived your first week of this game!',
      hint: 'Try some activities.',
      requirements: 'Survive for 7 days.',
      progress: () => `${Math.min(this.mainLoopService.totalTicks, 7)} / 7 days`,
      check: () => {
        return this.mainLoopService.totalTicks > 7;
      },
      effect: () => {
        this.mainLoopService.timeUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: 'Big Earner',
      description:
        'You earned your first few taels by working hard. Maybe you should invest in some land and a better home.',
      hint: 'Make some money.',
      requirements: 'Earn 350 taels or upgrade your home.',
      progress: () => `${Math.min(Math.floor(this.characterService.characterState.money), 350)} / 350 taels`,
      check: () => {
        return (
          this.characterService.characterState.money >= 350 || this.homeService.homeValue !== HomeType.SquatterTent
        );
      },
      effect: () => {
        this.homeService.homeUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: 'Bookworm',
      description:
        'You opened the manuals shop and unlocked the ' + this.itemRepoService.items['restartActivityManual'].name + '!',
      hint: 'There are lots of buttons in this game, maybe an aspiring immortal should press a few.',
      requirements: 'Open the manuals shop.',
      progress: () => this.storeService.storeOpened ? 'Complete' : 'Incomplete',
      check: () => {
        return this.storeService.storeOpened;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['restartActivityManual']);
      },
      unlocked: false,
    },
    {
      name: 'Played a Bit',
      description:
        'You worked toward immortality for ten years across your lifetimes and unlocked the ' +
        this.itemRepoService.items['fastPlayManual'].name + '!',
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      requirements: 'Play for 10 years total across all lives.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.mainLoopService.totalTicks, 3650))} / 3,650 days`,
      check: () => {
        return this.mainLoopService.totalTicks > 3650;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['fastPlayManual']);
      },
      unlocked: false,
    },
    {
      name: 'Basically an Expert',
      description:
        'You worked toward immortality for one hundred years across your lifetimes and unlocked the ' +
        this.itemRepoService.items['fasterPlayManual'].name + '!',
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      requirements: 'Play for 100 years total across all lives.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.mainLoopService.totalTicks, 36500))} / 36,500 days`,
      check: () => {
        return this.mainLoopService.totalTicks > 36500;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['fasterPlayManual']);
      },
      unlocked: false,
    },
    {
      name: 'Gear Up!',
      description: 'You created some equipment and now you can wear it.',
      hint: 'Some jobs let you make stuff you can use.',
      requirements: 'Create or equip any piece of equipment.',
      progress: () => this.inventoryService.equipmentCreated > 0 ? 'Complete' : 'Incomplete',
      check: () => {
        return (
          this.inventoryService.equipmentCreated > 0 ||
          this.characterService.characterState.equipment.head !== null ||
          this.characterService.characterState.equipment.body !== null ||
          this.characterService.characterState.equipment.leftHand !== null ||
          this.characterService.characterState.equipment.rightHand !== null ||
          this.characterService.characterState.equipment.legs !== null ||
          this.characterService.characterState.equipment.feet !== null
        );
      },
      effect: () => {
        this.inventoryService.equipmentUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: 'Persistent Reincarnator',
      description:
        'You lived one thousand years across your lifetimes and unlocked the ' +
        this.itemRepoService.items['fastestPlayManual'].name + '!',
      hint: 'The millennial.',
      requirements: 'Play for 1,000 years total across all lives.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.mainLoopService.totalTicks, 365000))} / 365,000 days`,
      check: () => {
        return this.mainLoopService.totalTicks > 365000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['fastestPlayManual']);
      },
      unlocked: false,
    },
    {
      name: 'Veteran Cultivator',
      description:
        'You lived ten thousand years across your lifetimes and unlocked the ' +
        this.itemRepoService.items['totalPlaytimeManual'].name + '!',
      hint: 'A long life. Myriad years.',
      requirements: 'Play for 10,000 years total across all lives.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.mainLoopService.totalTicks, 3650000))} / 3,650,000 days`,
      check: () => {
        return this.mainLoopService.totalTicks > 3650000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['totalPlaytimeManual']);
      },
      unlocked: false,
    },
    {
      name: 'Clang! Clang! Clang!',
      description:
        'You reached proficiency in blacksmithing and can now work as a Blacksmith without going through an apprenticeship (you still need the attributes for the Blacksmithing activity).',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.',
      requirements: 'Complete the Blacksmithing apprenticeship.',
      progress: () => this.activityService.completedApprenticeships.includes(ActivityType.Blacksmithing) ? 'Complete' : 'Incomplete',
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Blacksmithing);
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Bubble, Bubble',
      description:
        'You reached proficiency in alchemy and can now work as a Alchemist without going through an apprenticeship (you still need the attributes for the Alchemy activity).',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.',
      requirements: 'Complete the Alchemy apprenticeship.',
      progress: () => this.activityService.completedApprenticeships.includes(ActivityType.Alchemy) ? 'Complete' : 'Incomplete',
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Alchemy);
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Tanner',
      description:
        'You reached proficiency in leatherworking and can now work as a Leatherworker without going through an apprenticeship (you still need the attributes for the Leatherworking activity).',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.',
      requirements: 'Complete the Leatherworking apprenticeship.',
      progress: () => this.activityService.completedApprenticeships.includes(ActivityType.Leatherworking) ? 'Complete' : 'Incomplete',
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Leatherworking);
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Carpenter',
      description:
        'You reached proficiency in woodworking and can now work as a Woodworker without going through an apprenticeship (you still need the attributes for the Woodworking activity).',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.',
      requirements: 'Complete the Woodworking apprenticeship.',
      progress: () => this.activityService.completedApprenticeships.includes(ActivityType.Woodworking) ? 'Complete' : 'Incomplete',
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Woodworking);
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Addict',
      description: 'You got a taste of those sweet, sweet empowerment pills and want more.',
      hint: 'Master of all.',
      requirements: 'Take an empowerment pill.',
      progress: () => this.characterService.characterState.empowermentFactor > 1 ? 'Complete' : 'Incomplete',
      check: () => {
        return this.characterService.characterState.empowermentFactor > 1;
      },
      effect: () => {
        //TODO: Create a downside to taking empowerment pills, maybe post-Death
      },
      unlocked: false,
    },
    {
      name: 'Habitual User',
      displayName: 'Dope',
      description:
        "You got every last drop you could out of those pills and now you feel nothing from them. At least they didn't kill you or do lasting harm, right?",
      hint: 'D.A.R.E.',
      requirements: 'Reach maximum empowerment factor (1953.65).',
      progress: () => `${this.bigNumberPipe.transform(Math.floor((this.characterService.characterState.empowermentFactor - 1) * 100))} / 95,265 pills`,
      check: () => {
        return this.characterService.characterState.empowermentFactor >= 1953.65;
      },
      effect: () => {
        //TODO: Create a downside to taking HUGE NUMBERS of empowerment pills, maybe in Hell?
      },
      unlocked: false,
    },
    {
      name: 'This Sparks Joy',
      description: 'You used 888 items and unlocked the ' + this.itemRepoService.items['autoUseManual'].name + '!',
      hint: 'Immortals should know the potential of the things they use.',
      requirements: 'Use 888 items.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.inventoryService.lifetimeUsedItems, 888))} / 888 items`,
      check: () => {
        return this.inventoryService.lifetimeUsedItems >= 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoUseManual']);
      },
      unlocked: false,
    },
    {
      name: 'This Does Not Spark Joy',
      description:
        'You filled your entire inventory and unlocked the ' + this.itemRepoService.items['autoSellManual'].name + '!',
      hint: 'So much stuff.',
      requirements: 'Fill your entire inventory.',
      progress: () => `${this.inventoryService.itemStacks.length - this.inventoryService.openInventorySlots()} / ${this.inventoryService.itemStacks.length} slots`,
      check: () => {
        return this.inventoryService.openInventorySlots() === 0;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoSellManual']);
      },
      unlocked: false,
    },
    {
      name: 'Waster',
      description:
        'You threw away 10,000 items and unlocked the ' + this.itemRepoService.items['betterStorageManual'].name + '!',
      hint: 'Too much stuff.',
      requirements: 'Throw away 10,000 items.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.inventoryService.thrownAwayItems, 10000))} / 10,000 items`,
      check: () => {
        return this.inventoryService.thrownAwayItems >= 10000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['betterStorageManual']);
      },
      unlocked: false,
    },
    {
      name: 'Landfill',
      description:
        'You threw away 100,000 items and unlocked the ' + this.itemRepoService.items['evenBetterStorageManual'].name + '!',
      hint: 'Way, way too much stuff.',
      requirements: 'Throw away 100,000 items with max stack size at least 1,000.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.inventoryService.thrownAwayItems, 100000))} / 100,000 items, stack size: ${this.bigNumberPipe.transform(this.inventoryService.maxStackSize)} / 1,000`,
      check: () => {
        return this.inventoryService.maxStackSize >= 1000 && this.inventoryService.thrownAwayItems >= 100000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['evenBetterStorageManual']);
      },
      unlocked: false,
    },
    {
      name: 'Hoarder',
      description:
        'You really love holding vast amounts of materials and unlocked the ' +
        this.itemRepoService.items['bestStorageManual'].name + '!',
      hint: "Just stop already, it's too much. Why would an aspiring immortal need this much?",
      requirements: 'Throw away 1,000,000 items with max stack size at least 10,000.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.inventoryService.thrownAwayItems, 1000000))} / 1,000,000 items, stack size: ${this.bigNumberPipe.transform(this.inventoryService.maxStackSize)} / 10,000`,
      check: () => {
        return this.inventoryService.maxStackSize >= 10000 && this.inventoryService.thrownAwayItems >= 1000000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestStorageManual']);
      },
      unlocked: false,
    },
    {
      name: 'All Things In Moderation',
      hint: 'Immortals know what to use and what to toss.',
      description:
        'You sold and used 8,888 items and unlocked the ' + this.itemRepoService.items['autoBalanceManual'].name + '!',
      requirements: 'Use and sell at least 8,888 items each.',
      progress: () => `Used: ${this.bigNumberPipe.transform(Math.min(this.inventoryService.lifetimeUsedItems, 8888))} / 8,888, Sold: ${this.bigNumberPipe.transform(Math.min(this.inventoryService.lifetimeSoldItems, 8888))} / 8,888`,
      check: () => {
        return this.inventoryService.lifetimeUsedItems >= 8888 && this.inventoryService.lifetimeSoldItems >= 8888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBalanceManual']);
      },
      unlocked: false,
    },
    {
      name: 'Land Rush',
      description:
        'You owned 520 plots of land and unlocked the ' + this.itemRepoService.items['autoBuyLandManual'].name + '!',
      hint: 'Immortals are known for their vast real estate holdings.',
      requirements: 'Own 520 plots of land.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.homeService.land, 520))} / 520 plots`,
      check: () => {
        return this.homeService.land >= 520;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBuyLandManual']);
      },
      unlocked: false,
    },
    {
      name: 'Real Housewives of Immortality',
      description:
        'You acquired a very fine home and unlocked the ' + this.itemRepoService.items['autoBuyHomeManual'].name + '!',
      hint: 'Immortals value a good home.',
      requirements: 'Own a Courtyard House or better.',
      progress: () => `Home level: ${this.homeService.homeValue} / ${HomeType.CourtyardHouse}`,
      check: () => {
        return this.homeService.homeValue >= HomeType.CourtyardHouse;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBuyHomeManual']);
      },
      unlocked: false,
    },
    {
      name: 'Off to Ikea',
      description:
        'You filled all your furniture slots and unlocked the ' +
        this.itemRepoService.items['autoBuyFurnitureManual'].name + '!',
      hint: 'Immortals have discerning taste in furnishings.',
      requirements: 'Fill all furniture slots (bathtub, bed, kitchen, workbench).',
      progress: () => {
        const filled = [this.homeService.furniture.bathtub, this.homeService.furniture.bed, this.homeService.furniture.kitchen, this.homeService.furniture.workbench].filter(f => f !== null).length;
        return `${filled} / 4 furniture slots`;
      },
      check: () => {
        return (
          this.homeService.furniture.bathtub !== null &&
          this.homeService.furniture.bed !== null &&
          this.homeService.furniture.kitchen !== null &&
          this.homeService.furniture.workbench !== null
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBuyFurnitureManual']);
      },
      unlocked: false,
    },
    {
      name: 'Time to Buy a Tractor',
      description: 'You plowed 888 fields and unlocked the ' + this.itemRepoService.items['autoFieldManual'].name + '!',
      hint: 'An aspiring immortal should have vast tracts of fertile land.',
      requirements: 'Plow 888 fields.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.homeService.fields.length + this.homeService.extraFields, 888))} / 888 fields`,
      check: () => {
        return this.homeService.fields.length + this.homeService.extraFields >= 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoFieldManual']);
      },
      unlocked: false,
    },
    {
      name: 'Industrial Revolution',
      description:
        "You've found all the basic autobuyers and unlocked the " +
        this.itemRepoService.items['autoBuyerSettingsManual'].name + '!',
      hint: 'Become really, really lazy',
      requirements: 'Unlock all basic autobuyers (home, land, field, furniture).',
      progress: () => {
        const unlocked = [this.homeService.autoBuyHomeUnlocked, this.homeService.autoBuyLandUnlocked, this.homeService.autoFieldUnlocked, this.homeService.autoBuyFurnitureUnlocked].filter(Boolean).length;
        return `${unlocked} / 4 autobuyers`;
      },
      check: () => {
        return (
          this.homeService.autoBuyHomeUnlocked &&
          this.homeService.autoBuyLandUnlocked &&
          this.homeService.autoFieldUnlocked &&
          this.homeService.autoBuyFurnitureUnlocked
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBuyerSettingsManual']);
      },
      unlocked: false,
    },
    {
      name: 'Guzzler',
      description: 'You drank 88 potions and unlocked the ' + this.itemRepoService.items['autoPotionManual'].name + '!',
      hint: 'Glug, glug, glug.',
      requirements: 'Drink 88 potions.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.inventoryService.lifetimePotionsUsed, 88))} / 88 potions`,
      check: () => {
        return this.inventoryService.lifetimePotionsUsed >= 88;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoPotionManual']);
      },
      unlocked: false,
    },
    {
      name: 'Junkie',
      description: 'You took 131 pills and unlocked the ' + this.itemRepoService.items['autoPillManual'].name + '!',
      hint: 'An aspiring immortal should take the red one. Take it over and over.',
      requirements: 'Take 131 pills.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.inventoryService.lifetimePillsUsed, 131))} / 131 pills`,
      check: () => {
        return this.inventoryService.lifetimePillsUsed >= 131;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoPillManual']);
      },
      unlocked: false,
    },
    {
      name: 'Monster Slayer',
      description: 'You killed 131 monsters and unlocked the ' + this.itemRepoService.items['autoTroubleManual'].name + '!',
      hint: 'An aspiring immortal bravely faces down their foes.',
      requirements: 'Kill 131 monsters.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.battleService.troubleKills, 131))} / 131 kills`,
      check: () => {
        return this.battleService.troubleKills >= 131;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoTroubleManual']);
      },
      unlocked: false,
    },
    {
      name: 'Weapons Master',
      description:
        'You wielded powerful weapons of both metal and wood and unlocked the ' +
        this.itemRepoService.items['autoWeaponMergeManual'].name + '!',
      hint: 'Left and right.',
      requirements: 'Equip weapons with 60+ base damage in both hands.',
      progress: () => {
        const left = this.characterService.characterState.equipment?.leftHand?.weaponStats?.baseDamage || 0;
        const right = this.characterService.characterState.equipment?.rightHand?.weaponStats?.baseDamage || 0;
        return `Left: ${this.bigNumberPipe.transform(left)} / 60, Right: ${this.bigNumberPipe.transform(right)} / 60`;
      },
      check: () => {
        if (
          this.characterService.characterState.equipment?.rightHand?.weaponStats &&
          this.characterService.characterState.equipment?.rightHand?.weaponStats.baseDamage >= 60 &&
          this.characterService.characterState.equipment?.leftHand?.weaponStats &&
          this.characterService.characterState.equipment?.leftHand?.weaponStats.baseDamage >= 60
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoWeaponMergeManual']);
      },
      unlocked: false,
    },
    {
      name: 'Practically Invincible',
      description:
        'You equipped yourself with powerful armor and unlocked the ' +
        this.itemRepoService.items['autoArmorMergeManual'].name + '!',
      hint: 'Suit up.',
      requirements: 'Equip armor with 60+ defense in all slots (head, body, legs, feet).',
      progress: () => {
        const head = this.characterService.characterState.equipment?.head?.armorStats?.defense || 0;
        const body = this.characterService.characterState.equipment?.body?.armorStats?.defense || 0;
        const legs = this.characterService.characterState.equipment?.legs?.armorStats?.defense || 0;
        const feet = this.characterService.characterState.equipment?.feet?.armorStats?.defense || 0;
        return `Head: ${this.bigNumberPipe.transform(head)}, Body: ${this.bigNumberPipe.transform(body)}, Legs: ${this.bigNumberPipe.transform(legs)}, Feet: ${this.bigNumberPipe.transform(feet)} (need 60 each)`;
      },
      check: () => {
        if (
          this.characterService.characterState.equipment?.head?.armorStats &&
          this.characterService.characterState.equipment?.head?.armorStats.defense >= 60 &&
          this.characterService.characterState.equipment?.body?.armorStats &&
          this.characterService.characterState.equipment?.body?.armorStats.defense >= 60 &&
          this.characterService.characterState.equipment?.legs?.armorStats &&
          this.characterService.characterState.equipment?.legs?.armorStats.defense >= 60 &&
          this.characterService.characterState.equipment?.feet?.armorStats &&
          this.characterService.characterState.equipment?.feet?.armorStats.defense >= 60
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoArmorMergeManual']);
      },
      unlocked: false,
    },
    {
      name: 'Gemologist',
      description: 'You acquired 88 gems and unlocked the ' + this.itemRepoService.items['useSpiritGemManual'].name + '!',
      hint: 'Ooh, shiny.',
      requirements: 'Kill more than 88 monsters.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.battleService.troubleKills, 88))} / 88 kills`,
      check: () => {
        return this.battleService.troubleKills > 88;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['useSpiritGemManual']);
      },
      unlocked: false,
    },
    {
      name: 'Ingredient Snob',
      description:
        'You achieved a deep understanding of herbs and unlocked the ' +
        this.itemRepoService.items['bestHerbsManual'].name + '!',
      hint: 'An aspiring immortal should take the red one. Take it over and over.',
      requirements: 'Reach 1,024 in Wood Lore and Water Lore.',
      progress: () => `Wood Lore: ${this.bigNumberPipe.transform(Math.floor(this.characterService.characterState.attributes.woodLore.value))}, Water Lore: ${this.bigNumberPipe.transform(Math.floor(this.characterService.characterState.attributes.waterLore.value))} (need 1,024 each)`,
      check: () => {
        return (
          this.characterService.characterState.attributes.woodLore.value > 1024 &&
          this.characterService.characterState.attributes.waterLore.value > 1024
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestHerbsManual']);
      },
      unlocked: false,
    },
    {
      name: 'Wood Snob',
      description:
        'You achieved a deep understanding of wood and unlocked the ' +
        this.itemRepoService.items['bestWoodManual'].name + '!',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.',
      requirements: 'Reach 1,024 in Wood Lore and Intelligence.',
      progress: () => `Wood Lore: ${this.bigNumberPipe.transform(Math.floor(this.characterService.characterState.attributes.woodLore.value))}, Intelligence: ${this.bigNumberPipe.transform(Math.floor(this.characterService.characterState.attributes.intelligence.value))} (need 1,024 each)`,
      check: () => {
        return (
          this.characterService.characterState.attributes.woodLore.value > 1024 &&
          this.characterService.characterState.attributes.intelligence.value > 1024
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestWoodManual']);
      },
      unlocked: false,
    },
    {
      name: 'Ore Snob',
      displayName: 'Smelting Snob',
      description:
        'You achieved a deep understanding of digging and smelting metal and unlocked the ' +
        this.itemRepoService.items['bestOreManual'].name + '!',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.',
      requirements: 'Reach 1,024 in Metal Lore and Earth Lore.',
      progress: () => `Metal Lore: ${this.bigNumberPipe.transform(Math.floor(this.characterService.characterState.attributes.metalLore.value))}, Earth Lore: ${this.bigNumberPipe.transform(Math.floor(this.characterService.characterState.attributes.earthLore.value))} (need 1,024 each)`,
      check: () => {
        return (
          this.characterService.characterState.attributes.metalLore.value > 1024 &&
          this.characterService.characterState.attributes.earthLore.value > 1024
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestOreManual']);
      },
      unlocked: false,
    },
    {
      name: 'Hide Snob',
      displayName: 'Hunting Snob',
      description:
        'You achieved a deep understanding of hunting and gathering hides and unlocked the ' +
        this.itemRepoService.items['bestHidesManual'].name + '!',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality. Maybe you should try getting good at a few of them.',
      requirements: 'Reach 1,024 in Animal Handling and Speed.',
      progress: () => `Animal Handling: ${this.bigNumberPipe.transform(Math.floor(this.characterService.characterState.attributes.animalHandling.value))}, Speed: ${this.bigNumberPipe.transform(Math.floor(this.characterService.characterState.attributes.speed.value))} (need 1,024 each)`,
      check: () => {
        return (
          this.characterService.characterState.attributes.animalHandling.value > 1024 &&
          this.characterService.characterState.attributes.speed.value > 1024
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestHidesManual']);
      },
      unlocked: false,
    },
    {
      name: 'Gem Snob',
      description: 'You have sold 888 gems and unlocked the ' + this.itemRepoService.items['bestGemsManual'].name + '!',
      hint: 'I hear the market for fine jewelry is so hot right now.',
      requirements: 'Sell 888 gems.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.inventoryService.lifetimeGemsSold, 888))} / 888 gems`,
      check: () => {
        return this.inventoryService.lifetimeGemsSold >= 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestGemsManual']);
      },
      unlocked: false,
    },
    {
      name: 'Unlimited Taels',
      description:
        'Your family has unlocked the secrets of compound interest. You probably never have to worry about money again.',
      hint: 'Family first. Especially in matters of money.',
      requirements: 'Reach Bloodline Rank 4.',
      progress: () => `Bloodline Rank: ${this.characterService.characterState.bloodlineRank} / 4`,
      check: () => {
        return this.characterService.characterState.bloodlineRank >= 4;
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Not Unlimited Taels',
      description:
        "You filled up your purse, your wall safe, the box under your bed, and a giant money pit in the backyard. You just can't hold any more money.",
      hint: 'How rich can you get?',
      requirements: 'Fill your money to maximum capacity.',
      progress: () => `${this.bigNumberPipe.transform(this.characterService.characterState.money)} / ${this.bigNumberPipe.transform(this.characterService.characterState.maxMoney)} taels`,
      check: () => {
        return this.characterService.characterState.money >= this.characterService.characterState.maxMoney - 1e21; //not exactly max in case this gets checked at a bad time
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: "Grandpa's Old Tent",
      description:
        "You've gone through eight cycles of reincarnation and come to understand the value of grandfathers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      requirements: 'Complete more than 8 reincarnation cycles.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.characterService.characterState.totalLives, 8))} / 8 lives`,
      check: () => {
        return this.characterService.characterState.totalLives > 8;
      },
      effect: () => {
        this.homeService.grandfatherTent = true;
      },
      unlocked: false,
    },
    {
      name: 'Paternal Pride',
      description: "You've worked 888 days of odd jobs and come to understand the value of fathers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      requirements: 'Work more than 888 days of odd jobs.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.activityService.oddJobDays, 888))} / 888 days`,
      check: () => {
        return this.activityService.oddJobDays > 888;
      },
      effect: () => {
        this.characterService.fatherGift = true;
      },
      unlocked: false,
    },
    {
      name: 'Maternal Love',
      description: "You've done 888 days of begging and come to understand the value of mothers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      requirements: 'Beg for more than 888 days.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.activityService.beggingDays, 888))} / 888 days`,
      check: () => {
        return this.activityService.beggingDays > 888;
      },
      effect: () => {
        this.inventoryService.motherGift = true;
      },
      unlocked: false,
    },
    {
      name: "Grandma's Stick",
      description: "You've developed spirituality and come to understand the value of grandmothers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      requirements: 'Gain any Spirituality.',
      progress: () => `Spirituality: ${this.bigNumberPipe.transform(Math.floor(this.characterService.characterState.attributes.spirituality.value))}`,
      check: () => {
        return this.characterService.characterState.attributes.spirituality.value > 0;
      },
      effect: () => {
        this.inventoryService.grandmotherGift = true;
      },
      unlocked: false,
    },
    {
      name: 'Weapons Grandmaster',
      description:
        'You wielded epic weapons of both metal and wood and unlocked the ' +
        this.itemRepoService.items['bestWeaponManual'].name + '!',
      hint: 'Power level 10,000!',
      requirements: 'Equip weapons with 8,888+ base damage in both hands.',
      progress: () => {
        const left = this.characterService.characterState.equipment?.leftHand?.weaponStats?.baseDamage || 0;
        const right = this.characterService.characterState.equipment?.rightHand?.weaponStats?.baseDamage || 0;
        return `Left: ${this.bigNumberPipe.transform(left)} / 8,888, Right: ${this.bigNumberPipe.transform(right)} / 8,888`;
      },
      check: () => {
        if (
          this.characterService.characterState.equipment?.rightHand?.weaponStats &&
          this.characterService.characterState.equipment?.rightHand?.weaponStats.baseDamage >= 8888 &&
          this.characterService.characterState.equipment?.leftHand?.weaponStats &&
          this.characterService.characterState.equipment?.leftHand?.weaponStats.baseDamage >= 8888
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestWeaponManual']);
      },
      unlocked: false,
    },
    {
      name: 'Tank!',
      description:
        'You armored yourself with epic defenses and unlocked the ' +
        this.itemRepoService.items['bestArmorManual'].name + '!',
      hint: "Don't hurt me!",
      requirements: 'Equip armor with 8,888+ defense in all slots (head, body, legs, feet).',
      progress: () => {
        const head = this.characterService.characterState.equipment?.head?.armorStats?.defense || 0;
        const body = this.characterService.characterState.equipment?.body?.armorStats?.defense || 0;
        const legs = this.characterService.characterState.equipment?.legs?.armorStats?.defense || 0;
        const feet = this.characterService.characterState.equipment?.feet?.armorStats?.defense || 0;
        return `Head: ${this.bigNumberPipe.transform(head)}, Body: ${this.bigNumberPipe.transform(body)}, Legs: ${this.bigNumberPipe.transform(legs)}, Feet: ${this.bigNumberPipe.transform(feet)} (need 8,888 each)`;
      },
      check: () => {
        if (
          this.characterService.characterState.equipment?.head?.armorStats &&
          this.characterService.characterState.equipment?.head?.armorStats.defense >= 8888 &&
          this.characterService.characterState.equipment?.body?.armorStats &&
          this.characterService.characterState.equipment?.body?.armorStats.defense >= 8888 &&
          this.characterService.characterState.equipment?.legs?.armorStats &&
          this.characterService.characterState.equipment?.legs?.armorStats.defense >= 8888 &&
          this.characterService.characterState.equipment?.feet?.armorStats &&
          this.characterService.characterState.equipment?.feet?.armorStats.defense >= 8888
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestArmorManual']);
      },
      unlocked: false,
    },
    {
      name: 'My Favorite Things',
      description:
        "You've automatically replaced your equipment 888 times and unlocked the " +
        this.itemRepoService.items['slotLockingManual'].name + '!',
      hint: "Just keep playing. I'm sure this will come to a tanky grandmaster aspiring immortal eventually.",
      requirements: 'Automatically replace equipment 888 times.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.inventoryService.lifetimeEquipmentAutoEquipped, 888))} / 888 auto-equips`,
      check: () => {
        return this.inventoryService.lifetimeEquipmentAutoEquipped >= 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['slotLockingManual']);
      },
      unlocked: false,
    },
    {
      name: 'Treasured Masterwork',
      description:
        "You've elevated a treasured piece of equipment to extraordinary heights and unlocked the " +
        this.itemRepoService.items['favoritePriorityManual'].name + '!',
      hint: 'Dedicate yourself to perfecting your most prized possession.',
      requirements: 'Have a favorited item reach Tier 12 (value >= 2,782,559,402).',
      progress: () => {
        let highestFavoriteValue = 0;
        // Check equipped items
        for (const slot of ['head', 'body', 'leftHand', 'rightHand', 'legs', 'feet'] as const) {
          const item = this.characterService.characterState.equipment[slot];
          if (item?.favorite && item.value > highestFavoriteValue) {
            highestFavoriteValue = item.value;
          }
        }
        // Check inventory items
        for (const stack of this.inventoryService.itemStacks) {
          if (stack?.item && 'favorite' in stack.item && (stack.item as { favorite?: boolean }).favorite) {
            if (stack.item.value > highestFavoriteValue) {
              highestFavoriteValue = stack.item.value;
            }
          }
        }
        return `Highest favorited item value: ${this.bigNumberPipe.transform(highestFavoriteValue)} / 2.78B`;
      },
      check: () => {
        const threshold = 2782559402;
        // Check equipped items
        for (const slot of ['head', 'body', 'leftHand', 'rightHand', 'legs', 'feet'] as const) {
          const item = this.characterService.characterState.equipment[slot];
          if (item?.favorite && item.value >= threshold) {
            return true;
          }
        }
        // Check inventory items
        for (const stack of this.inventoryService.itemStacks) {
          if (stack?.item && 'favorite' in stack.item && (stack.item as { favorite?: boolean }).favorite) {
            if (stack.item.value >= threshold) {
              return true;
            }
          }
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['favoritePriorityManual']);
      },
      unlocked: false,
    },
    {
      name: "You're a wizard now.",
      description:
        'Enlightenment! You have achieved a permanent and deep understanding of elemental balance with your high, balanced levels of lore in each of the five elements. Qi is now unlocked for all future lives.',
      hint: 'Seek the balance of the dao.',
      requirements: 'Balance all five elemental lores at 1,000+ (within 21% of each other).',
      progress: () => {
        const fire = Math.floor(this.characterService.characterState.attributes.fireLore.value);
        const earth = Math.floor(this.characterService.characterState.attributes.earthLore.value);
        const wood = Math.floor(this.characterService.characterState.attributes.woodLore.value);
        const water = Math.floor(this.characterService.characterState.attributes.waterLore.value);
        const metal = Math.floor(this.characterService.characterState.attributes.metalLore.value);
        return `Fire: ${this.bigNumberPipe.transform(fire)}, Earth: ${this.bigNumberPipe.transform(earth)}, Wood: ${this.bigNumberPipe.transform(wood)}, Water: ${this.bigNumberPipe.transform(water)}, Metal: ${this.bigNumberPipe.transform(metal)} (need 1,000 each, balanced)`;
      },
      check: () => {
        const fireLore = this.characterService.characterState.attributes.fireLore.value;
        const earthLore = this.characterService.characterState.attributes.earthLore.value;
        const woodLore = this.characterService.characterState.attributes.woodLore.value;
        const waterLore = this.characterService.characterState.attributes.waterLore.value;
        const metalLore = this.characterService.characterState.attributes.metalLore.value; //Reduce the bulk

        const lowValue = Math.min(metalLore, waterLore, woodLore, earthLore, fireLore);
        const highValue = Math.max(metalLore, waterLore, woodLore, earthLore, fireLore);
        return lowValue >= 1000 && highValue <= lowValue * 1.21; // 1.1 * 1.1 = 1.21
      },
      effect: () => {
        this.characterService.characterState.qiUnlocked = true;
        if (this.characterService.characterState.status.qi.max === 0) {
          this.characterService.characterState.status.qi.max = 1;
          this.characterService.characterState.status.qi.value = 1;
        }
        this.activityService.reloadActivities();
      },
      unlocked: false,
    },
    {
      name: 'Sect Leader',
      description: 'You have become powerful enough that you may now start attracting followers.',
      hint: 'Ascension has its privileges.',
      requirements: 'Reach Rank 1 in Soul Core, Meridians, and Bloodline.',
      progress: () => `Soul Core: ${this.characterService.soulCoreRank()}, Meridians: ${this.characterService.meridianRank()}, Bloodline: ${this.characterService.characterState.bloodlineRank} (need 1 each)`,
      check: () => {
        return (
          this.characterService.soulCoreRank() >= 1 &&
          this.characterService.meridianRank() >= 1 &&
          this.characterService.characterState.bloodlineRank >= 1
        );
      },
      effect: () => {
        this.followerService.followersUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: 'Impossible',
      description: 'You have achieved incredible power and are ready to begin taking on impossible tasks.',
      hint: "No one can exceed the limits of humanity. It can't be done.",
      requirements: 'Reach Soul Core Rank 9, Meridian Rank 9, and Bloodline Rank 5.',
      progress: () => `Soul Core: ${this.characterService.soulCoreRank()} / 9, Meridians: ${this.characterService.meridianRank()} / 9, Bloodline: ${this.characterService.characterState.bloodlineRank} / 5`,
      check: () => {
        return (
          this.characterService.soulCoreRank() >= 9 &&
          this.characterService.meridianRank() >= 9 &&
          this.characterService.characterState.bloodlineRank >= 5
        );
      },
      effect: () => {
        this.impossibleTaskService.impossibleTasksUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: 'Eternal Nation',
      description: 'You have established an empire that will never fall, and a bloodline that will always inherit it.',
      hint: 'Bloodline Empire.',
      requirements: 'Own a Capital and reach Bloodline Rank 7.',
      progress: () => `Home: ${this.homeService.home.type} / ${HomeType.Capital}, Bloodline: ${this.characterService.characterState.bloodlineRank} / 7`,
      check: () => {
        return (
          this.homeService.home.type >= HomeType.Capital && this.characterService.characterState.bloodlineRank >= 7
        );
      },
      effect: () => {
        this.characterService.characterState.imperial = true;
      },
      unlocked: false,
    },
    {
      name: 'Limit Breaker',
      description: 'You have broken past human limits and improve constantly! What new fate awaits you?',
      hint: '999',
      requirements: 'Reach Bloodline Rank 9.',
      progress: () => `Bloodline Rank: ${this.characterService.characterState.bloodlineRank} / 9`,
      check: () => {
        return this.characterService.characterState.bloodlineRank >= 9;
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Harmony of Mind and Body',
      description:
        'You have balanced your powerful mind and body and unlocked the ability to use your qi to strike down your enemies.',
      hint: 'The dao embraces all things in perfect harmony.',
      requirements: 'Balance all five basic attributes at 1,000,000+ (within 21% of each other).',
      progress: () => {
        const str = Math.floor(this.characterService.characterState.attributes.strength.value);
        const spd = Math.floor(this.characterService.characterState.attributes.speed.value);
        const tgh = Math.floor(this.characterService.characterState.attributes.toughness.value);
        const chr = Math.floor(this.characterService.characterState.attributes.charisma.value);
        const int = Math.floor(this.characterService.characterState.attributes.intelligence.value);
        return `Str: ${this.bigNumberPipe.transform(str)}, Spd: ${this.bigNumberPipe.transform(spd)}, Tgh: ${this.bigNumberPipe.transform(tgh)}, Chr: ${this.bigNumberPipe.transform(chr)}, Int: ${this.bigNumberPipe.transform(int)} (need 1M each, balanced)`;
      },
      check: () => {
        const speed = this.characterService.characterState.attributes.speed.value;
        const toughness = this.characterService.characterState.attributes.toughness.value;
        const charisma = this.characterService.characterState.attributes.charisma.value;
        const intelligence = this.characterService.characterState.attributes.intelligence.value;
        const strength = this.characterService.characterState.attributes.strength.value; //Reduce the bulk

        const lowValue = Math.min(speed, toughness, charisma, intelligence, strength);
        const highValue = Math.max(speed, toughness, charisma, intelligence, strength);
        return lowValue >= 1000000 && highValue <= lowValue * 1.21; // 1.1 * 1.1 = 1.21
      },
      effect: () => {
        this.battleService.qiAttackUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: 'Unity of Spirit, Mind, and Body',
      description:
        'You have balanced your powerful spirit with your mind and body. You unlocked the ability to use your qi to protect yourself.',
      hint: 'The dao embraces all things in perfect harmony.',
      requirements: 'Balance all five basic attributes plus Spirituality at 1,000,000+ (within 21% of each other).',
      progress: () => {
        const spi = Math.floor(this.characterService.characterState.attributes.spirituality.value);
        const str = Math.floor(this.characterService.characterState.attributes.strength.value);
        const spd = Math.floor(this.characterService.characterState.attributes.speed.value);
        const tgh = Math.floor(this.characterService.characterState.attributes.toughness.value);
        const chr = Math.floor(this.characterService.characterState.attributes.charisma.value);
        const int = Math.floor(this.characterService.characterState.attributes.intelligence.value);
        return `Spi: ${this.bigNumberPipe.transform(spi)}, Str: ${this.bigNumberPipe.transform(str)}, Spd: ${this.bigNumberPipe.transform(spd)}, Tgh: ${this.bigNumberPipe.transform(tgh)}, Chr: ${this.bigNumberPipe.transform(chr)}, Int: ${this.bigNumberPipe.transform(int)} (need 1M each, balanced)`;
      },
      check: () => {
        const spirituality = this.characterService.characterState.attributes.spirituality.value;
        const speed = this.characterService.characterState.attributes.speed.value;
        const toughness = this.characterService.characterState.attributes.toughness.value;
        const charisma = this.characterService.characterState.attributes.charisma.value;
        const intelligence = this.characterService.characterState.attributes.intelligence.value;
        const strength = this.characterService.characterState.attributes.strength.value; //Reduce the bulk

        const lowValue = Math.min(speed, toughness, charisma, intelligence, strength, spirituality);
        const highValue = Math.max(speed, toughness, charisma, intelligence, strength, spirituality);
        return lowValue >= 1000000 && highValue <= lowValue * 1.21; // 1.1 * 1.1 = 1.21
      },
      effect: () => {
        this.battleService.qiShieldUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: 'Disposable Followers',
      description:
        'You have recruited so many people you can now freely dismiss followers using the ' +
        this.itemRepoService.items['followerAutoDismissManual'].name + '!',
      hint: 'The One Hundred Companions.',
      requirements: 'Recruit 100 followers.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.followerService.totalRecruited, 100))} / 100 followers`,
      check: () => {
        return this.followerService.totalRecruited >= 100;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['followerAutoDismissManual']);
      },
      unlocked: false,
    },
    {
      name: 'Loyal Followers',
      description:
        "One of your followers has trained under you so long they have nothing else to learn. In an epiphany you realized how to double your new followers' lifespan.",
      hint: 'Endless training.',
      requirements: 'Train a follower to level 100.',
      progress: () => `Highest level: ${this.bigNumberPipe.transform(this.followerService.highestLevel)} / 100`,
      check: () => {
        return this.followerService.highestLevel >= 100;
      },
      effect: () => {
        this.followerService.followerLifespanDoubled = true;
      },
      unlocked: false,
    },
    {
      name: 'Ascension',
      description: 'You have developed enough spirituality to ascend.',
      hint: 'Only with spiritual development can you ascend to higher states.',
      requirements: 'Reach 10 Spirituality.',
      progress: () => `Spirituality: ${this.bigNumberPipe.transform(Math.floor(this.characterService.characterState.attributes.spirituality.value))} / 10`,
      check: () => {
        return this.characterService.characterState.attributes.spirituality.value >= 10;
      },
      effect: () => {
        this.characterService.characterState.ascensionUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: "I don't want to go.",
      description:
        'You have lived many lives and unlocked the ' + this.itemRepoService.items['autoPauseSettingsManual'].name + '!',
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      requirements: 'Complete 48 lives and play for 50 years total.',
      progress: () => `Lives: ${this.bigNumberPipe.transform(this.characterService.characterState.totalLives)} / 48, Days: ${this.bigNumberPipe.transform(this.mainLoopService.totalTicks)} / 18,250`,
      check: () => {
        return this.characterService.characterState.totalLives >= 48 && this.mainLoopService.totalTicks > 18250;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoPauseSettingsManual']);
      },
      unlocked: false,
    },
    {
      name: 'Breaks are Good',
      description:
        "You have collected two hour's worth of offline ticks and unlocked the " +
        this.itemRepoService.items['bankedTicksEfficiencyManual'].name + '!',
      hint: 'Take a day off from cultivating.', //it takes 20h to get
      requirements: 'Bank 2 hours worth of offline ticks.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.mainLoopService.bankedTicks, 288000))} / 288,000 ticks`,
      check: () => {
        return this.mainLoopService.bankedTicks > 2 * 60 * 60 * 40; //there are 40 ticks a second
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bankedTicksEfficiencyManual']);
      },
      unlocked: false,
    },
    {
      name: 'Breaks are Bad',
      description:
        'You died from overwork performing an activity without necessary rest and unlocked the ' +
        this.itemRepoService.items['autoRestManual'].name + '!',
      hint: "There's no time to rest, cultivating is life.",
      requirements: 'Die from overwork or become immortal.',
      progress: () => this.activityService.activityDeath || this.characterService.characterState.immortal ? 'Complete' : 'Incomplete',
      check: () => {
        return this.activityService.activityDeath || this.characterService.characterState.immortal;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoRestManual']);
      },
      unlocked: false,
    },
    {
      name: 'Still Spry',
      description:
        'You have lived to be 300 years old and unlocked the ' + this.itemRepoService.items['ageSpeedManual'].name + '!',
      hint: 'One step to becoming immortal is to live longer.',
      requirements: 'Live to 300 years old in a single life.',
      progress: () => `Age: ${this.bigNumberPipe.transform(Math.floor(this.characterService.characterState.age / 365))} / 300 years`,
      check: () => {
        return this.characterService.characterState.age > 300 * 365;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['ageSpeedManual']);
      },
      unlocked: false,
    },
    {
      name: 'Immortality',
      description: 'Congratulations! You are now immortal.',
      hint: 'Name of the game.',
      requirements: 'Achieve immortality.',
      progress: () => this.characterService.characterState.immortal ? 'Complete' : 'Incomplete',
      check: () => {
        return this.characterService.characterState.immortal;
      },
      effect: () => {
        this.activityService.reloadActivities();
      },
      unlocked: false,
    },
    {
      name: 'Headhunter',
      description: "You've sorted through so many applicants that you can now always find followers you want.",
      hint: "You didn't really want one thousand scouts, did you?",
      requirements: 'Dismiss more than 888 followers.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.followerService.totalDismissed, 888))} / 888 dismissed`,
      check: () => {
        return this.followerService.totalDismissed > 888;
      },
      effect: () => {
        this.followerService.onlyWantedFollowers = true;
      },
      unlocked: false,
    },
    {
      name: 'Yes We Can!',
      description: 'You found him.',
      hint: 'Can we fix it?',
      requirements: 'Recruit a builder named Robert or Bob.',
      progress: () => {
        for (const follower of this.followerService.followers) {
          if ((follower.name === 'Robert' || follower.name === 'Bob') && follower.job === 'builder') {
            return 'Complete';
          }
        }
        return 'Incomplete';
      },
      check: () => {
        for (const follower of this.followerService.followers) {
          if ((follower.name === 'Robert' || follower.name === 'Bob') && follower.job === 'builder') {
            return true;
          }
        }
        return false;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: "Don't mess with Grandma",
      description: 'You have crafted the mightiest stick. Grandmother would be so proud.',
      hint: 'The best stick.',
      requirements: "Upgrade Grandmother's Walking Stick to 1 billion+ base damage.",
      progress: () => {
        const stick = this.characterService.characterState.equipment.leftHand;
        if (stick?.name === "Grandmother's Walking Stick") {
          return `Stick damage: ${this.bigNumberPipe.transform(stick.weaponStats?.baseDamage || 0)} / 1,000,000,000`;
        }
        return 'Equip the stick first';
      },
      check: () => {
        if (this.characterService.characterState.equipment.leftHand?.name === "Grandmother's Walking Stick") {
          if ((this.characterService.characterState.equipment.leftHand.weaponStats?.baseDamage || 0) > 1e9) {
            return true;
          }
        }
        return false;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: 'Smooth Farming',
      description:
        'You have harvested crops every day for months and can now count on more regular and reliable harvests.',
      hint: "When starting your garden, it's best to work a little every day.",
      requirements: 'Harvest crops for 60 consecutive days.',
      progress: () => `${this.bigNumberPipe.transform(Math.min(this.homeService.consecutiveHarvests, 60))} / 60 consecutive days`,
      check: () => {
        return this.homeService.consecutiveHarvests >= 60;
      },
      effect: () => {
        this.homeService.smoothFarming = true;
      },
      unlocked: false,
    },
    {
      name: "They're Great",
      description: 'You have made a friend who can provide you with a tasty breakfast.',
      hint: "You'll need to find a very special pet.",
      requirements: 'Recruit a tiger named Tony or Antonio.',
      progress: () => {
        for (const follower of this.followerService.followers) {
          if ((follower.name === 'Tony' || follower.name === 'Antonio') && follower.job === 'tiger') {
            return 'Complete';
          }
        }
        return 'Incomplete';
      },
      check: () => {
        for (const follower of this.followerService.followers) {
          if ((follower.name === 'Tony' || follower.name === 'Antonio') && follower.job === 'tiger') {
            return true;
          }
        }
        return false;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: 'Let It Burn',
      description: 'You have burned an insane amount of money.',
      hint: "You didn't want that money anyway.",
      requirements: 'Burn more than 1 billion taels in Hell.',
      progress: () => `${this.bigNumberPipe.transform(this.hellService.burnedMoney)} / 1B taels`,
      check: () => {
        return this.hellService.burnedMoney > 1e9;
      },
      effect: () => {
        this.hellService.fasterHellMoney = true;
      },
      unlocked: false,
    },
  ];

  unlockAchievement(achievement: Achievement, newAchievement: boolean) {
    if (newAchievement) {
      this.unlockedAchievements.push(achievement.name);
      this.logService.log(LogTopic.STORY, achievement.description);
      // check if gameStateService is injected yet, if not, inject it (circular dependency issues)
      if (!this.gameStateService) {
        this.gameStateService = this.injector.get(GameStateService);
      }
      this.gameStateService.savetoLocalStorage();
      this.characterService.toast(
        'Achievement Unlocked: ' + (achievement.displayName ? achievement.displayName : achievement.name)
      );
    }
    achievement.effect();
    achievement.unlocked = true;
  }

  getProperties(): AchievementProperties {
    return {
      unlockedAchievements: this.unlockedAchievements,
    };
  }

  setProperties(properties: AchievementProperties) {
    this.unlockedAchievements = properties.unlockedAchievements || [];
    for (const achievement of this.achievements) {
      if (this.unlockedAchievements.includes(achievement.name)) {
        this.unlockAchievement(achievement, false);
      }
    }
  }
}
