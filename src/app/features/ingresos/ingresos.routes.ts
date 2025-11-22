import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./pages/ingresos-list.page').then(m => m.IngresosListPage)
    }
] as Routes;
