import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    standalone: true,
    selector: 'app-footer',
    imports: [RouterModule],
    template: `<div class="card layout-footer mb-4 flex flex-wrap align-items-center gap-2">
                <span>Kash © 2026</span>
                <span class="mx-2">|</span>
                <a routerLink="/legal/aviso-legal" class="text-color-secondary hover:text-primary">Aviso legal</a>
                <a routerLink="/legal/privacidad" class="text-color-secondary hover:text-primary">Privacidad</a>
                <a routerLink="/legal/cookies" class="text-color-secondary hover:text-primary">Cookies</a>
                <span class="mx-2">|</span>
                <span>Desarrollado por <a href="https://sergioizq.com" target="_blank" class="text-primary font-bold hover:underline">sergioizq.dev</a></span>
                </div>`
})
export class AppFooter {}
