import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/api/auth.service';
import { map } from 'rxjs';

/**
 * Guard funcional para verificar roles de usuario
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
    return () => {
        const authService = inject(AuthService);
        const router = inject(Router);
        
        return authService.currentUser$.pipe(
            map(user => {
                if (!user) {
                    router.navigate(['/auth/login']);
                    return false;
                }
                
                const hasRole = allowedRoles.some(role => 
                    user.rol?.toLowerCase() === role.toLowerCase()
                );
                
                if (hasRole) {
                    return true;
                }
                
                // Redirigir a página de acceso denegado
                router.navigate(['/auth/access']);
                return false;
            })
        );
    };
};

/**
 * Guard para admin
 */
export const adminGuard: CanActivateFn = roleGuard(['admin']);

/**
 * Guard para usuarios premium
 */
export const premiumGuard: CanActivateFn = roleGuard(['premium', 'admin']);
