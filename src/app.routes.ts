import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { authGuard } from './app/core/guards/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: 'legal',
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'aviso-legal'
                    },
                    {
                        path: 'aviso-legal',
                        loadComponent: () => import('./app/shared/pages/legal/aviso-legal.page').then((m) => m.AvisoLegalPage)
                    },
                    {
                        path: 'privacidad',
                        loadComponent: () => import('./app/shared/pages/legal/politica-privacidad.page').then((m) => m.PoliticaPrivacidadPage)
                    },
                    {
                        path: 'cookies',
                        loadComponent: () => import('./app/shared/pages/legal/politica-cookies.page').then((m) => m.PoliticaCookiesPage)
                    }
                ]
            },
            {
                path: '',
                canActivate: [authGuard],
                children: [
                    {
                        path: '',
                        loadChildren: () => import('./app/features/dashboard/dashboard.routes')
                    },
                    {
                        path: 'gastos',
                        loadChildren: () => import('./app/features/gastos/gastos.routes')
                    },
                    {
                        path: 'ingresos',
                        loadChildren: () => import('./app/features/ingresos/ingresos.routes')
                    },
                    {
                        path: 'movimientos',
                        loadChildren: () => import('./app/features/movimientos/movimientos.routes')
                    },
                    {
                        path: 'reglas-categorizacion',
                        loadChildren: () => import('./app/features/reglas-categorizacion/reglas-categorizacion.routes')
                    },
                    {
                        path: 'gastos-programados',
                        loadChildren: () => import('./app/features/gastos-programados/gastos-programados.routes')
                    },
                    {
                        path: 'ingresos-programados',
                        loadChildren: () => import('./app/features/ingresos-programados/ingresos-programados.routes')
                    },
                    {
                        path: 'cuentas',
                        loadChildren: () => import('./app/features/cuentas/cuentas.routes')
                    },
                    {
                        path: 'formas-pago',
                        loadChildren: () => import('./app/features/formas-pago/formas-pago.routes')
                    },
                    {
                        path: 'clientes',
                        loadChildren: () => import('./app/features/clientes/clientes.routes')
                    },
                    {
                        path: 'proveedores',
                        loadChildren: () => import('./app/features/proveedores/proveedores.routes')
                    },
                    {
                        path: 'personas',
                        loadChildren: () => import('./app/features/personas/personas.routes')
                    },
                    {
                        path: 'categorias',
                        loadChildren: () => import('./app/features/categorias/categorias.routes')
                    },
                    {
                        path: 'conceptos',
                        loadChildren: () => import('./app/features/conceptos/conceptos.routes')
                    },
                    {
                        path: 'traspasos',
                        loadChildren: () => import('./app/features/traspasos/traspasos.routes')
                    },
                    {
                        path: 'traspasos-programados',
                        loadChildren: () => import('./app/features/traspasos-programados/traspasos-programados.routes')
                    },
                    {
                        path: 'inversiones',
                        loadChildren: () => import('./app/features/inversiones/inversiones.routes')
                    },
                    {
                        path: 'reportes',
                        loadChildren: () => import('./app/features/reportes/reportes.routes')
                    },
                    {
                        path: 'ayuda',
                        loadComponent: () => import('./app/shared/pages/ayuda.page').then((m) => m.AyudaPage)
                    },
                    {
                        path: 'auth/my-profile',
                        loadComponent: () => import('./app/features/auth/pages/my-profile.page').then((m) => m.MyProfilePage)
                    }
                ]
            }
        ]
    },
    {
        path: 'auth',
        loadChildren: () => import('./app/features/auth/auth.routes')
    },
    {
        path: 'notfound',
        loadComponent: () => import('./app/shared/pages/notfound.page').then((m) => m.NotFoundPage)
    },
    {
        path: '**',
        redirectTo: '/notfound'
    }
];
