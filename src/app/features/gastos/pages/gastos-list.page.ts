import { Component, inject, ChangeDetectionStrategy, signal, computed, effect, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePickerModule } from 'primeng/datepicker';
import { GastosStore } from '../stores/gastos.store';
import { Gasto, GastoCreate } from '@/core/models';
import { HttpErrorLike } from '@/core/models/error-response.model';
import { GastoFormModalComponent } from '../components/gasto-form-modal.component';
import { BasePageComponent, BasePageTemplateComponent, HelpGlossaryComponent, GlossaryConfig, ListLazyLoadEvent } from '@sergioizq/ngx-crud-ui';
import { DataViewModule } from 'primeng/dataview';
import { LayoutService } from '@/layout/service/layout.service';
import { TransaccionesHabitualesChipsComponent, TransaccionHabitualSeleccionada, ExportarExcelDialogComponent, ExportarExcelFiltros } from '@/shared/components';
import { GastoService } from '@/core/services/api/gasto.service';
import { HideAmountPipe } from '@/shared/pipes/hide-amount.pipe';
import { calcularRangoFecha, FiltroPeriodoRapido } from '@/shared/utils/rango-fecha.util';

@Component({
    selector: 'app-gastos-list-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        TableModule,
        ToolbarModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        SkeletonModule,
        DataViewModule,
        DatePickerModule,
        GastoFormModalComponent,
        BasePageTemplateComponent,
        HelpGlossaryComponent,
        TransaccionesHabitualesChipsComponent,
        ExportarExcelDialogComponent,
        HideAmountPipe
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
        /* Toolbar responsive en móvil */
        @media screen and (max-width: 768px) {
            :host ::ng-deep .p-toolbar {
                flex-direction: column !important;
                align-items: stretch !important;
            }
            
            :host ::ng-deep .p-toolbar-group-start,
            :host ::ng-deep .p-toolbar-group-end {
                width: 100% !important;
                justify-content: center !important;
            }
            
            :host ::ng-deep .p-toolbar-group-start {
                margin-bottom: 0.5rem;
            }
        }
    `],
    template: `
        <ngxc-base-page-template [loading]="gastosStore.loading() && gastosStore.gastos().length === 0" [skeletonType]="'table'">
            <div class="card surface-ground px-4 py-5 md:px-6 lg:px-8">
                <div class="surface-card shadow-2 border-round p-6">
                    <app-transacciones-habituales-chips tipo="gasto" [refresco]="habitualesRefresco()" (seleccionar)="onHabitualSeleccionado($event)" />

                    <p-toolbar styleClass="mb-6 gap-2 p-6">
                        <ng-template #start>
                            <p-button label="Nuevo Gasto" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                        </ng-template>

                        <ng-template #end>
                            <ngxc-help-glossary [config]="glossary" class="mr-2" />
                            <p-button icon="pi pi-refresh" severity="secondary" outlined (onClick)="refreshTable()" pTooltip="Actualizar" class="mr-2" />
                            <p-button label="Exportar" icon="pi pi-upload" severity="secondary" (onClick)="exportarDialogVisible.set(true)" />
                        </ng-template>
                    </p-toolbar>

                    <div class="mb-6">
                        <div class="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                            <h5 class="m-0 font-semibold text-lg">Movimientos</h5>
                            <div class="flex flex-wrap items-center gap-2">
                                <p-button label="Hoy" size="small" [outlined]="filtroPeriodoActivo() !== 'hoy'" (onClick)="seleccionarFiltroPeriodo('hoy')" />
                                <p-button label="Esta semana" size="small" [outlined]="filtroPeriodoActivo() !== 'semana'" (onClick)="seleccionarFiltroPeriodo('semana')" />
                                <p-button label="Este mes" size="small" [outlined]="filtroPeriodoActivo() !== 'mes'" (onClick)="seleccionarFiltroPeriodo('mes')" />
                                <p-datePicker
                                    [ngModel]="rangoPersonalizado()"
                                    (ngModelChange)="onRangoPersonalizadoChange($event)"
                                    selectionMode="range"
                                    dateFormat="dd/mm/yy"
                                    [showIcon]="true"
                                    [readonlyInput]="true"
                                    placeholder="Rango personalizado"
                                    appendTo="body"
                                    styleClass="w-full md:w-auto"
                                />
                            </div>
                        </div>

                        @if (!layout.isMobileView()) {
                        <div class="overflow-x-auto">
                            <p-table
                                [value]="gastosStore.movimientosPeriodo()"
                                [paginator]="true"
                                [rows]="10"
                                [loading]="gastosStore.loadingMovimientosPeriodo()"
                                [loadingIcon]="'none'"
                                [tableStyle]="{ 'min-width': '75rem' }"
                                styleClass="p-datatable-gridlines p-datatable-loading-icon-none"
                                [rowHover]="true"
                                dataKey="id"
                                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
                                [showCurrentPageReport]="true"
                                [rowsPerPageOptions]="[10, 20, 30]"
                                sortField="fecha"
                                [sortOrder]="-1"
                            >
                                <ng-template #header>
                                    <tr>
                                        <th pSortableColumn="fecha" style="min-width:10rem; padding: 1rem">
                                            Fecha
                                            <p-sortIcon field="fecha" />
                                        </th>
                                        <th pSortableColumn="personaNombre" style="min-width:12rem">
                                            Persona
                                            <p-sortIcon field="personaNombre" />
                                        </th>
                                        <th pSortableColumn="formaPagoNombre" style="min-width:12rem">
                                            Forma de Pago
                                            <p-sortIcon field="formaPagoNombre" />
                                        </th>
                                        <th pSortableColumn="proveedorNombre" style="min-width:12rem">
                                            Proveedor
                                            <p-sortIcon field="proveedorNombre" />
                                        </th>
                                        <th pSortableColumn="conceptoNombre" style="min-width:14rem">
                                            Concepto
                                            <p-sortIcon field="conceptoNombre" />
                                        </th>
                                        <th pSortableColumn="cuentaNombre" style="min-width:12rem">
                                            Cuenta
                                            <p-sortIcon field="cuentaNombre" />
                                        </th>
                                        <th pSortableColumn="importe" style="min-width:10rem">
                                            Importe
                                            <p-sortIcon field="importe" />
                                        </th>
                                        <th style="min-width:10rem">Acciones</th>
                                    </tr>
                                </ng-template>

                                <ng-template #body let-gasto>
                                    <tr>
                                        <td style="padding: 1rem">{{ gasto.fecha | date: 'dd/MM/yyyy' }}</td>
                                        <td>{{ gasto.personaNombre || '-' }}</td>
                                        <td>{{ gasto.formaPagoNombre || '-' }}</td>
                                        <td>{{ gasto.proveedorNombre || '-' }}</td>
                                        <td style="padding: 1rem">
                                            <div class="flex flex-col">
                                                <span class="font-semibold">{{ gasto.conceptoNombre }}</span>
                                                @if (gasto.descripcion) {
                                                    <small class="text-500">{{ gasto.descripcion }}</small>
                                                }
                                            </div>
                                        </td>
                                        <td>{{ gasto.cuentaNombre || '-' }}</td>
                                        <td>
                                            <span class="font-bold text-red-500">- {{ gasto.importe | hideAmount:'currency' }}</span>
                                        </td>
                                        <td>
                                            <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editGasto(gasto)" />
                                            <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteGasto(gasto)" />
                                        </td>
                                    </tr>
                                </ng-template>

                                <ng-template #emptymessage>
                                    <tr>
                                        <td colspan="8" style="padding: 2rem">
                                            <div class="text-center py-6">
                                                <i class="pi pi-calendar-times text-500 text-4xl mb-3"></i>
                                                <p class="text-900 font-semibold mb-1">No hay movimientos en este periodo</p>
                                            </div>
                                        </td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </div>
                        } @else {
                        <p-dataView styleClass="kash-mobile-dataview" [value]="gastosStore.movimientosPeriodo()" [rows]="10" [paginator]="true" [loading]="gastosStore.loadingMovimientosPeriodo()" [showCurrentPageReport]="true" currentPageReportTemplate="{first}-{last} de {totalRecords}">
                            <ng-template #list let-movimientos>
                                <div class="flex flex-col gap-4 pt-4">
                                    @for (gasto of movimientos; track gasto.id) {
                                        <div class="surface-card rounded-xl border border-surface-200 dark:border-surface-700 border-l-4 border-l-red-500 shadow-sm p-4">
                                            <div class="flex justify-between items-start gap-3 pb-3 border-b border-surface-200 dark:border-surface-700">
                                                <div class="flex flex-col min-w-0">
                                                    <span class="font-semibold text-base text-900 truncate">{{ gasto.conceptoNombre }}</span>
                                                    <span class="text-xs text-500 flex items-center gap-1 mt-1">
                                                        <i class="pi pi-calendar" style="font-size: 0.75rem"></i>{{ gasto.fecha | date: 'dd/MM/yyyy' }}
                                                    </span>
                                                </div>
                                                <span class="font-bold text-red-500 text-lg whitespace-nowrap">- {{ gasto.importe | hideAmount:'currency' }}</span>
                                            </div>

                                            <div class="grid grid-cols-2 gap-x-4 gap-y-3 py-3">
                                                <div class="flex flex-col gap-1 min-w-0">
                                                    <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-truck mr-1"></i>Proveedor</span>
                                                    <span class="text-sm text-700 truncate">{{ gasto.proveedorNombre || '—' }}</span>
                                                </div>
                                                <div class="flex flex-col gap-1 min-w-0">
                                                    <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-id-card mr-1"></i>Persona</span>
                                                    <span class="text-sm text-700 truncate">{{ gasto.personaNombre || '—' }}</span>
                                                </div>
                                                <div class="flex flex-col gap-1 min-w-0">
                                                    <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-credit-card mr-1"></i>Forma de Pago</span>
                                                    <span class="text-sm text-700 truncate">{{ gasto.formaPagoNombre || '—' }}</span>
                                                </div>
                                                <div class="flex flex-col gap-1 min-w-0">
                                                    <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-wallet mr-1"></i>Cuenta</span>
                                                    <span class="text-sm text-700 truncate">{{ gasto.cuentaNombre || '—' }}</span>
                                                </div>
                                            </div>

                                            <div class="flex justify-end gap-2 pt-3 border-t border-surface-200 dark:border-surface-700">
                                                <p-button icon="pi pi-pencil" label="Editar" severity="secondary" [outlined]="true" size="small" (click)="editGasto(gasto)" />
                                                <p-button icon="pi pi-trash" label="Eliminar" severity="danger" [outlined]="true" size="small" (click)="deleteGasto(gasto)" />
                                            </div>
                                        </div>
                                    }
                                </div>
                            </ng-template>

                            <ng-template #empty>
                                <div class="text-center py-6">
                                    <i class="pi pi-calendar-times text-500 text-4xl mb-3"></i>
                                    <p class="text-900 font-semibold mb-1">No hay movimientos en este periodo</p>
                                </div>
                            </ng-template>
                        </p-dataView>
                        }

                        <div class="flex justify-end mt-3 pt-3 border-t surface-border">
                            <span class="text-600 mr-2">Total del periodo:</span>
                            <span class="font-bold text-red-500">- {{ gastosStore.sumaImporteMovimientosPeriodo() | hideAmount:'currency' }}</span>
                        </div>
                    </div>

                    @if (!layout.isMobileView()) {
                    <p-table
                        #dt
                        [value]="gastosStore.gastos()"
                        [lazy]="true"
                        (onLazyLoad)="loadGastosLazy($event)"
                        [rows]="pageSize()"
                        [totalRecords]="totalRecords()"
                        [paginator]="true"
                        [loading]="gastosStore.loading()"
                        [loadingIcon]="'none'"
                        [globalFilterFields]="['conceptoNombre', 'categoriaNombre', 'proveedorNombre', 'descripcion']"
                        [tableStyle]="{ 'min-width': '75rem' }"
                        styleClass="p-datatable-gridlines p-datatable-loading-icon-none"
                        [selection]="selectedGastos()"
                        (selectionChange)="selectedGastos.set($event)"
                        [rowHover]="true"
                        dataKey="id"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} gastos"
                        [showCurrentPageReport]="true"
                        [rowsPerPageOptions]="[10, 20, 30]"
                        sortField="fecha"
                        [sortOrder]="-1"
                    >
                        <ng-template #caption>
                            <div class="flex flex-col md:flex-row items-center justify-between gap-3 py-3 px-4">
                                <h5 class="m-0 font-semibold text-xl">Gestión de Gastos</h5>
                                <p-iconfield class="w-full md:w-auto">
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #header>
                            <tr>
                                <th pSortableColumn="fecha" style="min-width:10rem; padding: 1rem">
                                    Fecha
                                    <p-sortIcon field="fecha" />
                                </th>
                                <th pSortableColumn="personaNombre" style="min-width:12rem">
                                    Persona
                                    <p-sortIcon field="personaNombre" />
                                </th>
                                <th pSortableColumn="formaPagoNombre" style="min-width:12rem">
                                    Forma de Pago
                                    <p-sortIcon field="formaPagoNombre" />
                                </th>
                                <th pSortableColumn="proveedorNombre" style="min-width:12rem">
                                    Proveedor
                                    <p-sortIcon field="proveedorNombre" />
                                </th>
                                <th pSortableColumn="conceptoNombre" style="min-width:14rem">
                                    Concepto
                                    <p-sortIcon field="conceptoNombre" />
                                </th>
                                <th pSortableColumn="cuentaNombre" style="min-width:12rem">
                                    Cuenta
                                    <p-sortIcon field="cuentaNombre" />
                                </th>
                                <th pSortableColumn="importe" style="min-width:10rem">
                                    Importe
                                    <p-sortIcon field="importe" />
                                </th>
                                <th style="min-width:10rem">Acciones</th>
                            </tr>
                        </ng-template>

                        <ng-template #body let-gasto>
                            <tr>
                                <td style="padding: 1rem">{{ gasto.fecha | date: 'dd/MM/yyyy' }}</td>
                                <td>{{ gasto.personaNombre || '-' }}</td>
                                <td>{{ gasto.formaPagoNombre || '-' }}</td>
                                <td>{{ gasto.proveedorNombre || '-' }}</td>
                                <td style="padding: 1rem">
                                    <div class="flex flex-col">
                                        <span class="font-semibold">{{ gasto.conceptoNombre }}</span>
                                        @if (gasto.descripcion) {
                                            <small class="text-500">{{ gasto.descripcion }}</small>
                                        }
                                    </div>
                                </td>
                                <td>{{ gasto.cuentaNombre || '-' }}</td>
                                <td>
                                    <span class="font-bold text-red-500">- {{ gasto.importe | hideAmount:'currency' }}</span>
                                </td>
                                <td>
                                    <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editGasto(gasto)" />
                                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteGasto(gasto)" />
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template #loadingbody>
                            <tr>
                                <td style="padding: 1rem"><p-skeleton /></td>
                                <td style="padding: 1rem"><p-skeleton width="6rem" /></td>
                                <td><p-skeleton width="70%" /></td>
                                <td><p-skeleton width="70%" /></td>
                                <td><p-skeleton width="70%" /></td>
                                <td style="padding: 1rem">
                                    <div class="flex flex-col gap-2">
                                        <p-skeleton width="80%" />
                                        <p-skeleton width="60%" height=".8rem" />
                                    </div>
                                </td>
                                <td><p-skeleton width="70%" /></td>
                                <td><p-skeleton width="5rem" /></td>
                                <td>
                                    <div class="flex gap-2">
                                        <p-skeleton shape="circle" size="2.5rem" />
                                        <p-skeleton shape="circle" size="2.5rem" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="10" style="padding: 2rem">
                                    <div class="text-center py-8">
                                        <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                        <p class="text-900 font-semibold text-xl mb-2">No hay gastos</p>
                                        <p class="text-600 mb-4">Comienza agregando tu primer gasto</p>
                                        <p-button label="Crear Gasto" icon="pi pi-plus" (onClick)="openNew()" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                    } @else {
                    <p-dataView
                        styleClass="kash-mobile-dataview"
                        [value]="gastosStore.gastos()"
                        [lazy]="true"
                        (onLazyLoad)="loadGastosLazy($event)"
                        [rows]="pageSize()"
                        [totalRecords]="totalRecords()"
                        [paginator]="true"
                        [loading]="gastosStore.loading()"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="{first}-{last} de {totalRecords}"
                    >
                        <ng-template #header>
                            <div class="flex flex-col gap-3 py-2">
                                <h5 class="m-0 font-semibold text-lg">Gestión de Gastos</h5>
                                <p-iconfield>
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" (input)="onSearchInput($event)" placeholder="Buscar..." class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #list let-gastos>
                            <div class="flex flex-col gap-4 pt-4">
                                @for (gasto of gastos; track gasto.id) {
                                    <div class="surface-card rounded-xl border border-surface-200 dark:border-surface-700 border-l-4 border-l-red-500 shadow-sm p-4">
                                        <div class="flex justify-between items-start gap-3 pb-3 border-b border-surface-200 dark:border-surface-700">
                                            <div class="flex flex-col min-w-0">
                                                <span class="font-semibold text-base text-900 truncate">{{ gasto.conceptoNombre }}</span>
                                                <span class="text-xs text-500 flex items-center gap-1 mt-1">
                                                    <i class="pi pi-calendar" style="font-size: 0.75rem"></i>{{ gasto.fecha | date: 'dd/MM/yyyy' }}
                                                </span>
                                            </div>
                                            <span class="font-bold text-red-500 text-lg whitespace-nowrap">- {{ gasto.importe | hideAmount:'currency' }}</span>
                                        </div>

                                        <div class="grid grid-cols-2 gap-x-4 gap-y-3 py-3">
                                            <div class="flex flex-col gap-1 min-w-0">
                                                <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-truck mr-1"></i>Proveedor</span>
                                                <span class="text-sm text-700 truncate">{{ gasto.proveedorNombre || '—' }}</span>
                                            </div>
                                            <div class="flex flex-col gap-1 min-w-0">
                                                <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-id-card mr-1"></i>Persona</span>
                                                <span class="text-sm text-700 truncate">{{ gasto.personaNombre || '—' }}</span>
                                            </div>
                                            <div class="flex flex-col gap-1 min-w-0">
                                                <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-credit-card mr-1"></i>Forma de Pago</span>
                                                <span class="text-sm text-700 truncate">{{ gasto.formaPagoNombre || '—' }}</span>
                                            </div>
                                            <div class="flex flex-col gap-1 min-w-0">
                                                <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-wallet mr-1"></i>Cuenta</span>
                                                <span class="text-sm text-700 truncate">{{ gasto.cuentaNombre || '—' }}</span>
                                            </div>
                                        </div>

                                        <div class="flex justify-end gap-2 pt-3 border-t border-surface-200 dark:border-surface-700">
                                            <p-button icon="pi pi-pencil" label="Editar" severity="secondary" [outlined]="true" size="small" (click)="editGasto(gasto)" />
                                            <p-button icon="pi pi-trash" label="Eliminar" severity="danger" [outlined]="true" size="small" (click)="deleteGasto(gasto)" />
                                        </div>
                                    </div>
                                }
                            </div>
                        </ng-template>

                        <ng-template #empty>
                            <div class="text-center py-8">
                                <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                <p class="text-900 font-semibold text-xl mb-2">No hay gastos</p>
                                <p class="text-600 mb-4">Comienza agregando tu primer gasto</p>
                                <p-button label="Crear Gasto" icon="pi pi-plus" (onClick)="openNew()" />
                            </div>
                        </ng-template>
                    </p-dataView>
                    }

                    <!-- Nuevo componente de formulario modal con autocomplete -->
                    <app-gasto-form-modal [visible]="gastoDialog()" [gasto]="currentGasto()" (visibleChange)="gastoDialog.set($event)" (save)="onSaveGasto($event)" (cancel)="hideDialog()" />

                    <app-exportar-excel-dialog tipo="gasto" [visible]="exportarDialogVisible()" (visibleChange)="exportarDialogVisible.set($event)" [searchTermActual]="searchTerm()" [exportando]="exportandoExcel()" (exportar)="onExportarExcel($event)" />
                </div>
            </div>
        </ngxc-base-page-template>
    `
})
export class GastosListPage extends BasePageComponent implements OnDestroy {
    gastosStore = inject(GastosStore);
    protected readonly layout = inject(LayoutService);
    private readonly gastoService = inject(GastoService);

    protected override loadingSignal = this.gastosStore.loading;
    protected override skeletonType = 'table' as const;

    readonly glossary: GlossaryConfig = {
        title: 'Glosario · Gastos',
        intro: 'Esta pantalla registra y consulta tus <strong>gastos</strong> (salidas de dinero). Cada gasto descuenta su importe del saldo de la cuenta asociada. Puedes buscarlos, ordenarlos, paginarlos y exportarlos a Excel.',
        sections: [
            {
                title: 'Botones y acciones',
                rows: [
                    { icon: 'pi pi-plus', color: '#22c55e', term: 'Nuevo Gasto', def: 'Abre el formulario para registrar un gasto: fecha, importe, concepto, categoría, proveedor, persona, forma de pago y cuenta.' },
                    { icon: 'pi pi-search', color: '#6366f1', term: 'Buscar', def: 'Filtra la tabla por concepto, categoría, proveedor o descripción. La búsqueda se aplica automáticamente al dejar de escribir.' },
                    { icon: 'pi pi-refresh', color: '#64748b', term: 'Actualizar', def: 'Vuelve a cargar la lista de gastos desde el servidor con los filtros actuales.' },
                    { icon: 'pi pi-upload', color: '#3b82f6', term: 'Exportar', def: 'Abre un diálogo de filtros (fecha, concepto, categoría, proveedor, persona) y descarga un Excel con los gastos que los cumplen.' },
                    { icon: 'pi pi-pencil', color: '#f59e0b', term: 'Editar', def: 'Modifica los datos del gasto seleccionado.' },
                    { icon: 'pi pi-trash', color: '#ef4444', term: 'Eliminar', def: 'Borra el gasto (pide confirmación). El saldo de la cuenta se recalcula.' },
                ]
            },
            {
                title: 'Columnas de la tabla',
                rows: [
                    { icon: 'pi pi-calendar', color: '#6366f1', term: 'Fecha', def: 'Día en que se produjo el gasto.' },
                    { icon: 'pi pi-id-card', color: '#8b5cf6', term: 'Persona', def: 'Persona a la que se imputa el gasto (útil en gastos compartidos o familiares).' },
                    { icon: 'pi pi-credit-card', color: '#06b6d4', term: 'Forma de Pago', def: 'Medio con el que se pagó: tarjeta, efectivo, transferencia, etc.' },
                    { icon: 'pi pi-truck', color: '#64748b', term: 'Proveedor', def: 'Comercio o entidad a quien se realizó el pago.' },
                    { icon: 'pi pi-bookmark', color: '#f59e0b', term: 'Concepto', def: 'Descripción del gasto. Debajo aparece la nota o descripción ampliada si la hubiera.' },
                    { icon: 'pi pi-wallet', color: '#3b82f6', term: 'Cuenta', def: 'Cuenta de la que sale el dinero.' },
                    { icon: 'pi pi-euro', color: '#ef4444', term: 'Importe', def: 'Cantidad gastada. Se muestra en rojo con signo negativo porque reduce tu saldo.' },
                ]
            }
        ]
    };

    @ViewChild('dt') dt!: Table;

    gastoDialog = signal<boolean>(false);
    selectedGastos = signal<Gasto[]>([]);
    currentGasto = signal<Partial<Gasto>>({});
    /** Se incrementa tras crear un gasto para forzar la recarga de "gastos habituales". */
    habitualesRefresco = signal(0);

    exportarDialogVisible = signal(false);
    exportandoExcel = signal(false);

    pageSize = signal<number>(10);
    pageNumber = signal<number>(1);
    searchTerm = signal<string>('');
    sortColumn = signal<string>('fecha');
    sortOrder = signal<string>('desc');

    /** Filtro activo de la tabla "Movimientos" (independiente de la tabla de gestión). */
    filtroPeriodoActivo = signal<FiltroPeriodoRapido | 'rango'>('hoy');
    rangoPersonalizado = signal<Date[] | null>(null);

    // Computed signal para totalRecords
    totalRecords = computed(() => this.gastosStore.totalRecords());

    // Subject para manejar búsqueda con debounce
    private searchSubject = new Subject<string>();

    constructor() {
        super();
        // Configurar búsqueda con debounce de 500ms
        this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe((searchValue) => {
            this.searchTerm.set(searchValue);
            this.pageNumber.set(1); // Resetear a primera página en búsqueda
            this.reloadGastos();
        });

        // Effect para detectar sincronización automática
        effect(() => {
            const lastUpdate = this.gastosStore.lastUpdated();
            if (lastUpdate) {
            }
        });

        // Cargar el filtro por defecto ("Hoy") de la tabla de movimientos rápidos
        this.cargarMovimientosPeriodo();
    }

    ngOnDestroy() {
        this.searchSubject.complete();
    }

    /**
     * Recargar gastos con los filtros actuales
     */
    private reloadGastos() {
        this.gastosStore.loadGastosPaginated({
            page: this.pageNumber(),
            pageSize: this.pageSize(),
            searchTerm: this.searchTerm() || undefined,
            sortColumn: this.sortColumn() || undefined,
            sortOrder: this.sortOrder() || undefined
        });
    }

    /**
     * Refrescar la tabla manualmente
     */
    refreshTable() {
        this.reloadGastos();
        this.showInfo('Datos actualizados', 'Actualización');
    }

    /** Selecciona uno de los filtros rápidos ("Hoy" / "Esta semana" / "Este mes") de la tabla de Movimientos. */
    seleccionarFiltroPeriodo(filtro: FiltroPeriodoRapido) {
        this.filtroPeriodoActivo.set(filtro);
        this.rangoPersonalizado.set(null);
        this.cargarMovimientosPeriodo();
    }

    /** Selecciona un rango de fechas personalizado en la tabla de Movimientos. */
    onRangoPersonalizadoChange(rango: Date[] | null) {
        this.rangoPersonalizado.set(rango);
        if (rango?.[0] && rango[1]) {
            this.filtroPeriodoActivo.set('rango');
            this.cargarMovimientosPeriodo();
        }
    }

    /** Recarga la tabla de Movimientos con el filtro de periodo actualmente activo. */
    private cargarMovimientosPeriodo() {
        const filtro = this.filtroPeriodoActivo();
        if (filtro === 'rango') {
            const rango = this.rangoPersonalizado();
            if (!rango?.[0] || !rango[1]) return;
            this.gastosStore.loadGastosPorPeriodo({
                fechaInicio: this.toIsoDateLocal(rango[0]),
                fechaFin: this.toIsoDateLocal(rango[1])
            });
        } else {
            this.gastosStore.loadGastosPorPeriodo(calcularRangoFecha(filtro));
        }
    }

    private toIsoDateLocal(fecha: Date): string {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadGastosLazy(event: ListLazyLoadEvent) {
        // Calcular página actual (PrimeNG usa first que es el índice del primer registro)
        const first = event.first ?? 0;
        const rows = event.rows ?? this.pageSize();
        this.pageNumber.set(Math.floor(first / rows) + 1);
        this.pageSize.set(rows);

        // Capturar ordenamiento si existe
        if (event.sortField) {
            this.sortColumn.set(Array.isArray(event.sortField) ? event.sortField[0] : event.sortField);
            // event.sortOrder: 1 = ASC, -1 = DESC
            this.sortOrder.set(event.sortOrder === 1 ? 'asc' : 'desc');
        }

        // Cargar gastos
        this.reloadGastos();
    }

    onGlobalFilter(table: Table, event: Event) {
        const searchValue = (event.target as HTMLInputElement).value;

        // Usar Subject para aplicar debounce (esperar 500ms después de dejar de escribir)
        this.searchSubject.next(searchValue);
    }

    /** Búsqueda desde el DataView móvil (no depende de la referencia de la tabla). */
    onSearchInput(event: Event) {
        this.searchSubject.next((event.target as HTMLInputElement).value);
    }

    openNew() {
        this.currentGasto.set({});
        this.gastoDialog.set(true);
    }

    /** Repetir un gasto habitual: abre el modal de alta con la combinación ya rellenada. */
    onHabitualSeleccionado(habitual: TransaccionHabitualSeleccionada) {
        this.currentGasto.set({
            conceptoId: habitual.conceptoId,
            conceptoNombre: habitual.conceptoNombre,
            categoriaId: habitual.categoriaId ?? undefined,
            categoriaNombre: habitual.categoriaNombre ?? undefined,
            cuentaId: habitual.cuentaId,
            cuentaNombre: habitual.cuentaNombre,
            formaPagoId: habitual.formaPagoId,
            formaPagoNombre: habitual.formaPagoNombre,
            proveedorId: habitual.terceroId,
            proveedorNombre: habitual.terceroNombre,
            personaId: habitual.personaId,
            personaNombre: habitual.personaNombre
        });
        this.gastoDialog.set(true);
    }

    hideDialog() {
        this.gastoDialog.set(false);
        this.currentGasto.set({});
    }

    async onSaveGasto(gasto: Partial<Gasto>) {
        if (gasto.id) {
            // Actualizar gasto existente
            try {
                await this.gastosStore.updateGasto({ id: gasto.id, gasto });
                this.showSuccess('Gasto actualizado correctamente');
                this.gastoDialog.set(false);
                this.currentGasto.set({});
                // No reloadGastos() - optimistic update already syncs UI
                // Sí recargamos "Movimientos rápidos": si cambió la fecha, el gasto puede
                // entrar o salir del periodo filtrado, y solo el servidor sabe la verdad.
                this.cargarMovimientosPeriodo();
            } catch (error) {
                this.showError((error as HttpErrorLike).userMessage || 'Error al actualizar el gasto');
            }
        } else {
            var gastoCreate: GastoCreate = {
                conceptoId: gasto.conceptoId!,
                conceptoNombre: gasto.conceptoNombre!,
                categoriaId: gasto.categoriaId!,
                categoriaNombre: gasto.categoriaNombre!,
                proveedorId: gasto.proveedorId!,
                proveedorNombre: gasto.proveedorNombre!,
                fecha: gasto.fecha!,
                importe: gasto.importe!,
                descripcion: gasto.descripcion,
                formaPagoId: gasto.formaPagoId!,
                formaPagoNombre: gasto.formaPagoNombre!,
                personaId: gasto.personaId!,
                personaNombre: gasto.personaNombre!,
                cuentaId: gasto.cuentaId!,
                cuentaNombre: gasto.cuentaNombre!,
            };

            const displayData: Partial<Gasto> = {
                conceptoNombre: gasto.conceptoNombre,
                categoriaNombre: gasto.categoriaNombre,
                cuentaNombre: gasto.cuentaNombre,
                formaPagoNombre: gasto.formaPagoNombre,
                proveedorNombre: gasto.proveedorNombre,
                personaNombre: gasto.personaNombre
            };

            this.gastosStore.createGasto(gastoCreate, displayData).then(() => {
                this.showSuccess('Gasto creado correctamente');
                this.habitualesRefresco.update((v) => v + 1);
                this.cargarMovimientosPeriodo();
            });
            
            this.gastoDialog.set(false);
            this.currentGasto.set({});
        }
    }

    editGasto(gasto: Gasto) {
        this.currentGasto.set({ ...gasto });
        this.gastoDialog.set(true);
    }

    deleteGasto(gasto: Gasto) {
        this.confirmAction(
            `¿Estás seguro de eliminar el gasto "${gasto.conceptoNombre}"?`,
            () => {
                this.gastosStore.deleteGasto(gasto.id);
            },
            {
                header: 'Confirmar eliminación',
                acceptLabel: 'Sí, eliminar',
                rejectLabel: 'Cancelar',
                successMessage: 'Gasto eliminado correctamente'
            }
        );
    }

    deleteSelectedGastos() {
        this.confirmAction(
            '¿Estás seguro de eliminar los gastos seleccionados?',
            async () => {
                try {
                    const deletePromises = this.selectedGastos().map((gasto) => this.gastosStore.deleteGasto(gasto.id));

                    await Promise.all(deletePromises);
                    this.showSuccess('Gastos eliminados correctamente');
                    this.selectedGastos.set([]);
                    // No reloadGastos() - optimistic updates already sync UI
                } catch (error) {
                    this.showError((error as HttpErrorLike).userMessage || 'Error al eliminar algunos gastos');
                }
            },
            {
                header: 'Confirmar',
                acceptLabel: 'Sí, eliminar',
                rejectLabel: 'Cancelar'
            }
        );
    }

    onExportarExcel(filtros: ExportarExcelFiltros): void {
        this.exportandoExcel.set(true);
        firstValueFrom(this.gastoService.descargarExcel(filtros))
            .then((blob) => {
                this.descargarBlob(blob, `gastos_${new Date().toISOString().split('T')[0]}.xlsx`);
                this.exportarDialogVisible.set(false);
                this.showSuccess('El archivo se ha descargado correctamente.', 'Exportación completada');
            })
            .catch(() => {
                this.showError('No se pudo generar el archivo. Inténtalo de nuevo.', 'Error al exportar');
            })
            .finally(() => this.exportandoExcel.set(false));
    }

    private descargarBlob(blob: Blob, nombre: string): void {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombre;
        enlace.click();
        URL.revokeObjectURL(url);
    }

    getCategorySeverity(categoria: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
        if (!categoria) return 'secondary';

        // Generar un hash simple del nombre de categoría para asignar color consistente
        const severities: Array<'success' | 'info' | 'warn' | 'contrast' | 'secondary'> = ['success', 'info', 'warn', 'contrast', 'secondary'];

        let hash = 0;
        for (let i = 0; i < categoria.length; i++) {
            hash = categoria.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % severities.length;
        return severities[index];
    }

    selectGasto(gasto: Gasto) {
        this.gastosStore.selectGasto(gasto);
    }
}
