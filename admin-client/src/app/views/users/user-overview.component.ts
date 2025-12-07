import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-overview',
  template: `
    <h3>User Overview</h3>
    <p>Details for user with ID: {{ userId }}</p>
  `,
  standalone: true
})
export class UserOverviewComponent {
  userId: string | null = null;
  constructor(private route: ActivatedRoute) {
    this.userId = this.route.snapshot.paramMap.get('id');
  }
}
