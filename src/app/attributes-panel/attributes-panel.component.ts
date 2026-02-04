import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { trigger, state, style, transition, animate, keyframes, AnimationEvent } from '@angular/animations';
import { Character, AttributeType } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { GameStateService } from '../game-state/game-state.service';
import { PANEL_HELP, ATTRIBUTES } from '../game-state/tooltips';

export type AttributeUpdatesArrays = {
  [key in AttributeType]: number[];
};

export interface AttributeGroup {
  name: string;
  keys: AttributeType[];
}

@Component({
  selector: 'app-attributes-panel',
  templateUrl: './attributes-panel.component.html',
  styleUrls: ['./attributes-panel.component.less', '../app.component.less'],
  animations: [
    trigger('popupText', [
      state('in', style({ position: 'fixed' })),
      transition(':leave', [
        animate(
          1000,
          keyframes([style({ transform: 'translate(0%, 0%)' }), style({ transform: 'translate(100%, -150%)' })])
        ),
      ]),
    ]),
  ],
})

export class AttributesPanelComponent {
  character: Character;
  popupCounter = 0;
  panelHelp = PANEL_HELP.attributes;
  attrTooltips = ATTRIBUTES;

  attributeGroups: AttributeGroup[] = [
    {
      name: 'Basic',
      keys: ['strength', 'toughness', 'speed', 'intelligence', 'charisma'],
    },
    {
      name: 'Cultivation',
      keys: ['spirituality', 'earthLore', 'metalLore', 'woodLore', 'waterLore', 'fireLore'],
    },
    {
      name: 'Proficiency',
      keys: ['animalHandling', 'combatMastery', 'magicMastery'],
    },
  ];

  constructor(
    public characterService: CharacterService,
    public dialog: MatDialog,
    public gameStateService: GameStateService,
    public mainLoopService: MainLoopService
  ) {
    this.character = characterService.characterState;
    this.attributeUpdates = {
      strength: [],
      toughness: [],
      speed: [],
      intelligence: [],
      charisma: [],
      spirituality: [],
      earthLore: [],
      metalLore: [],
      woodLore: [],
      waterLore: [],
      fireLore: [],
      animalHandling: [],
      combatMastery: [],
      magicMastery: [],
    };

    this.mainLoopService.longTickSubject.subscribe(() => {
      if (this.popupCounter < 1) {
        this.popupCounter++;
        return;
      }
      this.popupCounter = 0;
      for (const key in this.character.attributeUpdates) {
        const attributeType = key as AttributeType;
        if (this.character.attributeUpdates[attributeType] !== 0) {
          this.attributeUpdates[attributeType].push(this.character.attributeUpdates[attributeType]);
          this.character.attributeUpdates[attributeType] = 0;
        }
      }
    });
  }

  attributeUpdates: AttributeUpdatesArrays;

  // Preserve original property order
  originalOrder = (): number => {
    return 0;
  };

  animationDoneEvent(event: AnimationEvent, key: string) {
    const attributeType = key as AttributeType;
    while (this.attributeUpdates[attributeType].length > 0) {
      this.attributeUpdates[attributeType].pop();
    }
  }

  getAttributeUpdates(key: string): number[] {
    const attributeType = key as AttributeType;
    return this.attributeUpdates[attributeType];
  }

  isAttributeVisible(key: AttributeType): boolean {
    const attr = this.character.attributes[key];
    return attr.value !== 0 || !!this.character.highestAttributes[key];
  }

  hasVisibleAttributes(group: AttributeGroup): boolean {
    return group.keys.some(key => this.isAttributeVisible(key));
  }
}
