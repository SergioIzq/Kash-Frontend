import { Component, output, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * Cabecera fija para el desplegable de un `p-autoComplete`, con un botón que permite
 * ocultar el teclado virtual en móvil sin cerrar el propio desplegable, para poder
 * hacer scroll por la lista con más comodidad.
 *
 * Uso: `<ng-template pTemplate="header"><app-cerrar-teclado-boton (cerrar)="algo.blur()" /></ng-template>`.
 * El propio componente no sabe qué input hay que desenfocar; solo emite la intención,
 * dejando que el consumidor haga `blur()` sobre el input del `p-autoComplete` concreto
 * (confirmado en pruebas manuales: `blur()` no cierra el desplegable).
 */
@Component({
    selector: 'app-cerrar-teclado-boton',
    standalone: true,
    imports: [ButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        `
            .cerrar-teclado-header {
                display: flex;
                justify-content: flex-end;
                padding: 0.35rem 0.5rem;
                border-bottom: 1px solid var(--surface-200);
            }
        `
    ],
    template: `
        <div class="cerrar-teclado-header">
            <p-button icon="pi pi-angle-down" label="Cerrar teclado" [text]="true" size="small" severity="secondary" (onClick)="cerrar.emit()" />
        </div>
    `
})
export class CerrarTecladoBotonComponent {
    cerrar = output<void>();
}
