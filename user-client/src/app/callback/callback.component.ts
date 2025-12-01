import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CallbackComponent implements OnInit {

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // Check login status from query params (set by backend redirect)
    this.route.queryParams.subscribe(params => {
      const loginStatus = params['login'];
      
      if (loginStatus === 'success') {
        console.log('Login successful');
        // Redirect to home or dashboard
        this.router.navigate(['/']);
      } else if (loginStatus === 'error') {
        console.error('Login failed');
        // Show error message or redirect to login page
        this.router.navigate(['/'], { queryParams: { error: 'login_failed' } });
      }
    });
  }

}