import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ForgotPasswordComponent } from './pages/forgotPassword/forgotPassword.component';
import { AccountCreationComponent } from './pages/createAccount/createAccount.component';
import { VerifyAccountComponent } from './pages/verifyAccount/verifyAccount.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'verify-account', component: VerifyAccountComponent },
    { path: 'create-account', component: AccountCreationComponent },

    { path: '', redirectTo: 'login', pathMatch: 'full' }
  ];