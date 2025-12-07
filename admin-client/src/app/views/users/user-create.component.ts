import { Component } from '@angular/core';

@Component({
  selector: 'app-user-create',
  template: `
    <h3>Create User</h3>
    <form>
      <label>Name: <input type="text" name="name"></label><br>
      <label>Email: <input type="email" name="email"></label><br>
      <button type="submit">Create</button>
    </form>
  `,
  standalone: true
})
export class UserCreateComponent {}
