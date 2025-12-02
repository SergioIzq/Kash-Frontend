import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs'; // ✅ Necesario para async/await
import { AuthService } from '@/core/services/api/auth.service';
import { LoginCredentials, Usuario } from '../models';
import { ErrorResponse } from '../models/error-response.model';

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
        
        async login(credentials: LoginCredentials): Promise<void> {
            patchState(store, { loading: true, error: null });

            try {
                // Convertir a PascalCase para backend
                const loginPayload = {
                    correo: credentials.correo,
                    contrasena: credentials.contrasena
                };

                // Esperamos la respuesta
                await firstValueFrom(authService.login(loginPayload));
                
                // Si pasa, obtenemos el usuario actual
                const user = authService.getCurrentUser();
                
                patchState(store, {
                    user,
                    isAuthenticated: true,
                    loading: false,
                    error: null
                });

            } catch (err: any) {
                // Extraemos el mensaje de error de tu backend
                const errorMsg = (err.error as ErrorResponse)?.detail || 'Error al iniciar sesión';
                
                patchState(store, {
                    loading: false,
                    error: errorMsg
                });
                
                // ⚠️ IMPORTANTE: Relanzar error para el componente
                throw err;
            }
        },

        async register(payload: { correo: string; contrasena: string }): Promise<void> {
            patchState(store, { loading: true, error: null });
            try {
                await firstValueFrom(authService.register(payload));
                patchState(store, { loading: false });
            } catch (err: any) {
                const errorMsg = (err.error as ErrorResponse)?.detail || 'Error al registrar usuario';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        async confirmEmail(token: string): Promise<void> {
            patchState(store, { loading: true, error: null });
            try {
                await firstValueFrom(authService.confirmEmail(token));
                patchState(store, { loading: false });
            } catch (err: any) {
                const errorMsg = (err.error as ErrorResponse)?.detail || 'Error al confirmar correo';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        async forgotPassword(email: string): Promise<void> {
            patchState(store, { loading: true, error: null });
            try {
                await firstValueFrom(authService.forgotPassword(email));
                patchState(store, { loading: false });
            } catch (err: any) {
                const errorMsg = (err.error as ErrorResponse)?.detail || 'No se pudo enviar el correo';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        async resetPassword(payload: { email: string; token: string; newPassword: string }): Promise<void> {
            patchState(store, { loading: true, error: null });
            try {
                await firstValueFrom(authService.resetPassword(payload.email, payload.token, payload.newPassword));
                patchState(store, { loading: false });
                // Aquí el componente recibirá el control sin errores y mostrará la pantalla de éxito
            } catch (err: any) {
                const errorMsg = (err.error as ErrorResponse)?.detail || 'No se pudo restablecer la contraseña';
                patchState(store, { loading: false, error: errorMsg });
                // Aquí el componente caerá en su bloque catch
                throw err;
            }
        },

        // 6. RESEND CONFIRMATION
        async resendConfirmationEmail(email: string): Promise<void> {
            patchState(store, { loading: true, error: null });
            try {
                await firstValueFrom(authService.resendConfirmation(email));
                patchState(store, { loading: false });
            } catch (err: any) {
                const errorMsg = (err.error as ErrorResponse)?.detail || 'Error al reenviar correo';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        // 7. LOGOUT
        async logout(): Promise<void> {
            patchState(store, { loading: true });
            try {
                await firstValueFrom(authService.logout());
            } catch (err) {
                console.warn('Error en logout backend, limpiando localmente de todos modos', err);
            } finally {
                // Siempre limpiamos el estado local, falle o no el backend
                patchState(store, {
                    user: null,
                    isAuthenticated: false,
                    loading: false,
                    error: null
                });
            }
        },

        // Métodos síncronos auxiliares
        setUser(user: Usuario | null) {
            patchState(store, { user, isAuthenticated: user !== null });
        },

        clearError() {
            patchState(store, { error: null });
        }
    })),

    withHooks({
        onInit(store, authService = inject(AuthService)) {
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                store.setUser(currentUser);
            }
        }
    })
);