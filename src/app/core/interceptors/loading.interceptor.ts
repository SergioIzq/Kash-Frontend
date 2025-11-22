import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * Interceptor HTTP funcional para manejo de estado de carga
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    const loadingService = inject(LoadingService);
    
    // Incrementar contador de peticiones
    loadingService.show();
    
    return next(req).pipe(
        finalize(() => {
            // Decrementar contador al finalizar
            loadingService.hide();
        })
    );
};
