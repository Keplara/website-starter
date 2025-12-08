import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
/**
 * Interface representing a Product entity.
 * Extend or modify fields as needed.
 */
export interface Product {
  id: string | number;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  [key: string]: any; // For additional dynamic fields
}

@Injectable({
  providedIn: 'root',
})
export class ManagementService {
  // private userDetailsSubject = new BehaviorSubject<any | null>(null); // will come from resource server
  // public userDetails$ = this.userDetailsSubject.asObservable(); // will come from resource server

  private scopes: string[] = [];
  private roles: string[] = [];

  constructor(private http: HttpClient) { }


  /**
   * Adds a new product via POST to /api/management/product
   * Returns an observable with the created product data or error.
   */
  addProduct(product: Product): Observable<any> {
    console.log('[ManagementService] Adding product:', product);
    return this.http.post('/api/management/product', product, { withCredentials: true });
  }

  /**
   * Returns true if the user has the specified scope.
   */
  // Make a directive
  hasScope(scope: string): boolean {
    console.log('[UserService] Checking scope:', scope, 'User scopes:', this.scopes);
    return this.scopes.includes(scope.toLowerCase());
  }

  /**
   * Returns true if the user has the specified role.
   */
  // Make a directive
  hasRole(role: string): boolean {
    console.log('[UserService] Checking role:', role, 'User roles:', this.roles);
    return this.roles.includes(role.toLowerCase());
  }
}
