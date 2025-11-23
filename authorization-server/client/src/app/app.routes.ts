import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ForgotPasswordComponent } from './pages/forgotPassword/forgotPassword.component';
import { AccountCreationComponent } from './pages/createAccount/createAccount.component';
import { VerifyAccountComponent } from './pages/verifyAccount/verifyAccount.component';
import { ErrorPageComponent } from './pages/error/error.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'verify-account', component: VerifyAccountComponent },
    { path: 'create-account', component: AccountCreationComponent },
    { path: 'error', component: ErrorPageComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
  ];