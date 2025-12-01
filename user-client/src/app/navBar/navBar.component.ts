import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { SearchBoxComponent } from "../sharedComponents/searchBox/searchBox.component";
import { filter } from 'rxjs/operators';
import { CoreService } from '../services/core.service';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { Product } from '../interfaces/core.interface';
import { ProductListItem } from '../sharedComponents/productListItem/productListItem.component';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

/**
 * @title Basic toolbar
 */
@Component({
  selector: 'navBar',
  templateUrl: 'navBar.component.html',
  styleUrls: ['navBar.component.scss'],
  standalone: true,
  // changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, RouterLink, LayoutModule, ProductListItem, MatListModule, MatButtonModule, MatIconModule, CommonModule, SearchBoxComponent],
})
export class NavBar implements OnInit {
  backgroundColor: string = "--primary-800";
  position: 'relative' | 'absolute' = 'relative';
  showSearchbar: boolean = true;
  error?: null | string;
  hasError: boolean = false;
  searchResults: Product[] = [];
  isHomePage: boolean = false;
  // Breakpoints
  isMobile: boolean = false;
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
    private userService: UserService
  ) { }

  ngOnInit(): void {
    // Subscribe to AuthService login state
    this.authService.loggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    this.updateToolbar(this.location.path());
    this.coreService.getSearchResults().subscribe((products: Product[]) => {
      this.searchResults = products;
      if (this.searchResults.length > 0) {
        this.updateToolbar("/results")
      }
    });
    // Listen to route changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.updateToolbar(this.location.path());
        this.isLoggedIn = this.authService.isLoggedIn();
      });

    this.breakpointObserver.observe([
      '(max-width: 700px)',
    ]).subscribe(result => {
      if (result.breakpoints['(max-width: 700px)']) {
        this.isMobile = true;
      } else {
        this.isMobile = false;
      }
    });

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
    // Fetch user details on init
    this.userService.fetchUserDetails().subscribe({
      error: (err) => {
        // Error already handled in userDetails$ subscription
      }
    });
  }

  // Expose hasScope/hasRole for template use
  hasScope(scope: string): boolean {
    return this.userService.hasScope(scope);
  }

  hasRole(role: string): boolean {
    return this.userService.hasRole(role);
  }

  private updateToolbar(path: string): void {
    if (path === "") {
      this.backgroundColor = "transparent";
      this.showSearchbar = false;
      this.position = "absolute";
      this.isHomePage = true;
    } else {
      this.backgroundColor = "var(--primary-800)"; // Change to desired color when not on home page
      this.showSearchbar = true;
      this.position = "relative";
      this.isHomePage = false;
    }
  }

  toggleMobileSearch() {
    this.displayMobileSearch = !this.displayMobileSearch;
  }

  login() {
    // Navigate to Angular /login route so user sees login page and can start SSO flow
    this.router.navigate(['/login']);
  }

  logout(){
    this.authService.logout();
  }
}