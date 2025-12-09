import { Component, inject, input, output, effect, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

// Modelos
import { TraspasoProgramado } from '@/core/models/traspaso-programado.model';
import { Cuenta } from '@/core/models/cuenta.model';

// Componentes compartidos
import { CuentaCreateModalComponent } from '@/shared/components';

// Stores
import { CuentaStore } from '@/features/cuentas/store/cuenta.store';

interface TraspasoProgramadoFormData extends Omit<Partial<TraspasoProgramado>, 'fechaEjecucion'> {
    fechaEjecucion?: Date | null;
}

@Component({
    selector: 'app-traspaso-programado-form-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DrawerModule,
        SelectModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        DatePickerModule,
        AutoCompleteModule,
        ToggleSwitchModule,
        TooltipModule,
        CuentaCreateModalComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-drawer 
            [(visible)]="isVisible" 
            position="right" 
            [style]="{ width: '600px', maxWidth: '100vw' }" 
            [modal]="true" 
            [blockScroll]="true"
            (onHide)="onCancel()" 
            styleClass="p-sidebar-md surface-ground">
            
            <ng-template pTemplate="header">
                <div class="flex flex-col">
                    <span class="font-bold text-xl text-900">{{ isEditMode() ? 'Editar Traspaso Programado' : 'Nuevo Traspaso Programado' }}</span>
                    <span class="text-500 text-sm mt-1">Configura traspasos automáticos entre cuentas</span>
                </div>
            </ng-template>

            <div class="flex flex-col gap-5 py-2">
                
                <div class="card surface-card p-4 border-round shadow-1">
                    <div class="flex flex-col gap-4">
                        <div class="field">
                            <label for="cuentaOrigen" class="font-semibold text-gray-700 block mb-2">Cuenta Origen *</label>
                            <div class="p-inputgroup">
                                <p-autoComplete
                                    [(ngModel)]="selectedCuentaOrigen"
                                    [suggestions]="filteredCuentasOrigen()"
                                    (completeMethod)="searchCuentasOrigen($event)"
                                    [showClear]="true"
                                    (onClear)="onCuentaOrigenClear()"
                                    optionLabel="nombre"
                                    [dropdown]="true"
                                    placeholder="Seleccionar cuenta de origen..."
                                    [forceSelection]="true"
                                    (onSelect)="onCuentaOrigenSelect($event)"
                                    inputStyleClass="font-semibold"
                                    class="flex-1"
                                />
                                <button pButton icon="pi pi-plus" severity="secondary" (click)="openCreateCuenta()" pTooltip="Crear cuenta"></button>
                            </div>
                            @if (submitted() && !selectedCuentaOrigen) {
                                <small class="text-red-500 block mt-1">La cuenta origen es requerida.</small>
                            }
                        </div>

                        <div class="field">
                            <label for="cuentaDestino" class="font-semibold text-gray-700 block mb-2">Cuenta Destino *</label>
                            <div class="p-inputgroup">
                                <p-autoComplete
                                    [(ngModel)]="selectedCuentaDestino"
                                    [suggestions]="filteredCuentasDestino()"
                                    (completeMethod)="searchCuentasDestino($event)"
                                    [showClear]="true"
                                    (onClear)="onCuentaDestinoClear()"
                                    optionLabel="nombre"
                                    [dropdown]="true"
                                    placeholder="Seleccionar cuenta de destino..."
                                    [forceSelection]="true"
                                    (onSelect)="onCuentaDestinoSelect($event)"
                                    inputStyleClass="font-semibold"
                                    class="flex-1"
                                />
                            </div>
                            @if (submitted() && !selectedCuentaDestino) {
                                <small class="text-red-500 block mt-1">La cuenta destino es requerida.</small>
                            }
                            @if (submitted() && selectedCuentaOrigen && selectedCuentaDestino && selectedCuentaOrigen.id === selectedCuentaDestino.id) {
                                <small class="text-red-500 block mt-1">La cuenta origen y destino no pueden ser iguales.</small>
                            }
                        </div>

                        <div class="field">
                            <label for="importe" class="font-semibold text-gray-700 block mb-2">Importe a Traspasar *</label>
                            <p-inputNumber 
                                id="importe" 
                                [(ngModel)]="formData.importe" 
                                mode="currency" 
                                currency="EUR" 
                                locale="es-ES" 
                                [min]="0" 
                                placeholder="0,00 €"
                                inputStyleClass="text-right font-bold text-xl text-blue-600 w-full" 
                                class="w-full"
                            />
                            @if (submitted() && !formData.importe) {
                                <small class="text-red-500 block mt-1">El importe es requerido.</small>
                            }
                        </div>
                    </div>
                </div>

                <div class="card surface-card p-4 border-round shadow-1 border-blue-100 border">
                    <div class="flex justify-between items-center mb-4 border-bottom-1 surface-border pb-2">
                        <h3 class="text-xs font-bold text-blue-600 uppercase tracking-wider m-0">Configuración de Recurrencia</h3>
                        
                        <div class="flex items-center gap-2">
                            <label for="activo" class="text-sm font-medium text-gray-700 cursor-pointer">Activo</label>
                            <p-toggleswitch [(ngModel)]="formData.activo" inputId="activo"></p-toggleswitch>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="field col-span-2">
                            <label class="font-medium text-gray-700 block mb-2 text-sm">Frecuencia *</label>
                            <p-select
                                [options]="frecuencias" 
                                [(ngModel)]="formData.frecuencia" 
                                placeholder="Selecciona frecuencia" 
                                class="w-full"
                                [showClear]="true">
                            </p-select>
                            @if (submitted() && !formData.frecuencia) {
                                <small class="text-red-500 block mt-1">La frecuencia es requerida.</small>
                            }
                        </div>

                        <div class="field col-span-2">
                            <label class="font-medium text-gray-700 block mb-2 text-sm">Fecha de Ejecución *</label>
                            <p-datePicker 
                                [(ngModel)]="formData.fechaEjecucion" 
                                dateFormat="dd/mm/yy" 
                                [showIcon]="true" 
                                appendTo="body" 
                                styleClass="w-full" 
                                placeholder="Seleccione la fecha"
                            />
                            <small class="text-gray-500">Fecha en la que se ejecutará el traspaso automático.</small>
                            @if (submitted() && !formData.fechaEjecucion) {
                                <small class="text-red-500 block mt-1">La fecha de ejecución es requerida.</small>
                            }
                        </div>
                    </div>
                </div>

                <div class="card surface-card p-4 border-round shadow-1">
                    <div class="field">
                        <label for="descripcion" class="font-semibold text-gray-700 block mb-2">Descripción / Notas</label>
                        <textarea 
                            id="descripcion" 
                            pTextarea 
                            [(ngModel)]="formData.descripcion" 
                            rows="3" 
                            class="w-full" 
                            placeholder="Añadir detalles adicionales sobre este traspaso programado...">
                        </textarea>
                    </div>
                </div>

            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-end gap-2 p-3 surface-border border-top-1">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="onCancel()" />
                    <p-button label="Guardar Programación" icon="pi pi-check" (onClick)="onSave()" />
                </div>
            </ng-template>
        </p-drawer>

        <app-cuenta-create-modal 
            [visible]="showCuentaCreateModal" 
            (visibleChange)="showCuentaCreateModal = $event" 
            (created)="onCuentaCreated($event)" 
            (cancel)="showCuentaCreateModal = false" />
    `,
    styles: [`
        :host ::ng-deep {
            .p-sidebar { background: #f8f9fa; }
            .p-autocomplete { width: 100%; }
            .p-inputgroup button { flex-shrink: 0; }
            .p-datepicker { width: 100%; }
            .p-select { width: 100%; }
        }
    `]
})
export class TraspasoProgramadoFormModalComponent {
    private messageService = inject(MessageService);
    private cuentaStore = inject(CuentaStore);

    // Inputs/Outputs
    visible = input<boolean>(false);
    traspasoProgramado = input<Partial<TraspasoProgramado> | null>(null);
    save = output<Partial<TraspasoProgramado>>();
    cancel = output<void>();

    // Estado
    isVisible = false;
    isEditMode = signal(false);
    submitted = signal(false);
    
    formData: TraspasoProgramadoFormData = {
        cuentaOrigenId: undefined,
        cuentaDestinoId: undefined,
        importe: 0,
        frecuencia: undefined,
        fechaEjecucion: null,
        activo: true,
        descripcion: ''
    };

    frecuencias = [
        { label: 'Diario', value: 'DIARIO' },
        { label: 'Semanal', value: 'SEMANAL' },
        { label: 'Mensual', value: 'MENSUAL' },
        { label: 'Anual', value: 'ANUAL' }
    ];

    // Autocomplete para cuentas
    selectedCuentaOrigen: Cuenta | null = null;
    selectedCuentaDestino: Cuenta | null = null;
    filteredCuentasOrigen = signal<Cuenta[]>([]);
    filteredCuentasDestino = signal<Cuenta[]>([]);

    // Modales
    showCuentaCreateModal = false;

    constructor() {
        // Efecto para sincronizar visibility
        effect(() => {
            this.isVisible = this.visible();
        });

        // Efecto para cargar datos al editar
        effect(() => {
            const traspaso = this.traspasoProgramado();
            if (traspaso && traspaso.id) {
                this.isEditMode.set(true);
                this.loadTraspasoData(traspaso);
            } else {
                this.isEditMode.set(false);
                this.resetForm();
            }
        });

        // Cargar catálogos
        effect(() => {
            if (this.visible()) {
                this.cuentaStore.loadCuentasPaginated({ page: 1, pageSize: 1000 });
            }
        });
    }

    private loadTraspasoData(traspaso: Partial<TraspasoProgramado>) {
        this.formData = {
            ...traspaso,
            fechaEjecucion: traspaso.fechaEjecucion ? new Date(traspaso.fechaEjecucion) : null
        };

        const cuentas = this.cuentaStore.cuentas();
        this.selectedCuentaOrigen = cuentas.find(c => c.id === traspaso.cuentaOrigenId) || null;
        this.selectedCuentaDestino = cuentas.find(c => c.id === traspaso.cuentaDestinoId) || null;
    }

    private resetForm() {
        this.formData = {
            cuentaOrigenId: undefined,
            cuentaDestinoId: undefined,
            importe: 0,
            frecuencia: undefined,
            fechaEjecucion: null,
            activo: true,
            descripcion: ''
        };
        this.selectedCuentaOrigen = null;
        this.selectedCuentaDestino = null;
        this.submitted.set(false);
    }

    // Métodos de búsqueda de cuentas
    searchCuentasOrigen(event: AutoCompleteCompleteEvent) {
        const query = event.query.toLowerCase();
        const cuentas = this.cuentaStore.cuentas();
        this.filteredCuentasOrigen.set(
            query 
                ? cuentas.filter(c => c.nombre.toLowerCase().includes(query))
                : cuentas
        );
    }

    searchCuentasDestino(event: AutoCompleteCompleteEvent) {
        const query = event.query.toLowerCase();
        const cuentas = this.cuentaStore.cuentas();
        this.filteredCuentasDestino.set(
            query 
                ? cuentas.filter(c => c.nombre.toLowerCase().includes(query))
                : cuentas
        );
    }

    onCuentaOrigenSelect(event: any) {
        this.formData.cuentaOrigenId = event.value.id;
    }

    onCuentaOrigenClear() {
        this.selectedCuentaOrigen = null;
        this.formData.cuentaOrigenId = undefined;
    }

    onCuentaDestinoSelect(event: any) {
        this.formData.cuentaDestinoId = event.value.id;
    }

    onCuentaDestinoClear() {
        this.selectedCuentaDestino = null;
        this.formData.cuentaDestinoId = undefined;
    }

    // Modales de creación
    openCreateCuenta() {
        this.showCuentaCreateModal = true;
    }

    onCuentaCreated(cuenta: Cuenta) {
        this.messageService.add({
            severity: 'success',
            summary: 'Cuenta Creada',
            detail: `La cuenta "${cuenta.nombre}" ha sido creada correctamente`
        });
        this.cuentaStore.loadCuentasPaginated({ page: 1, pageSize: 1000 });
        this.showCuentaCreateModal = false;
    }

    // Validación y guardado
    onSave() {
        this.submitted.set(true);

        if (!this.validateForm()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor, completa todos los campos requeridos'
            });
            return;
        }

        // Convertir fechaEjecucion de Date a string ISO
        const traspasoToSave: Partial<TraspasoProgramado> = {
            ...this.formData,
            fechaEjecucion: this.formData.fechaEjecucion 
                ? this.formData.fechaEjecucion.toISOString()
                : new Date().toISOString()
        };

        if (this.isEditMode()) {
            traspasoToSave.id = this.traspasoProgramado()?.id;
        }

        this.save.emit(traspasoToSave);
        this.resetForm();
        this.isVisible = false;
    }

    private validateForm(): boolean {
        return !!(
            this.formData.cuentaOrigenId &&
            this.formData.cuentaDestinoId &&
            this.formData.cuentaOrigenId !== this.formData.cuentaDestinoId &&
            this.formData.importe &&
            this.formData.importe > 0 &&
            this.formData.frecuencia &&
            this.formData.fechaEjecucion
        );
    }

    onCancel() {
        this.resetForm();
        this.isVisible = false;
        this.cancel.emit();
    }
}
