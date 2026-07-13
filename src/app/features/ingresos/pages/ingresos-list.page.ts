import { Component, inject, ChangeDetectionStrategy, signal, computed, effect, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
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
import { IngresosStore } from '../stores/ingresos.store';
import { Ingreso, IngresoCreate } from '@/core/models';
import { HttpErrorLike } from '@/core/models/error-response.model';
import { IngresoFormModalComponent } from '../components/ingreso-form-modal.component';
import { BasePageComponent, BasePageTemplateComponent, HelpGlossaryComponent, GlossaryConfig, ListLazyLoadEvent } from '@sergioizq/ngx-crud-ui';
import { DataViewModule } from 'primeng/dataview';
import { LayoutService } from '@/layout/service/layout.service';

@Component({
    selector: 'app-ingresos-list-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, TableModule, ToolbarModule, TagModule, InputIconModule, IconFieldModule, SkeletonModule, DataViewModule, IngresoFormModalComponent, BasePageTemplateComponent, HelpGlossaryComponent],
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
        <ngxc-base-page-template [loading]="ingresosStore.loading() && ingresosStore.ingresos().length === 0" [skeletonType]="'table'">
            <div class="card surface-ground px-4 py-5 md:px-6 lg:px-8">
                <div class="surface-card shadow-2 border-round p-6">
                    <p-toolbar styleClass="mb-6 gap-2 p-6">
                        <ng-template #start>
                            <p-button label="Nuevo Ingreso" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                        </ng-template>

                        <ng-template #end>
                            <ngxc-help-glossary [config]="glossary" class="mr-2" />
                            <p-button icon="pi pi-refresh" severity="secondary" outlined (onClick)="refreshTable()" pTooltip="Actualizar" class="mr-2" />
                            <p-button label="Exportar" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
                        </ng-template>
                    </p-toolbar>

                    @if (!layout.isMobileView()) {
                    <p-table
                        #dt
                        [value]="ingresosStore.ingresos()"
                        [lazy]="true"
                        (onLazyLoad)="loadIngresosLazy($event)"
                        [rows]="pageSize()"
                        [totalRecords]="totalRecords()"
                        [paginator]="true"
                        [loading]="ingresosStore.loading()"
                        [loadingIcon]="'none'"
                        [globalFilterFields]="['conceptoNombre', 'categoriaNombre', 'proveedorNombre', 'descripcion']"
                        [tableStyle]="{ 'min-width': '75rem' }"
                        styleClass="p-datatable-gridlines p-datatable-loading-icon-none"
                        [selection]="selectedIngresos()"
                        (selectionChange)="selectedIngresos.set($event)"
                        [rowHover]="true"
                        dataKey="id"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ingresos"
                        [showCurrentPageReport]="true"
                        [rowsPerPageOptions]="[10, 20, 30]"
                        sortField="fecha"
                        [sortOrder]="-1"
                    >
                        <ng-template #caption>
                            <div class="flex flex-col md:flex-row items-center justify-between gap-3 py-3 px-4">
                                <h5 class="m-0 font-semibold text-xl">Gestión de Ingresos</h5>
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
                                <th pSortableColumn="clienteNombre" style="min-width:12rem">
                                    Cliente
                                    <p-sortIcon field="clienteNombre" />
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

                        <ng-template #body let-ingreso>
                            <tr>
                                <td style="padding: 1rem">{{ ingreso.fecha | date: 'dd/MM/yyyy' }}</td>
                                <td>{{ ingreso.personaNombre || '-' }}</td>
                                <td>{{ ingreso.formaPagoNombre || '-' }}</td>
                                <td>{{ ingreso.clienteNombre || '-' }}</td>
                                <td style="padding: 1rem">
                                    <div class="flex flex-col">
                                        <span class="font-semibold">{{ ingreso.conceptoNombre }}</span>
                                        @if (ingreso.descripcion) {
                                            <small class="text-500">{{ ingreso.descripcion }}</small>
                                        }
                                    </div>
                                </td>
                                <td>{{ ingreso.cuentaNombre || '-' }}</td>
                                <td>
                                    <span class="font-bold text-green-500">+ {{ ingreso.importe | number: '1.2-2' : 'es-ES' }} €</span>
                                </td>
                                <td>
                                    <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editIngreso(ingreso)" />
                                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteIngreso(ingreso)" />
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
                                        <p class="text-900 font-semibold text-xl mb-2">No hay ingresos</p>
                                        <p class="text-600 mb-4">Comienza agregando tu primer ingreso</p>
                                        <p-button label="Crear Ingreso" icon="pi pi-plus" (onClick)="openNew()" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                    } @else {
                    <p-dataView
                        styleClass="kash-mobile-dataview"
                        [value]="ingresosStore.ingresos()"
                        [lazy]="true"
                        (onLazyLoad)="loadIngresosLazy($event)"
                        [rows]="pageSize()"
                        [totalRecords]="totalRecords()"
                        [paginator]="true"
                        [loading]="ingresosStore.loading()"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="{first}-{last} de {totalRecords}"
                    >
                        <ng-template #header>
                            <div class="flex flex-col gap-3 py-2">
                                <h5 class="m-0 font-semibold text-lg">Gestión de Ingresos</h5>
                                <p-iconfield>
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" (input)="onSearchInput($event)" placeholder="Buscar..." class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #list let-ingresos>
                            <div class="flex flex-col gap-4 pt-4">
                                @for (ingreso of ingresos; track ingreso.id) {
                                    <div class="surface-card rounded-xl border border-surface-200 dark:border-surface-700 border-l-4 border-l-green-500 shadow-sm p-4">
                                        <!-- Cabecera: concepto + importe -->
                                        <div class="flex justify-between items-start gap-3 pb-3 border-b border-surface-200 dark:border-surface-700">
                                            <div class="flex flex-col min-w-0">
                                                <span class="font-semibold text-base text-900 truncate">{{ ingreso.conceptoNombre }}</span>
                                                <span class="text-xs text-500 flex items-center gap-1 mt-1">
                                                    <i class="pi pi-calendar" style="font-size: 0.75rem"></i>{{ ingreso.fecha | date: 'dd/MM/yyyy' }}
                                                </span>
                                            </div>
                                            <span class="font-bold text-green-500 text-lg whitespace-nowrap">+ {{ ingreso.importe | number: '1.2-2' : 'es-ES' }} €</span>
                                        </div>

                                        <!-- Detalles -->
                                        <div class="grid grid-cols-2 gap-x-4 gap-y-3 py-3">
                                            <div class="flex flex-col gap-1 min-w-0">
                                                <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-user mr-1"></i>Cliente</span>
                                                <span class="text-sm text-700 truncate">{{ ingreso.clienteNombre || '—' }}</span>
                                            </div>
                                            <div class="flex flex-col gap-1 min-w-0">
                                                <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-id-card mr-1"></i>Persona</span>
                                                <span class="text-sm text-700 truncate">{{ ingreso.personaNombre || '—' }}</span>
                                            </div>
                                            <div class="flex flex-col gap-1 min-w-0">
                                                <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-credit-card mr-1"></i>Forma de Pago</span>
                                                <span class="text-sm text-700 truncate">{{ ingreso.formaPagoNombre || '—' }}</span>
                                            </div>
                                            <div class="flex flex-col gap-1 min-w-0">
                                                <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-wallet mr-1"></i>Cuenta</span>
                                                <span class="text-sm text-700 truncate">{{ ingreso.cuentaNombre || '—' }}</span>
                                            </div>
                                        </div>

                                        <!-- Acciones -->
                                        <div class="flex justify-end gap-2 pt-3 border-t border-surface-200 dark:border-surface-700">
                                            <p-button icon="pi pi-pencil" label="Editar" severity="secondary" [outlined]="true" size="small" (click)="editIngreso(ingreso)" />
                                            <p-button icon="pi pi-trash" label="Eliminar" severity="danger" [outlined]="true" size="small" (click)="deleteIngreso(ingreso)" />
                                        </div>
                                    </div>
                                }
                            </div>
                        </ng-template>

                        <ng-template #empty>
                            <div class="text-center py-8">
                                <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                <p class="text-900 font-semibold text-xl mb-2">No hay ingresos</p>
                                <p class="text-600 mb-4">Comienza agregando tu primer ingreso</p>
                                <p-button label="Crear Ingreso" icon="pi pi-plus" (onClick)="openNew()" />
                            </div>
                        </ng-template>
                    </p-dataView>
                    }

                    <!-- Nuevo componente de formulario modal con autocomplete -->
                    <app-ingreso-form-modal [visible]="ingresoDialog()" [ingreso]="currentIngreso()" (visibleChange)="ingresoDialog.set($event)" (save)="onSaveIngreso($event)" (cancel)="hideDialog()" />
                </div>
            </div>
        </ngxc-base-page-template>
    `
})
export class IngresosListPage extends BasePageComponent implements OnDestroy {
    ingresosStore = inject(IngresosStore);
    protected readonly layout = inject(LayoutService);

    protected override loadingSignal = this.ingresosStore.loading;
    protected override skeletonType = 'table' as const;

    readonly glossary: GlossaryConfig = {
        title: 'Glosario · Ingresos',
        intro: 'Esta pantalla registra y consulta tus <strong>ingresos</strong> (entradas de dinero). Cada ingreso suma su importe al saldo de la cuenta asociada. Puedes buscarlos, ordenarlos, paginarlos y exportarlos a CSV.',
        sections: [
            {
                title: 'Botones y acciones',
                rows: [
                    { icon: 'pi pi-plus', color: '#22c55e', term: 'Nuevo Ingreso', def: 'Abre el formulario para registrar un ingreso: fecha, importe, concepto, categoría, cliente, persona, forma de pago y cuenta.' },
                    { icon: 'pi pi-search', color: '#6366f1', term: 'Buscar', def: 'Filtra la tabla por concepto, categoría, cliente o descripción. Se aplica automáticamente al dejar de escribir.' },
                    { icon: 'pi pi-refresh', color: '#64748b', term: 'Actualizar', def: 'Vuelve a cargar la lista de ingresos desde el servidor con los filtros actuales.' },
                    { icon: 'pi pi-upload', color: '#3b82f6', term: 'Exportar', def: 'Descarga los ingresos cargados en un archivo CSV (compatible con Excel).' },
                    { icon: 'pi pi-pencil', color: '#f59e0b', term: 'Editar', def: 'Modifica los datos del ingreso seleccionado.' },
                    { icon: 'pi pi-trash', color: '#ef4444', term: 'Eliminar', def: 'Borra el ingreso (pide confirmación). El saldo de la cuenta se recalcula.' },
                ]
            },
            {
                title: 'Columnas de la tabla',
                rows: [
                    { icon: 'pi pi-calendar', color: '#6366f1', term: 'Fecha', def: 'Día en que se produjo el ingreso.' },
                    { icon: 'pi pi-id-card', color: '#8b5cf6', term: 'Persona', def: 'Persona a la que se imputa el ingreso.' },
                    { icon: 'pi pi-credit-card', color: '#06b6d4', term: 'Forma de Pago', def: 'Medio por el que se recibió el dinero: transferencia, efectivo, tarjeta, etc.' },
                    { icon: 'pi pi-user', color: '#64748b', term: 'Cliente', def: 'Cliente o entidad de quien procede el ingreso.' },
                    { icon: 'pi pi-bookmark', color: '#f59e0b', term: 'Concepto', def: 'Descripción del ingreso. Debajo aparece la nota ampliada si la hubiera.' },
                    { icon: 'pi pi-wallet', color: '#3b82f6', term: 'Cuenta', def: 'Cuenta en la que entra el dinero.' },
                    { icon: 'pi pi-euro', color: '#22c55e', term: 'Importe', def: 'Cantidad recibida. Se muestra en verde porque aumenta tu saldo.' },
                ]
            }
        ]
    };

    @ViewChild('dt') dt!: Table;

    ingresoDialog = signal<boolean>(false);
    selectedIngresos = signal<Ingreso[]>([]);
    currentIngreso = signal<Partial<Ingreso>>({});

    pageSize = signal<number>(10);
    pageNumber = signal<number>(1);
    searchTerm = signal<string>('');
    sortColumn = signal<string>('fecha');
    sortOrder = signal<string>('desc');

    // Computed signal para totalRecords
    totalRecords = computed(() => this.ingresosStore.totalRecords());

    // Subject para manejar búsqueda con debounce
    private searchSubject = new Subject<string>();

    constructor() {
        super();
        // Configurar búsqueda con debounce de 500ms
        this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe((searchValue) => {
            this.searchTerm.set(searchValue);
            this.pageNumber.set(1); // Resetear a primera página en búsqueda
            this.reloadIngresos();
        });

        // Effect para detectar sincronización automática
        effect(() => {
            const lastUpdate = this.ingresosStore.lastUpdated();
            if (lastUpdate) {
            }
        });
    }

    ngOnDestroy() {
        this.searchSubject.complete();
    }

    /**
     * Recargar ingresos con los filtros actuales
     */
    private reloadIngresos() {
        this.ingresosStore.loadIngresosPaginated({
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
        this.reloadIngresos();
        this.showInfo('Datos actualizados', 'Actualización');
    }

    loadIngresosLazy(event: ListLazyLoadEvent) {
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

        // Cargar ingresos
        this.reloadIngresos();
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
        this.currentIngreso.set({});
        this.ingresoDialog.set(true);
    }

    hideDialog() {
        this.ingresoDialog.set(false);
        this.currentIngreso.set({});
    }

    async onSaveIngreso(ingreso: Partial<Ingreso>) {
        if (ingreso.id) {
            // Actualizar ingreso existente
            try {
                await this.ingresosStore.updateIngreso({ id: ingreso.id, ingreso });
                this.showSuccess('Ingreso actualizado correctamente');
                this.ingresoDialog.set(false);
                this.currentIngreso.set({});
                // No reloadIngresos() - optimistic update already syncs UI
            } catch (error) {
                this.showError((error as HttpErrorLike).userMessage || 'Error al actualizar el ingreso');
            }
        } else {
            var ingresoCreate: IngresoCreate = {
                conceptoId: ingreso.conceptoId!,
                conceptoNombre: ingreso.conceptoNombre!,
                categoriaId: ingreso.categoriaId!,
                categoriaNombre: ingreso.categoriaNombre!,
                clienteId: ingreso.clienteId!,
                clienteNombre: ingreso.clienteNombre!,
                fecha: ingreso.fecha!,
                importe: ingreso.importe!,
                descripcion: ingreso.descripcion,
                formaPagoId: ingreso.formaPagoId!,
                formaPagoNombre: ingreso.formaPagoNombre!,
                personaId: ingreso.personaId!,
                personaNombre: ingreso.personaNombre!,
                cuentaId: ingreso.cuentaId!,
                cuentaNombre: ingreso.cuentaNombre!,
            };

            const displayData: Partial<Ingreso> = {
                conceptoNombre: ingreso.conceptoNombre,
                categoriaNombre: ingreso.categoriaNombre,
                cuentaNombre: ingreso.cuentaNombre,
                formaPagoNombre: ingreso.formaPagoNombre,
                clienteNombre: ingreso.clienteNombre,
                personaNombre: ingreso.personaNombre
            };

            this.ingresosStore.createIngreso(ingresoCreate, displayData).then(() => {
                this.showSuccess('Ingreso creado correctamente');
            });
            
            this.ingresoDialog.set(false);
            this.currentIngreso.set({});
        }
    }

    editIngreso(ingreso: Ingreso) {
        this.currentIngreso.set({ ...ingreso });
        this.ingresoDialog.set(true);
    }

    deleteIngreso(ingreso: Ingreso) {
        this.confirmAction(
            `¿Estás seguro de eliminar el ingreso "${ingreso.conceptoNombre}"?`,
            () => {
                this.ingresosStore.deleteIngreso(ingreso.id);
            },
            {
                header: 'Confirmar eliminación',
                acceptLabel: 'Sí, eliminar',
                rejectLabel: 'Cancelar',
                successMessage: 'Ingreso eliminado correctamente'
            }
        );
    }

    deleteSelectedIngresos() {
        this.confirmAction(
            '¿Estás seguro de eliminar los ingresos seleccionados?',
            async () => {
                try {
                    const deletePromises = this.selectedIngresos().map((ingreso) => this.ingresosStore.deleteIngreso(ingreso.id));

                    await Promise.all(deletePromises);
                    this.showSuccess('Ingresos eliminados correctamente');
                    this.selectedIngresos.set([]);
                    // No reloadIngresos() - optimistic updates already sync UI
                } catch (error) {
                    this.showError((error as HttpErrorLike).userMessage || 'Error al eliminar algunos ingresos');
                }
            },
            {
                header: 'Confirmar',
                acceptLabel: 'Sí, eliminar',
                rejectLabel: 'Cancelar'
            }
        );
    }

    exportCSV() {
        // En lazy mode, exportar los datos actuales del store
        const ingresos = this.ingresosStore.ingresos();
        if (!ingresos || ingresos.length === 0) {
            this.showWarning('No hay datos para exportar');
            return;
        }

        // Crear CSV manualmente con BOM para UTF-8
        const headers = ['Concepto', 'Categoría', 'Proveedor', 'Fecha', 'Importe', 'Descripción'];
        const csvData = ingresos.map((g) => [g.conceptoNombre, g.categoriaNombre || '', g.clienteNombre || '', g.fecha, g.importe, g.descripcion || '']);

        // Agregar BOM (Byte Order Mark) para UTF-8
        let csv = '\uFEFF';
        csv += headers.join(',') + '\n';
        csvData.forEach((row) => {
            csv += row.map((field) => `"${field}"`).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `ingresos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    selectIngreso(ingreso: Ingreso) {
        this.ingresosStore.selectIngreso(ingreso);
    }
}
