import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export const resourceAuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept /api/resource requests
  if (!req.url.startsWith('/api/resource')) {
    return next(req);
  }

  const http = inject(HttpClient);
  return http.get<{ loggedIn: boolean, accessTokenExpired: boolean }>('/api/check-session', { withCredentials: true }).pipe(
    switchMap(session => {
      if (session.loggedIn && !session.accessTokenExpired) {
        // Token is valid, proceed
        return next(req);
      } else if (session.loggedIn && session.accessTokenExpired) {
        // Try to refresh token
        return http.post('/api/refresh', {}, { withCredentials: true }).pipe(
          switchMap(() => next(req)),
          catchError((refreshErr: HttpErrorResponse) => {
            // Only throw error, let app handle navigation
            return throwError(() => refreshErr);
          })
        );
      } else {
        // Not logged in, just throw error (global interceptor will handle navigation to /login)
        return throwError(() => new Error('Not authenticated'));
      }
    }),
    catchError((err: HttpErrorResponse) => {
      // Only throw error, let app handle navigation
      return throwError(() => err);
    })
  );
};
