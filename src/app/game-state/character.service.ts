import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import {
  Character,
  AttributeType,
  DAYS_PER_LIFESPAN_BONUS,
  MAX_BASE_LIFESPAN_YEARS,
  STARVATION_DAMAGE_PERCENT,
  STARVATION_DAMAGE_MIN,
  STARVATION_SPIRITUALITY_GAIN,
  NOURISHMENT_DAILY_COST,
} from './character';
import { ActivityService } from './activity.service';
import { Subscription } from 'rxjs';
import { BigNumberPipe } from '../app.component';
import { HellLevel, HellService } from './hell.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CamelToTitlePipe } from '../app.component';

@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  camelToTitlePipe = new CamelToTitlePipe();
  bigNumberPipe: BigNumberPipe;
  activityService?: ActivityService;
  characterState: Character;
  forceRebirth = false;
  fatherGift = false;
  lifespanTooltip = '';
  lifespanHeader = '';
  lifespanFactors: { label: string; tooltip: string }[] = [];
  deathSubscriber?: Subscription;
  hellService?: HellService;
  private snackBar: MatSnackBar;
  private snackBarObservable?: Subscription;

  constructor(
    private injector: Injector,
    private mainLoopService: MainLoopService,
    private logService: LogService,
    private reincarnationService: ReincarnationService,
    public dialog: MatDialog
  ) {
    setTimeout(() => (this.hellService = this.injector.get(HellService)));
    this.snackBar = this.injector.get(MatSnackBar);
    this.bigNumberPipe = this.injector.get(BigNumberPipe);
    this.characterState = new Character(logService, this.camelToTitlePipe, this.bigNumberPipe, mainLoopService, dialog);

    let prevTotalTicks = this.mainLoopService.totalTicks;
    mainLoopService.longTickSubject.subscribe(elapsedDays => {
      const currentTotalTicks = this.mainLoopService.totalTicks;

      let extraDays = Math.floor(elapsedDays / DAYS_PER_LIFESPAN_BONUS);
      if (prevTotalTicks % DAYS_PER_LIFESPAN_BONUS > currentTotalTicks % DAYS_PER_LIFESPAN_BONUS) {
        extraDays++;
      }

      if (extraDays > 0) {
        this.characterState.increaseBaseLifespan(extraDays, MAX_BASE_LIFESPAN_YEARS);
      }

      prevTotalTicks = currentTotalTicks;
    });

    mainLoopService.tickSubject.subscribe(() => {
      if (!this.characterState.dead) {
        this.characterState.age++;
        this.characterState.status.nourishment.value -= NOURISHMENT_DAILY_COST;
      }
      // check for death
      let deathMessage = '';
      if (this.forceRebirth) {
        deathMessage = 'You release your soul from your body at the age of ' + this.formatDays(this.characterState.age) + '.';
      } else if (this.characterState.age >= this.characterState.lifespan && !this.characterState.immortal) {
        deathMessage =
          'You reach the end of your natural life and pass away from natural causes at the age of ' +
          this.formatDays(this.characterState.age) +
          '.';
      } else if (this.characterState.status.nourishment.value <= 0) {
        this.characterState.status.nourishment.value = 0;
        if (this.characterState.attributes.spirituality.value > 0) {
          // you're spiritual now, you can fast!
          const starvationDamage = Math.max(
            this.characterState.status.health.value * STARVATION_DAMAGE_PERCENT,
            STARVATION_DAMAGE_MIN
          );
          this.logService.injury(
            LogTopic.DAMAGE,
            'You take ' + this.bigNumberPipe.transform(starvationDamage) + ' damage from starvation.'
          );
          this.characterState.status.health.value -= starvationDamage;
          if (this.characterState.status.health.value < 0) {
            this.characterState.status.health.value = 0;
          }
          this.characterState.increaseAttribute('spirituality', STARVATION_SPIRITUALITY_GAIN);
          if (this.characterState.status.health.value <= 0) {
            if (!this.characterState.immortal) {
              deathMessage = 'You starve to death at the age of ' + this.formatDays(this.characterState.age) + '.';
            } else if (this.hellService?.inHell) {
              this.hellService.beaten = true;
            }
          }
        } else if (!this.characterState.immortal) {
          deathMessage = 'You starve to death at the age of ' + this.formatDays(this.characterState.age) + '.';
        }
      } else if (this.characterState.status.health.value <= 0 && !this.characterState.immortal) {
        if (!this.activityService) {
          this.activityService = this.injector.get(ActivityService);
        }
        if (this.activityService.activityDeath) {
          deathMessage = 'You die from overwork at the age of ' + this.formatDays(this.characterState.age) + '.';
        } else {
          deathMessage = 'You succumb to your wounds and die at the age of ' + this.formatDays(this.characterState.age) + '.';
        }
      } else if (this.characterState.immortal && this.characterState.status.health.value < 0) {
        this.characterState.status.health.value = 0;
      }
      if (deathMessage !== '') {
        if (!this.characterState.immortal) {
          this.logService.injury(LogTopic.DEATH, deathMessage);
          if (!this.forceRebirth) {
            this.logService.injury(
              LogTopic.DEATH,
              "You have failed to achieve immortality and your life has ended. Don't worry, I'm sure you'll achieve immortality in your next life."
            );
          }
        }
        this.characterState.dead = true;
        if (!this.characterState.showLifeSummary) {
          this.toast('A new life begins.');
        }
        this.characterState.reincarnate(deathMessage); // make sure character reincarnation fires before other things reset
        this.reincarnationService.reincarnate();
        // Revive the character in the next tick update for making sure that everything is stopped.
        this.deathSubscriber = this.mainLoopService.tickSubject.subscribe(() => {
          this.characterState.dead = false;
          this.deathSubscriber?.unsubscribe();
        });
        this.forceRebirth = false;
        if (this.characterState.immortal) {
          this.logService.log(
            LogTopic.MILESTONE,
            'You are born anew, still an immortal but with the fresh vigor of youth.'
          );
        } else {
          this.logService.log(
            LogTopic.MILESTONE,
            'Congratulations! The cycle of reincarnation has brought you back into the world. You have been born again. You are certain that lucky life number ' +
              this.characterState.totalLives +
              ' will be the one.'
          );
          this.logService.log(
            LogTopic.MILESTONE,
            "It takes you a few years to grow up and remember your purpose: to become an immortal. You're all grown up now, so get to it!"
          );
        }
      }
    });

    mainLoopService.longTickSubject.subscribe(() => {
      if (this.characterState.highestMoney < this.characterState.money) {
        this.characterState.highestMoney = this.characterState.money;
      }
      if (this.characterState.highestAge < this.characterState.age) {
        this.characterState.highestAge = this.characterState.age;
      }
      if (this.characterState.highestHealth < this.characterState.status.health.value) {
        this.characterState.highestHealth = this.characterState.status.health.value;
      }
      if (this.characterState.highestStamina < this.characterState.status.stamina.value) {
        this.characterState.highestStamina = this.characterState.status.stamina.value;
      }
      if (this.characterState.highestQi < this.characterState.status.qi.value) {
        this.characterState.highestQi = this.characterState.status.qi.value;
      }

      if (this.characterState.dead) {
        return;
      }
      this.characterState.recalculateDerivedStats();
      if (
        this.hellService?.inHell &&
        this.hellService.currentHell === HellLevel.CrushingBoulder &&
        !this.hellService.completedHellTasks.includes(HellLevel.CrushingBoulder)
      ) {
        this.characterState.attackPower = 1;
      }
      this.setLifespanTooltip();
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      if (this.fatherGift && this.characterState.bloodlineRank < 6) {
        // Skip the family gifts, it's not thematic.
        this.logService.log(
          LogTopic.MILESTONE,
          'Your father puts some coins in your purse before sending you on your way.'
        );
        this.characterState.updateMoney(200);
      }
    });
  }

  formatDays(ageInDays: number, format: 'short' | 'long' | 'years' | 'y' = 'short'): string {
    // 'years' and 'y' format: decimal years (for lifespan bonuses)
    if (format === 'years' || format === 'y') {
      const suffix = format === 'y' ? 'y' : ' years';
      if (ageInDays < 1) {
        return '0' + suffix;
      }
      const years = ageInDays / 365;
      if (years >= 1000) {
        return this.bigNumberPipe.transform(years) + suffix;
      }
      // Don't show .0 or .00 decimal
      const formatted = years.toFixed(2);
      if (formatted.endsWith('.00')) {
        return formatted.slice(0, -3) + suffix;
      }
      if (formatted.endsWith('0')) {
        return formatted.slice(0, -1) + suffix;
      }
      return formatted + suffix;
    }

    // 'short' and 'long' formats: years + days
    const years = Math.floor(ageInDays / 365);
    const days = Math.floor(ageInDays % 365);

    // Hide days if 0 or after 10,000 years
    if (days === 0 || years >= 10000) {
      return `${years.toLocaleString()} years`;
    }

    // For 'long' format, skip "0 years"
    if (format === 'long') {
      if (years === 0) {
        return `${days.toLocaleString()} days`;
      }
      return `${years.toLocaleString()} years and ${days.toLocaleString()} days`;
    }

    // 'short' format: skip "0 years"
    if (years === 0) {
      return `${days.toLocaleString()} days`;
    }
    return `${years.toLocaleString()} years, ${days.toLocaleString()} days`;
  }

  setLifespanTooltip() {
    if (
      this.characterState.foodLifespan +
        this.characterState.alchemyLifespan +
        this.characterState.statLifespan +
        this.characterState.spiritualityLifespan +
        this.characterState.magicLifespan <=
      0
    ) {
      this.lifespanHeader = 'You have done nothing to extend your lifespan.';
      this.lifespanFactors = [];
      this.lifespanTooltip = this.lifespanHeader;
      return;
    }
    if (this.characterState.immortal) {
      this.lifespanHeader =
        'You are immortal. If you had remained mortal, your base lifespan of ' +
        this.formatDays(this.characterState.baseLifespan, 'years') +
        ' would be extended by:';
    } else {
      this.lifespanHeader = 'Your base lifespan of ' + this.formatDays(this.characterState.baseLifespan, 'years') + ' is extended by:';
    }
    const factors: { label: string; tooltip: string }[] = [];
    if (this.characterState.foodLifespan > 0) {
      factors.push({
        label: 'Healthy Food: ' + this.formatDays(this.characterState.foodLifespan, 'years'),
        tooltip: 'Eating healthy crops increases lifespan.\n\nTotal bonus: ' + this.formatDays(this.characterState.foodLifespan, 'years'),
      });
    }
    if (this.characterState.alchemyLifespan > 0) {
      factors.push({
        label: 'Alchemy: ' + this.formatDays(this.characterState.alchemyLifespan, 'years'),
        tooltip: 'Consuming alchemical pills increases lifespan.\n\nTotal bonus: ' + this.formatDays(this.characterState.alchemyLifespan, 'years'),
      });
    }
    if (this.characterState.statLifespan > 0) {
      factors.push({
        label: 'Basic Attributes: ' + this.formatDays(this.characterState.statLifespan, 'years'),
        tooltip: this.getStatLifespanTooltip(),
      });
    }
    if (this.characterState.magicLifespan > 0) {
      factors.push({
        label: 'Cultivation: ' + this.formatDays(this.characterState.magicLifespan, 'years'),
        tooltip: this.getCultivationLifespanTooltip(),
      });
    }
    if (this.characterState.spiritualityLifespan > 0) {
      factors.push({
        label: 'Spirituality: ' + this.formatDays(this.characterState.spiritualityLifespan, 'years'),
        tooltip: this.getSpiritualityLifespanTooltip(),
      });
    }
    this.lifespanFactors = factors;
    // Keep legacy tooltip for backward compatibility
    let tooltip = this.lifespanHeader;
    for (let i = 0; i < factors.length; i++) {
      if (i % 3 === 0) {
        tooltip += '\n' + factors[i].label;
      } else {
        tooltip += ' | ' + factors[i].label;
      }
    }
    this.lifespanTooltip = tooltip;
  }

  getStatLifespanTooltip(): string {
    const attrs = this.characterState.attributes;
    const totalAptitude =
      attrs.strength.aptitude +
      attrs.toughness.aptitude +
      attrs.speed.aptitude +
      attrs.intelligence.aptitude +
      attrs.charisma.aptitude;
    const avgAptitude = totalAptitude / 5;
    const multiplier = this.characterState.bloodlineRank < 5 ? 0.1 : 5;

    const lines: string[] = [
      'Basic Attributes',
      '',
      'Lifespan bonus based on average aptitude.',
      '',
      'Aptitudes:',
      `  Str ${this.bigNumberPipe.transform(attrs.strength.aptitude)} + Tou ${this.bigNumberPipe.transform(attrs.toughness.aptitude)} + Spd ${this.bigNumberPipe.transform(attrs.speed.aptitude)} + Int ${this.bigNumberPipe.transform(attrs.intelligence.aptitude)} + Cha ${this.bigNumberPipe.transform(attrs.charisma.aptitude)}`,
      `  = ${this.bigNumberPipe.transform(totalAptitude)} total ÷ 5 = ${this.bigNumberPipe.transform(avgAptitude)} avg`,
      '',
      ...this.getAptitudeMultiplierBreakdown(avgAptitude, false),
      '',
      `Bloodline multiplier: ×${multiplier} (${this.characterState.bloodlineRank < 5 ? 'rank < 5: ×0.1' : 'rank ≥ 5: ×5'})`,
      `Final: ${this.formatDays(this.characterState.statLifespan, 'years')}`,
    ];
    return lines.join('\n');
  }

  getSpiritualityLifespanTooltip(): string {
    const spirValue = this.characterState.attributes.spirituality.value;

    const lines: string[] = [
      'Spirituality',
      '',
      'Lifespan bonus based on spirituality value.',
      '',
      `Spirituality: ${this.bigNumberPipe.transform(spirValue)}`,
      '',
      ...this.getAptitudeMultiplierBreakdown(spirValue, true),
      '',
      `Spirituality multiplier: ×5 (fixed)`,
      `Final: ${this.formatDays(this.characterState.spiritualityLifespan, 'years')}`,
    ];
    return lines.join('\n');
  }

  private getAptitudeMultiplierBreakdown(value: number, noEmpowerment: boolean): string[] {
    const state = this.characterState;
    const limit = state.attributeScalingLimit;
    const softCap = state.attributeSoftCap;
    const empMult = noEmpowerment ? 1 : state.empowermentMult;
    const lines: string[] = [];

    // Determine which tier and show the formula
    let x: number;
    let tierName: string;
    let formula: string;

    if (value < limit) {
      tierName = 'Linear (below scaling limit)';
      x = value;
      formula = `${this.bigNumberPipe.transform(value)}`;
    } else if (value < limit * 10) {
      tierName = 'Reduced (1/4 rate)';
      const excess = value - limit;
      x = limit + excess / 4;
      formula = `${this.bigNumberPipe.transform(limit)} + (${this.bigNumberPipe.transform(value)} - ${this.bigNumberPipe.transform(limit)}) ÷ 4 = ${this.bigNumberPipe.transform(x)}`;
    } else if (value < limit * 100) {
      tierName = 'Reduced (1/20 rate)';
      const tier1 = limit;
      const tier2 = (limit * 9) / 4;
      const excess = (value - limit * 10) / 20;
      x = tier1 + tier2 + excess;
      formula = `${this.bigNumberPipe.transform(tier1)} + ${this.bigNumberPipe.transform(tier2)} + (${this.bigNumberPipe.transform(value)} - ${this.bigNumberPipe.transform(limit * 10)}) ÷ 20 = ${this.bigNumberPipe.transform(x)}`;
    } else if (value <= softCap) {
      tierName = 'Reduced (1/100 rate)';
      const tier1 = limit;
      const tier2 = (limit * 9) / 4;
      const tier3 = (limit * 90) / 20;
      const excess = (value - limit * 100) / 100;
      x = tier1 + tier2 + tier3 + excess;
      formula = `${this.bigNumberPipe.transform(tier1)} + ${this.bigNumberPipe.transform(tier2)} + ${this.bigNumberPipe.transform(tier3)} + (${this.bigNumberPipe.transform(value)} - ${this.bigNumberPipe.transform(limit * 100)}) ÷ 100 = ${this.bigNumberPipe.transform(x)}`;
    } else {
      tierName = 'Soft-capped (sqrt)';
      const d = limit + (limit * 9) / 4 + (limit * 90) / 20 + (softCap - limit * 100) / 100;
      const sqrtFactor = Math.pow(limit / 1e13, 0.15);
      const inner = (value - softCap) * sqrtFactor;
      x = Math.pow(inner, 0.5) + d;
      formula = `√((${this.bigNumberPipe.transform(value)} - ${this.bigNumberPipe.transform(softCap)}) × ${sqrtFactor.toFixed(6)}) + ${this.bigNumberPipe.transform(d)} = √(${this.bigNumberPipe.transform(inner)}) + ${this.bigNumberPipe.transform(d)} = ${this.bigNumberPipe.transform(x)}`;
    }

    lines.push(`Tier: ${tierName}`);
    const meridianRank = Math.log10(state.reinforceMeridiansCost / state.reinforceMeridiansOriginalCost);
    lines.push(`Scaling limit: ${this.bigNumberPipe.transform(limit)} (10 × 2^${meridianRank} from Meridians)`);
    lines.push(`Calculation: ${formula}`);

    // Empowerment
    if (!noEmpowerment && empMult !== 1) {
      const afterEmp = x * empMult;
      lines.push(`Empowerment: × ${empMult.toFixed(3)} = ${this.bigNumberPipe.transform(afterEmp)}`);
      x = afterEmp;
    }

    // Hardcap (if bloodlineRank < 8)
    if (state.bloodlineRank < 8) {
      let c = 365000;
      if (state.yinYangUnlocked) {
        const balance = Math.max(1 - Math.abs(state.yang - state.yin) / ((state.yang + state.yin) / 2), 0);
        c += balance * c;
      }
      const hardcapped = c / (-1 - Math.log((x + c) / c)) + c;
      lines.push(`Hardcap applied: ${this.bigNumberPipe.transform(x)} → ${this.bigNumberPipe.transform(hardcapped)}`);
      x = hardcapped;
    }

    lines.push(`Base bonus: ${this.formatDays(x, 'years')}`);
    return lines;
  }

  getCultivationLifespanTooltip(): string {
    const sources = this.characterState.cultivationLifespanSources;
    const sourceNames = Object.keys(sources);
    const total = this.characterState.getCultivationLifespan();

    const lines: string[] = [
      'Cultivation',
      '',
      'Lifespan bonus from cultivation activities.',
      '',
    ];

    if (sourceNames.length === 0) {
      lines.push('No sources yet.');
    } else {
      lines.push('Sources:');
      for (const name of sourceNames) {
        lines.push(`• ${name}: ${this.formatDays(sources[name], 'years')}`);
      }
      lines.push('');
      lines.push(`Total: ${this.formatDays(total, 'years')}`);
    }

    return lines.join('\n');
  }


  resetAptitudes() {
    const keys = Object.keys(this.characterState.attributes) as AttributeType[];
    for (const key in keys) {
      const attribute = this.characterState.attributes[keys[key]];
      attribute.lifeStartValue = 0;
      attribute.aptitude = 1 + attribute.aptitude / this.characterState.aptitudeGainDivider; // keep up to 20% of aptitudes after Ascension
      if (parseInt(key) < 5) {
        attribute.value = 1;
      } else {
        attribute.value = 0;
      }
    }
    if (!this.activityService) {
      this.activityService = this.injector.get(ActivityService);
    }
    this.activityService.reloadActivities();
    this.activityService.activityLoop.splice(0, this.activityService.activityLoop.length);
    this.forceRebirth = true;
    this.mainLoopService.tick();
  }

  condenseSoulCore() {
    if (this.characterState.aptitudeGainDivider <= 5) {
      // double check we're not going over the max rank
      return;
    }
    this.logService.log(
      LogTopic.MILESTONE,
      'Your spirituality coelesces around the core of your soul, strengthening it and reforging it into something stronger.'
    );
    this.logService.log(LogTopic.MILESTONE, 'You now gain additional aptitude each time you reincarnate.');
    this.characterState.condenseSoulCoreCost *= 10;
    this.characterState.aptitudeGainDivider /= 1.5;
    this.resetAptitudes();
  }

  soulCoreRank(): number {
    return Math.log10(this.characterState.condenseSoulCoreCost / this.characterState.condenseSoulCoreOriginalCost); // Log base 10 because the cost is multiplied by 10 per rank.
  }

  reinforceMeridians() {
    if (this.characterState.attributeScalingLimit >= 10240) {
      // double check we're not going over the max rank
      return;
    }
    this.logService.log(
      LogTopic.MILESTONE,
      'The pathways that carry your chi through your body have been strengthened and reinforced.'
    );
    this.logService.log(LogTopic.MILESTONE, 'Your aptitudes can now give you a greater increase when gaining attributes.');

    this.characterState.reinforceMeridiansCost *= 10;
    this.characterState.attributeScalingLimit *= 2;
    this.resetAptitudes();
  }

  meridianRank(): number {
    return Math.log10(this.characterState.reinforceMeridiansCost / this.characterState.reinforceMeridiansOriginalCost); // Log base 10 because the cost is multiplied by 10 per rank.
  }

  upgradeBloodline() {
    if (this.characterState.bloodlineRank >= 9) {
      // double check we're not going over the max rank
      return;
    }
    this.logService.log(
      LogTopic.MILESTONE,
      'You sacrifice your current life to strengthen a permanent bloodline that will pass on to all of your descendants.'
    );
    this.logService.log(
      LogTopic.MILESTONE,
      'You will be reborn into your own family line and reap greater benefits from your previous lives.'
    );
    this.characterState.bloodlineCost *= 100;
    this.characterState.bloodlineRank++;
    this.resetAptitudes();
  }

  stashWeapons() {
    this.characterState.stashedEquipment.rightHand = this.characterState.equipment.rightHand;
    this.characterState.stashedEquipment.leftHand = this.characterState.equipment.leftHand;
    this.characterState.equipment.rightHand = null;
    this.characterState.equipment.leftHand = null;
  }

  restoreWeapons() {
    this.characterState.equipment.rightHand = this.characterState.stashedEquipment.rightHand;
    this.characterState.equipment.leftHand = this.characterState.stashedEquipment.leftHand;
    this.characterState.stashedEquipment.rightHand = null;
    this.characterState.stashedEquipment.leftHand = null;
  }

  stashArmor() {
    this.characterState.stashedEquipment.head = this.characterState.equipment.head;
    this.characterState.stashedEquipment.body = this.characterState.equipment.body;
    this.characterState.stashedEquipment.legs = this.characterState.equipment.legs;
    this.characterState.stashedEquipment.feet = this.characterState.equipment.feet;
    this.characterState.equipment.head = null;
    this.characterState.equipment.body = null;
    this.characterState.equipment.legs = null;
    this.characterState.equipment.feet = null;
  }

  restoreArmor() {
    this.characterState.equipment.head = this.characterState.stashedEquipment.head;
    this.characterState.equipment.body = this.characterState.stashedEquipment.body;
    this.characterState.equipment.legs = this.characterState.stashedEquipment.legs;
    this.characterState.equipment.feet = this.characterState.stashedEquipment.feet;
    this.characterState.stashedEquipment.head = null;
    this.characterState.stashedEquipment.body = null;
    this.characterState.stashedEquipment.legs = null;
    this.characterState.stashedEquipment.feet = null;
  }

  stashMoney() {
    this.characterState.stashedMoney = this.characterState.money;
    this.characterState.money = 0;
  }

  restoreMoney() {
    this.characterState.money = this.characterState.stashedMoney;
    this.characterState.stashedMoney = 0;
  }

  // this doesn't really belong here, but nearly everything accesses this service and I didn't want to make a whole service for one function, so here it will live for now
  toast(message: string, duration = 5000) {
    const snackBar = this.snackBar.open(message, 'Close', {
      duration: duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['snackBar', 'darkMode'],
    });
    this.snackBarObservable = snackBar.onAction().subscribe(() => {
      this.snackBarObservable?.unsubscribe();
    });
  }
}
