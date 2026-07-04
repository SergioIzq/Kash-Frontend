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
import { CuentaStore } from '../store/cuenta.store';
import { Cuenta } from '@/core/models/cuenta.model';
import { CuentaFormModalComponent } from '../components/cuenta-form-modal.component';
import { BasePageComponent, BasePageTemplateComponent, HelpGlossaryComponent, GlossaryConfig } from '@/shared/components';
import { DataViewModule } from 'primeng/dataview';
import { LayoutService } from '@/layout/service/layout.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
    selector: 'app-cuentas-list-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, TableModule, ToolbarModule, InputIconModule, IconFieldModule, SkeletonModule, DataViewModule, CuentaFormModalComponent, BasePageTemplateComponent, HelpGlossaryComponent],
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
        <app-base-page-template [loading]="cuentaStore.loading()" [skeletonType]="'table'">
            <div class="card surface-ground px-4 py-5 md:px-6 lg:px-8">
                <div class="surface-card shadow-2 border-round p-6">

                    <p-toolbar styleClass="mb-6 gap-2 p-6">
                        <ng-template #start>
                            <p-button label="Nueva Cuenta" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                        </ng-template>

                        <ng-template #end>
                            <app-help-glossary [config]="glossary" class="mr-2" />
                            <p-button icon="pi pi-refresh" severity="secondary" outlined (onClick)="refreshTable()" pTooltip="Actualizar" />
                        </ng-template>
                    </p-toolbar>

                    @if (!layout.isMobileView()) {
                    <p-table
                        #dt
                        [value]="cuentaStore.cuentas()"
                        [loading]="cuentaStore.loading()"
                        [lazy]="true"
                        (onLazyLoad)="onLazyLoad($event)"
                        [paginator]="true"
                        [rows]="pageSize"
                        [totalRecords]="cuentaStore.totalRecords()"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} cuentas"
                        [rowsPerPageOptions]="[10, 25, 50]"
                        [tableStyle]="{ 'min-width': '50rem' }"
                        styleClass="p-datatable-gridlines"
                        [rowHover]="true"
                        dataKey="id"
                    >
                        <ng-template #caption>
                            <div class="flex flex-col md:flex-row items-center justify-between gap-3 py-3 px-4">
                                <h5 class="m-0 font-semibold text-xl">Gestión de Cuentas</h5>
                                <p-iconfield class="w-full md:w-auto">
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" [(ngModel)]="searchTerm" (input)="onSearchChange($event)" placeholder="Buscar cuentas..." class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #header>
                            <tr>
                                <th pSortableColumn="nombre" style="min-width:20rem; padding: 1rem">
                                    Nombre
                                    <p-sortIcon field="nombre" />
                                </th>
                                <th pSortableColumn="saldo" style="min-width:12rem">
                                    Saldo
                                    <p-sortIcon field="saldo" />
                                </th>
                                <th style="min-width:10rem">Acciones</th>
                            </tr>
                        </ng-template>

                        <ng-template #body let-cuenta>
                            <tr>
                                <td style="padding: 1rem">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-credit-card text-primary"></i>
                                        <span class="font-semibold">{{ cuenta.nombre }}</span>
                                    </div>
                                </td>
                                <td>
                                    <span [class]="'font-bold ' + (cuenta.saldo >= 0 ? 'text-green-600' : 'text-red-600')"> {{ cuenta.saldo | number: '1.2-2' : 'es-ES' }} € </span>
                                </td>
                                <td>
                                    <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editCuenta(cuenta)" />
                                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteCuenta(cuenta)" />
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template #loadingbody>
                            <tr>
                                <td style="padding: 1rem"><p-skeleton width="80%" /></td>
                                <td><p-skeleton width="70%" /></td>
                                <td><p-skeleton width="6rem" /></td>
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
                                <td colspan="8" style="padding: 2rem">
                                    <div class="text-center py-8">
                                        <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                        <p class="text-900 font-semibold text-xl mb-2">No hay cuentas</p>
                                        <p class="text-600 mb-4">Comienza agregando tu primera cuenta</p>
                                        <p-button label="Crear Cuenta" icon="pi pi-plus" (onClick)="openNew()" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                    } @else {
                    <p-dataView
                        styleClass="kash-mobile-dataview"
                        [value]="cuentaStore.cuentas()"
                        [lazy]="true"
                        (onLazyLoad)="onLazyLoad($event)"
                        [rows]="pageSize"
                        [totalRecords]="cuentaStore.totalRecords()"
                        [paginator]="true"
                        [loading]="cuentaStore.loading()"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="{first}-{last} de {totalRecords}"
                    >
                        <ng-template #header>
                            <div class="flex flex-col gap-3 py-2">
                                <h5 class="m-0 font-semibold text-lg">Gestión de Cuentas</h5>
                                <p-iconfield>
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" [(ngModel)]="searchTerm" (input)="onSearchChange($event)" placeholder="Buscar..." class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #list let-cuentas>
                            <div class="flex flex-col gap-4 pt-4">
                                @for (cuenta of cuentas; track cuenta.id) {
                                    <div class="surface-card rounded-xl border border-surface-200 dark:border-surface-700 border-l-4 border-l-primary shadow-sm p-4">
                                        <div class="flex justify-between items-center gap-3 pb-3 border-b border-surface-200 dark:border-surface-700">
                                            <span class="font-semibold text-base text-900 flex items-center gap-2 min-w-0">
                                                <i class="pi pi-credit-card text-primary"></i><span class="truncate">{{ cuenta.nombre }}</span>
                                            </span>
                                            <span [class]="'font-bold text-lg whitespace-nowrap ' + (cuenta.saldo >= 0 ? 'text-green-500' : 'text-red-500')">{{ cuenta.saldo | number: '1.2-2' : 'es-ES' }} €</span>
                                        </div>

                                        <div class="flex justify-end gap-2 pt-3">
                                            <p-button icon="pi pi-pencil" label="Editar" severity="secondary" [outlined]="true" size="small" (click)="editCuenta(cuenta)" />
                                            <p-button icon="pi pi-trash" label="Eliminar" severity="danger" [outlined]="true" size="small" (click)="deleteCuenta(cuenta)" />
                                        </div>
                                    </div>
                                }
                            </div>
                        </ng-template>

                        <ng-template #empty>
                            <div class="text-center py-8">
                                <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                <p class="text-900 font-semibold text-xl mb-2">No hay cuentas</p>
                                <p class="text-600 mb-4">Comienza agregando tu primera cuenta</p>
                                <p-button label="Crear Cuenta" icon="pi pi-plus" (onClick)="openNew()" />
                            </div>
                        </ng-template>
                    </p-dataView>
                    }

                    <app-cuenta-form-modal [visible]="cuentaDialog" [cuenta]="currentCuenta" (visibleChange)="cuentaDialog = $event" (save)="onSaveCuenta($event)" (cancel)="hideDialog()" />
                </div>
            </div>
        </app-base-page-template>
    `
})
export class CuentasListPage extends BasePageComponent {
    cuentaStore = inject(CuentaStore);
    protected readonly layout = inject(LayoutService);

    protected override loadingSignal = this.cuentaStore.loading;
    protected override skeletonType = 'table' as const;

    readonly glossary: GlossaryConfig = {
        title: 'Glosario · Cuentas',
        intro: 'Esta pantalla gestiona tus <strong>cuentas</strong> (bancos, efectivo, tarjetas, etc.). El saldo de cada cuenta se actualiza automáticamente con los ingresos, gastos y traspasos que registres.',
        sections: [
            {
                title: 'Botones y acciones',
                rows: [
                    { icon: 'pi pi-plus', color: '#22c55e', term: 'Nueva Cuenta', def: 'Abre el formulario para crear una cuenta indicando su nombre y saldo inicial.' },
                    { icon: 'pi pi-search', color: '#6366f1', term: 'Buscar', def: 'Filtra la tabla por nombre de cuenta.' },
                    { icon: 'pi pi-refresh', color: '#64748b', term: 'Actualizar', def: 'Vuelve a cargar la lista de cuentas desde el servidor.' },
                    { icon: 'pi pi-pencil', color: '#f59e0b', term: 'Editar', def: 'Modifica el nombre o el saldo de la cuenta.' },
                    { icon: 'pi pi-trash', color: '#ef4444', term: 'Eliminar', def: 'Borra la cuenta (pide confirmación). No podrás eliminarla si tiene movimientos asociados.' },
                ]
            },
            {
                title: 'Columnas de la tabla',
                rows: [
                    { icon: 'pi pi-credit-card', color: '#6366f1', term: 'Nombre', def: 'Nombre identificativo de la cuenta (p. ej. «Cuenta corriente BBVA», «Efectivo»).' },
                    { icon: 'pi pi-euro', color: '#22c55e', term: 'Saldo', def: 'Dinero disponible en la cuenta. Se muestra en verde si es positivo y en rojo si es negativo.' },
                ]
            }
        ]
    };

    @ViewChild('dt') dt!: Table;

    cuentaDialog: boolean = false;
    currentCuenta: Partial<Cuenta> = {};
    private searchSubject = new Subject<string>();

    pageSize: number = 10;
    pageNumber: number = 1;
    searchTerm: string = '';
    sortColumn: string = 'nombre';
    sortOrder: string = 'asc';

    constructor() {
        super();
        // Configurar búsqueda con debounce de 500ms
        this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe((searchValue) => {
            this.searchTerm = searchValue;
            this.pageNumber = 1; // Resetear a primera página en búsqueda
            this.reloadCuentas();
        });
    }

    /**
     * Manejar evento lazy load de la tabla (paginación + sort)
     */
    onLazyLoad(event: any) {
        this.pageNumber = event.first / event.rows + 1;
        this.pageSize = event.rows;

        // Manejar ordenamiento
        if (event.sortField) {
            this.sortColumn = event.sortField;
            this.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
        }

        this.reloadCuentas();
    }

    /**
     * Manejar cambios en la búsqueda con debounce
     */
    onSearchChange(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchSubject.next(value);
    }

    /**
     * Recargar cuentas con los filtros actuales
     */
    private reloadCuentas() {
        this.cuentaStore.loadCuentasPaginated({
            page: this.pageNumber,
            pageSize: this.pageSize,
            searchTerm: this.searchTerm || undefined,
            sortColumn: this.sortColumn || undefined,
            sortOrder: this.sortOrder || undefined
        });
    }

    loadCuentas() {
        this.reloadCuentas();
    }

    refreshTable() {
        this.pageNumber = 1;
        this.searchTerm = '';
        this.reloadCuentas();
        this.showInfo('Datos actualizados', 'Actualización');
    }

    openNew() {
        this.currentCuenta = {};
        this.cuentaDialog = true;
    }

    hideDialog() {
        this.cuentaDialog = false;
        this.currentCuenta = {};
    }

    async onSaveCuenta(cuenta: Partial<Cuenta>) {
        if (cuenta.id) {
            try {
                await this.cuentaStore.update(cuenta.id, cuenta);
                this.showSuccess('Cuenta actualizada correctamente');
                this.hideDialog();
            } catch (error: any) {
                this.showError(error.message || 'Error al actualizar la cuenta');
            }
        } else {
            try {
                await this.cuentaStore.create(cuenta.nombre!, cuenta.saldo!);
                this.showSuccess('Cuenta creada correctamente');
                this.hideDialog();
            } catch (error: any) {
                this.showError(error.message || 'Error al crear la cuenta');
            }
        }
    }

    editCuenta(cuenta: Cuenta) {
        this.currentCuenta = { ...cuenta };
        this.cuentaDialog = true;
    }

    deleteCuenta(cuenta: Cuenta) {
        this.confirmAction(
            `¿Estás seguro de eliminar la cuenta "${cuenta.nombre}"?`,
            () => {
                this.cuentaStore.deleteCuenta(cuenta.id);
            },
            {
                header: 'Confirmar eliminación',
                acceptLabel: 'Sí, eliminar',
                rejectLabel: 'Cancelar',
                successMessage: 'Cuenta eliminado correctamente'
            }
        );
    }
}
