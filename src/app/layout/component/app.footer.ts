import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="card layout-footer">
                AhorroLand © 2025
                <span class="mx-2">|</span>
                    Desarrollado por <a href="mailto:tu@email.com" class="text-primary font-bold hover:underline">sergioizq.dev@gmail.com</a>    
                </div>`
})
export class AppFooter {}
