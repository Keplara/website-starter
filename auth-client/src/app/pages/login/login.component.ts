import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Import CommonModule and FormsModule
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private http: HttpClient, private router: Router) {
    // get query params
  }


  public routeToCreateAccount() {
    this.router.navigate(['/create-account'])
  }

  public onSubmit() {
    if (!this.email || !this.password) {
      alert('Please enter both email and password');
      return;
    }

    this.http.post('/login', {
      username: this.email,
      password: this.password
    }, { observe: 'response' }).pipe(
      // you can add operators if needed, e.g., tap, catchError
    ).subscribe({
      next: (response) => {
        console.log('Login request sent successfully', response);
        // The server handles redirect, no further action needed
      },
      error: (error) => {
        console.error('Login failed:', error);
        alert('Invalid credentials');
      }
    });
  }
}