import { Component } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { LIFESPAN } from '../game-state/tooltips';
import { BASE_LIFESPAN_YEARS, MAX_BASE_LIFESPAN_YEARS, DAYS_PER_LIFESPAN_BONUS } from '../game-state/character';
import { BonusFoodId } from '../game-state/consumable-tracking';
import { BigNumberPipe } from '../app.component';

type FactorType = 'food' | 'alchemy' | 'attributes' | 'cultivation' | 'spirituality';

interface ColoredSegment {
  text: string;
  color?: string; // str, tou, spd, int, cha, total, avg, limit, effective, mult, final, etc.
}

interface FoodLifespanEntry {
  id: BonusFoodId;
  name: string;
  eaten: { currentLife: number; allTime: number };
  triggered: { currentLife: number; allTime: number };
  chance: number;
  capDays: number;
  bonusDays: number;
  uncappedDays: number;
}

interface AlchemyLifespanEntry {
  id: string;
  name: string;
  consumed: { currentLife: number; allTime: number };
  capDays: number;
  bonusDays: number;
  uncappedDays: number;
}

interface CultivationLifespanEntry {
  id: string;
  name: string;
  capDays: number;
  bonusDays: number;
}

// Foods that give lifespan bonuses with their % chances and caps (in years)
const LIFESPAN_FOODS: { id: BonusFoodId; name: string; chance: number; capYears: number }[] = [
  { id: 'beans', name: 'Beans', chance: 2, capYears: 5 },
  { id: 'broccoli', name: 'Broccoli', chance: 5, capYears: 10 },
  { id: 'calabash', name: 'Calabash', chance: 8, capYears: 15 },
  { id: 'taro', name: 'Taro', chance: 10, capYears: 20 },
  { id: 'pear', name: 'Pear', chance: 12, capYears: 25 },
  { id: 'melon', name: 'Melon', chance: 15, capYears: 30 },
  { id: 'plum', name: 'Plum', chance: 18, capYears: 35 },
  { id: 'apricot', name: 'Apricot', chance: 20, capYears: 40 },
  { id: 'peach', name: 'Peach', chance: 22, capYears: 72 },
  { id: 'divinePeach', name: 'Divine Peach', chance: 100, capYears: 720 },
];

const ALCHEMY_LIFESPAN_ITEMS: { id: string; name: string; capYears: number }[] = [
  { id: 'pill:longevity', name: 'Longevity Pill', capYears: 100 },
];

const CULTIVATION_LIFESPAN_SOURCES: { id: string; name: string; capYears: number }[] = [
  { id: 'Extending Life', name: 'Extending Life', capYears: 100 },
];

@Component({
  selector: 'app-lifespan-modal',
  templateUrl: './lifespan-modal.component.html',
  styleUrls: ['./lifespan-modal.component.less', '../app.component.less'],
})
export class LifespanModalComponent {
  BASE_LIFESPAN_YEARS = BASE_LIFESPAN_YEARS;
  MAX_BASE_LIFESPAN_YEARS = MAX_BASE_LIFESPAN_YEARS;
  YEARS_PER_BONUS_DAY = DAYS_PER_LIFESPAN_BONUS / 365;

  selectedFactor: FactorType | null = null;

  private bigNumberPipe: BigNumberPipe;

  constructor(
    public characterService: CharacterService,
    public mainLoopService: MainLoopService
  ) {
    this.bigNumberPipe = new BigNumberPipe(mainLoopService);
  }

  get baseLifespanFormatted(): string {
    return this.characterService.formatDays(this.characterService.characterState.baseLifespan, 'long');
  }

  get totalYearsLivedFormatted(): string {
    return this.characterService.formatDays(this.mainLoopService.totalTicks, 'long');
  }

  get currentBonusFormatted(): string {
    return this.characterService.formatDays(this.characterService.characterState.baseLifespan - BASE_LIFESPAN_YEARS * 365, 'long');
  }

  get isBonusMaxed(): boolean {
    return this.characterService.characterState.baseLifespan >= MAX_BASE_LIFESPAN_YEARS * 365;
  }

  get lifeExpectancyFormatted(): string {
    return this.characterService.formatDays(this.characterService.characterState.lifespan, 'long');
  }

  get hasFoodBonus(): boolean {
    return this.characterService.characterState.foodLifespan > 0;
  }

  get hasAlchemyBonus(): boolean {
    return this.characterService.characterState.alchemyLifespan > 0;
  }

  get hasAttributesBonus(): boolean {
    return this.characterService.characterState.statLifespan > 0;
  }

  get hasCultivationBonus(): boolean {
    return this.characterService.characterState.magicLifespan > 0;
  }

  get hasSpiritualityBonus(): boolean {
    return this.characterService.characterState.spiritualityLifespan > 0;
  }

  get hasAnyBonus(): boolean {
    return this.hasFoodBonus || this.hasAlchemyBonus || this.hasAttributesBonus ||
           this.hasCultivationBonus || this.hasSpiritualityBonus;
  }

  selectFactor(factor: FactorType): void {
    this.selectedFactor = this.selectedFactor === factor ? null : factor;
  }

  formatDays(days: number, format: 'short' | 'long' | 'years' | 'y' = 'long'): string {
    return this.characterService.formatDays(days, format);
  }

  formatBigNumber(n: number): string {
    return this.bigNumberPipe.transform(n);
  }

  // Food details
  get foodLifespanEntries(): FoodLifespanEntry[] {
    const counters = this.characterService.characterState.consumableCounters;
    return LIFESPAN_FOODS.map(food => {
      const eaten = counters[food.id].consumed;
      const triggered = counters[food.id].effects['lifespan'] || { currentLife: 0, allTime: 0 };
      const capDays = food.capYears * 365;
      // Actual days gained this life (capped at food's max)
      const bonusDays = Math.min(triggered.currentLife, capDays);
      // Estimated uncapped: eaten × chance = expected triggers, each trigger = 1 day
      const uncappedDays = Math.round(eaten.currentLife * (food.chance / 100));
      return {
        id: food.id,
        name: food.name,
        eaten,
        triggered,
        chance: food.chance,
        capDays,
        bonusDays,
        uncappedDays,
      };
    }).filter(entry => entry.eaten.currentLife > 0 || entry.triggered.currentLife > 0);
  }

  // Alchemy details
  get alchemyLifespanEntries(): AlchemyLifespanEntry[] {
    const counters = this.characterService.characterState.consumableCounters;
    return ALCHEMY_LIFESPAN_ITEMS.map(item => {
      const counter = counters[item.id as keyof typeof counters];
      const consumed = counter?.consumed || { currentLife: 0, allTime: 0 };
      const gained = counter?.effects['gained'] || { currentLife: 0, allTime: 0 };
      const capDays = item.capYears * 365;
      const bonusDays = Math.min(gained.currentLife, capDays);
      return {
        id: item.id,
        name: item.name,
        consumed,
        capDays,
        bonusDays,
        uncappedDays: gained.currentLife,
      };
    }).filter(entry => entry.consumed.currentLife > 0 || entry.uncappedDays > 0);
  }

  // Cultivation details
  get cultivationLifespanEntries(): CultivationLifespanEntry[] {
    const sources = this.characterService.characterState.cultivationLifespanSources;
    return CULTIVATION_LIFESPAN_SOURCES.map(source => {
      const bonusDays = sources[source.id] || 0;
      const capDays = source.capYears * 365;
      return {
        id: source.id,
        name: source.name,
        capDays,
        bonusDays: Math.min(bonusDays, capDays),
      };
    }).filter(entry => entry.bonusDays > 0);
  }

  // Attributes formula breakdown with unique colors per variable
  get attributesColoredBreakdown(): ColoredSegment[][] {
    const attrs = this.characterService.characterState.attributes;
    const state = this.characterService.characterState;
    const fmt = (n: number) => this.bigNumberPipe.transform(n);

    const strApt = attrs.strength.aptitude;
    const touApt = attrs.toughness.aptitude;
    const spdApt = attrs.speed.aptitude;
    const intApt = attrs.intelligence.aptitude;
    const chaApt = attrs.charisma.aptitude;
    const totalAptitude = strApt + touApt + spdApt + intApt + chaApt;
    const avgAptitude = totalAptitude / 5;
    const limit = state.attributeScalingLimit;
    const softCap = state.attributeSoftCap;
    const multiplier = state.bloodlineRank < 5 ? 0.1 : 5;

    const lines: ColoredSegment[][] = [];

    // Aptitudes:
    lines.push([{ text: 'Aptitudes:' }]);

    // Str X + Tou X + Spd X + Int X + Cha X
    lines.push([
      { text: '  Str ' }, { text: fmt(strApt), color: 'str' },
      { text: ' + Tou ' }, { text: fmt(touApt), color: 'tou' },
      { text: ' + Spd ' }, { text: fmt(spdApt), color: 'spd' },
      { text: ' + Int ' }, { text: fmt(intApt), color: 'int' },
      { text: ' + Cha ' }, { text: fmt(chaApt), color: 'cha' },
    ]);

    // = total ÷ 5 = avg
    lines.push([
      { text: '  = ' }, { text: fmt(totalAptitude), color: 'total' },
      { text: ' total ÷ 5 = ' }, { text: fmt(avgAptitude), color: 'avg' }, { text: ' avg' },
    ]);

    lines.push([]); // Empty line

    // Scaling thresholds
    lines.push([
      { text: 'Scaling limit: ' }, { text: fmt(limit), color: 'limit' },
      { text: ' (from ' }, { text: 'Meridians', color: 'meridians' },
      { text: ')' },
    ]);
    lines.push([
      { text: 'Soft cap: ' }, { text: fmt(softCap), color: 'softcap' },
      { text: ' (fixed)' },
    ]);

    lines.push([]); // Empty line

    // Tier calculation
    let effectiveValue: number;
    if (avgAptitude < limit) {
      effectiveValue = avgAptitude;
      lines.push([{ text: 'Tier: Linear (below limit)' }]);
      lines.push([
        { text: '  Effective: ' }, { text: fmt(avgAptitude), color: 'avg' },
      ]);
    } else if (avgAptitude < limit * 10) {
      const excess = avgAptitude - limit;
      effectiveValue = limit + excess / 4;
      lines.push([{ text: 'Tier: Reduced (1/4 rate)' }]);
      lines.push([
        { text: '  ' }, { text: fmt(limit), color: 'limit' },
        { text: ' + (' }, { text: fmt(avgAptitude), color: 'avg' },
        { text: ' - ' }, { text: fmt(limit), color: 'limit' },
        { text: ') ÷ 4 = ' }, { text: fmt(effectiveValue), color: 'effective' },
      ]);
    } else if (avgAptitude < limit * 100) {
      const tier1 = limit;
      const tier2 = (limit * 9) / 4;
      const excess = (avgAptitude - limit * 10) / 20;
      effectiveValue = tier1 + tier2 + excess;
      lines.push([{ text: 'Tier: Reduced (1/20 rate)' }]);
      lines.push([
        { text: '  ' }, { text: fmt(tier1), color: 'limit' },
        { text: ' + ' }, { text: fmt(tier2), color: 'tier2' },
        { text: ' + (' }, { text: fmt(avgAptitude), color: 'avg' },
        { text: ' - ' }, { text: fmt(limit * 10), color: 'limit' },
        { text: ') ÷ 20 = ' }, { text: fmt(effectiveValue), color: 'effective' },
      ]);
    } else if (avgAptitude <= softCap) {
      const tier1 = limit;
      const tier2 = (limit * 9) / 4;
      const tier3 = (limit * 90) / 20;
      const excess = (avgAptitude - limit * 100) / 100;
      effectiveValue = tier1 + tier2 + tier3 + excess;
      lines.push([{ text: 'Tier: Reduced (1/100 rate)' }]);
      lines.push([
        { text: '  ' }, { text: fmt(tier1), color: 'limit' },
        { text: ' + ' }, { text: fmt(tier2), color: 'tier2' },
        { text: ' + ' }, { text: fmt(tier3), color: 'tier3' },
        { text: ' + (' }, { text: fmt(avgAptitude), color: 'avg' },
        { text: ' - ' }, { text: fmt(limit * 100), color: 'limit' },
        { text: ') ÷ 100 = ' }, { text: fmt(effectiveValue), color: 'effective' },
      ]);
    } else {
      const tier1 = limit;
      const tier2 = (limit * 9) / 4;
      const tier3 = (limit * 90) / 20;
      const tier4 = (softCap - limit * 100) / 100;
      const base = tier1 + tier2 + tier3 + tier4;
      const excess = Math.log10(avgAptitude / softCap) * softCap;
      effectiveValue = base + excess;
      lines.push([{ text: 'Tier: Logarithmic (above soft cap)' }]);
      lines.push([{ text: '  Base from capped tiers:' }]);
      lines.push([
        { text: '    Linear (0 to ' }, { text: fmt(limit), color: 'limit' },
        { text: '): ' }, { text: fmt(tier1), color: 'tier1' },
      ]);
      lines.push([
        { text: '    ÷4 rate (' }, { text: fmt(limit), color: 'limit' },
        { text: ' to ' }, { text: fmt(limit * 10), color: 'limit' },
        { text: '): ' }, { text: fmt(limit * 9), color: 'limit' },
        { text: ' ÷ 4 = ' }, { text: fmt(tier2), color: 'tier2' },
      ]);
      lines.push([
        { text: '    ÷20 rate (' }, { text: fmt(limit * 10), color: 'limit' },
        { text: ' to ' }, { text: fmt(limit * 100), color: 'limit' },
        { text: '): ' }, { text: fmt(limit * 90), color: 'limit' },
        { text: ' ÷ 20 = ' }, { text: fmt(tier3), color: 'tier3' },
      ]);
      lines.push([
        { text: '    ÷100 rate (' }, { text: fmt(limit * 100), color: 'limit' },
        { text: ' to ' }, { text: fmt(softCap), color: 'softcap' },
        { text: '): (' }, { text: fmt(softCap), color: 'softcap' },
        { text: ' - ' }, { text: fmt(limit * 100), color: 'limit' },
        { text: ') ÷ 100 = ' }, { text: fmt(tier4), color: 'tier4' },
      ]);
      lines.push([]);
      lines.push([
        { text: '    Total base: ' }, { text: fmt(tier1), color: 'tier1' },
        { text: ' + ' }, { text: fmt(tier2), color: 'tier2' },
        { text: ' + ' }, { text: fmt(tier3), color: 'tier3' },
        { text: ' + ' }, { text: fmt(tier4), color: 'tier4' },
        { text: ' = ' }, { text: fmt(base), color: 'base' },
      ]);
      lines.push([
        { text: '  Log excess: log₁₀(' }, { text: fmt(avgAptitude), color: 'avg' },
        { text: ' / ' }, { text: fmt(softCap), color: 'softcap' },
        { text: ') × ' }, { text: fmt(softCap), color: 'softcap' },
        { text: ' = ' }, { text: fmt(excess), color: 'excess' },
      ]);
      lines.push([
        { text: '  Effective: ' }, { text: fmt(base), color: 'base' },
        { text: ' + ' }, { text: fmt(excess), color: 'excess' },
        { text: ' = ' }, { text: fmt(effectiveValue), color: 'effective' },
      ]);
    }

    lines.push([]); // Empty line

    // Bloodline multiplier
    lines.push([
      { text: 'Bloodline', color: 'bloodline' },
      { text: ' multiplier: ' }, { text: `×${multiplier}`, color: 'mult' },
    ]);

    lines.push([]); // Empty line

    // Final
    lines.push([
      { text: 'Final: ' }, { text: fmt(effectiveValue), color: 'effective' },
      { text: ' × ' }, { text: `${multiplier}`, color: 'mult' },
      { text: ' = ' }, { text: this.formatDays(state.statLifespan), color: 'final' },
    ]);

    return lines;
  }

  // Spirituality formula breakdown with colors
  get spiritualityColoredBreakdown(): ColoredSegment[][] {
    const state = this.characterService.characterState;
    const fmt = (n: number) => this.bigNumberPipe.transform(n);
    const spirValue = state.attributes.spirituality.value;
    const limit = state.attributeScalingLimit;
    const softCap = state.attributeSoftCap;
    const multiplier = 5; // Fixed for spirituality

    const lines: ColoredSegment[][] = [];

    // Spirituality value
    lines.push([
      { text: 'Spirituality: ' }, { text: fmt(spirValue), color: 'spir' },
    ]);

    lines.push([]); // Empty line

    // Scaling thresholds
    lines.push([
      { text: 'Scaling limit: ' }, { text: fmt(limit), color: 'limit' },
      { text: ' (from ' }, { text: 'Meridians', color: 'meridians' },
      { text: ')' },
    ]);
    lines.push([
      { text: 'Soft cap: ' }, { text: fmt(softCap), color: 'softcap' },
      { text: ' (fixed)' },
    ]);

    lines.push([]); // Empty line

    // Tier calculation
    let effectiveValue: number;
    if (spirValue < limit) {
      effectiveValue = spirValue;
      lines.push([{ text: 'Tier: Linear (below limit)' }]);
      lines.push([
        { text: '  Effective: ' }, { text: fmt(spirValue), color: 'spir' },
      ]);
    } else if (spirValue < limit * 10) {
      const excess = spirValue - limit;
      effectiveValue = limit + excess / 4;
      lines.push([{ text: 'Tier: Reduced (1/4 rate)' }]);
      lines.push([
        { text: '  ' }, { text: fmt(limit), color: 'limit' },
        { text: ' + (' }, { text: fmt(spirValue), color: 'spir' },
        { text: ' - ' }, { text: fmt(limit), color: 'limit' },
        { text: ') ÷ 4 = ' }, { text: fmt(effectiveValue), color: 'effective' },
      ]);
    } else if (spirValue < limit * 100) {
      const tier1 = limit;
      const tier2 = (limit * 9) / 4;
      const excess = (spirValue - limit * 10) / 20;
      effectiveValue = tier1 + tier2 + excess;
      lines.push([{ text: 'Tier: Reduced (1/20 rate)' }]);
      lines.push([
        { text: '  ' }, { text: fmt(tier1), color: 'limit' },
        { text: ' + ' }, { text: fmt(tier2), color: 'tier2' },
        { text: ' + (' }, { text: fmt(spirValue), color: 'spir' },
        { text: ' - ' }, { text: fmt(limit * 10), color: 'limit' },
        { text: ') ÷ 20 = ' }, { text: fmt(effectiveValue), color: 'effective' },
      ]);
    } else if (spirValue <= softCap) {
      const tier1 = limit;
      const tier2 = (limit * 9) / 4;
      const tier3 = (limit * 90) / 20;
      const excess = (spirValue - limit * 100) / 100;
      effectiveValue = tier1 + tier2 + tier3 + excess;
      lines.push([{ text: 'Tier: Reduced (1/100 rate)' }]);
      lines.push([
        { text: '  ' }, { text: fmt(tier1), color: 'limit' },
        { text: ' + ' }, { text: fmt(tier2), color: 'tier2' },
        { text: ' + ' }, { text: fmt(tier3), color: 'tier3' },
        { text: ' + (' }, { text: fmt(spirValue), color: 'spir' },
        { text: ' - ' }, { text: fmt(limit * 100), color: 'limit' },
        { text: ') ÷ 100 = ' }, { text: fmt(effectiveValue), color: 'effective' },
      ]);
    } else {
      const tier1 = limit;
      const tier2 = (limit * 9) / 4;
      const tier3 = (limit * 90) / 20;
      const tier4 = (softCap - limit * 100) / 100;
      const base = tier1 + tier2 + tier3 + tier4;
      const excess = Math.log10(spirValue / softCap) * softCap;
      effectiveValue = base + excess;
      lines.push([{ text: 'Tier: Logarithmic (above soft cap)' }]);
      lines.push([{ text: '  Base from capped tiers:' }]);
      lines.push([
        { text: '    Linear (0 to ' }, { text: fmt(limit), color: 'limit' },
        { text: '): ' }, { text: fmt(tier1), color: 'tier1' },
      ]);
      lines.push([
        { text: '    ÷4 rate (' }, { text: fmt(limit), color: 'limit' },
        { text: ' to ' }, { text: fmt(limit * 10), color: 'limit' },
        { text: '): ' }, { text: fmt(limit * 9), color: 'limit' },
        { text: ' ÷ 4 = ' }, { text: fmt(tier2), color: 'tier2' },
      ]);
      lines.push([
        { text: '    ÷20 rate (' }, { text: fmt(limit * 10), color: 'limit' },
        { text: ' to ' }, { text: fmt(limit * 100), color: 'limit' },
        { text: '): ' }, { text: fmt(limit * 90), color: 'limit' },
        { text: ' ÷ 20 = ' }, { text: fmt(tier3), color: 'tier3' },
      ]);
      lines.push([
        { text: '    ÷100 rate (' }, { text: fmt(limit * 100), color: 'limit' },
        { text: ' to ' }, { text: fmt(softCap), color: 'softcap' },
        { text: '): (' }, { text: fmt(softCap), color: 'softcap' },
        { text: ' - ' }, { text: fmt(limit * 100), color: 'limit' },
        { text: ') ÷ 100 = ' }, { text: fmt(tier4), color: 'tier4' },
      ]);
      lines.push([]);
      lines.push([
        { text: '    Total base: ' }, { text: fmt(tier1), color: 'tier1' },
        { text: ' + ' }, { text: fmt(tier2), color: 'tier2' },
        { text: ' + ' }, { text: fmt(tier3), color: 'tier3' },
        { text: ' + ' }, { text: fmt(tier4), color: 'tier4' },
        { text: ' = ' }, { text: fmt(base), color: 'base' },
      ]);
      lines.push([
        { text: '  Log excess: log₁₀(' }, { text: fmt(spirValue), color: 'spir' },
        { text: ' / ' }, { text: fmt(softCap), color: 'softcap' },
        { text: ') × ' }, { text: fmt(softCap), color: 'softcap' },
        { text: ' = ' }, { text: fmt(excess), color: 'excess' },
      ]);
      lines.push([
        { text: '  Effective: ' }, { text: fmt(base), color: 'base' },
        { text: ' + ' }, { text: fmt(excess), color: 'excess' },
        { text: ' = ' }, { text: fmt(effectiveValue), color: 'effective' },
      ]);
    }

    lines.push([]); // Empty line

    // Multiplier (fixed for spirituality)
    lines.push([
      { text: 'Multiplier: ' }, { text: '×5', color: 'mult' }, { text: ' (fixed)' },
    ]);

    lines.push([]); // Empty line

    // Final
    lines.push([
      { text: 'Final: ' }, { text: fmt(effectiveValue), color: 'effective' },
      { text: ' × ' }, { text: '5', color: 'mult' },
      { text: ' = ' }, { text: this.formatDays(state.spiritualityLifespan), color: 'final' },
    ]);

    return lines;
  }

  // Meridian scaling limit tooltip
  get meridianScalingTooltip(): string {
    const state = this.characterService.characterState;
    const currentRank = Math.log10(state.reinforceMeridiansCost / state.reinforceMeridiansOriginalCost);

    const lines: string[] = ['Scaling Limit by Meridian Rank:', ''];
    for (let rank = 0; rank <= 9; rank++) {
      const limit = 10 * Math.pow(2, rank);
      const marker = rank === Math.round(currentRank) ? ' ◄ current' : '';
      lines.push(`Rank ${rank}: ${limit.toLocaleString()}${marker}`);
    }
    lines.push('', 'Formula: 10 × 2^rank');
    return lines.join('\n');
  }

  // Bloodline multiplier tooltip
  get bloodlineMultiplierTooltip(): string {
    const currentRank = this.characterService.characterState.bloodlineRank;

    const lines: string[] = ['Lifespan Multiplier by Bloodline Rank:', ''];
    for (let rank = 0; rank <= 9; rank++) {
      const mult = rank < 5 ? 0.1 : 5;
      const marker = rank === currentRank ? ' ◄ current' : '';
      lines.push(`Rank ${rank}: ×${mult}${marker}`);
    }
    return lines.join('\n');
  }

  getBaseLifespanTooltip(): string {
    const state = this.characterService.characterState;
    const baseYears = Math.floor(state.baseLifespan / 365);
    const baseDays = Math.floor(state.baseLifespan % 365);
    const totalYears = Math.floor(this.mainLoopService.totalTicks / 365).toLocaleString();
    const totalDays = Math.floor(this.mainLoopService.totalTicks % 365).toFixed(0);
    const bonusYears = Math.floor((state.baseLifespan - 30 * 365) / 365);
    const bonusDays = Math.floor((state.baseLifespan - 30 * 365) % 365);

    return LIFESPAN.template(baseYears, baseDays, totalYears, totalDays, bonusYears, bonusDays);
  }
}
