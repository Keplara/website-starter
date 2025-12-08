import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, throwError, tap, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userDetailsSubject = new BehaviorSubject<any | null>(null);
  public userDetails$ = this.userDetailsSubject.asObservable();

  private scopes: string[] = [];
  private roles: string[] = [];
  private actions: string[] = [];
  private deniedActions: string[] = [];
  private allowStatements: { action: string; resource?: string }[] = [];
  private denyStatements: { action: string; resource?: string }[] = [];

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  /**
   * Fetches user details from /api/resource/user-details and logs/checks session state on error.
   * Returns an observable with the user details or throws error.
   * Also updates the BehaviorSubject and parses scopes/roles.
   */
  fetchUserDetails(): Observable<any> {
    // Skip during SSR to avoid authentication errors
    console.log('[UserService] Checking platform for fetchUserDetails');
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[UserService] Skipping fetch during SSR');
      return of(null);
    }

    console.log('[UserService] Fetching /api/resource/user-details');
    return this.http.get('/api/resource/user-details', { withCredentials: true }).pipe(
      tap((data: any) => {
        console.log('[UserService] Fetched user details:', data);

        this.userDetailsSubject.next(data);
        this.scopes = Array.isArray(data?.scopes) ? data.scopes : (typeof data?.scope === 'string' ? data.scope.split(' ') : []);
        this.roles = Array.isArray(data?.roles) ? data.roles : (typeof data?.role === 'string' ? data.role.split(' ') : []);
        this.actions = Array.isArray(data?.actions) ? data.actions.map((a: any) => a.toLowerCase()) : [];
        this.deniedActions = Array.isArray(data?.deniedActions) ? data.deniedActions.map((a: any) => a.toLowerCase()) : [];
        this.allowStatements = Array.isArray(data?.allowStatements)
          ? data.allowStatements.map((s: any) => ({
            action: String(s.action || '').toLowerCase(),
            resource: s.resource ? String(s.resource).toLowerCase() : undefined,
          }))
          : [];
        this.denyStatements = Array.isArray(data?.denyStatements)
          ? data.denyStatements.map((s: any) => ({
            action: String(s.action || '').toLowerCase(),
            resource: s.resource ? String(s.resource).toLowerCase() : undefined,
          }))
          : [];
      }),
      catchError((err) => {
        this.userDetailsSubject.next(null);
        this.scopes = [];
        this.roles = [];
        this.actions = [];
        this.deniedActions = [];
        this.allowStatements = [];
        this.denyStatements = [];
        // navigate to login if 401/403
        return of(null);
      })
    );
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

  /**
   * Expose raw permission data for downstream permission checks.
   */
  getPermissionData() {
    return {
      actions: this.actions,
      deniedActions: this.deniedActions,
      allowStatements: this.allowStatements,
      denyStatements: this.denyStatements,
      roles: this.roles,
      scopes: this.scopes,
    };
  }
}
