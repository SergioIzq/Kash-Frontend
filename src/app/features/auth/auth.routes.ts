import { Routes } from '@angular/router';

export default [
    { path: 'login', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage) },
    { path: 'error', loadComponent: () => import('./pages/error.page').then((m) => m.ErrorPage) },
    { path: 'access', loadComponent: () => import('./pages/access.page').then((m) => m.AccessPage) },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
] as Routes;
