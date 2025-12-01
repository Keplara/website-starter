import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userDetailsSubject = new BehaviorSubject<any | null>(null);
  public userDetails$ = this.userDetailsSubject.asObservable();

  private scopes: string[] = [];
  private roles: string[] = [];

  constructor(private http: HttpClient) {}

  /**
   * Fetches user details from /api/resource/user and logs/checks session state on error.
   * Returns an observable with the user details or throws error.
   * Also updates the BehaviorSubject and parses scopes/roles.
   */
  fetchUserDetails(): Observable<any> {
    console.log('[UserService] Fetching /api/resource/user');
    return new Observable(observer => {
      this.http.get('/api/resource/user', { withCredentials: true }).subscribe({
        next: (data: any) => {
          console.log('[UserService] Fetched user details:', data);
          this.userDetailsSubject.next(data);
          this.scopes = Array.isArray(data?.scopes) ? data.scopes : (typeof data?.scope === 'string' ? data.scope.split(' ') : []);
          this.roles = Array.isArray(data?.roles) ? data.roles : (typeof data?.role === 'string' ? data.role.split(' ') : []);
          observer.next(data);
          observer.complete();
        },
        error: (err) => {
          this.userDetailsSubject.next(null);
          this.scopes = [];
          this.roles = [];
          observer.error(err);
        }
      });
    });
  }

  /**
   * Returns true if the user has the specified scope.
   */
  hasScope(scope: string): boolean {
    console.log('[UserService] Checking scope:', scope, 'User scopes:', this.scopes);
    return this.scopes.includes(scope.toLowerCase());
  }

  /**
   * Returns true if the user has the specified role.
   */
  hasRole(role: string): boolean {
    console.log('[UserService] Checking role:', role, 'User roles:', this.roles);
    return this.roles.includes(role.toLowerCase());
  }
}
