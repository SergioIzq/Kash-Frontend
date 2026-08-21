import { Component, inject, input, output, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GastoService } from '@/core/services/api/gasto.service';
import { IngresoService } from '@/core/services/api/ingreso.service';
import { GastoHabitual, IngresoHabitual } from '@/core/models';

export interface TransaccionHabitualSeleccionada {
    conceptoId: string;
    conceptoNombre: string;
    categoriaId?: string | null;
    categoriaNombre?: string | null;
    cuentaId: string;
    cuentaNombre: string;
    formaPagoId: string;
    formaPagoNombre: string;
    terceroId?: string | null;
    terceroNombre?: string | null;
    personaId?: string | null;
    personaNombre?: string | null;
}

/**
 * Chips de un toque con las combinaciones completas de gasto/ingreso más repetidas del
 * usuario (capability transacciones-habituales). No muestra nada si no hay combinaciones
 * repetidas. Nota: el backend no expone el importe del último uso de la combinación (solo
 * concepto/categoría/cuenta/formaPago/tercero/persona + veces/último uso), así que al
 * seleccionar un chip el importe no se pre-rellena.
 */
@Component({
    selector: 'app-transacciones-habituales-chips',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        `
            .habituales-titulo {
                display: flex;
                align-items: baseline;
                gap: 0.4rem;
                margin-bottom: 0.6rem;
            }
            .chips-row {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }
            .chip-habitual {
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                padding: 0.4rem 0.85rem;
                border-radius: 999px;
                font-size: 0.82rem;
                font-weight: 600;
                background: var(--surface-100);
                border: 1px solid var(--surface-200);
                cursor: pointer;
                white-space: nowrap;
                transition:
                    background 0.15s,
                    border-color 0.15s,
                    box-shadow 0.15s,
                    transform 0.15s;
            }
            .chip-habitual:hover {
                background: var(--surface-200);
                border-color: var(--primary-color);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
                transform: translateY(-1px);
            }
            .chip-habitual:active {
                transform: translateY(0);
                box-shadow: none;
            }
            .chip-habitual:focus-visible {
                outline: 2px solid var(--primary-color);
                outline-offset: 2px;
            }

            /* Móvil: fila de chips deslizable horizontalmente (patrón habitual en apps
               móviles para listas cortas de sugerencias) en vez de envolver en varias
               líneas apretadas, y objetivos táctiles algo más grandes. */
            @media screen and (max-width: 768px) {
                .chips-row {
                    flex-wrap: nowrap;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    padding-bottom: 0.35rem;
                    margin: 0 -0.25rem;
                    padding-left: 0.25rem;
                    padding-right: 0.25rem;
                    scrollbar-width: none;
                }
                .chips-row::-webkit-scrollbar {
                    display: none;
                }
                .chip-habitual {
                    padding: 0.55rem 1rem;
                    font-size: 0.85rem;
                    flex: 0 0 auto;
                }
            }
        `
    ],
    template: `
        @if (habituales().length > 0) {
            <div class="mb-4">
                <div class="habituales-titulo">
                    <span class="font-semibold text-900 text-sm">{{ tipo() === 'gasto' ? 'Gastos habituales' : 'Ingresos habituales' }}</span>
                    <span class="text-500 text-xs">(clic para crear)</span>
                </div>
                <div class="chips-row">
                    @for (habitual of habituales(); track habitual.conceptoId + habitual.cuentaId + habitual.formaPagoId + (tercero(habitual) ?? '') + (habitual.personaId ?? '')) {
                        <button type="button" class="chip-habitual" (click)="seleccionar.emit(toSeleccion(habitual))">
                            <i class="pi pi-bolt text-primary"></i>
                            {{ habitual.conceptoNombre }}
                            @if (tercero(habitual)) {
                                <span class="text-500 font-normal">· {{ tercero(habitual) }}</span>
                            }
                        </button>
                    }
                </div>
            </div>
        }
    `
})
export class TransaccionesHabitualesChipsComponent {
    private readonly gastoService = inject(GastoService);
    private readonly ingresoService = inject(IngresoService);

    tipo = input.required<'gasto' | 'ingreso'>();
    /** Incrementar este valor desde el padre fuerza una recarga (ej. tras crear un gasto/ingreso). */
    refresco = input<number>(0);
    seleccionar = output<TransaccionHabitualSeleccionada>();

    habituales = signal<(GastoHabitual | IngresoHabitual)[]>([]);

    constructor() {
        effect(() => {
            this.tipo();
            this.refresco(); // dependencia intencional: solo para forzar el refetch, no se usa el valor
            if (this.tipo() === 'gasto') {
                this.gastoService.getHabituales(6).subscribe({
                    next: (data) => this.habituales.set(data),
                    error: () => this.habituales.set([])
                });
            } else {
                this.ingresoService.getHabituales(6).subscribe({
                    next: (data) => this.habituales.set(data),
                    error: () => this.habituales.set([])
                });
            }
        });
    }

    tercero(habitual: GastoHabitual | IngresoHabitual): string | null | undefined {
        return this.tipo() === 'gasto' ? (habitual as GastoHabitual).proveedorNombre : (habitual as IngresoHabitual).clienteNombre;
    }

    toSeleccion(habitual: GastoHabitual | IngresoHabitual): TransaccionHabitualSeleccionada {
        const terceroId = this.tipo() === 'gasto' ? (habitual as GastoHabitual).proveedorId : (habitual as IngresoHabitual).clienteId;
        return {
            conceptoId: habitual.conceptoId,
            conceptoNombre: habitual.conceptoNombre,
            categoriaId: habitual.categoriaId,
            categoriaNombre: habitual.categoriaNombre,
            cuentaId: habitual.cuentaId,
            cuentaNombre: habitual.cuentaNombre,
            formaPagoId: habitual.formaPagoId,
            formaPagoNombre: habitual.formaPagoNombre,
            terceroId,
            terceroNombre: this.tercero(habitual),
            personaId: habitual.personaId,
            personaNombre: habitual.personaNombre
        };
    }
}
