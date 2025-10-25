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
import {MatListModule} from '@angular/material/list';
import {BreakpointObserver, LayoutModule} from '@angular/cdk/layout';
import { Product } from '../interfaces/core.interface';
import { ProductListItem } from '../sharedComponents/productListItem/productListItem.component';

/**
 * @title Basic toolbar
 */
@Component({
  selector: 'navBar',
  templateUrl: 'navBar.component.html',
  styleUrls: ['navBar.component.scss'],
  standalone: true,
  // changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, RouterLink,LayoutModule, ProductListItem, MatListModule, MatButtonModule, MatIconModule, CommonModule, SearchBoxComponent],
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

  constructor(private breakpointObserver: BreakpointObserver,
     private coreService: CoreService,
      private location: Location,
       private router: Router
      ) {
      }

  ngOnInit(): void {
    this.updateToolbar(this.location.path());
    this.coreService.getSearchResults().subscribe((products: Product[]) => {
      this.searchResults = products;
      if (this.searchResults.length > 0){
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

  toggleMobileSearch(){
    this.displayMobileSearch = !this.displayMobileSearch;
  }


  login(){
    window.location.href = "http://localhost:8082/login?cid=1&redirectURI=localhost:8080?message=welcome"
  }
}