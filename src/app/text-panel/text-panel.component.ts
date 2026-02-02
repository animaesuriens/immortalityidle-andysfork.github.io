import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-text-panel',
  template: 'passed in {{ data.name }}',
  templateUrl: './text-panel.component.html',
  styleUrls: ['./text-panel.component.less', '../app.component.less'],
})
export class TextPanelComponent {
  titleText = '';
  bodyText = '';
  imageFile = '';
  isMilestone = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { titleText: string; bodyText: string; imageFile?: string; milestone?: boolean }) {
    this.titleText = data.titleText;
    this.bodyText = data.bodyText;
    this.imageFile = data.imageFile || '';
    this.isMilestone = data.milestone || false;
  }
}
