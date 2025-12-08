import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavBar } from './navBar/navBar.component';
import { Title } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBar],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = environment.title;
  constructor(
    private titleService: Title,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }


  ngOnInit(): void {
    this.titleService.setTitle(this.title);
    // Only check login status in browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      this.authService.checkLoginStatus().subscribe();
      this.userService.fetchUserDetails().subscribe();

      // Refetch user details on every navigation
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.userService.fetchUserDetails().subscribe({
            error: () => {
              // already handled inside the service
            }
          });
        });
    }
  }
}
