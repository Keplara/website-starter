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

  constructor(private http: HttpClient, private router: Router){
    // get query params
  }


  public routeToCreateAccount(){
    this.router.navigate(['/create-account'])
  }


  // Function to generate a random state value
  generateRandomState(): string {
    // Create a secure random string of 32 characters
    return (Math.random() + 1).toString(36).substring(2, 18) + (Math.random() + 1).toString(36).substring(2, 18);
  }

  onLogin() {
    // needs to be done in the backend.
    // from query params else defualt the query params
    // Assuming you have already obtained the necessary client info
    const clientId = '1';  // Provided by your authorization server
    const redirectUri = 'http://main-client.com/callback'; // Where the auth server will redirect after successful login
    const responseType = 'code'; // OAuth 2.0 authorization code flow
    const scope = 'openid profile'; // You can specify scopes here
    const state = this.generateRandomState();
  
    // Build the authorization URL to redirect the user to the authorization server
    const authorizationUrl = `http://auth-server.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&state=${state}`;
  
    // Redirect the user to the authorization server for login
    window.location.href = authorizationUrl;
  }

  public onSubmit() {
    if (this.email && this.password) {

      // Prepare the login data
      const loginData = {
        email: this.email,
        password: this.password
      };
     // handles auth code


      // // Make a POST request to the authentication API
      // this.http.post('http://localhost:8084/token', loginData).subscribe(
      //   (response: any) => {
      //     console.log('Login successful:', response);
      //     // Handle successful login, e.g., store the token, redirect to another page, etc.
      //   },
      //   (error: any) => {
      //     console.error('Login failed:', error);
      //     // Handle login failure, e.g., show an error message to the user
      //   }
      // );
    }
  }
}