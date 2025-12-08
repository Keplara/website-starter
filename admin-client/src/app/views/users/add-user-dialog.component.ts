import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  styleUrl: './add-user-dialog.component.scss',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>person_add</mat-icon>
      Add New User
    </h2>
    
    <mat-dialog-content class="dialog-content">
      <form [formGroup]="form" class="dialog-form" novalidate>
        <div class="photo-upload">
          <button type="button" mat-icon-button class="photo-button">
            <mat-icon>add_a_photo</mat-icon>
          </button>
          <span class="photo-label">Add Photo</span>
        </div>
       
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="username-field">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username" required />
          <mat-error *ngIf="form.get('username')?.hasError('required')">Username is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>First Name</mat-label>
          <input matInput formControlName="firstname" required />
          <mat-error *ngIf="form.get('firstname')?.hasError('required')">Required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Last Name</mat-label>
          <input matInput formControlName="lastname" required />
          <mat-error *ngIf="form.get('lastname')?.hasError('required')">Required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="age-field" subscriptSizing="dynamic">
          <mat-label>Age</mat-label>
          <input matInput type="number" formControlName="age" required />
          <mat-error *ngIf="form.get('age')?.hasError('required')">Age is required</mat-error>
          <mat-error *ngIf="form.get('age')?.hasError('min')">Must be positive</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid">
        <mat-icon>check</mat-icon>
        Add User
      </button>
    </mat-dialog-actions>
  `})
export class AddUserDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      age: [null, [Validators.required, Validators.min(0)]],
    });
  }

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
