import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { AuthorizationService } from '../../service/AuthorizationService';

@Component({
  selector: 'app-account-creation',
  templateUrl: "./createAccount.component.html",
  styleUrls: ["./createAccount.component.scss"],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, MatCardModule, MatIconModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule]
})

export class AccountCreationComponent {
    accountForm: FormGroup;
    authorizationService: AuthorizationService;
    errorMessage?: string;

  constructor(authorizationService: AuthorizationService, private router: Router ) {
    this.authorizationService = authorizationService;

    this.accountForm = new FormGroup({
        emailGroup: new FormGroup({
          email: new FormControl('', [Validators.required, Validators.email]),
          confirmEmail: new FormControl('', [Validators.required,Validators.email ]),
        },
        [Validators.required, this.emailsMatchValidator()]
        ),
        phone: new FormControl(''),
        passwordGroup: new FormGroup({
            password: new FormControl('', [Validators.required]),
            confirmPassword: new FormControl('', [Validators.required])
        }, [Validators.required, this.passwordsMatchValidator()]
        ),
        username: new FormControl('', [Validators.required]),
        age: new FormControl(''),
        reasonForJoining: new FormControl('N/A')

    });
  }

  get emailGroup(): any{
    return this.accountForm.controls['emailGroup'];
  }
  get passwordGroup(): any{
    return this.accountForm.controls['passwordGroup'];
  }

  emailsMatchValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const email = control.get('email')?.value; // Access 'email' from the group
      const confirmEmail = control.get('confirmEmail')?.value; // Access 'confirmEmail' from the group
      if (email != confirmEmail){
        control.get('confirmEmail')?.setErrors({ emailsMismatch: true });
      }
      return (email === confirmEmail) ? null : { emailsMismatch: true };
    };
  }


  passwordsMatchValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      if (password != confirmPassword){
        control.get('confirmPassword')?.setErrors({ passwordsMismatch: true });
      }
      return (password === confirmPassword) ? null : { passwordsMismatch: true };
    };
  }

  public routeToLogin(){
    this.router.navigate(['/login']); // Navigate after success
  }

  onSubmit(): void {
    if (this.accountForm.valid) {

        this.authorizationService.createAccount({emailAddress: this.emailGroup.get('email').value, username: this.accountForm.get('username')?.value, password: this.passwordGroup.get('password').value}).subscribe({
            next: (response) => {
                console.log('Account created successfully', response);
                this.router.navigate(['/verify-account']); // Navigate after success
            },
            error: (error) => {console.error('Error creating account', error), this.errorMessage = error.error}
        });
        console.log('Form Submitted', this.accountForm.value);
        
    }
  }
}