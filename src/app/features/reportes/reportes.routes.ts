import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./pages/reportes.page').then(m => m.ReportesPage)
    }
] as Routes;
