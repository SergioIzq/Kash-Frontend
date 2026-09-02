import { ChangeDetectionStrategy, Component, output, viewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { Popover, PopoverModule } from 'primeng/popover';
import { CalculadoraImporte, OperadorCalculadora } from '@/shared/utils/calculadora-importe.util';

/**
 * Botón + popover con una calculadora básica (operaciones encadenadas, sin precedencia de
 * operadores) para componer el importe de un gasto o un ingreso sin salir del formulario.
 *
 * Se usa como hermano de `app-money-input` dentro de un `p-inputgroup`:
 * ```html
 * <p-inputgroup>
 *   <app-money-input ... />
 *   <app-calculadora-importe (valorConfirmado)="onImporteChange($event)" />
 * </p-inputgroup>
 * ```
 *
 * El `p-popover` vive anidado DENTRO de `p-inputgroup-addon` (no como hermano) para que
 * `p-inputgroup-addon` siga siendo el último hijo real de `.p-inputgroup` y conserve el
 * redondeo de esquina que PrimeNG aplica vía `:last-child`; si el popover fuera hermano,
 * seguiría siendo el último hijo del DOM aunque no pinte nada mientras está cerrado.
 *
 * El resultado NUNCA se aplica solo; hace falta pulsar "Usar este valor" (ver
 * `openspec/changes/calculadora-importe-gasto-ingreso/specs/calculadora-importe/spec.md`).
 * La calculadora siempre arranca en cero al abrirse, sin precargar el importe ya introducido.
 */
@Component({
    selector: 'app-calculadora-importe',
    standalone: true,
    imports: [ButtonModule, InputGroupModule, InputGroupAddonModule, PopoverModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents' },
    template: `
        <p-inputgroup-addon>
            <p-button type="button" icon="pi pi-calculator" [outlined]="true" severity="secondary" (onClick)="popover.toggle($event)" />

            <p-popover #popover [appendTo]="'body'" (onShow)="onAbrir()">
                <div class="calculadora-importe">
                    <div class="calculadora-importe__pantalla" [class.calculadora-importe__pantalla--error]="motor.hayError">
                        @if (motor.operadorActual; as op) {
                            <span class="calculadora-importe__operador-pendiente">{{ op }}</span>
                        }
                        <span class="calculadora-importe__valor">{{ motor.pantalla }}</span>
                    </div>
                    <div class="calculadora-importe__teclado">
                        <button type="button" class="tecla" (click)="digito('7')">7</button>
                        <button type="button" class="tecla" (click)="digito('8')">8</button>
                        <button type="button" class="tecla" (click)="digito('9')">9</button>
                        <button type="button" class="tecla tecla--operador" [class.tecla--activa]="motor.operadorActual === '÷'" (click)="operador('÷')">÷</button>

                        <button type="button" class="tecla" (click)="digito('4')">4</button>
                        <button type="button" class="tecla" (click)="digito('5')">5</button>
                        <button type="button" class="tecla" (click)="digito('6')">6</button>
                        <button type="button" class="tecla tecla--operador" [class.tecla--activa]="motor.operadorActual === '×'" (click)="operador('×')">×</button>

                        <button type="button" class="tecla" (click)="digito('1')">1</button>
                        <button type="button" class="tecla" (click)="digito('2')">2</button>
                        <button type="button" class="tecla" (click)="digito('3')">3</button>
                        <button type="button" class="tecla tecla--operador" [class.tecla--activa]="motor.operadorActual === '-'" (click)="operador('-')">−</button>

                        <button type="button" class="tecla tecla--limpiar" (click)="motor.limpiar()">C</button>
                        <button type="button" class="tecla" (click)="digito('0')">0</button>
                        <button type="button" class="tecla" (click)="digito(',')">,</button>
                        <button type="button" class="tecla tecla--operador" [class.tecla--activa]="motor.operadorActual === '+'" (click)="operador('+')">+</button>

                        <button type="button" class="tecla tecla--igual" (click)="motor.calcular()">=</button>
                    </div>
                    <p-button label="Usar este valor" styleClass="w-full" (onClick)="onUsar()" />
                </div>
            </p-popover>
        </p-inputgroup-addon>
    `,
    styles: [
        `
            /* p-inputgroup-addon es hijo único de este componente, así que las reglas base
               de PrimeNG lo tratan a la vez como :first-child (redondeo/borde izquierdo,
               como si abriera el inputgroup) Y :last-child (redondeo/borde derecho, como
               si lo cerrara) de SU propio padre, en vez de solo :last-child de
               .p-inputgroup: sin esto se ve como un botón redondeado suelto con doble
               borde en vez de fundido con app-money-input. Se anula aquí solo el lado
               izquierdo (con las mismas propiedades lógicas que usa PrimeNG, para competir
               en la cascada por la misma propiedad, y con especificidad mayor que la regla
               base .p-inputgroupaddon:first-child (0,2,0), para ganar sin depender del
               orden de las hojas de estilo). */
            p-inputgroup-addon.p-inputgroupaddon {
                border-start-start-radius: 0;
                border-end-start-radius: 0;
                border-inline-start: none;
            }
            .calculadora-importe {
                width: 15rem;
                padding: 0.5rem;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .calculadora-importe__pantalla {
                display: flex;
                align-items: baseline;
                justify-content: flex-end;
                gap: 0.4rem;
                font-size: 1.25rem;
                font-weight: 600;
                padding: 0.5rem 0.6rem;
                border-radius: 6px;
                background: var(--p-form-field-background, #09090b);
                border: 1px solid var(--p-form-field-border-color, #52525b);
                overflow-x: auto;
                white-space: nowrap;
            }
            .calculadora-importe__pantalla--error {
                color: var(--p-red-500, #ef4444);
            }
            .calculadora-importe__operador-pendiente {
                color: var(--primary-color, #34d399);
                font-size: 1rem;
            }
            .calculadora-importe__valor {
                margin-left: auto;
            }
            .calculadora-importe__teclado {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 0.4rem;
            }
            /* La mayoría de botones de la app (el propio disparador de esta calculadora,
               "Cancelar", "Actualizar", iconos editar/borrar) son p-button "outlined
               secondary": fondo transparente que se funde con el panel + borde gris, no un
               relleno sólido. Se usan los mismos tokens (--p-button-outlined-secondary-*)
               para que las teclas no destaquen como una caja gris ajena al resto de la UI. */
            .tecla {
                padding: 0.6rem 0;
                border: 1px solid var(--p-button-outlined-secondary-border-color, #3f3f46);
                border-radius: 6px;
                background: transparent;
                color: var(--p-button-outlined-secondary-color, #a1a1aa);
                cursor: pointer;
                font-size: 1rem;
            }
            .tecla:hover {
                background: var(--p-button-outlined-secondary-hover-background, rgba(255, 255, 255, 0.04));
            }
            .tecla--operador {
                color: var(--p-content-color, #ffffff);
                font-weight: 600;
            }
            .tecla--activa {
                background: var(--primary-color, #34d399);
                color: var(--p-primary-contrast-color, #18181b);
                border-color: var(--primary-color, #34d399);
            }
            .tecla--limpiar {
                color: var(--p-red-500, #ef4444);
                font-weight: 600;
            }
            .tecla--igual {
                grid-column: span 4;
                background: var(--primary-color, #34d399);
                color: var(--p-primary-contrast-color, #18181b);
                border-color: var(--primary-color, #34d399);
                font-weight: 600;
            }
        `
    ]
})
export class CalculadoraImporteComponent {
    protected readonly popover = viewChild.required<Popover>('popover');

    readonly valorConfirmado = output<number>();

    protected motor = new CalculadoraImporte();

    protected onAbrir(): void {
        this.motor = new CalculadoraImporte();
    }

    protected digito(valor: string): void {
        this.motor.introducirDigito(valor);
    }

    protected operador(valor: OperadorCalculadora): void {
        this.motor.introducirOperador(valor);
    }

    protected onUsar(): void {
        this.valorConfirmado.emit(this.motor.obtenerResultado());
        this.popover().hide();
    }
}
