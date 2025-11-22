import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./pages/gastos-list.page').then(m => m.GastosListPage)
    }
] as Routes;
