import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

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
  redirectUri: string = '';
  client_id: string = '';

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute){
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
      // Prepare query parameters
      const params = new URLSearchParams();
      params.set('emailOrUsername', this.email);
      params.set('password', this.password);

      // Make a POST request to the login endpoint
      // Backend will automatically handle OAuth authorization if there's a pending request
      this.http.post(`/login?${params.toString()}`, {}, { 
        responseType: 'text',
        observe: 'response'
      }).subscribe({
        next: (response) => {
          console.log('Login successful:', response.body);
          
          // Check if backend sent a redirect (OAuth flow)
          const redirectUrl = response.headers.get('X-Redirect-URL');
          if (redirectUrl) {
            window.location.href = redirectUrl; // Complete OAuth flow
          } else if (this.redirectUri) {
            // If OAuth params present but no redirect header, complete manually
            window.location.href = this.redirectUri;
          } else {
            // Normal login, go to home
            this.router.navigate(['/']);
          }
        },
        error: (error: any) => {
          console.error('Login failed:', error);
          // Error will be handled by the HTTP interceptor
        }
      });
    }
  }
}