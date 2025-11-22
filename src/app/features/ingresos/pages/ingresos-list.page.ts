import { Component, inject, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { IngresosStore } from '../stores/ingresos.store';
import { Ingreso, IngresoCreate } from '@/core/models';

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
        DatePickerModule,
        SkeletonModule
    ],
    providers: [MessageService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="card surface-ground px-4 py-5 md:px-6 lg:px-8">
            <div class="surface-card shadow-2 border-round p-6">
                <p-toast></p-toast>

                <p-toolbar styleClass="mb-6 gap-2 p-6">
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
                    [value]="ingresosStore.ingresos()"
                    [lazy]="true"
                    (onLazyLoad)="loadIngresosLazy($event)"
                    [rows]="pageSize"
                    [totalRecords]="totalRecords"
                    [paginator]="true"
                    [loading]="ingresosStore.loading()"
                    [loadingIcon]="'none'"
                    [globalFilterFields]="['conceptoNombre', 'categoriaNombre', 'clienteNombre', 'descripcion']"
                    [tableStyle]="{ 'min-width': '75rem' }"
                    styleClass="p-datatable-gridlines p-datatable-loading-icon-none"
                    [(selection)]="selectedIngresos"
                    [rowHover]="true"
                    dataKey="id"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ingresos"
                    [showCurrentPageReport]="true"
                    [rowsPerPageOptions]="[10, 20, 30]"
                    sortField="fecha"
                    [sortOrder]="-1"
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
                            <th pSortableColumn="conceptoNombre" style="min-width:16rem; padding: 1rem">
                                Concepto
                                <p-sortIcon field="conceptoNombre" />
                            </th>
                            <th pSortableColumn="categoriaNombre" style="min-width:12rem">
                                Categoría
                                <p-sortIcon field="categoriaNombre" />
                            </th>
                            <th pSortableColumn="clienteNombre" style="min-width:12rem">
                                Cliente
                                <p-sortIcon field="clienteNombre" />
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

                    <ng-template #body let-ingreso>
                        <tr>
                            <td style="padding: 1rem">
                                <p-tableCheckbox [value]="ingreso" />
                            </td>
                            <td style="padding: 1rem">
                                <div class="flex flex-col">
                                    <span class="font-semibold">{{ ingreso.conceptoNombre }}</span>
                                    @if (ingreso.descripcion) {
                                        <small class="text-500">{{ ingreso.descripcion }}</small>
                                    }
                                </div>
                            </td>
                            <td style="padding: 1rem">
                                <p-tag 
                                    [value]="ingreso.categoriaNombre || 'Sin categoría'" 
                                    [severity]="getCategorySeverity(ingreso.categoriaNombre)" />
                            </td>
                            <td>{{ ingreso.clienteNombre || '-' }}</td>
                            <td>{{ ingreso.fecha | date:'dd/MM/yyyy' }}</td>
                            <td>
                                <span class="font-bold text-green-500">{{ ingreso.importe | currency:'EUR':'symbol':'1.2-2' }}</span>
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

                    <ng-template #loadingbody>
                        <tr>
                            <td style="padding: 1rem"><p-skeleton /></td>
                            <td style="padding: 1rem">
                                <div class="flex flex-col gap-2">
                                    <p-skeleton width="80%" />
                                    <p-skeleton width="60%" height=".8rem" />
                                </div>
                            </td>
                            <td style="padding: 1rem"><p-skeleton width="6rem" height="2rem" /></td>
                            <td><p-skeleton width="70%" /></td>
                            <td><p-skeleton width="6rem" /></td>
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
                                    [(ngModel)]="currentIngreso.conceptoNombre" 
                                    required 
                                    autofocus 
                                    fluid />
                                <small class="text-red-500" *ngIf="submitted && !currentIngreso.conceptoNombre">
                                    El concepto es requerido.
                                </small>
                            </div>

                            <div>
                                <label for="importe" class="block font-bold mb-3">Importe</label>
                                <p-inputnumber 
                                    id="importe" 
                                    [(ngModel)]="currentIngreso.importe" 
                                    mode="currency" 
                                    currency="EUR" 
                                    locale="es-ES"
                                    [min]="0"
                                    fluid />
                                <small class="text-red-500" *ngIf="submitted && !currentIngreso.importe">
                                    El importe es requerido.
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
                                <label for="categoriaNombre" class="block font-bold mb-3">Categoría</label>
                                <input 
                                    type="text" 
                                    pInputText 
                                    id="categoriaNombre" 
                                    [(ngModel)]="currentIngreso.categoriaNombre" 
                                    fluid />
                            </div>

                            <div>
                                <label for="clienteNombre" class="block font-bold mb-3">Cliente</label>
                                <input 
                                    type="text" 
                                    pInputText 
                                    id="clienteNombre" 
                                    [(ngModel)]="currentIngreso.clienteNombre" 
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
export class IngresosListPage implements OnDestroy {
    ingresosStore = inject(IngresosStore);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    @ViewChild('dt') dt!: Table;

    ingresoDialog: boolean = false;
    selectedIngresos: Ingreso[] = [];
    currentIngreso: Partial<Ingreso> = {};
    submitted: boolean = false;
    
    pageSize: number = 10;
    pageNumber: number = 1;
    searchTerm: string = '';
    sortColumn: string = 'fecha';
    sortOrder: string = 'desc';
    
    // Subject para manejar búsqueda con debounce
    private searchSubject = new Subject<string>();
    
    constructor() {
        // Configurar búsqueda con debounce de 500ms
        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(searchValue => {
            this.searchTerm = searchValue;
            this.pageNumber = 1; // Resetear a primera página en búsqueda
            this.reloadIngresos();
        });
    }
    
    ngOnDestroy() {
        this.searchSubject.complete();
    }
    
    get totalRecords(): number {
        return this.ingresosStore.totalRecords();
    }
    
    /**
     * Recargar ingresos con los filtros actuales
     */
    private reloadIngresos() {
        this.ingresosStore.loadIngresosPaginated({ 
            page: this.pageNumber, 
            pageSize: this.pageSize,
            searchTerm: this.searchTerm || undefined,
            sortColumn: this.sortColumn || undefined,
            sortOrder: this.sortOrder || undefined
        });
    }

    loadIngresosLazy(event: any) {
        // Calcular página actual (PrimeNG usa first que es el índice del primer registro)
        this.pageNumber = Math.floor(event.first / event.rows) + 1;
        this.pageSize = event.rows;
        
        // Capturar ordenamiento si existe
        if (event.sortField) {
            this.sortColumn = event.sortField;
            // event.sortOrder: 1 = ASC, -1 = DESC
            this.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
        }
        
        console.log('loadIngresosLazy llamado - event:', event);
        console.log('Calculado:', { 
            page: this.pageNumber, 
            pageSize: this.pageSize,
            sortColumn: this.sortColumn,
            sortOrder: this.sortOrder,
            searchTerm: this.searchTerm
        });
        
        // Cargar ingresos
        this.reloadIngresos();
    }

    onGlobalFilter(table: Table, event: Event) {
        const searchValue = (event.target as HTMLInputElement).value;
        console.log('Input de búsqueda:', searchValue);
        
        // Usar Subject para aplicar debounce (esperar 500ms después de dejar de escribir)
        this.searchSubject.next(searchValue);
    }

    openNew() {
        this.currentIngreso = {
            conceptoNombre: '',
            importe: 0,
            fecha: new Date().toISOString().split('T')[0],
            categoriaNombre: '',
            clienteNombre: '',
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
            message: `¿Estás seguro de eliminar el ingreso "${ingreso.conceptoNombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.ingresosStore.deleteIngreso(ingreso.id);
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
                // Implementar eliminación múltiple
                this.messageService.add({
                    severity: 'info',
                    summary: 'Info',
                    detail: 'Función de eliminación múltiple pendiente',
                    life: 3000
                });
            }
        });
    }

    saveIngreso() {
        this.submitted = true;

        if (!this.currentIngreso.conceptoNombre?.trim() || !this.currentIngreso.importe) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Por favor complete los campos requeridos'
            });
            return;
        }

        if (this.currentIngreso.id) {
            // Actualizar ingreso existente
            this.ingresosStore.updateIngreso({
                id: this.currentIngreso.id,
                ingreso: this.currentIngreso
            });
            this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Ingreso actualizado correctamente',
                life: 3000
            });
        } else {
            // Crear nuevo ingreso - requiere catálogos configurados
            this.messageService.add({
                severity: 'info',
                summary: 'Info',
                detail: 'La creación de ingresos estará disponible una vez configurados los catálogos',
                life: 3000
            });
        }

        this.ingresoDialog = false;
        this.currentIngreso = {};
    }

    exportCSV() {
        // En lazy mode, exportar los datos actuales del store
        const ingresos = this.ingresosStore.ingresos();
        if (!ingresos || ingresos.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No hay datos para exportar'
            });
            return;
        }

        // Crear CSV manualmente con BOM para UTF-8
        const headers = ['Concepto', 'Categoría', 'Cliente', 'Fecha', 'Importe', 'Descripción'];
        const csvData = ingresos.map(i => [
            i.conceptoNombre,
            i.categoriaNombre || '',
            i.clienteNombre || '',
            i.fecha,
            i.importe,
            i.descripcion || ''
        ]);

        // Agregar BOM (Byte Order Mark) para UTF-8
        let csv = '\uFEFF';
        csv += headers.join(',') + '\n';
        csvData.forEach(row => {
            csv += row.map(field => `"${field}"`).join(',') + '\n';
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

    getCategorySeverity(categoria: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
        const categoryMap: Record<string, "success" | "secondary" | "info" | "warn" | "danger" | "contrast"> = {
            'Salario': 'success',
            'Freelance': 'info',
            'Inversión': 'warn',
            'Bonificación': 'contrast',
            'Venta': 'secondary',
            'Alquiler': 'info',
            'Intereses': 'warn',
            'Honorarios': 'info',
            'Comisiones': 'success'
        };
        
        return categoryMap[categoria] || 'secondary';
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
