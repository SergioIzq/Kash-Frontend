import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/api/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

/**
 * Interceptor HTTP moderno funcional para autenticación
 * Añade el token a todas las peticiones y maneja refresh automático
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    
    // Excluir rutas de autenticación
    if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
        return next(req);
    }
    
    const token = authService.getAccessToken();
    
    if (token) {
        // Clonar request y añadir token
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        
        return next(authReq).pipe(
            catchError(error => {
                // Si es 401, limpiar sesión y redirigir
                if (error.status === 401) {
                    authService.logout().subscribe();
                }
                return throwError(() => error);
            })
        );
    }
    
    return next(req);
};
