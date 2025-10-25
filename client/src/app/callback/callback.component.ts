import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss'] 
})
export class CallbackComponent implements OnInit {

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // Step 1: Get the authorization code from the query parameters
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        // Step 2: Exchange the code for tokens
        this.exchangeCodeForTokens(code);
      } else {
        console.error('No authorization code found');
      }
    });
  }

  private exchangeCodeForTokens(code: string) {
    const tokenEndpoint = 'https://auth.mysite.com/oauth/token'; // Token endpoint on the authorization server
    const clientId = 'Client';  // Client ID of the main client
    const clientSecret = 'Client-secret';  // Use the actual secret for your client
    const redirectUri = 'https://Client.com/callback';  // The callback URL you specified earlier

    const tokenRequestBody = new URLSearchParams();
    tokenRequestBody.set('grant_type', 'authorization_code');
    tokenRequestBody.set('code', code);
    tokenRequestBody.set('redirect_uri', redirectUri);
    tokenRequestBody.set('client_id', clientId);
    tokenRequestBody.set('client_secret', clientSecret);

    // Step 3: Send the request to the token endpoint
    this.http.post(tokenEndpoint, tokenRequestBody.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      .subscribe((response: any) => {
        console.log('Token exchange successful', response);
        // Store the access token (and refresh token, if available)
        localStorage.setItem('access_token', response.access_token);
        // Redirect the user to a logged-in page or protected area
        this.router.navigate(['/main']);
      }, (error) => {
        console.error('Token exchange failed', error);
      });
  }
}