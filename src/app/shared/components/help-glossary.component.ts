import { Component, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

/** Una fila del glosario: un término (botón, columna, indicador…) y su explicación. */
export interface GlossaryRow {
    /** Clase del icono PrimeNG, p. ej. 'pi pi-wallet'. Opcional. */
    icon?: string;
    /** Color del icono en hex, p. ej. '#6366f1'. Opcional (por defecto color primario). */
    color?: string;
    /** Nombre del término. */
    term: string;
    /** Definición. Admite HTML sencillo (strong, em, code, ul, li…). */
    def: string;
}

/** Un bloque del glosario con un título y sus filas. */
export interface GlossarySection {
    title: string;
    rows: GlossaryRow[];
}

/** Configuración completa del glosario de una pantalla. */
export interface GlossaryConfig {
    /** Cabecera del diálogo, p. ej. 'Glosario · Gastos'. */
    title: string;
    /** Descripción de qué hace la pantalla (se muestra arriba del todo). Opcional. */
    intro?: string;
    /** Secciones del glosario. */
    sections: GlossarySection[];
}

/**
 * Botón de ayuda reutilizable que abre un diálogo con el glosario de la pantalla:
 * qué hace, qué botones tiene y qué significan sus columnas.
 *
 * Uso:
 *   <app-help-glossary [config]="glossary" />
 */
@Component({
    selector: 'app-help-glossary',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule, DividerModule, TooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
        .help-intro {
            font-size: .875rem;
            line-height: 1.6;
            color: var(--text-color-secondary);
            margin: 0 0 1rem 0;
        }
        .help-section-title {
            font-size: .7rem;
            font-weight: 700;
            letter-spacing: .08em;
            text-transform: uppercase;
            color: var(--text-color-secondary);
            margin: 0 0 .75rem 0;
        }
        .help-row {
            display: flex;
            gap: .75rem;
            align-items: flex-start;
            padding: .5rem 0;
        }
        .help-icon-wrap {
            width: 2rem;
            height: 2rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .help-term {
            font-weight: 600;
            font-size: .875rem;
            color: var(--text-color);
        }
        .help-def {
            font-size: .8rem;
            color: var(--text-color-secondary);
            margin-top: .15rem;
            line-height: 1.5;
        }
        .help-def :is(ul, ol) { margin: .25rem 0 0 0; padding-left: 1.1rem; }
    `],
    template: `
        <p-button
            [icon]="'pi pi-question-circle'"
            [label]="label || undefined"
            severity="secondary"
            [outlined]="true"
            [rounded]="!label"
            [pTooltip]="tooltip"
            (onClick)="visible.set(true)"
        />

        <p-dialog
            [header]="config.title"
            [visible]="visible()"
            (visibleChange)="visible.set($event)"
            [modal]="true"
            [draggable]="false"
            [resizable]="false"
            [dismissableMask]="true"
            [style]="{ width: '42rem', maxWidth: '95vw' }"
            styleClass="help-dialog"
        >
            @if (config.intro) {
                <p class="help-intro" [innerHTML]="config.intro"></p>
            }

            @for (section of config.sections; track section.title; let last = $last) {
                <p class="help-section-title">{{ section.title }}</p>

                @for (row of section.rows; track row.term) {
                    <div class="help-row">
                        @if (row.icon) {
                            <div class="help-icon-wrap" [style.background]="(row.color || defaultColor) + '10'">
                                <i [class]="row.icon" [style.color]="row.color || defaultColor"></i>
                            </div>
                        }
                        <div>
                            <div class="help-term">{{ row.term }}</div>
                            <div class="help-def" [innerHTML]="row.def"></div>
                        </div>
                    </div>
                }

                @if (!last) {
                    <p-divider />
                }
            }

            <ng-template pTemplate="footer">
                <p-button label="Cerrar" icon="pi pi-times" severity="secondary" (onClick)="visible.set(false)" />
            </ng-template>
        </p-dialog>
    `
})
export class HelpGlossaryComponent {
    /** Contenido del glosario de la pantalla. */
    @Input({ required: true }) config!: GlossaryConfig;
    /** Texto opcional del botón. Si se omite, el botón es solo icono (redondo). */
    @Input() label?: string;
    /** Tooltip del botón. */
    @Input() tooltip: string = 'Ayuda / Glosario';

    readonly defaultColor = '#6366f1';
    readonly visible = signal(false);
}
