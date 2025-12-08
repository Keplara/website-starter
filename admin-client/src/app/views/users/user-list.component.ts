
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AddUserDialogComponent } from './add-user-dialog.component';

export interface User {
  username: string;
  firstname: string;
  lastname: string;
  age: number;
  createdOn: string;
  modifiedOn: string;
  createdBy: string;
  modifiedBy: string;
  avatar?: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatListModule, MatButtonModule, RouterLink, MatIconModule, AddUserDialogComponent],
  templateUrl: './user-list.component.html'
})
export class UserListComponent {
  users: User[] = [
    {
      username: 'jdoe',
      firstname: 'John',
      lastname: 'Doe',
      age: 30,
      createdOn: '2025-01-01',
      modifiedOn: '2025-06-01',
      createdBy: 'admin',
      modifiedBy: 'admin',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    {
      username: 'asmith',
      firstname: 'Alice',
      lastname: 'Smith',
      age: 28,
      createdOn: '2025-02-15',
      modifiedOn: '2025-05-20',
      createdBy: 'admin',
      modifiedBy: 'jdoe',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
    },
    {
      username: 'bwayne',
      firstname: 'Bruce',
      lastname: 'Wayne',
      age: 35,
      createdOn: '2025-03-10',
      modifiedOn: '2025-07-01',
      createdBy: 'asmith',
      modifiedBy: 'jdoe',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
    },
    {
      username: 'ckent',
      firstname: 'Clark',
      lastname: 'Kent',
      age: 32,
      createdOn: '2025-04-12',
      modifiedOn: '2025-08-15',
      createdBy: 'bwayne',
      modifiedBy: 'asmith',
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg'
    },
    {
      username: 'dprince',
      firstname: 'Diana',
      lastname: 'Prince',
      age: 29,
      createdOn: '2025-05-20',
      modifiedOn: '2025-09-10',
      createdBy: 'ckent',
      modifiedBy: 'bwayne',
      avatar: 'https://randomuser.me/api/portraits/women/5.jpg'
    }
  ];

  constructor(private dialog: MatDialog, private router: Router) { }

  addUser() {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '400px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const now = new Date().toISOString().slice(0, 10);
        this.users = [
          ...this.users,
          {
            username: result.username,
            firstname: result.firstname,
            lastname: result.lastname,
            age: Number(result.age),
            createdOn: now,
            modifiedOn: now,
            createdBy: 'admin',
            modifiedBy: 'admin',
            avatar: 'https://material.angular.dev/assets/img/examples/shiba1.jpg'
          }
        ];
      }
    });
  }

  editUser(user: User) {
    this.router.navigate([user.username, 'edit'], { relativeTo: undefined });
  }

  confirmDelete(user: User) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('User deleted:', user);
      }
    });
  }

  // displayedColumns is not needed for mat-list
}
