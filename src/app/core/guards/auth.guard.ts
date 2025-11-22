import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/api/auth.service';
import { map } from 'rxjs';

/**
 * Guard funcional moderno para proteger rutas autenticadas
 */
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    return authService.isAuthenticated$.pipe(
        map(isAuthenticated => {
            if (isAuthenticated) {
                return true;
            }
            
            // Redirigir a login y guardar URL intentada
            router.navigate(['/auth/login'], {
                queryParams: { returnUrl: state.url }
            });
            return false;
        })
    );
};

/**
 * Guard para evitar acceso a login cuando ya está autenticado
 */
export const noAuthGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    return authService.isAuthenticated$.pipe(
        map(isAuthenticated => {
            if (!isAuthenticated) {
                return true;
            }
            
            // Si ya está autenticado, redirigir al dashboard
            router.navigate(['/']);
            return false;
        })
    );
};
