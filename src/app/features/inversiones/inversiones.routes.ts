import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./pages/inversiones-list.page').then((m) => m.InversionesListPage)
    }
] as Routes;
