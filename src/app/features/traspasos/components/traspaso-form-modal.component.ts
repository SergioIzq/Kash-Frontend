import { Component, inject, input, output, effect, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { Traspaso } from '@/core/models/traspaso.model';
import { Cuenta } from '@/core/models/cuenta.model';
import { CuentaCreateModalComponent } from '@/shared/components';
import { CuentaStore } from '@/features/cuentas/store/cuenta.store';

interface CatalogItem {
    id: string;
    nombre: string;
}

interface TraspasoFormData extends Omit<Partial<Traspaso>, 'fecha'> {
    fecha?: Date | string;
}

@Component({
    selector: 'app-traspaso-form-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        ButtonModule,
        InputNumberModule,
        TextareaModule,
        DatePickerModule,
        AutoCompleteModule,
        CuentaCreateModalComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-dialog 
            [(visible)]="isVisible" 
            [style]="{ width: '650px' }" 
            [header]="isEditMode() ? 'Editar Traspaso' : 'Nuevo Traspaso'" 
            [modal]="true" 
            [contentStyle]="{ padding: '2rem' }" 
            (onHide)="onCancel()" 
            styleClass="p-fluid"
        >
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <!-- Cuenta Origen -->
                    <div>
                        <label for="cuentaOrigen" class="block font-bold mb-3">Cuenta Origen *</label>
                        <div class="flex gap-2">
                            <p-autoComplete
                                [(ngModel)]="selectedCuentaOrigen"
                                [suggestions]="filteredCuentasOrigen()"
                                (completeMethod)="searchCuentasOrigen($event)"
                                [showClear]="true"
                                (onClear)="onCuentaOrigenClear()"
                                optionLabel="nombre"
                                [dropdown]="true"
                                placeholder="Buscar o seleccionar cuenta origen"
                                [forceSelection]="true"
                                (onSelect)="onCuentaOrigenSelect($event)"
                                fluid
                            />
                            <p-button 
                                icon="pi pi-plus" 
                                [rounded]="true" 
                                severity="secondary" 
                                [outlined]="true" 
                                (click)="openCreateCuentaOrigen()" 
                                pTooltip="Crear nueva cuenta" 
                            />
                        </div>
                        @if (submitted() && !selectedCuentaOrigen) {
                            <small class="text-red-500"> La cuenta origen es requerida. </small>
                        }
                    </div>

                    <!-- Cuenta Destino -->
                    <div>
                        <label for="cuentaDestino" class="block font-bold mb-3">Cuenta Destino *</label>
                        <div class="flex gap-2">
                            <p-autoComplete
                                [(ngModel)]="selectedCuentaDestino"
                                [suggestions]="filteredCuentasDestino()"
                                (completeMethod)="searchCuentasDestino($event)"
                                [showClear]="true"
                                (onClear)="onCuentaDestinoClear()"
                                optionLabel="nombre"
                                [dropdown]="true"
                                placeholder="Buscar o seleccionar cuenta destino"
                                [forceSelection]="true"
                                (onSelect)="onCuentaDestinoSelect($event)"
                                fluid
                            />
                            <p-button 
                                icon="pi pi-plus" 
                                [rounded]="true" 
                                severity="secondary" 
                                [outlined]="true" 
                                (click)="openCreateCuentaDestino()" 
                                pTooltip="Crear nueva cuenta" 
                            />
                        </div>
                        @if (submitted() && !selectedCuentaDestino) {
                            <small class="text-red-500"> La cuenta destino es requerida. </small>
                        }
                        @if (submitted() && selectedCuentaOrigen && selectedCuentaDestino && selectedCuentaOrigen.id === selectedCuentaDestino.id) {
                            <small class="text-red-500"> La cuenta origen y destino deben ser diferentes. </small>
                        }
                    </div>

                    <!-- Importe -->
                    <div>
                        <label for="importe" class="block font-bold mb-3">Importe *</label>
                        <p-inputnumber 
                            id="importe" 
                            [(ngModel)]="formData.importe" 
                            mode="currency" 
                            currency="EUR" 
                            locale="es-ES" 
                            [min]="0.01" 
                            fluid 
                        />
                        @if (submitted() && (!formData.importe || formData.importe <= 0)) {
                            <small class="text-red-500"> El importe es requerido y debe ser mayor a 0. </small>
                        }
                    </div>

                    <!-- Fecha -->
                    <div>
                        <label for="fecha" class="block font-bold mb-3">Fecha *</label>
                        <p-datepicker 
                            [(ngModel)]="formData.fecha" 
                            dateFormat="dd/mm/yy" 
                            iconDisplay="input" 
                            fluid 
                        />
                        @if (submitted() && !formData.fecha) {
                            <small class="text-red-500"> La fecha es requerida. </small>
                        }
                    </div>

                    <!-- Descripción -->
                    <div>
                        <label for="descripcion" class="block font-bold mb-3">Descripción</label>
                        <textarea 
                            id="descripcion" 
                            pTextarea 
                            [(ngModel)]="formData.descripcion" 
                            rows="3" 
                            placeholder="Descripción opcional del traspaso"
                            fluid
                        ></textarea>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="onCancel()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="onSave()" />
            </ng-template>
        </p-dialog>

        <!-- Modales inline para creación rápida de cuentas -->
        <app-cuenta-create-modal 
            [visible]="showCuentaCreateModal" 
            (visibleChange)="showCuentaCreateModal = $event" 
            (created)="onCuentaCreated($event)" 
            (cancel)="showCuentaCreateModal = false" 
        />
    `,
    styles: [
        `
            :host ::ng-deep {
                .p-autocomplete {
                    width: 100%;
                }
            }
        `
    ]
})
export class TraspasoFormModalComponent {
    private messageService = inject(MessageService);
    private cuentaStore = inject(CuentaStore);

    // Inputs/Outputs
    visible = input<boolean>(false);
    traspaso = input<Partial<Traspaso> | null>(null);
    visibleChange = output<boolean>();
    save = output<Partial<Traspaso>>();
    cancel = output<void>();

    // Estado del formulario
    formData: TraspasoFormData = {};
    submitted = signal(false);

    // Selectores asíncronos
    selectedCuentaOrigen: CatalogItem | null = null;
    selectedCuentaDestino: CatalogItem | null = null;

    filteredCuentasOrigen = signal<CatalogItem[]>([]);
    filteredCuentasDestino = signal<CatalogItem[]>([]);

    // Control de modales inline
    showCuentaCreateModal = false;
    // Variable para saber qué cuenta se está creando (origen o destino)
    private creatingCuentaFor: 'origen' | 'destino' = 'origen';

    constructor() {
        // Sincronizar visible con isVisible interno
        effect(() => {
            this.isVisible = this.visible();
        });

        // Cargar datos cuando cambia el traspaso
        effect(() => {
            const traspasoData = this.traspaso();
            if (traspasoData !== undefined) {
                this.loadFormData();
            }
        });
    }

    isVisible = false;

    isEditMode = signal(false);

    private loadFormData() {
        const traspasoData = this.traspaso();

        if (traspasoData?.id) {
            // Modo edición
            this.isEditMode.set(true);
            this.formData = {
                ...traspasoData,
                fecha: traspasoData.fecha ? new Date(traspasoData.fecha) : new Date()
            };

            // Cargar valores seleccionados en autocompletes
            this.selectedCuentaOrigen = traspasoData.cuentaOrigenId && traspasoData.cuentaOrigenNombre
                ? { id: traspasoData.cuentaOrigenId, nombre: traspasoData.cuentaOrigenNombre }
                : null;

            this.selectedCuentaDestino = traspasoData.cuentaDestinoId && traspasoData.cuentaDestinoNombre
                ? { id: traspasoData.cuentaDestinoId, nombre: traspasoData.cuentaDestinoNombre }
                : null;
        } else {
            // Modo creación
            this.isEditMode.set(false);
            this.formData = {
                importe: 0,
                fecha: new Date(),
                descripcion: ''
            };
            this.selectedCuentaOrigen = null;
            this.selectedCuentaDestino = null;
        }

        this.submitted.set(false);
    }

    // Métodos de búsqueda asíncrona para cuenta origen
    searchCuentasOrigen(event: AutoCompleteCompleteEvent) {
        const query = event.query;

        if (!query || query.length < 2) {
            this.cuentaStore
                .getRecent(5)
                .then((cuentas) => {
                    // Filtrar la cuenta destino si ya está seleccionada
                    const filtered = this.selectedCuentaDestino
                        ? cuentas.filter(c => c.id !== this.selectedCuentaDestino!.id)
                        : cuentas;
                    this.filteredCuentasOrigen.set(filtered);
                })
                .catch((err) => {
                    console.error('Error cargando cuentas:', err);
                    this.filteredCuentasOrigen.set([]);
                });
        } else {
            this.cuentaStore
                .search(query, 10)
                .then((cuentas) => {
                    // Filtrar la cuenta destino si ya está seleccionada
                    const filtered = this.selectedCuentaDestino
                        ? cuentas.filter(c => c.id !== this.selectedCuentaDestino!.id)
                        : cuentas;
                    this.filteredCuentasOrigen.set(filtered);
                })
                .catch((err) => {
                    console.error('Error buscando cuentas:', err);
                    this.filteredCuentasOrigen.set([]);
                });
        }
    }

    // Métodos de búsqueda asíncrona para cuenta destino
    searchCuentasDestino(event: AutoCompleteCompleteEvent) {
        const query = event.query;

        if (!query || query.length < 2) {
            this.cuentaStore
                .getRecent(5)
                .then((cuentas) => {
                    // Filtrar la cuenta origen si ya está seleccionada
                    const filtered = this.selectedCuentaOrigen
                        ? cuentas.filter(c => c.id !== this.selectedCuentaOrigen!.id)
                        : cuentas;
                    this.filteredCuentasDestino.set(filtered);
                })
                .catch((err) => {
                    console.error('Error cargando cuentas:', err);
                    this.filteredCuentasDestino.set([]);
                });
        } else {
            this.cuentaStore
                .search(query, 10)
                .then((cuentas) => {
                    // Filtrar la cuenta origen si ya está seleccionada
                    const filtered = this.selectedCuentaOrigen
                        ? cuentas.filter(c => c.id !== this.selectedCuentaOrigen!.id)
                        : cuentas;
                    this.filteredCuentasDestino.set(filtered);
                })
                .catch((err) => {
                    console.error('Error buscando cuentas:', err);
                    this.filteredCuentasDestino.set([]);
                });
        }
    }

    // Eventos de selección
    onCuentaOrigenSelect(event: any) {
        this.formData.cuentaOrigenId = event.id;
        this.formData.cuentaOrigenNombre = event.nombre;

        // Si la cuenta destino es la misma, limpiarla
        if (this.selectedCuentaDestino && this.selectedCuentaDestino.id === event.id) {
            this.selectedCuentaDestino = null;
            this.formData.cuentaDestinoId = undefined;
            this.formData.cuentaDestinoNombre = undefined;
            this.messageService.add({
                severity: 'warn',
                summary: 'Cuenta destino limpiada',
                detail: 'La cuenta origen y destino deben ser diferentes'
            });
        }
    }

    onCuentaDestinoSelect(event: any) {
        this.formData.cuentaDestinoId = event.id;
        this.formData.cuentaDestinoNombre = event.nombre;

        // Si la cuenta origen es la misma, limpiarla
        if (this.selectedCuentaOrigen && this.selectedCuentaOrigen.id === event.id) {
            this.selectedCuentaOrigen = null;
            this.formData.cuentaOrigenId = undefined;
            this.formData.cuentaOrigenNombre = undefined;
            this.messageService.add({
                severity: 'warn',
                summary: 'Cuenta origen limpiada',
                detail: 'La cuenta origen y destino deben ser diferentes'
            });
        }
    }

    // Handlers para limpiar autocompletes
    onCuentaOrigenClear() {
        this.selectedCuentaOrigen = null;
        this.formData.cuentaOrigenId = undefined;
        this.formData.cuentaOrigenNombre = undefined;
        this.filteredCuentasOrigen.set([]);
    }

    onCuentaDestinoClear() {
        this.selectedCuentaDestino = null;
        this.formData.cuentaDestinoId = undefined;
        this.formData.cuentaDestinoNombre = undefined;
        this.filteredCuentasDestino.set([]);
    }

    // Abrir modales de creación inline
    openCreateCuentaOrigen() {
        this.creatingCuentaFor = 'origen';
        this.showCuentaCreateModal = true;
    }

    openCreateCuentaDestino() {
        this.creatingCuentaFor = 'destino';
        this.showCuentaCreateModal = true;
    }

    // Handler cuando se crea una nueva cuenta
    onCuentaCreated(nuevaCuenta: Cuenta) {
        this.showCuentaCreateModal = false;

        const cuentaItem: CatalogItem = {
            id: nuevaCuenta.id,
            nombre: nuevaCuenta.nombre
        };

        if (this.creatingCuentaFor === 'origen') {
            // Seleccionar automáticamente como cuenta origen
            this.selectedCuentaOrigen = cuentaItem;
            this.formData.cuentaOrigenId = cuentaItem.id;
            this.formData.cuentaOrigenNombre = cuentaItem.nombre;
            this.filteredCuentasOrigen.set([cuentaItem, ...this.filteredCuentasOrigen()]);
        } else {
            // Seleccionar automáticamente como cuenta destino
            this.selectedCuentaDestino = cuentaItem;
            this.formData.cuentaDestinoId = cuentaItem.id;
            this.formData.cuentaDestinoNombre = cuentaItem.nombre;
            this.filteredCuentasDestino.set([cuentaItem, ...this.filteredCuentasDestino()]);
        }

        this.messageService.add({
            severity: 'success',
            summary: 'Cuenta creada',
            detail: `Cuenta "${nuevaCuenta.nombre}" creada y seleccionada correctamente`
        });
    }

    onSave() {
        this.submitted.set(true);

        // Validaciones
        if (!this.selectedCuentaOrigen ||
            !this.selectedCuentaDestino ||
            !this.formData.importe ||
            this.formData.importe <= 0 ||
            !this.formData.fecha) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Por favor complete todos los campos requeridos'
            });
            return;
        }

        // Validación de dominio: cuentas diferentes
        if (this.selectedCuentaOrigen.id === this.selectedCuentaDestino.id) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error de validación',
                detail: 'La cuenta de origen y destino deben ser diferentes'
            });
            return;
        }

        // Preparar datos para guardar
        const traspasoToSave: Partial<Traspaso> = {
            ...this.formData,
            cuentaOrigenId: this.selectedCuentaOrigen.id,
            cuentaOrigenNombre: this.selectedCuentaOrigen.nombre,
            cuentaDestinoId: this.selectedCuentaDestino.id,
            cuentaDestinoNombre: this.selectedCuentaDestino.nombre,
            fecha: typeof this.formData.fecha === 'string'
                ? this.formData.fecha
                : new Date(this.formData.fecha!).toISOString().split('T')[0]
        };

        this.save.emit(traspasoToSave);
        this.closeModal();
    }

    onCancel() {
        this.cancel.emit();
        this.closeModal();
    }

    private closeModal() {
        this.isVisible = false;
        this.visibleChange.emit(false);
        this.submitted.set(false);
    }
}
