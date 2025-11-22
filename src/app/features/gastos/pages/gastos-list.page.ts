import { Component, inject, ChangeDetectionStrategy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { RippleModule } from 'primeng/ripple';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService, ConfirmationService } from 'primeng/api';
import { GastosStore } from '../stores/gastos.store';
import { Gasto, GastoCreate } from '@/core/models';

@Component({
    selector: 'app-gastos-list-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        InputNumberModule,
        ToastModule,
        ConfirmDialogModule,
        TableModule,
        ToolbarModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        RippleModule,
        TextareaModule,
        DatePickerModule
    ],
    providers: [MessageService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="surface-ground px-4 py-5 md:px-6 lg:px-8">
            <div class="surface-card shadow-2 border-round p-6">
                <p-toast></p-toast>

                <p-toolbar styleClass="mb-6 gap-2 p-6">
                    <ng-template #start>
                        <p-button 
                            label="Nuevo Gasto" 
                            icon="pi pi-plus" 
                            severity="secondary" 
                            class="mr-2" 
                            (onClick)="openNew()" />
                        <p-button 
                            severity="secondary" 
                            label="Eliminar" 
                            icon="pi pi-trash" 
                            outlined 
                            (onClick)="deleteSelectedGastos()" 
                            [disabled]="!selectedGastos || !selectedGastos.length" />
                    </ng-template>

                    <ng-template #end>
                        <p-button 
                            label="Exportar" 
                            icon="pi pi-upload" 
                            severity="secondary" 
                            (onClick)="exportCSV()" />
                    </ng-template>
                </p-toolbar>

                <p-table
                    #dt
                    [value]="gastosStore.gastos()"
                    [rows]="10"
                    [paginator]="true"
                    [globalFilterFields]="['conceptoNombre', 'categoriaNombre', 'proveedorNombre', 'descripcion']"
                    [tableStyle]="{ 'min-width': '75rem' }"
                    styleClass="p-datatable-gridlines"
                    [(selection)]="selectedGastos"
                    [rowHover]="true"
                    dataKey="id"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} gastos"
                    [showCurrentPageReport]="true"
                    [rowsPerPageOptions]="[10, 20, 30]"
                >
                    <ng-template #caption>
                        <div class="flex items-center justify-between py-3 px-4">
                            <h5 class="m-0 font-semibold text-xl">Gestión de Gastos</h5>
                            <p-iconfield>
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
                            </p-iconfield>
                        </div>
                    </ng-template>

                    <ng-template #header>
                        <tr>
                            <th style="width: 3rem; padding: 1rem">
                                <p-tableHeaderCheckbox />
                            </th>
                            <th pSortableColumn="conceptoNombre" style="min-width:16rem; padding: 1rem">
                                Concepto
                                <p-sortIcon field="conceptoNombre" />
                            </th>
                            <th pSortableColumn="categoriaNombre" style="min-width:12rem">
                                Categoría
                                <p-sortIcon field="categoriaNombre" />
                            </th>
                            <th pSortableColumn="proveedorNombre" style="min-width:12rem">
                                Proveedor
                                <p-sortIcon field="proveedorNombre" />
                            </th>
                            <th pSortableColumn="fecha" style="min-width:10rem">
                                Fecha
                                <p-sortIcon field="fecha" />
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
                            <td style="padding: 1rem">
                                <p-tableCheckbox [value]="gasto" />
                            </td>
                            <td style="padding: 1rem">
                                <div class="flex flex-col">
                                    <span class="font-semibold">{{ gasto.conceptoNombre }}</span>
                                    @if (gasto.descripcion) {
                                        <small class="text-500">{{ gasto.descripcion }}</small>
                                    }
                                </div>
                            </td>
                            <td style="padding: 1rem">
                                <p-tag 
                                    [value]="gasto.categoriaNombre || 'Sin categoría'" 
                                    [severity]="getCategorySeverity(gasto.categoriaNombre)" />
                            </td>
                            <td>{{ gasto.proveedorNombre || '-' }}</td>
                            <td>{{ gasto.fecha | date:'dd/MM/yyyy' }}</td>
                            <td>
                                <span class="font-bold text-red-500">{{ gasto.importe | currency:'EUR':'symbol':'1.2-2' }}</span>
                            </td>
                            <td>
                                <p-button 
                                    icon="pi pi-pencil" 
                                    class="mr-2" 
                                    [rounded]="true" 
                                    [outlined]="true" 
                                    (click)="editGasto(gasto)" />
                                <p-button 
                                    icon="pi pi-trash" 
                                    severity="danger" 
                                    [rounded]="true" 
                                    [outlined]="true" 
                                    (click)="deleteGasto(gasto)" />
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="7" style="padding: 2rem">
                                <div class="text-center py-8">
                                    <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                    <p class="text-900 font-semibold text-xl mb-2">No hay gastos</p>
                                    <p class="text-600 mb-4">Comienza agregando tu primer gasto</p>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>

                <p-dialog 
                    [(visible)]="gastoDialog" 
                    [style]="{ width: '550px' }" 
                    header="Detalles del Gasto" 
                    [modal]="true"
                    [contentStyle]="{ padding: '2rem' }"
                    styleClass="p-fluid">
                    <ng-template #content>
                        <div class="flex flex-col gap-6">
                            <div>
                                <label for="conceptoNombre" class="block font-bold mb-3">Concepto</label>
                                <input 
                                    type="text" 
                                    pInputText 
                                    id="conceptoNombre" 
                                    [(ngModel)]="currentGasto.conceptoNombre" 
                                    required 
                                    autofocus 
                                    fluid />
                                <small class="text-red-500" *ngIf="submitted && !currentGasto.conceptoNombre">
                                    El concepto es requerido.
                                </small>
                            </div>

                            <div>
                                <label for="importe" class="block font-bold mb-3">Importe</label>
                                <p-inputnumber 
                                    id="importe" 
                                    [(ngModel)]="currentGasto.importe" 
                                    mode="currency" 
                                    currency="EUR" 
                                    locale="es-ES"
                                    [min]="0"
                                    fluid />
                                <small class="text-red-500" *ngIf="submitted && !currentGasto.importe">
                                    El importe es requerido.
                                </small>
                            </div>

                            <div>
                                <label for="fecha" class="block font-bold mb-3">Fecha</label>
                                <p-datepicker 
                                    [(ngModel)]="currentGasto.fecha" 
                                    dateFormat="dd/mm/yy"
                                    iconDisplay="input"
                                    fluid />
                            </div>

                            <div>
                                <label for="categoriaNombre" class="block font-bold mb-3">Categoría</label>
                                <input 
                                    type="text" 
                                    pInputText 
                                    id="categoriaNombre" 
                                    [(ngModel)]="currentGasto.categoriaNombre" 
                                    fluid />
                            </div>

                            <div>
                                <label for="proveedorNombre" class="block font-bold mb-3">Proveedor</label>
                                <input 
                                    type="text" 
                                    pInputText 
                                    id="proveedorNombre" 
                                    [(ngModel)]="currentGasto.proveedorNombre" 
                                    fluid />
                            </div>

                            <div>
                                <label for="descripcion" class="block font-bold mb-3">Descripción</label>
                                <textarea 
                                    id="descripcion" 
                                    pTextarea 
                                    [(ngModel)]="currentGasto.descripcion" 
                                    rows="3" 
                                    fluid>
                                </textarea>
                            </div>
                        </div>
                    </ng-template>

                    <ng-template #footer>
                        <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" />
                        <p-button label="Guardar" icon="pi pi-check" (click)="saveGasto()" />
                    </ng-template>
                </p-dialog>

                <p-confirmdialog [style]="{ width: '450px' }" />
            </div>
        </div>
    `
})
export class GastosListPage {
    gastosStore = inject(GastosStore);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    @ViewChild('dt') dt!: Table;

    gastoDialog: boolean = false;
    selectedGastos: Gasto[] = [];
    currentGasto: Partial<Gasto> = {};
    submitted: boolean = false;

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.currentGasto = {
            conceptoNombre: '',
            importe: 0,
            fecha: new Date().toISOString().split('T')[0],
            descripcion: ''
        };
        this.submitted = false;
        this.gastoDialog = true;
    }

    hideDialog() {
        this.gastoDialog = false;
        this.submitted = false;
    }

    editGasto(gasto: Gasto) {
        this.currentGasto = { ...gasto };
        this.gastoDialog = true;
    }

    deleteGasto(gasto: Gasto) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el gasto "${gasto.conceptoNombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.gastosStore.deleteGasto(gasto.id);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Gasto eliminado correctamente',
                    life: 3000
                });
            }
        });
    }

    deleteSelectedGastos() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de eliminar los gastos seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.selectedGastos.forEach(gasto => {
                    this.gastosStore.deleteGasto(gasto.id);
                });
                this.selectedGastos = [];
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Gastos eliminados correctamente',
                    life: 3000
                });
            }
        });
    }

    saveGasto() {
        this.submitted = true;

        if (!this.currentGasto.conceptoNombre?.trim() || !this.currentGasto.importe) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Por favor complete los campos requeridos'
            });
            return;
        }

        if (this.currentGasto.id) {
            // Actualizar gasto existente
            const gastoUpdate: Partial<Gasto> = {
                conceptoNombre: this.currentGasto.conceptoNombre,
                importe: this.currentGasto.importe,
                fecha: typeof this.currentGasto.fecha === 'string' 
                    ? this.currentGasto.fecha 
                    : new Date(this.currentGasto.fecha!).toISOString().split('T')[0],
                descripcion: this.currentGasto.descripcion,
                categoriaNombre: this.currentGasto.categoriaNombre,
                proveedorNombre: this.currentGasto.proveedorNombre
            };
            
            this.gastosStore.updateGasto({ id: this.currentGasto.id, gasto: gastoUpdate });
            this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Gasto actualizado correctamente',
                life: 3000
            });
        } else {
            // Crear nuevo gasto
            const nuevoGasto: GastoCreate = {
                importe: this.currentGasto.importe,
                fecha: typeof this.currentGasto.fecha === 'string' 
                    ? this.currentGasto.fecha 
                    : new Date(this.currentGasto.fecha!).toISOString().split('T')[0],
                descripcion: this.currentGasto.descripcion || '',
                conceptoId: '', // TODO: Requerirá selección desde catálogo
                categoriaId: '',
                proveedorId: '',
                personaId: '',
                cuentaId: '',
                formaPagoId: ''
            };
            
            // Nota: Esto es temporal, requerirá implementación completa con catálogos
            this.messageService.add({
                severity: 'info',
                summary: 'Info',
                detail: 'La creación de gastos estará disponible una vez configurados los catálogos',
                life: 3000
            });
        }

        this.gastoDialog = false;
        this.currentGasto = {};
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    getCategorySeverity(categoria: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
        const categoryMap: Record<string, "success" | "secondary" | "info" | "warn" | "danger" | "contrast"> = {
            'Alimentación': 'success',
            'Transporte': 'info',
            'Vivienda': 'warn',
            'Salud': 'danger',
            'Entretenimiento': 'secondary',
            'Educación': 'info',
            'Ropa': 'success',
            'Tecnología': 'contrast',
            'Servicios': 'warn',
            'Otros': 'secondary'
        };
        
        return categoryMap[categoria] || 'secondary';
    }

    selectGasto(gasto: Gasto) {
        this.gastosStore.selectGasto(gasto);
    }
}

