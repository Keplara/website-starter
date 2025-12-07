import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from './navBar/navBar.component';
import { Title } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBar],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = environment.title;
  constructor(private titleService: Title, private authService: AuthService) {}


  ngOnInit(): void {
    this.titleService.setTitle(this.title);
    this.authService.checkLoginStatus().subscribe();
  }
}
