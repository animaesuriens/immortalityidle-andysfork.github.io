import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GameStateService } from '../game-state/game-state.service';
import { ChangelogPanelComponent } from '../changelog-panel/changelog-panel.component';
import { CURRENT_VERSION } from '../versions';

@Component({
  selector: 'app-credits-modal',
  templateUrl: './credits-modal.component.html',
  styleUrls: ['./credits-modal.component.less', '../app.component.less'],
})
export class CreditsModalComponent {
  applicationVersion = CURRENT_VERSION;

  constructor(
    protected gameStateService: GameStateService,
    private dialog: MatDialog
  ) {}

  changelogClicked() {
    this.dialog.open(ChangelogPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }
}
