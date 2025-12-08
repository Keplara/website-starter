// auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  console.log('AuthGuard: Checking authentication status...');
  return auth.checkLoginStatus().pipe(
    map(isLoggedIn => {
      if (!isLoggedIn) {
        console.log('AuthGuard: User not authenticated, redirecting to login.');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      console.log('AuthGuard: User is authenticated.');
      return isLoggedIn;
    })
  );
};
