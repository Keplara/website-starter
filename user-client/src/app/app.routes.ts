import { Routes } from '@angular/router';
import { HomeViewComponent } from './views/home/homeView.component';
import { ProductOverviewViewComponent } from './views/product-overview/productOverviewView.component';
import { CallbackComponent } from './callback/callback.component';
import { authGuard } from './routeGuards/auth.guard';
import { LoginComponent } from './views/login/login.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeViewComponent,
    },
    {
        path: 'about',
        component: HomeViewComponent,
    },
    {
        path: 'product',
        component: ProductOverviewViewComponent,
        canActivate: [authGuard],
        // have a guard per protected route to grab permissions for the user to display the appropiate apis they can use
    },
    {
        path: 'callback', // may be removed :)
        component: CallbackComponent,
    },
    {
        path: 'dashboard',
        component: HomeViewComponent,
    },
    {
        path: 'login',
        component: LoginComponent,
    },
];
