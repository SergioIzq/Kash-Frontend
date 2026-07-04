import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./pages/importar-movimientos.page').then((m) => m.ImportarMovimientosPage)
    }
] as Routes;
