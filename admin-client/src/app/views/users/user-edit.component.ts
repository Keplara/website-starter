import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-user-edit',
  template: `
    <h3>Edit User</h3>
    <button (click)="goBack()">Back</button>
    <p>Editing user with ID: {{ userId }}</p>
    <form>
      <label>Name: <input type="text" name="name"></label><br>
      <label>Email: <input type="email" name="email"></label><br>
      <button type="submit">Save</button>
    </form>
  `,
  standalone: true
})
export class UserEditComponent {
  userId: string | null = null;
  constructor(private route: ActivatedRoute, private router: Router) {
    this.userId = this.route.snapshot.paramMap.get('id');
  }

  goBack() {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }
}
