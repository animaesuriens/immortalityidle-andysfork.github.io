import { Component } from '@angular/core';
import { VERSIONS, VersionEntry } from '../versions';

@Component({
  selector: 'app-changelog-panel',
  templateUrl: './changelog-panel.component.html',
  styleUrls: ['./changelog-panel.component.less'],
})
export class ChangelogPanelComponent {
  versions: VersionEntry[] = VERSIONS;
}
