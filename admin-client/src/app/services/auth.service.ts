import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  loggedIn$ = this.loggedInSubject.asObservable();
  clientBaseURL: string = environment.clientBaseURL;
  constructor(private http: HttpClient, private router: Router) {}

  // ---------------------
  // CHECK LOGIN STATUS
  // ---------------------
  checkLoginStatus(): Observable<boolean> {
  const url = `/api/check-session`;

    return this.http.get<{ loggedIn: boolean }>(url, { withCredentials: true })
      .pipe(
        map(res => res.loggedIn),
        tap(loggedIn => this.loggedInSubject.next(loggedIn)),
        catchError(err => {
          console.log('AuthService: Error checking login status', err);
          this.loggedInSubject.next(false);
          return of(false);
        })
      );
  }

  // ---------------------
  // LOGOUT
  // ---------------------
  logout(): void {
    this.loggedInSubject.next(false);
    // Only call backend proxy logout endpoint
    this.http.post('/api/logout', {}, { withCredentials: true }).subscribe({
      next: () => {
        console.log('Logged out from client server');   
        // Redirect to home page after logout
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Error logging out from client server:', err);
      }
    });
  }
  // clean up logout, logout button doesn't always work
  // ---------------------
  // HELPER
  // ---------------------
  isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }
}
