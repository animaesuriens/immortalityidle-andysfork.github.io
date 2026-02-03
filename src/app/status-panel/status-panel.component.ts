import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { GameStateService } from '../game-state/game-state.service';
import { BigNumberPipe } from '../app.component';
import { BASE_HEALTH, BASE_STAMINA, BASE_NOURISHMENT, BASE_QI } from '../game-state/character';
import { PANEL_HELP, STATUS } from '../game-state/tooltips';
import { LifespanModalComponent } from '../lifespan-modal/lifespan-modal.component';

@Component({
  selector: 'app-status-panel',
  templateUrl: './status-panel.component.html',
  styleUrls: ['./status-panel.component.less', '../app.component.less'],
})
export class StatusPanelComponent {
  yinColor = '#000000';
  yangColor = '#ffffff';
  balanceString = 'perfect';
  flashHealth = false;
  flashStamina = false;
  flashQi = false;
  flashNutrition = false;
  panelHelp = PANEL_HELP.status;

  Math: Math;
  private bigNumberPipe: BigNumberPipe;

  constructor(
    public characterService: CharacterService,
    public gameStateService: GameStateService,
    public mainLoopService: MainLoopService,
    private dialog: MatDialog
  ) {
    this.bigNumberPipe = new BigNumberPipe(mainLoopService);
    this.Math = Math;
    mainLoopService.longTickSubject.subscribe(() => {
      this.updateYinYang();
      this.flashHealth = this.characterService.characterState.statusToFlash.includes('health');
      this.flashStamina = this.characterService.characterState.statusToFlash.includes('stamina');
      this.flashQi = this.characterService.characterState.statusToFlash.includes('qi');
      this.flashNutrition = this.characterService.characterState.statusToFlash.includes('nourishment');
      this.characterService.characterState.statusToFlash = [];
    });
  }

  openLifespanModal(): void {
    this.dialog.open(LifespanModalComponent, {
      panelClass: 'lifespan-modal-panel',
    });
  }

  updateYinYang() {
    if (!this.characterService.characterState.yinYangUnlocked) {
      return;
    }
    let yang = this.characterService.characterState.yang;
    let yin = this.characterService.characterState.yin;
    if (yin < 1) {
      yin = 1;
    }
    if (yang < 1) {
      yang = 1;
    }
    if (yang >= yin) {
      this.yangColor = '#ffffff';
      const val = 255 - Math.round((yin / yang) * 255);
      const valstr = val.toString(16);
      this.yinColor = '#' + valstr + valstr + valstr;
    } else {
      this.yinColor = '#000000';
      const val = Math.round((yang / yin) * 255);
      const valstr = val.toString(16);
      this.yangColor = '#' + valstr + valstr + valstr;
    }
    const balanceValues = [
      'perfect',
      'exceptional',
      'excellent',
      'good',
      'fair',
      'poor',
      'terrible',
      'abysmal',
      'non-existent',
    ];
    const difference = Math.max((Math.abs(yang - yin) / ((yang + yin) / 2)) * 10000, 1);
    const differenceIndex = Math.min(Math.floor(Math.log(difference) / Math.log(5)), balanceValues.length - 1);
    this.balanceString = balanceValues[differenceIndex];
  }

  private fmt(n: number): string {
    return this.bigNumberPipe.transform(n);
  }

  getHealthTooltip(): string {
    const state = this.characterService.characterState;
    const max = state.status.health.max;
    const toughnessBonus = Math.floor(Math.log2(state.attributes.toughness.value + 2) * 5);
    const bonusFactor = state.bonusHealth ? 5 : 1;

    const lines: string[] = [
      STATUS.health.name,
      '',
      STATUS.health.description,
      '',
      `Base: ${BASE_HEALTH}`,
    ];

    if (toughnessBonus > 0) {
      lines.push(`  + ${this.fmt(toughnessBonus)} from toughness (floor(log2(${this.fmt(state.attributes.toughness.value)} + 2) × 5))`);
    }
    if (state.healthBonusFood > 0) {
      lines.push(`  + ${this.fmt(state.healthBonusFood)} from food`);
    }
    if (state.healthBonusBath > 0) {
      lines.push(`  + ${this.fmt(state.healthBonusBath)} from bathing`);
    }
    if (state.healthBonusCultivation > 0) {
      lines.push(`  + ${this.fmt(state.healthBonusCultivation)} from cultivation`);
    }
    if (state.healthBonusSoul > 0) {
      lines.push(`  + ${this.fmt(state.healthBonusSoul)} from soul`);
    }
    if (bonusFactor > 1) {
      lines.push(`  × ${bonusFactor} multiplier`);
    }
    lines.push(`  = ${this.fmt(max)}`);

    return lines.join('\n');
  }

  getStaminaTooltip(): string {
    const state = this.characterService.characterState;
    const max = state.status.stamina.max;

    const lines: string[] = [
      STATUS.stamina.name,
      '',
      STATUS.stamina.description,
      '',
      `Base: ${BASE_STAMINA}`,
    ];

    if (state.staminaBonusFood > 0) {
      lines.push(`  + ${this.fmt(state.staminaBonusFood)} from food`);
    }
    if (state.staminaBonusCultivation > 0) {
      lines.push(`  + ${this.fmt(state.staminaBonusCultivation)} from cultivation`);
    }
    lines.push(`  = ${this.fmt(max)}`);

    return lines.join('\n');
  }

  getQiTooltip(): string {
    const state = this.characterService.characterState;
    const max = state.status.qi.max;

    if (!state.qiUnlocked) {
      return `${STATUS.qi.name}\n\n${STATUS.qi.locked}`;
    }

    const lines: string[] = [
      STATUS.qi.name,
      '',
      STATUS.qi.description,
      '',
      `Base: ${BASE_QI}`,
    ];

    if (state.qiBonusCultivation > 0) {
      lines.push(`  + ${this.fmt(state.qiBonusCultivation)} from cultivation`);
    }
    lines.push(`  = ${this.fmt(max)}`);

    return lines.join('\n');
  }

  getNourishmentTooltip(): string {
    const state = this.characterService.characterState;
    const max = state.status.nourishment.max;

    const lines: string[] = [
      STATUS.nourishment.name,
      '',
      STATUS.nourishment.description,
    ];

    if (state.attributes.spirituality.value > 0) {
      STATUS.nourishment.starvationWithSpirituality.forEach(line => lines.push(`• ${line}`));
    } else {
      lines.push(`• ${STATUS.nourishment.starvationWithoutSpirituality}`);
    }

    lines.push('');
    lines.push(`Base: ${BASE_NOURISHMENT}`);
    if (state.nourishmentBonusFood > 0) {
      lines.push(`  + ${this.fmt(state.nourishmentBonusFood)} from food`);
    }
    lines.push(`  = ${this.fmt(max)}`);

    return lines.join('\n');
  }
}
