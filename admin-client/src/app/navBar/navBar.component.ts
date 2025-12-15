import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, PLATFORM_ID, Inject } from '@angular/core';

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { CoreService } from '../services/core.service';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { environment } from '../../environments/environment';
import { ProductListItem } from '../sharedComponents/productListItem/productListItem.component';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

// TODO: Add a dropdown in the admin client to select an IAM user when logged in as Root.

/**
 * @title Basic toolbar
 */
@Component({
  selector: 'navBar',
  templateUrl: 'navBar.component.html',
  styleUrls: ['navBar.component.scss'],
  standalone: true,
  // changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, RouterLink, LayoutModule, MatListModule, MatButtonModule, MatIconModule, CommonModule],
})
export class NavBar implements OnInit {
  backgroundColor: string = "--primary-800";
  position: 'relative' | 'absolute' = 'relative';
  isHomePage: boolean = false;
  // Breakpoints
  isMobile: boolean = false;
  siteTitle: string = environment.title;
  displayMobileSearch: boolean = false;
  isLoggedIn: boolean = false;

  userDetails: any = null;
  userError: string | null = null;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private coreService: CoreService,
    private location: Location,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    // Subscribe to AuthService login state
    this.authService.loggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    // Only observe breakpoints in browser (uses media queries not available during SSR)
    if (isPlatformBrowser(this.platformId)) {
      this.breakpointObserver.observe([
        '(max-width: 700px)',
      ]).subscribe(result => {
        if (result.breakpoints['(max-width: 700px)']) {
          this.isMobile = true;
        } else {
          this.isMobile = false;
        }
      });
    }

    // Subscribe to user details observable
    this.userService.userDetails$.subscribe({
      next: (data) => {
        this.userDetails = data;
        this.userError = null;
      },
      error: (err) => {
        this.userDetails = null;
        this.userError = err?.error?.error || 'Failed to fetch user details';
      }
    });

    // Initial fetch on init (browser only)
    if (isPlatformBrowser(this.platformId)) {
      this.userService.fetchUserDetails().subscribe({
        error: () => {
          // Error already handled in userDetails$ subscription
        }
      });
    }

  }

  // Expose hasScope/hasRole for template use
  hasScope(scope: string): boolean {
    return this.userService.hasScope(scope);
  }

  hasRole(role: string): boolean {
    return this.userService.hasRole(role);
  }

  login() {
    // Navigate to Angular /login route so user sees login page and can start SSO flow
    this.router.navigate(['/login']);
  }

  logout() {
    this.authService.logout();
  }
}