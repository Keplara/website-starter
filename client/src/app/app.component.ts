import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from './navBar/navBar.component';
import { HomeViewComponent } from './views/home/homeView.component';
import { Title } from '@angular/platform-browser';
import { environment } from '../environments/environment';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBar, HomeViewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = environment.title;
  constructor(private titleService: Title) {}


  ngOnInit(): void {
    this.titleService.setTitle(this.title);
  }
}
