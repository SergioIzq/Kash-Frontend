import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { inject } from '@angular/core';
import { AuthService } from '@/core/services/api/auth.service';
import { Usuario } from '../models';

interface AuthState {
    user: Usuario | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
};

/**
 * Signal Store global para autenticación
 * Optimizado con computed signals y métodos reactivos
 */
export const AuthStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    
    withComputed((store) => ({
        isLoggedIn: computed(() => store.isAuthenticated() && store.user() !== null),
        userName: computed(() => {
            const user = store.user();
            return user ? `${user.nombre} ${user.apellido || ''}`.trim() : '';
        }),
        userInitials: computed(() => {
            const user = store.user();
            if (!user) return '';
            const firstInitial = user.nombre?.charAt(0) || '';
            const lastInitial = user.apellido?.charAt(0) || '';
            return `${firstInitial}${lastInitial}`.toUpperCase();
        })
    })),
    
    withMethods((store, authService = inject(AuthService)) => ({
        // Login reactivo
        login: rxMethod<{ email: string; password: string }>(
            pipe(
                tap(() => patchState(store, { loading: true, error: null })),
                switchMap((credentials) => {
                    // Convertir a PascalCase para el backend C#
                    const loginCredentials = {
                        correo: credentials.email,
                        contrasena: credentials.password
                    };
                    return authService.login(loginCredentials).pipe(
                        tapResponse({
                            next: (response) => {
                                const user = authService.getCurrentUser();
                                patchState(store, {
                                    user,
                                    isAuthenticated: true,
                                    loading: false,
                                    error: null
                                });
                            },
                            error: (error: any) => {
                                patchState(store, {
                                    loading: false,
                                    error: error.userMessage || 'Error al iniciar sesión'
                                });
                            }
                        })
                    );
                })
            )
        ),
        
        // Logout
        logout: rxMethod<void>(
            pipe(
                tap(() => patchState(store, { loading: true })),
                switchMap(() =>
                    authService.logout().pipe(
                        tapResponse({
                            next: () => {
                                patchState(store, {
                                    user: null,
                                    isAuthenticated: false,
                                    loading: false,
                                    error: null
                                });
                            },
                            error: () => {
                                // Limpiar estado aunque falle
                                patchState(store, {
                                    user: null,
                                    isAuthenticated: false,
                                    loading: false
                                });
                            }
                        })
                    )
                )
            )
        ),
        
        // Actualizar usuario
        setUser(user: Usuario | null) {
            patchState(store, { user, isAuthenticated: user !== null });
        },
        
        // Limpiar error
        clearError() {
            patchState(store, { error: null });
        }
    })),
    
    withHooks({
        onInit(store, authService = inject(AuthService)) {
            // Sincronizar con AuthService al iniciar
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                store.setUser(currentUser);
            }
        }
    })
);
