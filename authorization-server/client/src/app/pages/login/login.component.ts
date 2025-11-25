import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatSnackBarModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})

export class LoginComponent {
  email: string = '';
  password: string = '';
  redirectUri: string = '';
  client_id: string = '';

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ){
    // Get redirect_uri from query params
    this.route.queryParams.subscribe(params => {
      this.redirectUri = params['redirect_uri'];
      this.client_id = params['client_id'];
    });
  }


  public routeToCreateAccount(){
    this.router.navigate(['/create-account'])
  }


  // Function to generate a random state value
  generateRandomState(): string {
    // Create a secure random string of 32 characters
    return (Math.random() + 1).toString(36).substring(2, 18) + (Math.random() + 1).toString(36).substring(2, 18);
  }

  public onSubmit() {
    if (this.email && this.password) {
      // Prepare form data
      const formData = new URLSearchParams();
      formData.set('emailOrUsername', this.email);
      formData.set('password', this.password);

      // Preserve OAuth query params in URL
      const queryParams = this.route.snapshot.queryParams;
      const queryString = new URLSearchParams(queryParams).toString();
      const url = queryString ? `/login?${queryString}` : '/login';

      // Make POST request with headers indicating AJAX call
      this.http.post<any>(url, formData.toString(), { 
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
            console.log('Redirect URI:', response.redirectUrl);
          // Check if backend returned a redirect URL (OAuth flow)
          if (response.redirectUrl) {
            // Navigate to the OAuth authorization endpoint
            window.location.href = response.redirectUrl;
          } else {
            // Normal login, navigate to home
            this.router.navigate(['/']);
          }
        },
        error: (error: any) => {
          console.error('Login failed:', error);
          this.password = ''; // Clear password field
          this.snackBar.open('Invalid email or password. Please try again.', 'Dismiss', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar'],
            politeness: 'assertive'
          });
        }
      });
    }
  }
}