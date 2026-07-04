import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppLogo } from '@/layout/component/app.logo';

/**
 * Layout compartido por las páginas legales públicas (Aviso Legal, Privacidad, Cookies).
 * No requiere autenticación: usa su propio encabezado en vez del layout de la app.
 */
@Component({
    selector: 'app-legal-page-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, AppLogo],
    styles: [`
        .legal-wrap { min-height: 100%; padding: 0; }
        .legal-card {
            width: 100%;
            margin: 0 auto;
        }
        .legal-header {
            display: flex;
            align-items: center;
            gap: .75rem;
            margin-bottom: 1rem;
        }
        .legal-header span { font-weight: 800; font-size: 1.05rem; }
        .legal-updated { color: var(--text-color-secondary); font-size: .85rem; margin: 0 0 1.75rem; }
        .legal-nav { display: flex; gap: 1.25rem; margin: 2.5rem 0 0; padding-top: 1.5rem; border-top: 1px solid var(--surface-200); flex-wrap: wrap; }
        .legal-nav a { color: var(--text-color-secondary); font-size: .85rem; text-decoration: none; }
        .legal-nav a:hover { color: var(--primary-color); text-decoration: underline; }
        .back-link { display: inline-flex; align-items: center; gap: .4rem; color: var(--text-color-secondary); font-size: .85rem; text-decoration: none; margin-bottom: 1.5rem; }
        .back-link:hover { color: var(--primary-color); }
    `],
    template: `
        <div class="legal-wrap">
            <div class="card legal-card">
                <div class="legal-header">
                    <app-logo style="height: 28px" />
                    <span>Kash</span>
                </div>
                <h3 class="m-0 mb-1">
                    <i class="pi pi-shield mr-2 text-primary"></i>
                    {{ title() }}
                </h3>
                <p class="legal-updated">Última actualización: {{ updated() }}</p>

                <ng-content></ng-content>

                <nav class="legal-nav">
                    <a routerLink="/legal/aviso-legal">Aviso Legal</a>
                    <a routerLink="/legal/privacidad">Política de Privacidad</a>
                    <a routerLink="/legal/cookies">Política de Cookies</a>
                </nav>
            </div>
        </div>
    `
})
export class LegalPageLayoutComponent {
    title = input.required<string>();
    updated = input<string>('julio de 2026');
}
