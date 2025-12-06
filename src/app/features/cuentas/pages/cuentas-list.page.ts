import { Component, inject, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { SkeletonModule } from 'primeng/skeleton';
import { CuentaStore } from '../store/cuenta.store';
import { Cuenta } from '@/core/models/cuenta.model';
import { CuentaFormModalComponent } from '../components/cuenta-form-modal.component';
import { BasePageComponent, BasePageTemplateComponent } from '@/shared/components';

@Component({
    selector: 'app-cuentas-list-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, ConfirmDialogModule, TableModule, ToolbarModule, InputIconModule, IconFieldModule, SkeletonModule, CuentaFormModalComponent, BasePageTemplateComponent],
    providers: [MessageService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-base-page-template [loading]="cuentaStore.loading()" [skeletonType]="'table'">
            <div class="card surface-ground px-4 py-5 md:px-6 lg:px-8">
                <div class="surface-card shadow-2 border-round p-6">
                    <p-toast></p-toast>

                    <p-toolbar styleClass="mb-6 gap-2 p-6">
                        <ng-template #start>
                            <p-button label="Nueva Cuenta" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                        </ng-template>

                        <ng-template #end>
                            <p-button icon="pi pi-refresh" severity="secondary" outlined (onClick)="refreshTable()" pTooltip="Actualizar" />
                        </ng-template>
                    </p-toolbar>

                    <p-table #dt [value]="cuentaStore.cuentas()" [loading]="cuentaStore.loading()" [globalFilterFields]="['nombre']" [tableStyle]="{ 'min-width': '50rem' }" styleClass="p-datatable-gridlines" [rowHover]="true" dataKey="id">
                        <ng-template #caption>
                            <div class="flex items-center justify-between py-3 px-4">
                                <h5 class="m-0 font-semibold text-xl">Gestión de Cuentas</h5>
                                <p-iconfield>
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
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
                                <th pSortableColumn="fechaCreacion" style="min-width:12rem">
                                    Fecha Creación
                                    <p-sortIcon field="fechaCreacion" />
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
                                    <span [class]="'font-bold ' + (cuenta.saldo >= 0 ? 'text-green-600' : 'text-red-600')"> {{ cuenta.saldo | number: '1.2-2' }} € </span>
                                </td>
                                <td>{{ cuenta.fechaCreacion | date: 'dd/MM/yyyy' }}</td>
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
                                <td colspan="4" style="padding: 2rem">
                                    <div class="text-center py-8">
                                        <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                        <p class="text-900 font-semibold text-xl mb-2">No hay cuentas</p>
                                        <p class="text-600 mb-4">Comienza agregando tu primera cuenta</p>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>

                    <app-cuenta-form-modal [visible]="cuentaDialog" [cuenta]="currentCuenta" (visibleChange)="cuentaDialog = $event" (save)="onSaveCuenta($event)" (cancel)="hideDialog()" />

                    <p-confirmdialog [style]="{ width: '450px' }" />
                </div>
            </div>
        </app-base-page-template>
    `
})
export class CuentasListPage extends BasePageComponent {
    cuentaStore = inject(CuentaStore);

    protected override loadingSignal = this.cuentaStore.loading;
    protected override skeletonType = 'table' as const;

    @ViewChild('dt') dt!: Table;

    cuentaDialog: boolean = false;
    currentCuenta: Partial<Cuenta> = {};

    ngOnInit() {
        this.loadCuentas();
    }

    loadCuentas() {
        // Cargar todas las cuentas - como es una entidad simple, no necesita paginación
        this.cuentaStore.search('', 100);
    }

    refreshTable() {
        this.loadCuentas();
        this.showInfo('Datos actualizados', 'Actualización');
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
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
                // Actualizar cuenta existente (si tu API lo soporta)
                await this.cuentaStore.update(cuenta.nombre!);
                this.showSuccess('Cuenta actualizada correctamente');
                this.loadCuentas();
                this.hideDialog();
            } catch (error: any) {
                this.showError(error.message || 'Error al actualizar la cuenta');
            }
        } else {
            // Crear nueva cuenta
            try {
                await this.cuentaStore.create(cuenta.nombre!, cuenta.saldo!);
                this.showSuccess('Cuenta creada correctamente');
                this.loadCuentas();
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
            async () => {
                this.showInfo('Funcionalidad de eliminación pendiente');
                // Aquí iría: await this.cuentaStore.delete(cuenta.id);
                // this.loadCuentas();
            },
            {
                header: 'Confirmar eliminación',
                acceptLabel: 'Sí, eliminar',
                rejectLabel: 'Cancelar',
                successMessage: 'Cuenta eliminada correctamente'
            }
        );
    }
}
