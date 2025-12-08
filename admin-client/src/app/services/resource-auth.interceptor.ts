import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export const resourceAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  // Skip interceptor during SSR to avoid NotYetImplemented errors
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }
  
  // Only intercept /api/resource requests
  if (!req.url.startsWith('/api/resource')) {
    return next(req);
  }

  const http = inject(HttpClient);
  return http.get<{ loggedIn: boolean, accessTokenExpired: boolean }>('/check-session', { withCredentials: true }).pipe(
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
