import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./pages/dashboard.page').then(m => m.DashboardPage)
    }
] as Routes;
