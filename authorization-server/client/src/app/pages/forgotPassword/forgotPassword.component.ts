import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, NgForm, ValidationErrors, Validators } from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgotPassword.component.html',
  styleUrls: ['./forgotPassword.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule,RouterModule, MatCardModule, MatIconModule, MatInputModule, MatFormFieldModule]
})
export class ForgotPasswordComponent {
  @ViewChild('emailModel') emailForm: NgForm | undefined;

  public email = "";

  // Does email and username
  onSubmit(): void {
    console.log(this.emailForm?.value)
    if (this.email != "") {
      console.log(this.email);
      // send request to Authorization server, if email is valid send new password link to the email, and if not valid throw error on the formcontrol.
    }
  }

}