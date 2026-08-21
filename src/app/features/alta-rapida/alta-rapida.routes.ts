import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./pages/alta-rapida.page').then((m) => m.AltaRapidaPage)
    }
] as Routes;
