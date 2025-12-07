import { Routes } from '@angular/router';
import { HomeViewComponent } from './views/home/homeView.component';
import { UsersComponent } from './views/users/users.component';
import { ProductsComponent } from './views/products/products.component';
import { ProductListComponent } from './views/products/product-list.component';
import { ProductCreateComponent } from './views/products/product-create.component';
import { ProductOverviewComponent } from './views/products/product-overview.component';
import { ProductEditComponent } from './views/products/product-edit.component';
import { IAMComponent } from './views/iam/iam.component';
import { CasesComponent } from './views/cases/cases.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { authGuard } from './routeGuards/auth.guard';
import { LoginComponent } from './views/login/login.component';
import { UserListComponent } from './views/users/user-list.component';
import { UserCreateComponent } from './views/users/user-create.component';
import { UserOverviewComponent } from './views/users/user-overview.component';
import { UserEditComponent } from './views/users/user-edit.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeViewComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'users',
        component: UsersComponent,
        children: [
          { path: '', component: UserListComponent },
          { path: 'create', component: UserCreateComponent },
          { path: ':id', component: UserOverviewComponent },
          { path: ':id/edit', component: UserEditComponent },
        ]
      },
      {
        path: 'products',
        component: ProductsComponent,
        children: [
          { path: '', component: ProductListComponent },
          { path: 'create', component: ProductCreateComponent },
          { path: ':id', component: ProductOverviewComponent },
          { path: ':id/edit', component: ProductEditComponent },
        ]
      },
      { path: 'iam', component: IAMComponent },
      { path: 'cases', component: CasesComponent },
    ]
  },
  {
    path: 'login',
    component: LoginComponent,
  },
];
