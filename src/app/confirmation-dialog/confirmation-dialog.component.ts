import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmationDialogData {
  title?: string;
  message: string;
  yesText?: string;
  noText?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.less', '../app.component.less'],
})
export class ConfirmationDialogComponent {
  title: string;
  message: string;
  yesText: string;
  noText: string;

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {
    this.title = data.title || '';
    this.message = data.message;
    this.yesText = data.yesText || 'Yes';
    this.noText = data.noText || 'No';
  }

  onYes(): void {
    this.dialogRef.close(true);
  }

  onNo(): void {
    this.dialogRef.close(false);
  }
}
