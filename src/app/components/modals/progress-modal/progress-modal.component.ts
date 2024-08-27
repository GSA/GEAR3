import { Component, Inject, Input, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-progress-modal',
  standalone: false,
  templateUrl: './progress-modal.component.html',
  styleUrl: './progress-modal.component.css'
})
export class ProgressModalComponent {
  constructor(
    public dialogRef: MatDialogRef<ProgressModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }) { }

  onClose(): void {
    this.dialogRef.close();
  }
}
