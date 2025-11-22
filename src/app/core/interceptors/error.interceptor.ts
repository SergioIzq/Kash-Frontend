import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor HTTP funcional para manejo global de errores
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const messageService = inject(MessageService, { optional: true });
    
    return next(req).pipe(
        catchError(error => {
            let errorMessage = 'Ha ocurrido un error';
            
            if (error.error instanceof ErrorEvent) {
                // Error del cliente
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Error del servidor
                switch (error.status) {
                    case 400:
                        errorMessage = error.error?.message || 'Solicitud inválida';
                        break;
                    case 401:
                        errorMessage = 'No autorizado. Por favor, inicia sesión';
                        break;
                    case 403:
                        errorMessage = 'No tienes permisos para realizar esta acción';
                        break;
                    case 404:
                        errorMessage = 'Recurso no encontrado';
                        break;
                    case 500:
                        errorMessage = 'Error del servidor. Intenta nuevamente';
                        break;
                    case 0:
                        errorMessage = 'Sin conexión al servidor';
                        break;
                    default:
                        errorMessage = error.error?.message || 'Error desconocido';
                }
            }
            
            // Mostrar mensaje de error si MessageService está disponible
            if (messageService) {
                messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMessage,
                    life: 5000
                });
            }
            
            console.error('HTTP Error:', error);
            return throwError(() => ({ ...error, userMessage: errorMessage }));
        })
    );
};
