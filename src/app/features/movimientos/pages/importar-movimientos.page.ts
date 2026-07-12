import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

import { MovimientoService } from '@/core/services/api/movimiento.service';
import {
    ColumnMapping,
    ImportarMovimientosResult,
    MovimientoImportError,
    defaultColumnMapping
} from '@/core/models/movimiento-import.model';

type Step = 'form' | 'previewing' | 'review' | 'confirming' | 'result';
type AmountMode = 'signed' | 'split';

interface ReviewRow {
    incluir: boolean;
    fecha: string;
    descripcion: string;
    importe: number;
    tipo: 'gasto' | 'ingreso';
    categoriaNombre: string;
    cuentaNombre: string;
    conceptoNombre: string;
    formaPagoNombre: string;
    proveedorNombre: string | null;
    esDuplicado: boolean;
    reglaAplicada: boolean;
    reglaPatron: string | null;
    origen: string;
}

@Component({
    selector: 'app-importar-movimientos',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputTextModule,
        InputNumberModule,
        ButtonModule,
        CheckboxModule,
        SelectButtonModule,
        TableModule,
        TagModule,
        ProgressSpinnerModule,
        TooltipModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
        .drop-zone {
            border: 2px dashed var(--surface-400);
            border-radius: 10px;
            padding: 2.2rem 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: border-color .15s, background .15s;
        }
        .drop-zone:hover, .drop-zone.dragover {
            border-color: var(--primary-color);
            background: color-mix(in srgb, var(--primary-color) 6%, transparent);
        }
        .drop-zone.has-file {
            border-color: #22c55e;
            background: color-mix(in srgb, #22c55e 6%, transparent);
        }
        .field-label { font-size: .8rem; font-weight: 600; color: var(--text-color-secondary); margin-bottom: .35rem; display:block; }
        .file-chip {
            display:flex; align-items:center; gap:.6rem; padding:.45rem .7rem;
            border:1px solid var(--surface-200); border-radius:8px; background: var(--surface-0);
        }
        .file-chip .name { font-weight:600; font-size:.85rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .tipo-pill {
            border: 1px solid transparent; border-radius: 999px; padding: .15rem .6rem;
            font-size: .72rem; font-weight: 700; cursor: pointer; white-space: nowrap;
        }
        .tipo-pill.gasto { background: color-mix(in srgb, #ef4444 12%, transparent); color: #dc2626; border-color: #fca5a5; }
        .tipo-pill.ingreso { background: color-mix(in srgb, #22c55e 14%, transparent); color: #16a34a; border-color: #86efac; }
        :host ::ng-deep tr.dup-row > td { background: color-mix(in srgb, #f59e0b 9%, transparent) !important; }
        :host ::ng-deep tr.selected-row > td { background: color-mix(in srgb, var(--primary-color) 8%, transparent) !important; }
        .chip { display:inline-flex; align-items:center; gap:.4rem; padding:.3rem .7rem; border-radius:999px;
            font-size:.78rem; font-weight:600; background: var(--surface-100); }
        /* Controles PrimeNG a ancho completo y responsive */
        :host ::ng-deep .p-selectbutton { display:flex; flex-wrap:wrap; width:100%; }
        :host ::ng-deep .p-selectbutton .p-togglebutton { flex:1 1 auto; justify-content:center; }
        :host ::ng-deep .p-inputnumber { width:100%; }
    `],
    template: `
        <div class="card">
            <div class="flex align-items-center gap-3 mb-1">
                <i class="pi pi-upload text-primary text-2xl"></i>
                <span class="font-bold text-2xl">Importar movimientos del banco</span>
            </div>
            <p class="text-500 mt-0 mb-4">
                Sube uno o varios extractos (CSV o PDF) del mismo banco. Kash los combinará en una
                previsualización para que <strong>revises y edites</strong> antes de crear nada.
            </p>

            <!-- ── Paso 1: formulario ─────────────────────────────── -->
            @if (step() === 'form') {
                <div class="flex flex-col gap-5 w-full">

                    <!-- Drop zone (multi-archivo) -->
                    <div>
                        <span class="field-label">1. Archivos del extracto</span>
                        <div
                            class="drop-zone"
                            [class.has-file]="selectedFiles().length > 0"
                            [class.dragover]="isDragOver()"
                            (click)="fileInput.click()"
                            (dragover)="onDragOver($event)"
                            (dragleave)="isDragOver.set(false)"
                            (drop)="onDrop($event)"
                        >
                            @if (selectedFiles().length === 0) {
                                <i class="pi pi-cloud-upload text-4xl text-400 block mb-3"></i>
                                <p class="font-semibold text-900 m-0">Arrastra tus extractos aquí</p>
                                <p class="text-500 text-sm mt-1 mb-0">o haz clic para seleccionar · varios a la vez · CSV o PDF · máx. 10 MB c/u</p>
                            } @else {
                                <i class="pi pi-check-circle text-3xl text-green-500 block mb-2"></i>
                                <p class="font-semibold m-0">{{ selectedFiles().length }} archivo(s) seleccionado(s)</p>
                                <p class="text-500 text-sm m-0 mt-1">Haz clic o arrastra para añadir más</p>
                            }
                        </div>
                        <input #fileInput type="file" multiple accept=".csv,.pdf,text/csv,application/pdf"
                            class="hidden" (change)="onFileChange($event)" />

                        @if (selectedFiles().length) {
                            <div class="flex flex-col gap-2 mt-2">
                                @for (f of selectedFiles(); track f.name + f.size) {
                                    <div class="file-chip">
                                        <i [class]="iconFor(f)" class="text-lg"></i>
                                        <span class="name flex-1">{{ f.name }}</span>
                                        <span class="text-500 text-xs">{{ sizeOf(f) }}</span>
                                        <button type="button" class="p-link text-400" (click)="removeFile(f); $event.stopPropagation()"
                                            pTooltip="Quitar"><i class="pi pi-times"></i></button>
                                    </div>
                                }
                                <div class="flex justify-end">
                                    <p-button label="Quitar todos" severity="secondary" [text]="true" size="small"
                                        icon="pi pi-trash" (onClick)="clearFiles()" />
                                </div>
                            </div>
                        }

                        @if (fileError()) {
                            <div class="flex align-items-center gap-2 text-red-500 text-sm mt-2">
                                <i class="pi pi-exclamation-circle"></i> {{ fileError() }}
                            </div>
                        }
                    </div>

                    <!-- Cuenta destino -->
                    <div>
                        <span class="field-label">2. ¿A qué cuenta pertenecen estos extractos?</span>
                        <input pInputText class="w-full" placeholder="Ej. BBVA Nómina"
                            [ngModel]="form().cuentaNombre" (ngModelChange)="patch('cuentaNombre', $event)" />
                        <small class="text-500">Se aplica a todos los archivos. Se crea automáticamente si no existe.</small>
                    </div>

                    <!-- Mapeo CSV -->
                    @if (hasCsv()) {
                        <div>
                            <span class="field-label">3. Mapeo de columnas del CSV (nombre de cabecera o índice 0,1,2…)</span>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label class="text-xs text-500">Columna de fecha</label>
                                    <input pInputText class="w-full" placeholder="Fecha"
                                        [ngModel]="form().fechaColumn" (ngModelChange)="patch('fechaColumn', $event)" />
                                </div>
                                <div>
                                    <label class="text-xs text-500">Columna de concepto</label>
                                    <input pInputText class="w-full" placeholder="Concepto"
                                        [ngModel]="form().conceptoColumn" (ngModelChange)="patch('conceptoColumn', $event)" />
                                </div>
                            </div>

                            <div class="mt-3">
                                <label class="text-xs text-500 block mb-2">¿Cómo viene el importe?</label>
                                <p-selectbutton [options]="amountModes" optionLabel="label" optionValue="value"
                                    [ngModel]="amountMode()" (ngModelChange)="amountMode.set($event)" [allowEmpty]="false" />
                            </div>

                            @if (amountMode() === 'signed') {
                                <div class="mt-3 w-full sm:w-1/2">
                                    <label class="text-xs text-500">Columna de importe (negativo = gasto)</label>
                                    <input pInputText class="w-full" placeholder="Importe"
                                        [ngModel]="form().importeColumn" (ngModelChange)="patch('importeColumn', $event)" />
                                </div>
                            } @else {
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label class="text-xs text-500">Columna de cargo (gastos)</label>
                                        <input pInputText class="w-full" placeholder="Débito / Cargo"
                                            [ngModel]="form().cargoColumn" (ngModelChange)="patch('cargoColumn', $event)" />
                                    </div>
                                    <div>
                                        <label class="text-xs text-500">Columna de abono (ingresos)</label>
                                        <input pInputText class="w-full" placeholder="Crédito / Abono"
                                            [ngModel]="form().abonoColumn" (ngModelChange)="patch('abonoColumn', $event)" />
                                    </div>
                                </div>
                            }
                        </div>
                    }

                    @if (hasPdf()) {
                        <div class="surface-50 border-round-lg p-3 border surface-border">
                            <p class="text-sm m-0 text-700">
                                <i class="pi pi-info-circle text-primary mr-2"></i>
                                Los PDF se procesan automáticamente (fecha al inicio de línea + importe). Si tu banco tiene un
                                formato peculiar, ajusta el <strong>regex de línea</strong> en las opciones avanzadas.
                            </p>
                        </div>
                    }

                    <!-- Opciones avanzadas -->
                    <div>
                        <p-button [text]="true" size="small" severity="secondary"
                            [icon]="showAdvanced() ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                            label="Opciones avanzadas" (onClick)="showAdvanced.set(!showAdvanced())" />

                        @if (showAdvanced()) {
                            <div class="surface-50 border-round-lg p-3 border surface-border flex flex-col gap-3 mt-2">
                                @if (hasCsv()) {
                                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label class="text-xs text-500">Separador de columnas</label>
                                            <p-selectbutton [options]="delimiters" optionLabel="label" optionValue="value"
                                                [ngModel]="form().delimiter ?? 'auto'" (ngModelChange)="patchDelimiter($event)" [allowEmpty]="false" />
                                        </div>
                                        <div>
                                            <label class="text-xs text-500">Decimales</label>
                                            <p-selectbutton [options]="decimals" optionLabel="label" optionValue="value"
                                                [ngModel]="form().decimalSeparator" (ngModelChange)="patch('decimalSeparator', $event)" [allowEmpty]="false" />
                                        </div>
                                        <div class="flex align-items-end gap-2 pb-2">
                                            <p-checkbox [binary]="true" inputId="hasHeader"
                                                [ngModel]="form().hasHeader" (ngModelChange)="patch('hasHeader', $event)" />
                                            <label for="hasHeader" class="text-sm">El fichero tiene cabecera</label>
                                        </div>
                                    </div>
                                }
                                @if (hasPdf()) {
                                    <div>
                                        <label class="text-xs text-500">Regex de línea (opcional, grupos: fecha, concepto, importe | cargo, abono)</label>
                                        <input pInputText class="w-full font-mono text-sm"
                                            placeholder="Regex con grupos con nombre (opcional)"
                                            [ngModel]="form().lineRegex" (ngModelChange)="patch('lineRegex', $event)" />
                                        <small class="text-500 font-mono">Ej: {{ regexEjemplo }}</small>
                                    </div>
                                    <div class="w-full sm:max-w-[260px]">
                                        <label class="text-xs text-500">Si hay varios importes por línea, usar</label>
                                        <p-selectbutton [options]="amountPositions" optionLabel="label" optionValue="value"
                                            [ngModel]="form().amountPosition" (ngModelChange)="patch('amountPosition', $event)" [allowEmpty]="false" />
                                    </div>
                                }
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-xs text-500">Filas iniciales a saltar</label>
                                        <p-inputnumber [showButtons]="true" [min]="0" [max]="50" styleClass="w-full" class="w-full"
                                            [ngModel]="form().skipRows" (ngModelChange)="patch('skipRows', $event ?? 0)" />
                                    </div>
                                    <div>
                                        <label class="text-xs text-500">Formato de fecha (opcional, ej. dd/MM/yyyy)</label>
                                        <input pInputText class="w-full" placeholder="Autodetectar"
                                            [ngModel]="fechaFormato()" (ngModelChange)="setFechaFormato($event)" />
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-xs text-500">Categoría por defecto (gastos)</label>
                                        <input pInputText class="w-full"
                                            [ngModel]="form().categoriaGastoNombre" (ngModelChange)="patch('categoriaGastoNombre', $event)" />
                                    </div>
                                    <div>
                                        <label class="text-xs text-500">Categoría por defecto (ingresos)</label>
                                        <input pInputText class="w-full"
                                            [ngModel]="form().categoriaIngresoNombre" (ngModelChange)="patch('categoriaIngresoNombre', $event)" />
                                    </div>
                                    <div>
                                        <label class="text-xs text-500">Concepto por defecto</label>
                                        <input pInputText class="w-full"
                                            [ngModel]="form().conceptoNombre" (ngModelChange)="patch('conceptoNombre', $event)" />
                                    </div>
                                    <div>
                                        <label class="text-xs text-500">Forma de pago por defecto</label>
                                        <input pInputText class="w-full"
                                            [ngModel]="form().formaPagoNombre" (ngModelChange)="patch('formaPagoNombre', $event)" />
                                    </div>
                                </div>
                            </div>
                        }
                    </div>

                    @if (importError()) {
                        <div class="flex align-items-center gap-2 text-red-500 text-sm">
                            <i class="pi pi-exclamation-triangle"></i> {{ importError() }}
                        </div>
                    }

                    <div class="flex justify-end">
                        <p-button label="Previsualizar movimientos" icon="pi pi-eye"
                            [disabled]="!canImport()" (onClick)="previsualizar()" />
                    </div>
                </div>
            }

            <!-- ── Paso 2: previsualizando ────────────────────────── -->
            @if (step() === 'previewing') {
                <div class="flex flex-col align-items-center justify-center gap-4 py-16">
                    <p-progressspinner strokeWidth="4" styleClass="w-16 h-16" />
                    <p class="font-semibold text-xl text-center m-0">Analizando {{ selectedFiles().length }} archivo(s)…</p>
                    <p class="text-500 m-0 text-sm text-center">Preparando la previsualización de tus movimientos.</p>
                </div>
            }

            <!-- ── Paso 3: revisión ───────────────────────────────── -->
            @if (step() === 'review') {
                <div class="flex flex-col gap-4">
                    <div>
                        <p class="font-bold text-xl m-0">Revisa antes de crear</p>
                        <p class="text-500 mt-1 mb-0 text-sm">
                            Edita lo que necesites, desmarca lo que no quieras importar y confirma. Solo se crearán las filas marcadas.
                        </p>
                    </div>

                    <!-- Resumen -->
                    <div class="flex flex-wrap gap-2">
                        <span class="chip"><i class="pi pi-check-circle text-primary"></i> {{ incluidos }} a crear</span>
                        <span class="chip"><i class="pi pi-arrow-down text-red-500"></i> {{ numGastos }} gastos</span>
                        <span class="chip"><i class="pi pi-arrow-up text-green-500"></i> {{ numIngresos }} ingresos</span>
                        @if (numDup > 0) {
                            <span class="chip"><i class="pi pi-copy text-orange-400"></i> {{ numDup }} posibles duplicados</span>
                        }
                        @if (numAutoCategorizados > 0) {
                            <span class="chip"><i class="pi pi-bolt text-primary"></i> {{ numAutoCategorizados }} auto-categorizados por regla</span>
                        }
                    </div>

                    @if (parseErrores.length > 0) {
                        <div class="surface-50 border-round p-2 flex gap-2 align-items-center text-sm text-700">
                            <i class="pi pi-exclamation-triangle text-orange-400"></i>
                            {{ parseErrores.length }} línea(s) de los ficheros no se pudieron leer y se han omitido.
                        </div>
                    }

                    <div class="bulk-actions">
                        <div class="text-sm text-700">
                            @if (selectedReviewRows.length > 0) {
                                {{ selectedReviewRows.length }} fila(s) seleccionada(s)
                            } @else {
                                Haz clic en las filas, usa Ctrl/Cmd para alternar y Shift para seleccionar rangos.
                            }
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <p-button label="Incluir seleccionadas" icon="pi pi-check" size="small"
                                [disabled]="selectedReviewRows.length === 0"
                                (onClick)="aplicarSeleccionadas(true)" />
                            <p-button label="Excluir seleccionadas" icon="pi pi-ban" severity="secondary" size="small"
                                [disabled]="selectedReviewRows.length === 0"
                                (onClick)="aplicarSeleccionadas(false)" />
                        </div>
                    </div>

                    <!-- Tabla editable -->
                    <p-table [value]="reviewRows" [scrollable]="true" scrollHeight="460px"
                        styleClass="p-datatable-sm p-datatable-gridlines">
                        <ng-template #header>
                            <tr>
                                <th style="width:3rem" pTooltip="Incluir"></th>
                                <th style="width:7rem">Tipo</th>
                                <th style="width:6.5rem">Fecha</th>
                                <th style="min-width:13rem">Descripción</th>
                                <th style="width:9rem">Importe</th>
                                <th style="min-width:9rem">Categoría</th>
                                <th style="min-width:8rem">Cuenta</th>
                                @if (varios) { <th style="width:9rem">Archivo</th> }
                            </tr>
                        </ng-template>
                        <ng-template #body let-row>
                            <tr [class.dup-row]="row.esDuplicado" [class.selected-row]="isSelected(row)"
                                (click)="onRowClick(row, $event)">
                                <td>
                                    <div class="flex align-items-center gap-1">
                                        <p-checkbox [binary]="true"
                                            [ngModel]="row.incluir"
                                            (onChange)="setIncluir(row, $event.checked ?? false)"
                                            pTooltip="Marca si se importará esta fila" />
                                        @if (row.esDuplicado) {
                                            <i class="pi pi-copy text-orange-400 text-sm" pTooltip="Posible duplicado (ya existe o repetido)"></i>
                                        }
                                    </div>
                                </td>
                                <td>
                                    <button type="button" class="tipo-pill" [class.gasto]="row.tipo==='gasto'"
                                        [class.ingreso]="row.tipo==='ingreso'" (click)="toggleTipo(row)"
                                        pTooltip="Clic para cambiar gasto/ingreso">
                                        {{ row.tipo === 'gasto' ? 'Gasto' : 'Ingreso' }}
                                    </button>
                                </td>
                                <td class="text-sm white-space-nowrap">{{ row.fecha | date:'dd/MM/yyyy' }}</td>
                                <td><input pInputText class="w-full" [(ngModel)]="row.descripcion" /></td>
                                <td>
                                    <p-inputnumber [(ngModel)]="row.importe" mode="decimal"
                                        [minFractionDigits]="2" [maxFractionDigits]="2" suffix=" €"
                                        styleClass="w-full" inputStyleClass="w-full" />
                                </td>
                                <td>
                                    <div class="flex align-items-center gap-1">
                                        <input pInputText class="w-full" [(ngModel)]="row.categoriaNombre" />
                                        @if (row.reglaAplicada) {
                                            <i class="pi pi-bolt text-primary text-sm"
                                                [pTooltip]="'Auto-categorizado por regla: ' + row.reglaPatron"></i>
                                        }
                                    </div>
                                </td>
                                <td><input pInputText class="w-full" [(ngModel)]="row.cuentaNombre" /></td>
                                @if (varios) {
                                    <td class="text-xs text-500 white-space-nowrap" [pTooltip]="row.origen">
                                        {{ row.origen.length > 14 ? (row.origen | slice:0:14) + '…' : row.origen }}
                                    </td>
                                }
                            </tr>
                        </ng-template>
                        <ng-template #emptymessage>
                            <tr><td [attr.colspan]="varios ? 8 : 7" class="text-center text-500 py-6">
                                No se detectó ningún movimiento en los archivos.
                            </td></tr>
                        </ng-template>
                    </p-table>

                    @if (importError()) {
                        <div class="flex align-items-center gap-2 text-red-500 text-sm">
                            <i class="pi pi-exclamation-triangle"></i> {{ importError() }}
                        </div>
                    }

                    <div class="flex gap-2 justify-between">
                        <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (onClick)="volver()" />
                        <p-button [label]="'Confirmar e importar (' + incluidos + ')'" icon="pi pi-check"
                            [disabled]="incluidos === 0" (onClick)="confirmar()" />
                    </div>
                </div>
            }

            <!-- ── Paso 4: confirmando ────────────────────────────── -->
            @if (step() === 'confirming') {
                <div class="flex flex-col align-items-center justify-center gap-4 py-16">
                    <p-progressspinner strokeWidth="4" styleClass="w-16 h-16" />
                    <p class="font-semibold text-xl text-center m-0">Creando los movimientos…</p>
                </div>
            }

            <!-- ── Paso 5: resultado ──────────────────────────────── -->
            @if (step() === 'result' && result()) {
                <div class="flex flex-col gap-5 w-full">
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div class="surface-card border-round-lg p-4 text-center shadow-1">
                            <i class="pi pi-arrow-down text-red-500 text-2xl mb-2 block"></i>
                            <div class="text-3xl font-bold text-red-500 mb-1">{{ result()!.gastosCreados }}</div>
                            <div class="text-500 text-sm">gastos creados</div>
                        </div>
                        <div class="surface-card border-round-lg p-4 text-center shadow-1">
                            <i class="pi pi-arrow-up text-green-500 text-2xl mb-2 block"></i>
                            <div class="text-3xl font-bold text-green-500 mb-1">{{ result()!.ingresosCreados }}</div>
                            <div class="text-500 text-sm">ingresos creados</div>
                        </div>
                        <div class="surface-card border-round-lg p-4 text-center shadow-1">
                            <i class="pi pi-times-circle text-red-400 text-2xl mb-2 block"></i>
                            <div class="text-3xl font-bold text-red-400 mb-1">{{ result()!.fallidos + result()!.errores.length }}</div>
                            <div class="text-500 text-sm">errores</div>
                        </div>
                    </div>

                    @if (totalCreados() > 0) {
                        <div class="surface-50 border-round p-3 flex gap-3 align-items-center">
                            <i class="pi pi-check-circle text-green-500 text-xl"></i>
                            <span class="text-700 text-sm">Se han creado {{ totalCreados() }} movimientos correctamente.</span>
                        </div>
                    }

                    @if (result()!.errores.length > 0) {
                        <div>
                            <p class="font-semibold mb-3 m-0">
                                <i class="pi pi-exclamation-triangle text-orange-400 mr-2"></i> Movimientos con problemas
                            </p>
                            <p-table [value]="result()!.errores" [scrollable]="true" scrollHeight="240px"
                                styleClass="p-datatable-sm p-datatable-gridlines">
                                <ng-template #header>
                                    <tr><th>Movimiento</th><th style="min-width: 14rem">Motivo</th></tr>
                                </ng-template>
                                <ng-template #body let-err>
                                    <tr>
                                        <td class="text-sm text-500">{{ err.contenido }}</td>
                                        <td class="text-red-500 text-sm">{{ err.razon }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </div>
                    }

                    <div class="flex gap-2 justify-end">
                        <p-button label="Importar otros" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="reset()" />
                    </div>
                </div>
            }
        </div>
    `
})
export class ImportarMovimientosPage {
    private readonly movimientoService = inject(MovimientoService);

    // ── Estado ──────────────────────────────────────────────
    step = signal<Step>('form');
    selectedFiles = signal<File[]>([]);
    isDragOver = signal(false);
    fileError = signal<string | null>(null);
    importError = signal<string | null>(null);
    showAdvanced = signal(false);
    amountMode = signal<AmountMode>('signed');
    fechaFormato = signal<string>('');
    form = signal<ColumnMapping>(defaultColumnMapping());
    result = signal<ImportarMovimientosResult | null>(null);

    // Revisión (arrays planos, se editan en sitio)
    reviewRows: ReviewRow[] = [];
    parseErrores: MovimientoImportError[] = [];
    selectedReviewRows: ReviewRow[] = [];
    private lastSelectionIndex: number | null = null;

    // ── Opciones de selectbutton ────────────────────────────
    readonly amountModes = [
        { label: 'Importe único (con signo)', value: 'signed' },
        { label: 'Cargo / Abono separados', value: 'split' }
    ];
    readonly delimiters = [
        { label: 'Auto', value: 'auto' },
        { label: 'Coma ,', value: ',' },
        { label: 'Punto y coma ;', value: ';' },
        { label: 'Tab', value: '\t' }
    ];
    readonly decimals = [
        { label: 'Auto', value: 'auto' },
        { label: '1.234,56', value: 'coma' },
        { label: '1,234.56', value: 'punto' }
    ];
    readonly amountPositions = [
        { label: 'El primero', value: 'first' },
        { label: 'El último', value: 'last' }
    ];
    readonly regexEjemplo = '^(?<fecha>\\d{2}/\\d{2}/\\d{4})\\s+(?<concepto>.+?)\\s+(?<importe>-?[\\d.,]+)$';

    // ── Computed / getters ──────────────────────────────────
    hasPdf = computed(() => this.selectedFiles().some((f) => f.name.toLowerCase().endsWith('.pdf')));
    hasCsv = computed(() => this.selectedFiles().some((f) => !f.name.toLowerCase().endsWith('.pdf')));

    totalCreados = computed(() => {
        const r = this.result();
        return r ? r.gastosCreados + r.ingresosCreados : 0;
    });

    canImport = computed(() => {
        if (this.selectedFiles().length === 0 || !this.form().cuentaNombre.trim()) return false;
        if (this.hasCsv()) {
            const f = this.form();
            if (!f.fechaColumn.trim() || !f.conceptoColumn.trim()) return false;
            const importeOk = this.amountMode() === 'signed'
                ? !!f.importeColumn?.trim()
                : !!(f.cargoColumn?.trim() || f.abonoColumn?.trim());
            if (!importeOk) return false;
        }
        return true;
    });

    get varios(): boolean { return this.selectedFiles().length > 1; }
    get incluidos(): number { return this.reviewRows.filter((r) => r.incluir).length; }
    get numGastos(): number { return this.reviewRows.filter((r) => r.incluir && r.tipo === 'gasto').length; }
    get numIngresos(): number { return this.reviewRows.filter((r) => r.incluir && r.tipo === 'ingreso').length; }
    get numDup(): number { return this.reviewRows.filter((r) => r.esDuplicado).length; }
    get numAutoCategorizados(): number { return this.reviewRows.filter((r) => r.reglaAplicada).length; }

    // ── Helpers de formulario ───────────────────────────────
    patch<K extends keyof ColumnMapping>(key: K, value: ColumnMapping[K]): void {
        this.form.update((f) => ({ ...f, [key]: value }));
    }

    patchDelimiter(value: string): void {
        this.patch('delimiter', value === 'auto' ? null : value);
    }

    setFechaFormato(value: string): void {
        this.fechaFormato.set(value);
        const v = value.trim();
        this.patch('fechaFormatos', v ? [v] : null);
    }

    toggleTipo(row: ReviewRow): void {
        row.tipo = row.tipo === 'gasto' ? 'ingreso' : 'gasto';
    }

    isSelected(row: ReviewRow): boolean {
        return this.selectedReviewRows.includes(row);
    }

    onRowClick(row: ReviewRow, event: MouseEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.closest('input,button,textarea,select,a,[role="button"]')) return;

        const index = this.reviewRows.indexOf(row);
        if (index < 0) return;

        const ctrl = event.ctrlKey || event.metaKey;
        const shift = event.shiftKey;

        if (shift && this.lastSelectionIndex !== null) {
            const start = Math.min(this.lastSelectionIndex, index);
            const end = Math.max(this.lastSelectionIndex, index);
            const range = this.reviewRows.slice(start, end + 1);
            const merged = ctrl ? [...this.selectedReviewRows] : [];
            for (const item of range) {
                if (!merged.includes(item)) merged.push(item);
            }
            this.selectedReviewRows = merged;
        } else if (ctrl) {
            this.selectedReviewRows = this.isSelected(row)
                ? this.selectedReviewRows.filter((item) => item !== row)
                : [...this.selectedReviewRows, row];
        } else {
            this.selectedReviewRows = [row];
        }

        this.lastSelectionIndex = index;
    }

    setIncluir(row: ReviewRow, incluir: boolean): void {
        row.incluir = incluir;
    }

    aplicarSeleccionadas(incluir: boolean): void {
        for (const row of this.selectedReviewRows) {
            row.incluir = incluir;
        }
    }

    iconFor(f: File): string {
        return f.name.toLowerCase().endsWith('.pdf') ? 'pi pi-file-pdf text-red-500' : 'pi pi-file-excel text-green-500';
    }

    sizeOf(f: File): string {
        const kb = f.size / 1024;
        return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
    }

    // ── Archivos ────────────────────────────────────────────
    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) this.addFiles(input.files);
        input.value = '';
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(true);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
        if (event.dataTransfer?.files.length) this.addFiles(event.dataTransfer.files);
    }

    private addFiles(list: FileList): void {
        const current = this.selectedFiles();
        const toAdd: File[] = [];
        let err: string | null = null;

        for (const f of Array.from(list)) {
            const name = f.name.toLowerCase();
            if (!name.endsWith('.csv') && !name.endsWith('.pdf')) {
                err = 'Solo se aceptan archivos .csv o .pdf';
                continue;
            }
            if (f.size > 10 * 1024 * 1024) {
                err = `"${f.name}" supera los 10 MB`;
                continue;
            }
            const dup = (x: File) => x.name === f.name && x.size === f.size;
            if (current.some(dup) || toAdd.some(dup)) continue;
            toAdd.push(f);
        }

        this.fileError.set(err);
        if (toAdd.length) this.selectedFiles.set([...current, ...toAdd]);
    }

    removeFile(file: File): void {
        this.selectedFiles.set(this.selectedFiles().filter((f) => !(f.name === file.name && f.size === file.size)));
        this.fileError.set(null);
    }

    clearFiles(): void {
        this.selectedFiles.set([]);
        this.fileError.set(null);
    }

    // ── Flujo: previsualizar → revisar → confirmar ──────────
    async previsualizar(): Promise<void> {
        const files = this.selectedFiles();
        if (files.length === 0 || !this.canImport()) return;

        this.importError.set(null);
        this.step.set('previewing');
        try {
            const settled = await Promise.allSettled(
                files.map((f) =>
                    firstValueFrom(this.movimientoService.previsualizar(this.form(), f)).then((res) => ({ file: f, res }))
                )
            );

            const rows: ReviewRow[] = [];
            const errores: MovimientoImportError[] = [];
            const vistos = new Set<string>();

            for (const s of settled) {
                if (s.status === 'rejected') {
                    errores.push({ linea: 0, contenido: '(archivo)', razon: this.mensajeError(s.reason, 'No se pudo procesar un archivo.') });
                    continue;
                }
                const { file, res } = s.value;
                (res.errores ?? []).forEach((e) =>
                    errores.push({ ...e, contenido: `[${file.name}] ${e.contenido}` })
                );
                for (const m of res.movimientos ?? []) {
                    // Duplicado entre archivos (extractos solapados), además del que ya marca el backend
                    const key = `${m.fecha}|${m.tipo}|${m.importe}|${m.descripcion}`;
                    const dupEntreArchivos = vistos.has(key);
                    vistos.add(key);
                    const esDup = m.esDuplicado || dupEntreArchivos;

                    rows.push({
                        incluir: !esDup,
                        fecha: m.fecha,
                        descripcion: m.descripcion,
                        importe: m.importe,
                        tipo: m.tipo,
                        categoriaNombre: m.categoriaNombre,
                        cuentaNombre: m.cuentaNombre,
                        conceptoNombre: m.conceptoNombre,
                        formaPagoNombre: m.formaPagoNombre,
                        proveedorNombre: m.proveedorNombre,
                        esDuplicado: esDup,
                        reglaAplicada: m.reglaAplicada,
                        reglaPatron: m.reglaPatron,
                        origen: file.name
                    });
                }
            }

            this.reviewRows = rows;
            this.parseErrores = errores;
            this.selectedReviewRows = [];
            this.lastSelectionIndex = null;
            this.step.set('review');
        } catch (err: any) {
            this.importError.set(this.mensajeError(err, 'No se pudo previsualizar el extracto.'));
            this.step.set('form');
        }
    }

    async confirmar(): Promise<void> {
        const payload = this.reviewRows
            .filter((r) => r.incluir)
            .map((r) => ({
                fecha: r.fecha,
                descripcion: r.descripcion,
                importe: r.importe,
                tipo: r.tipo,
                cuentaNombre: r.cuentaNombre,
                categoriaNombre: r.categoriaNombre,
                conceptoNombre: r.conceptoNombre,
                formaPagoNombre: r.formaPagoNombre,
                proveedorNombre: r.proveedorNombre
            }));
        if (payload.length === 0) return;

        this.importError.set(null);
        this.step.set('confirming');
        try {
            const res = await firstValueFrom(this.movimientoService.confirmar(payload));
            this.result.set(res);
            this.step.set('result');
        } catch (err: any) {
            this.importError.set(this.mensajeError(err, 'No se pudieron crear los movimientos.'));
            this.step.set('review');
        }
    }

    volver(): void {
        this.importError.set(null);
        this.step.set('form');
    }

    reset(): void {
        this.step.set('form');
        this.selectedFiles.set([]);
        this.fileError.set(null);
        this.importError.set(null);
        this.result.set(null);
        this.reviewRows = [];
        this.parseErrores = [];
        this.selectedReviewRows = [];
        this.lastSelectionIndex = null;
    }

    private mensajeError(err: any, fallback: string): string {
        return err?.error?.error?.message ?? err?.userMessage ?? fallback;
    }
}
