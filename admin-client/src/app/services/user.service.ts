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
  private actions: string[] = [];
  private deniedActions: string[] = [];
  private allowStatements: { action: string; resource?: string }[] = [];
  private denyStatements: { action: string; resource?: string }[] = [];

  constructor(private http: HttpClient) { }

  /**
   * Fetches user details from /api/resource/user and logs/checks session state on error.
   * Returns an observable with the user details or throws error.
   * Also updates the BehaviorSubject and parses scopes/roles.
   */
  fetchUserDetails(): Observable<any> {
    console.log('[UserService] Fetching /api/user');
    return new Observable(observer => {
      this.http.get('/api/resource/user', { withCredentials: true }).subscribe({
        next: (data: any) => {
          console.log('[UserService] Fetched user details:', data);
          this.userDetailsSubject.next(data);
          this.scopes = Array.isArray(data?.scopes) ? data.scopes : (typeof data?.scope === 'string' ? data.scope.split(' ') : []);
          this.roles = Array.isArray(data?.roles) ? data.roles : (typeof data?.role === 'string' ? data.role.split(' ') : []);
          this.actions = Array.isArray(data?.actions) ? data.actions.map((a: string) => a.toLowerCase()) : [];
          this.deniedActions = Array.isArray(data?.deniedActions) ? data.deniedActions.map((a: string) => a.toLowerCase()) : [];
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
          observer.next(data);
          observer.complete();
        },
        error: (err) => {
          this.userDetailsSubject.next(null);
          this.scopes = [];
          this.roles = [];
          this.actions = [];
          this.deniedActions = [];
          this.allowStatements = [];
          this.denyStatements = [];
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
