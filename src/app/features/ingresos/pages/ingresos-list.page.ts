import { Component, inject, ViewChild } from '@angular/core';
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
import { Ingreso } from '@/core/models';

@Component({
    selector: 'app-ingresos-list-page',
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
    template: `
        <div class="surface-ground px-4 py-5 md:px-6 lg:px-8">
            <div class="surface-card shadow-2 border-round p-6">
                <p-toast></p-toast>

                <p-toolbar styleClass="mb-6 gap-2">
                    <ng-template #start>
                        <p-button 
                            label="Nuevo Ingreso" 
                            icon="pi pi-plus" 
                            severity="secondary" 
                            class="mr-2" 
                            (onClick)="openNew()" />
                        <p-button 
                            severity="secondary" 
                            label="Eliminar" 
                            icon="pi pi-trash" 
                            outlined 
                            (onClick)="deleteSelectedIngresos()" 
                            [disabled]="!selectedIngresos || !selectedIngresos.length" />
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
                    [value]="ingresos"
                    [rows]="10"
                    [paginator]="true"
                    [globalFilterFields]="['concepto', 'tipo', 'fuente', 'descripcion']"
                    [tableStyle]="{ 'min-width': '75rem' }"
                    styleClass="p-datatable-gridlines"
                    [(selection)]="selectedIngresos"
                    [rowHover]="true"
                    dataKey="id"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ingresos"
                    [showCurrentPageReport]="true"
                    [rowsPerPageOptions]="[10, 20, 30]"
                >
                    <ng-template #caption>
                        <div class="flex items-center justify-between py-3 px-4">
                            <h5 class="m-0 font-semibold text-xl">Gestión de Ingresos</h5>
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
                            <th pSortableColumn="concepto" style="min-width:16rem; padding: 1rem">
                                Concepto
                                <p-sortIcon field="concepto" />
                            </th>
                            <th pSortableColumn="tipo" style="min-width:12rem">
                                Tipo
                                <p-sortIcon field="tipo" />
                            </th>
                            <th pSortableColumn="fuente" style="min-width:12rem">
                                Fuente
                                <p-sortIcon field="fuente" />
                            </th>
                            <th pSortableColumn="fecha" style="min-width:10rem">
                                Fecha
                                <p-sortIcon field="fecha" />
                            </th>
                            <th pSortableColumn="cantidad" style="min-width:10rem">
                                Cantidad
                                <p-sortIcon field="cantidad" />
                            </th>
                            <th style="min-width:10rem">Acciones</th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-ingreso>
                        <tr>
                            <td style="padding: 1rem">
                                <p-tableCheckbox [value]="ingreso" />
                            </td>
                            <td style="padding: 1rem">
                                <div class="flex flex-col">
                                    <span class="font-semibold">{{ ingreso.concepto }}</span>
                                    @if (ingreso.descripcion) {
                                        <small class="text-500">{{ ingreso.descripcion }}</small>
                                    }
                                </div>
                            </td>
                            <td>
                                <p-tag 
                                    [value]="ingreso.tipo || 'General'" 
                                    [severity]="getTipoSeverity(ingreso.tipo)" />
                            </td>
                            <td>{{ ingreso.fuente || '-' }}</td>
                            <td>{{ ingreso.fecha | date:'dd/MM/yyyy' }}</td>
                            <td>
                                <span class="font-bold text-green-500">{{ ingreso.cantidad | currency:'EUR':'symbol':'1.2-2' }}</span>
                            </td>
                            <td>
                                <p-button 
                                    icon="pi pi-pencil" 
                                    class="mr-2" 
                                    [rounded]="true" 
                                    [outlined]="true" 
                                    (click)="editIngreso(ingreso)" />
                                <p-button 
                                    icon="pi pi-trash" 
                                    severity="danger" 
                                    [rounded]="true" 
                                    [outlined]="true" 
                                    (click)="deleteIngreso(ingreso)" />
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="7" style="padding: 2rem">
                                <div class="text-center py-8">
                                    <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                    <p class="text-900 font-semibold text-xl mb-2">No hay ingresos</p>
                                    <p class="text-600 mb-4">Comienza agregando tu primer ingreso</p>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>

                <p-dialog 
                    [(visible)]="ingresoDialog" 
                    [style]="{ width: '550px' }" 
                    header="Detalles del Ingreso" 
                    [modal]="true"
                    [contentStyle]="{ padding: '2rem' }"
                    styleClass="p-fluid">
                    <ng-template #content>
                        <div class="flex flex-col gap-6">
                            <div>
                                <label for="concepto" class="block font-bold mb-3">Concepto</label>
                                <input 
                                    type="text" 
                                    pInputText 
                                    id="concepto" 
                                    [(ngModel)]="currentIngreso.concepto" 
                                    required 
                                    autofocus 
                                    fluid />
                                <small class="text-red-500" *ngIf="submitted && !currentIngreso.concepto">
                                    El concepto es requerido.
                                </small>
                            </div>

                            <div>
                                <label for="cantidad" class="block font-bold mb-3">Cantidad</label>
                                <p-inputnumber 
                                    id="cantidad" 
                                    [(ngModel)]="currentIngreso.cantidad" 
                                    mode="currency" 
                                    currency="EUR" 
                                    locale="es-ES"
                                    [min]="0"
                                    fluid />
                                <small class="text-red-500" *ngIf="submitted && !currentIngreso.cantidad">
                                    La cantidad es requerida.
                                </small>
                            </div>

                            <div>
                                <label for="fecha" class="block font-bold mb-3">Fecha</label>
                                <p-datepicker 
                                    [(ngModel)]="currentIngreso.fecha" 
                                    dateFormat="dd/mm/yy"
                                    iconDisplay="input"
                                    fluid />
                            </div>

                            <div>
                                <label for="tipo" class="block font-bold mb-3">Tipo</label>
                                <input 
                                    type="text" 
                                    pInputText 
                                    id="tipo" 
                                    [(ngModel)]="currentIngreso.tipo" 
                                    fluid />
                            </div>

                            <div>
                                <label for="fuente" class="block font-bold mb-3">Fuente</label>
                                <input 
                                    type="text" 
                                    pInputText 
                                    id="fuente" 
                                    [(ngModel)]="currentIngreso.fuente" 
                                    fluid />
                            </div>

                            <div>
                                <label for="descripcion" class="block font-bold mb-3">Descripción</label>
                                <textarea 
                                    id="descripcion" 
                                    pTextarea 
                                    [(ngModel)]="currentIngreso.descripcion" 
                                    rows="3" 
                                    fluid>
                                </textarea>
                            </div>
                        </div>
                    </ng-template>

                    <ng-template #footer>
                        <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" />
                        <p-button label="Guardar" icon="pi pi-check" (click)="saveIngreso()" />
                    </ng-template>
                </p-dialog>

                <p-confirmdialog [style]="{ width: '450px' }" />
            </div>
        </div>
    `
})
export class IngresosListPage {
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    @ViewChild('dt') dt!: Table;

    ingresoDialog: boolean = false;
    selectedIngresos: Ingreso[] = [];
    currentIngreso: Partial<Ingreso> = {};
    submitted: boolean = false;

    // Datos de demostración - reemplazar con servicio real
    ingresos: Ingreso[] = [
        {
            id: 1,
            concepto: 'Salario Mensual',
            cantidad: 2500,
            fecha: '2024-11-01',
            tipo: 'Salario',
            fuente: 'Empresa ABC',
            descripcion: 'Pago de salario correspondiente a noviembre 2024'
        },
        {
            id: 2,
            concepto: 'Freelance Proyecto Web',
            cantidad: 800,
            fecha: '2024-11-15',
            tipo: 'Freelance',
            fuente: 'Cliente XYZ',
            descripcion: 'Desarrollo de sitio web corporativo'
        },
        {
            id: 3,
            concepto: 'Dividendos Inversiones',
            cantidad: 150,
            fecha: '2024-11-10',
            tipo: 'Inversión',
            fuente: 'Broker Inversiones',
            descripcion: 'Rendimiento trimestral de inversiones'
        }
    ];

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.currentIngreso = {
            concepto: '',
            cantidad: 0,
            fecha: new Date().toISOString().split('T')[0],
            tipo: '',
            fuente: '',
            descripcion: ''
        };
        this.submitted = false;
        this.ingresoDialog = true;
    }

    hideDialog() {
        this.ingresoDialog = false;
        this.submitted = false;
    }

    editIngreso(ingreso: Ingreso) {
        this.currentIngreso = { ...ingreso };
        this.ingresoDialog = true;
    }

    deleteIngreso(ingreso: Ingreso) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el ingreso "${ingreso.concepto}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.ingresos = this.ingresos.filter(i => i.id !== ingreso.id);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Ingreso eliminado correctamente',
                    life: 3000
                });
            }
        });
    }

    deleteSelectedIngresos() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de eliminar los ingresos seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.ingresos = this.ingresos.filter(i => !this.selectedIngresos.includes(i));
                this.selectedIngresos = [];
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Ingresos eliminados correctamente',
                    life: 3000
                });
            }
        });
    }

    saveIngreso() {
        this.submitted = true;

        if (!this.currentIngreso.concepto?.trim() || !this.currentIngreso.cantidad) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Por favor complete los campos requeridos'
            });
            return;
        }

        if (this.currentIngreso.id) {
            // Actualizar ingreso existente
            const index = this.ingresos.findIndex(i => i.id === this.currentIngreso.id);
            if (index !== -1) {
                this.ingresos[index] = { ...this.ingresos[index], ...this.currentIngreso as Ingreso };
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Ingreso actualizado correctamente',
                    life: 3000
                });
            }
        } else {
            // Crear nuevo ingreso
            const nuevoIngreso: Ingreso = {
                id: Math.max(...this.ingresos.map(i => i.id), 0) + 1,
                concepto: this.currentIngreso.concepto!,
                cantidad: this.currentIngreso.cantidad!,
                fecha: typeof this.currentIngreso.fecha === 'string' 
                    ? this.currentIngreso.fecha 
                    : new Date(this.currentIngreso.fecha!).toISOString().split('T')[0],
                tipo: this.currentIngreso.tipo,
                fuente: this.currentIngreso.fuente,
                descripcion: this.currentIngreso.descripcion
            };
            
            this.ingresos = [...this.ingresos, nuevoIngreso];
            this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Ingreso creado correctamente',
                life: 3000
            });
        }

        this.ingresoDialog = false;
        this.currentIngreso = {};
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    getTipoSeverity(tipo: string | undefined): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
        const tipoMap: Record<string, "success" | "secondary" | "info" | "warn" | "danger" | "contrast"> = {
            'Salario': 'success',
            'Freelance': 'info',
            'Inversión': 'warn',
            'Bonificación': 'contrast',
            'Venta': 'secondary',
            'Alquiler': 'info',
            'Intereses': 'warn'
        };
        
        return tipo ? (tipoMap[tipo] || 'secondary') : 'secondary';
    }
}
