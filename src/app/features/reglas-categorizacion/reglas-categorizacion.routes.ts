import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () =>
            import('./pages/reglas-categorizacion-list.page').then((m) => m.ReglasCategorizacionListPage)
    }
] as Routes;
