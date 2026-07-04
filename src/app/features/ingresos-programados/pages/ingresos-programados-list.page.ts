import { Component, inject, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { IngresosProgramadosStore } from '../stores/ingresos-programados.store';
import { IngresoProgramado } from '@/core/models/ingreso-programado.model';
import { BasePageComponent, BasePageTemplateComponent } from '@/shared/components';
import { HelpGlossaryComponent, GlossaryConfig } from '@/shared/components/help-glossary.component';
import { DataViewModule } from 'primeng/dataview';
import { LayoutService } from '@/layout/service/layout.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { IngresoProgramadoFormModalComponent } from '../components/ingreso-programado-form-modal.component';

@Component({
    selector: 'app-ingresos-programados-list-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, TableModule, ToolbarModule, InputIconModule, IconFieldModule, SkeletonModule, TagModule, DataViewModule, BasePageTemplateComponent, IngresoProgramadoFormModalComponent, HelpGlossaryComponent],
    providers: [MessageService, ConfirmationService],
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
        <app-base-page-template [loading]="ingresosStore.loading()" [skeletonType]="'table'">
            <div class="card surface-ground px-4 py-5 md:px-6 lg:px-8">
                <div class="surface-card shadow-2 border-round p-6">

                    <p-toolbar styleClass="mb-6 gap-2 p-6">
                        <ng-template #start>
                            <p-button label="Nuevo Ingreso Programado" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                        </ng-template>

                        <ng-template #end>
                            <app-help-glossary [config]="glossary" class="mr-2" />
                            <p-button icon="pi pi-refresh" severity="secondary" outlined (onClick)="refreshTable()" pTooltip="Actualizar" />
                        </ng-template>
                    </p-toolbar>

                    @if (!layout.isMobileView()) {
                    <p-table
                        #dt
                        [value]="ingresosStore.ingresosProgramados()"
                        [loading]="ingresosStore.loading()"
                        [lazy]="true"
                        (onLazyLoad)="onLazyLoad($event)"
                        [paginator]="true"
                        [rows]="pageSize"
                        [totalRecords]="ingresosStore.totalRecords()"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ingresos programados"
                        [rowsPerPageOptions]="[10, 25, 50]"
                        [tableStyle]="{ 'min-width': '50rem' }"
                        styleClass="p-datatable-gridlines"
                        [rowHover]="true"
                        dataKey="id"
                    >
                        <ng-template #caption>
                            <div class="flex flex-col md:flex-row items-center justify-between gap-3 py-3 px-4">
                                <h5 class="m-0 font-semibold text-xl">Gestión de Ingresos Programados</h5>
                                <p-iconfield class="w-full md:w-auto">
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" [(ngModel)]="searchTerm" (input)="onSearchChange($event)" placeholder="Buscar ingresos programados..." class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #header>
                            <tr>
                                <th pSortableColumn="importe" style="min-width:10rem; padding: 1rem">
                                    Importe
                                    <p-sortIcon field="importe" />
                                </th>
                                <th pSortableColumn="frecuencia" style="min-width:10rem">
                                    Frecuencia
                                    <p-sortIcon field="frecuencia" />
                                </th>
                                <th pSortableColumn="fechaEjecucion" style="min-width:12rem">
                                    Próxima Ejecución
                                    <p-sortIcon field="fechaEjecucion" />
                                </th>
                                <th pSortableColumn="activo" style="min-width:8rem">
                                    Estado
                                    <p-sortIcon field="activo" />
                                </th>
                                <th style="min-width:10rem">Acciones</th>
                            </tr>
                        </ng-template>

                        <ng-template #body let-ingreso>
                            <tr>
                                <td style="padding: 1rem">
                                    <span class="font-bold text-green-600">{{ ingreso.importe | number: '1.2-2' : 'es-ES' }} €</span>
                                </td>
                                <td>
                                    <p-tag [value]="ingreso.frecuencia" [severity]="getFrecuenciaSeverity(ingreso.frecuencia)" />
                                </td>
                                <td>
                                    {{ ingreso.fechaEjecucion | date: 'dd/MM/yyyy HH:mm' }}
                                </td>
                                <td>
                                    <p-tag [value]="ingreso.activo ? 'Activo' : 'Inactivo'" [severity]="ingreso.activo ? 'success' : 'danger'" />
                                </td>
                                <td>
                                    <div class="flex gap-2">
                                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editIngreso(ingreso)" pTooltip="Editar" />
                                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteIngreso(ingreso)" pTooltip="Eliminar" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template #loadingbody>
                            <tr>
                                <td style="padding: 1rem"><p-skeleton width="80%" /></td>
                                <td><p-skeleton width="70%" /></td>
                                <td><p-skeleton width="70%" /></td>
                                <td><p-skeleton width="70%" /></td>
                                <td>
                                    <div class="flex gap-2">
                                        <p-skeleton shape="circle" size="2.5rem" />
                                        <p-skeleton shape="circle" size="2.5rem" />
                                        <p-skeleton shape="circle" size="2.5rem" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="8" style="padding: 2rem">
                                    <div class="text-center py-8">
                                        <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                        <p class="text-900 font-semibold text-xl mb-2">No hay ingresos programados</p>
                                        <p class="text-600 mb-4">Comienza agregando tu primer ingreso programado</p>
                                        <p-button label="Crear Ingreso Programado" icon="pi pi-plus" (onClick)="openNew()" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                    } @else {
                    <p-dataView
                        styleClass="kash-mobile-dataview"
                        [value]="ingresosStore.ingresosProgramados()"
                        [lazy]="true"
                        (onLazyLoad)="onLazyLoad($event)"
                        [rows]="pageSize"
                        [totalRecords]="ingresosStore.totalRecords()"
                        [paginator]="true"
                        [loading]="ingresosStore.loading()"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="{first}-{last} de {totalRecords}"
                    >
                        <ng-template #header>
                            <div class="flex flex-col gap-3 py-2">
                                <h5 class="m-0 font-semibold text-lg">Ingresos Programados</h5>
                                <p-iconfield>
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" [(ngModel)]="searchTerm" (input)="onSearchChange($event)" placeholder="Buscar..." class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #list let-ingresos>
                            <div class="flex flex-col gap-4 pt-4">
                                @for (ingreso of ingresos; track ingreso.id) {
                                    <div class="surface-card rounded-xl border border-surface-200 dark:border-surface-700 border-l-4 border-l-green-500 shadow-sm p-4">
                                        <div class="flex justify-between items-center gap-3 pb-3 border-b border-surface-200 dark:border-surface-700">
                                            <span class="font-bold text-green-500 text-lg whitespace-nowrap">{{ ingreso.importe | number: '1.2-2' : 'es-ES' }} €</span>
                                            <p-tag [value]="ingreso.activo ? 'Activo' : 'Inactivo'" [severity]="ingreso.activo ? 'success' : 'danger'" />
                                        </div>

                                        <div class="grid grid-cols-2 gap-x-4 gap-y-3 py-3">
                                            <div class="flex flex-col gap-1 min-w-0">
                                                <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-sync mr-1"></i>Frecuencia</span>
                                                <div><p-tag [value]="ingreso.frecuencia" [severity]="getFrecuenciaSeverity(ingreso.frecuencia)" /></div>
                                            </div>
                                            <div class="flex flex-col gap-1 min-w-0">
                                                <span class="text-xs text-400 uppercase tracking-wide"><i class="pi pi-calendar-clock mr-1"></i>Próxima Ejecución</span>
                                                <span class="text-sm text-700 truncate">{{ ingreso.fechaEjecucion | date: 'dd/MM/yyyy HH:mm' }}</span>
                                            </div>
                                        </div>

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
                                <p class="text-900 font-semibold text-xl mb-2">No hay ingresos programados</p>
                                <p class="text-600 mb-4">Comienza agregando tu primer ingreso programado</p>
                                <p-button label="Crear Ingreso Programado" icon="pi pi-plus" (onClick)="openNew()" />
                            </div>
                        </ng-template>
                    </p-dataView>
                    }
                </div>
            </div>
        </app-base-page-template>

        <!-- Modal de Formulario -->
        <app-ingreso-programado-form-modal [visible]="ingresoDialog" [ingresoProgramado]="currentIngreso" (save)="saveIngreso($event)" (cancel)="hideDialog()" />
    `
})
export class IngresosProgramadosListPage extends BasePageComponent {
    ingresosStore = inject(IngresosProgramadosStore);
    protected readonly layout = inject(LayoutService);

    protected override loadingSignal = this.ingresosStore.loading;
    protected override skeletonType = 'table' as const;

    readonly glossary: GlossaryConfig = {
        title: 'Glosario · Ingresos Programados',
        intro: 'Programaciones automáticas para registrar ingresos recurrentes.',
        sections: [
            {
                title: 'Acciones',
                rows: [
                    { term: 'Nuevo Ingreso Programado', def: 'Abre el formulario para crear una programación.' },
                    { term: 'Actualizar', def: 'Recarga el listado con los datos más recientes.' }
                ]
            },
            {
                title: 'Columnas',
                rows: [
                    { term: 'Importe', def: 'Valor del ingreso programado.' },
                    { term: 'Frecuencia', def: 'Periodicidad con la que se ejecuta.' },
                    { term: 'Próxima Ejecución', def: 'Fecha y hora estimada de la siguiente ejecución.' },
                    { term: 'Estado', def: 'Indica si la programación está activa o inactiva.' },
                    { term: 'Acciones', def: 'Permite editar o eliminar la programación.' }
                ]
            }
        ]
    };

    @ViewChild('dt') dt!: Table;

    private searchSubject = new Subject<string>();

    pageSize: number = 10;
    pageNumber: number = 1;
    searchTerm: string = '';
    sortColumn: string = 'fechaEjecucion';
    sortOrder: string = 'asc';

    // Propiedades del modal
    ingresoDialog: boolean = false;
    currentIngreso: Partial<IngresoProgramado> | null = null;

    constructor() {
        super();
        this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe((searchValue) => {
            this.searchTerm = searchValue;
            this.pageNumber = 1;
            this.reloadIngresos();
        });
    }

    onLazyLoad(event: any) {
        this.pageNumber = event.first / event.rows + 1;
        this.pageSize = event.rows;

        if (event.sortField) {
            this.sortColumn = event.sortField;
            this.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
        }

        this.reloadIngresos();
    }

    onSearchChange(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchSubject.next(value);
    }

    private reloadIngresos() {
        this.ingresosStore.loadIngresosProgramadosPaginated({
            page: this.pageNumber,
            pageSize: this.pageSize,
            searchTerm: this.searchTerm || undefined,
            sortColumn: this.sortColumn || undefined,
            sortOrder: this.sortOrder || undefined
        });
    }

    refreshTable() {
        this.pageNumber = 1;
        this.searchTerm = '';
        this.reloadIngresos();
        this.showInfo('Datos actualizados', 'Actualización');
    }

    openNew() {
        this.currentIngreso = null;
        this.ingresoDialog = true;
    }

    editIngreso(ingreso: IngresoProgramado) {
        this.currentIngreso = { ...ingreso };
        this.ingresoDialog = true;
    }

    hideDialog() {
        this.ingresoDialog = false;
        this.currentIngreso = null;
    }

    saveIngreso(ingreso: Partial<IngresoProgramado>) {
        if (ingreso.id) {
            // Actualizar
            this.ingresosStore.update(ingreso.id, ingreso);
            this.showSuccess('Ingreso programado actualizado correctamente');
        } else {
            // Crear
            this.ingresosStore.createIngreso(ingreso);
            this.showSuccess('Ingreso programado creado correctamente');
        }
        this.hideDialog();
    }

    deleteIngreso(ingreso: IngresoProgramado) {
        this.confirmAction(
            `¿Estás seguro de eliminar este ingreso programado?`,
            () => {
                this.ingresosStore.deleteIngreso(ingreso.id);
                this.showSuccess('Ingreso programado eliminado correctamente');
            },
            {
                header: 'Confirmar eliminación',
                acceptLabel: 'Sí, eliminar',
                rejectLabel: 'Cancelar'
            }
        );
    }

    getFrecuenciaSeverity(frecuencia: string): 'success' | 'info' | 'warn' | 'danger' {
        switch (frecuencia) {
            case 'DIARIO':
                return 'danger';
            case 'SEMANAL':
                return 'warn';
            case 'MENSUAL':
                return 'info';
            case 'ANUAL':
                return 'success';
            default:
                return 'info';
        }
    }
}
