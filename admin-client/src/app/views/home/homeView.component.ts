import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';

/**
 * @title Admin Dashboard
 */
@Component({
  selector: 'app-homeView',
  templateUrl: 'homeView.component.html',
  styleUrl: 'homeView.component.scss',
  standalone: true,
  imports: [
    CommonModule, MatSidenavModule, MatListModule, MatToolbarModule, MatIconModule, MatButtonModule, RouterOutlet,RouterLink
  ],
})
export class HomeViewComponent {
  // Pie chart data for Chart.js
  sectionTitle = 'Dashboard';

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects || event.url;
        if (url.includes('/users')) this.sectionTitle = 'Users';
        else if (url.includes('/products')) this.sectionTitle = 'Products';
        else if (url.includes('/iam')) this.sectionTitle = 'IAM';
        else if (url.includes('/cases')) this.sectionTitle = 'Cases';
        else this.sectionTitle = 'Dashboard';
      }
    });
  }
}