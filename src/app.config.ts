import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode, LOCALE_ID } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling, withPreloading, PreloadAllModules } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { NGX_CRUD_UI_TEXT } from '@sergioizq/ngx-crud-ui';
import { appRoutes } from './app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { loadingInterceptor } from './app/core/interceptors/loading.interceptor';
import { provideServiceWorker } from '@angular/service-worker';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(
            appRoutes,
            withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
            withEnabledBlockingInitialNavigation(),
            withPreloading(PreloadAllModules)
        ),
        provideHttpClient(
            withFetch(),
            withInterceptors([
                loadingInterceptor,
                authInterceptor,
                errorInterceptor
            ])
        ),
        provideAnimationsAsync(),
        providePrimeNG({ 
            theme: { 
                preset: Aura, 
                options: { 
                    darkModeSelector: '.app-dark'
                } 
            } 
        }),
        MessageService,
        ConfirmationService,
        { provide: LOCALE_ID, useValue: 'es-ES' },
        {
            provide: NGX_CRUD_UI_TEXT,
            useValue: {
                currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords}',
                mobilePageReportTemplate: '{first}-{last} de {totalRecords}',
                titleHeader: 'Nombre',
                actionsHeader: 'Acciones',
                editTooltip: 'Editar',
                deleteTooltip: 'Eliminar',
                refreshTooltip: 'Actualizar',
                helpTooltip: 'Ayuda / Glosario',
                closeLabel: 'Cerrar',
                successSummary: 'Éxito',
                errorSummary: 'Error',
                warningSummary: 'Aviso',
                infoSummary: 'Información',
                confirmHeader: 'Confirmar',
                confirmAcceptLabel: 'Sí',
                confirmRejectLabel: 'Cancelar',
                unknownErrorMessage: 'Error desconocido',
                unexpectedErrorMessage: 'Se ha producido un error inesperado',
                refreshedMessage: 'Datos actualizados',
                refreshedSummary: 'Actualizar',
                saveErrorFallback: 'No se ha podido guardar el registro',
                deleteConfirmMessage: '¿Seguro que quieres eliminar {label}?',
                deleteConfirmHeader: 'Confirmar eliminación',
                deleteConfirmAcceptLabel: 'Sí, eliminar'
            }
        },
        // Aquí estaba el error, lo he dejado una sola vez:
        provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
        })
    ]
};