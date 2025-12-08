import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from "@angular/router";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatButtonModule, MatIconModule]
})
export class UsersComponent { }
