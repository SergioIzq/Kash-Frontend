import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthResponse, LoginCredentials, Usuario } from '../../models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/auth`;

    private readonly TOKEN_KEY = 'auth_token';
    private readonly EXPIRES_KEY = 'token_expires_at';
    private readonly USER_KEY = 'user_data';

    private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getUserFromStorage());
    public currentUser$ = this.currentUserSubject.asObservable();

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor() {
        // Verificar token al iniciar
        if (this.hasValidToken()) {
            this.isAuthenticatedSubject.next(true);
        }
    }

    /**
     * Login del usuario
     */
    login(credentials: LoginCredentials): Observable<AuthResponse> {
        console.log('AuthService - Enviando credenciales de login:', credentials);
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
            tap((response) => {
                console.log('AuthService - Login exitoso:', response);
                this.handleAuthSuccess(response);
            }),
            catchError((error) => {
                console.error('AuthService - Error en login:', error);
                return this.handleAuthError(error);
            }),
            shareReplay(1)
        );
    }

    /**
     * Registrar del usuario
     */
    register(payload: { correo: string; contrasena: string }) {
        return this.http.post<void>(`${this.apiUrl}/register`, payload);
    }

    confirmEmail(token: string) {
        return this.http.get<{ mensaje: string }>(`${this.apiUrl}/confirmar-correo?token=${token}`);
    }

    resendConfirmation(email: string) {
        return this.http.post<void>(`${this.apiUrl}/resend-confirmation`, { correo: email });
    }

    /**
     * Logout del usuario
     */
    logout(): Observable<void> {
        this.clearAuthData();
        return of(undefined);
    }

    /**
     * Obtener usuario actual
     */
    getCurrentUser(): Usuario | null {
        return this.currentUserSubject.value;
    }

    /**
     * Obtener token de acceso desde cookie
     */
    getAccessToken(): string | null {
        const name = this.TOKEN_KEY + '=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        for (let cookie of cookieArray) {
            cookie = cookie.trim();
            if (cookie.indexOf(name) === 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }
        return null;
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated(): boolean {
        return this.hasValidToken();
    }

    /**
     * Manejo exitoso de autenticación
     */
    private handleAuthSuccess(response: AuthResponse): void {
        this.setToken(response.token, response.expiresAt);
        this.extractAndSetUser(response.token);
        this.isAuthenticatedSubject.next(true);
    }

    /**
     * Manejo de errores de autenticación
     */
    private handleAuthError(error: any): Observable<never> {
        this.clearAuthData();
        return throwError(() => error);
    }

    /**
     * Guardar token en cookie
     */
    private setToken(token: string, expiresAt: string): void {
        const expiresDate = new Date(expiresAt);
        document.cookie = `${this.TOKEN_KEY}=${token}; expires=${expiresDate.toUTCString()}; path=/; SameSite=Strict; Secure`;
        localStorage.setItem(this.EXPIRES_KEY, expiresAt);
    }

    /**
     * Extraer usuario del JWT y guardarlo
     */
    private extractAndSetUser(token: string): void {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const user: Usuario = {
                id: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub,
                email: payload.email,
                nombre: payload.nombre || payload.email.split('@')[0],
                apellido: payload.apellido,
                rol: payload.role
            };
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            this.currentUserSubject.next(user);
        } catch (error) {
            console.error('Error al extraer usuario del token:', error);
        }
    }

    /**
     * Obtener usuario del storage
     */
    private getUserFromStorage(): Usuario | null {
        const userData = localStorage.getItem(this.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Verificar si hay un token válido
     */
    private hasValidToken(): boolean {
        const token = this.getAccessToken();
        if (!token) return false;

        try {
            // Decodificar JWT para verificar expiración
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000; // Convertir a ms
            return Date.now() < exp;
        } catch {
            return false;
        }
    }

    /**
     * Limpiar datos de autenticación
     */
    private clearAuthData(): void {
        document.cookie = `${this.TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        localStorage.removeItem(this.EXPIRES_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
    }
}
