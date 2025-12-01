import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { resourceAuthInterceptor } from './services/resource-auth.interceptor';
import { globalAuthInterceptor } from './services/global-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideAnimationsAsync('noop'),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        resourceAuthInterceptor,
        globalAuthInterceptor
      ])
    ),
  ]
};
