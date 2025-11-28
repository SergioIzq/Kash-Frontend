import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const messageService = inject(MessageService, { optional: true });

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // 1. Permitir saltar el manejo global si enviamos un header específico
            if (req.headers.has('X-Skip-Global-Error')) {
                return throwError(() => error);
            }

            let summary = 'Error';
            let detail = 'Ha ocurrido un error inesperado';
            let severity = 'error';

            // 2. Lógica de extracción del mensaje (Backend .NET)
            if (error.error instanceof ErrorEvent) {
                // Error del lado del cliente (red, etc.)
                detail = `Error de comunicación: ${error.error.message}`;
            } else {
                // Error del servidor
                detail = extractErrorMessage(error);
                
                // Ajustar título según status
                switch (error.status) {
                    case 400: summary = 'Datos inválidos'; break;
                    case 401: summary = 'Sesión expirada'; break;
                    case 403: summary = 'Acceso denegado'; break;
                    case 404: summary = 'No encontrado'; break;
                    case 409: summary = 'Conflicto'; break;
                    case 422: summary = 'Error de validación'; break; // Común en APIs modernas
                    case 500: summary = 'Error del servidor'; break;
                    case 0:   summary = 'Sin conexión'; detail = 'No se puede contactar con el servidor'; break;
                }
            }

            // 3. Mostrar Toast
            if (messageService) {
                messageService.add({
                    severity: severity,
                    summary: summary,
                    detail: detail,
                    life: 5000,
                    icon: getIconByStatus(error.status) // Opcional: íconos dinámicos
                });
            }

            console.error('API Error:', error);
            // Retornamos el error agregando la propiedad 'userMessage' por si el componente la necesita
            return throwError(() => ({ ...error, userMessage: detail }));
        })
    );
};

// Función auxiliar para extraer el mensaje real de .NET
function extractErrorMessage(error: HttpErrorResponse): string {
    // Caso 1: Estructura ErrorResponse personalizada (tu backend actual)
    if (error.error?.message) {
        return error.error.message;
    }

    // Caso 2: ValidationProblemDetails estándar de .NET (400 Bad Request)
    // Devuelve: { errors: { "Email": ["El email es invalido"] } }
    if (error.error?.errors) {
        const firstKey = Object.keys(error.error.errors)[0];
        if (firstKey && error.error.errors[firstKey].length > 0) {
            return error.error.errors[firstKey][0]; // Devuelve el primer error de validación
        }
    }

    // Caso 3: ProblemDetails estándar (propiedad 'detail')
    if (error.error?.detail) {
        return error.error.detail;
    }

    // Caso 4: Texto plano o fallback
    if (typeof error.error === 'string') {
        return error.error;
    }

    return error.statusText || 'Error desconocido';
}

function getIconByStatus(status: number): string {
    if (status === 401 || status === 403) return 'pi pi-lock';
    if (status === 0) return 'pi pi-wifi';
    return 'pi pi-times-circle';
}