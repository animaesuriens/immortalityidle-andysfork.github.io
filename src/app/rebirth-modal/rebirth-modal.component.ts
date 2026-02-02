import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface RebirthModalData {
  age: string;
  gains: {
    name: string;
    increase: string;
    newAptitude: string;
    newStartValue: string;
  }[];
}

@Component({
  selector: 'app-rebirth-modal',
  templateUrl: './rebirth-modal.component.html',
  styleUrls: ['./rebirth-modal.component.less', '../app.component.less'],
})
export class RebirthModalComponent {
  age: string;
  gains: RebirthModalData['gains'];

  constructor(
    public dialogRef: MatDialogRef<RebirthModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RebirthModalData
  ) {
    this.age = data.age;
    this.gains = data.gains;
  }

  onYes(): void {
    this.dialogRef.close(true);
  }

  onNo(): void {
    this.dialogRef.close(false);
  }
}
