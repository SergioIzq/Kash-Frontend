import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

const STORAGE_KEY = 'kash_cookie_consent_v1';

@Component({
    selector: 'app-cookie-consent-banner',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
        .cookie-banner {
            position: fixed;
            left: 1rem;
            right: 1rem;
            bottom: 1rem;
            z-index: 9999;
            max-width: 780px;
            margin: 0 auto;
            background: var(--surface-0);
            border: 1px solid var(--surface-200);
            border-radius: 14px;
            box-shadow: 0 12px 32px rgba(0,0,0,.18);
            padding: 1.1rem 1.25rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 1rem;
        }
        .cookie-banner p { margin: 0; font-size: .88rem; color: var(--text-color-secondary); flex: 1 1 320px; }
        .cookie-banner a { color: var(--primary-color); font-weight: 600; text-decoration: none; }
        .cookie-banner a:hover { text-decoration: underline; }
        .cookie-actions { display: flex; gap: .5rem; flex-shrink: 0; margin-left: auto; }
    `],
    template: `
        @if (visible()) {
            <div class="cookie-banner" role="dialog" aria-label="Aviso de cookies">
                <p>
                    <i class="pi pi-shield mr-2 text-primary"></i>
                    Usamos únicamente almacenamiento técnico necesario para que Kash funcione (mantener tu sesión iniciada y el
                    funcionamiento sin conexión de la app). No usamos cookies de publicidad ni de analítica de terceros.
                    Más información en nuestra <a routerLink="/legal/cookies">Política de Cookies</a>.
                </p>
                <div class="cookie-actions">
                    <p-button label="Entendido" size="small" (onClick)="aceptar()" />
                </div>
            </div>
        }
    `
})
export class CookieConsentBannerComponent {
    visible = signal(this.leerConsentimientoPrevio());

    private leerConsentimientoPrevio(): boolean {
        try {
            return localStorage.getItem(STORAGE_KEY) !== '1';
        } catch {
            return false; // localStorage no disponible: no molestamos con el banner
        }
    }

    aceptar(): void {
        try {
            localStorage.setItem(STORAGE_KEY, '1');
        } catch {
            /* localStorage no disponible: simplemente ocultamos el banner en esta sesión */
        }
        this.visible.set(false);
    }
}
