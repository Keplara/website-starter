import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  template: `<p>Redirecting to login...</p>`
})
export class LoginComponent implements OnInit {
  ngOnInit() {
    // Start OAuth2 login flow by navigating to /api/login (server will redirect to auth server)
    window.location.href = '/login';
  }
}
