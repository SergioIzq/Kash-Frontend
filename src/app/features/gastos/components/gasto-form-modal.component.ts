import { Component, inject, input, output, effect, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

// Modelos
import { Gasto } from '@/core/models';

// Stores
import { ProveedorStore } from '@/features/proveedores/store/proveedor.store';
import { FormaPagoStore } from '@/features/formas-pago/store/forma-pago.store';
import { CuentaStore } from '@/features/cuentas/store/cuenta.store';
import { ConceptoStore } from '@/features/conceptos/store/concepto.store';
import { CategoriaStore } from '@/features/categorias/store/categoria.store';
import { PersonaStore } from '@/features/personas/store/persona.store';

interface CatalogItem {
    id: string;
    nombre: string;
}

interface GastoFormData extends Omit<Partial<Gasto>, 'fecha'> {
    fecha?: Date | string;
}

@Component({
    selector: 'app-gasto-form-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DrawerModule, // Usamos Drawer en lugar de Dialog
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        DatePickerModule,
        AutoCompleteModule,
        TooltipModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-drawer [(visible)]="isVisible" position="right" [closeOnEscape]="false" [style]="{ width: '600px', maxWidth: '100vw' }" [modal]="true" [blockScroll]="true" (onHide)="handleDrawerHide()" styleClass="p-sidebar-md surface-ground">
            <ng-template pTemplate="header">
                <div class="flex align-items-center gap-2">
                    <span class="font-bold text-xl text-900">{{ isEditMode() ? 'Editar Gasto' : 'Nuevo Gasto' }}</span>
                </div>
            </ng-template>

            <div class="grid grid-cols-12 gap-4 p-fluid py-2">
                <div class="col-span-12 field">
                    <label for="concepto" class="font-semibold text-gray-700 block mb-2">Concepto</label>
                    <div class="flex align-items-center gap-2">
                        <p-autoComplete
                            [(ngModel)]="selectedConcepto"
                            [placeholder]="getConceptoPlaceholder()"
                            [suggestions]="filteredConceptos()"
                            (completeMethod)="searchConceptos($event)"
                            [showClear]="true"
                            (onClear)="onConceptoClear()"
                            optionLabel="nombre"
                            [dropdown]="true"
                            class="flex-1 w-full"
                            styleClass="w-full"
                            [forceSelection]="false"
                            [showEmptyMessage]="false"
                            (onSelect)="onConceptoSelect($event)"
                            (onBlur)="onConceptoBlur()"
                            inputStyleClass="font-semibold"
                        />
                    </div>
                    @if (submitted() && !selectedConcepto) {
                        <small class="text-red-500 block mt-1">El concepto es requerido.</small>
                    }
                    @if (newConceptoMessage()) {
                        <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newConceptoMessage() }}</small>
                    }
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label for="importe" class="font-semibold text-gray-700 block mb-2">Importe</label>
                    <p-inputNumber
                        id="importe"
                        [(ngModel)]="formData.importe"
                        mode="currency"
                        currency="EUR"
                        locale="es-ES"
                        [min]="0"
                        placeholder="0,00 €"
                        inputStyleClass="text-right font-bold text-xl text-green-600"
                        class="w-full"
                        styleClass="w-full"
                    />
                    @if (submitted() && !formData.importe) {
                        <small class="text-red-500 block mt-1">El importe es requerido.</small>
                    }
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label for="fecha" class="font-semibold text-gray-700 block mb-2">Fecha</label>
                    <p-datePicker [(ngModel)]="formData.fecha" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" class="w-full" />
                </div>

                <div class="col-span-12 mt-4">
                    <h5 class="text-xs font-bold text-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-2">Clasificación Financiera</h5>
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label class="font-medium text-gray-700 block mb-2 text-sm">Categoría</label>
                    <div class="flex align-items-center gap-2">
                        <p-autoComplete
                            [(ngModel)]="selectedCategoria"
                            [suggestions]="filteredCategorias()"
                            (completeMethod)="searchCategorias($event)"
                            [showClear]="true"
                            (onClear)="onCategoriaClear()"
                            optionLabel="nombre"
                            [dropdown]="true"
                            placeholder="Seleccionar..."
                            [forceSelection]="false"
                            [showEmptyMessage]="false"
                            (onSelect)="onCategoriaSelect($event)"
                            (onBlur)="onCategoriaBlur()"
                            class="flex-1 w-full"
                            styleClass="w-full"
                        />
                    </div>
                    @if (submitted() && !selectedCategoria) {
                        <small class="text-red-500 block mt-1">La categoría es requerida.</small>
                    }
                    @if (newCategoriaMessage()) {
                        <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newCategoriaMessage() }}</small>
                    }
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label class="font-medium text-gray-700 block mb-2 text-sm">Forma de Pago</label>
                    <div class="flex align-items-center gap-2">
                        <p-autoComplete
                            [(ngModel)]="selectedFormaPago"
                            [suggestions]="filteredFormasPago()"
                            (completeMethod)="searchFormasPago($event)"
                            optionLabel="nombre"
                            [dropdown]="true"
                            placeholder="Seleccionar..."
                            [forceSelection]="false"
                            [showEmptyMessage]="false"
                            (onSelect)="onFormaPagoSelect($event)"
                            (onBlur)="onFormaPagoBlur()"
                            class="flex-1 w-full"
                            styleClass="w-full"
                        />
                    </div>
                    @if (submitted() && !selectedFormaPago) {
                        <small class="text-red-500 block mt-1">La forma de pago es requerida.</small>
                    }
                    @if (newFormaPagoMessage()) {
                        <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newFormaPagoMessage() }}</small>
                    }
                </div>

                <div class="col-span-12 field">
                    <label class="font-medium text-gray-700 block mb-2 text-sm">Cuenta de Destino</label>
                    <div class="flex align-items-center gap-2">
                        <p-autoComplete
                            [(ngModel)]="selectedCuenta"
                            [suggestions]="filteredCuentas()"
                            (completeMethod)="searchCuentas($event)"
                            optionLabel="nombre"
                            [dropdown]="true"
                            placeholder="Seleccionar cuenta bancaria / caja..."
                            [forceSelection]="false"
                            [showEmptyMessage]="false"
                            (onSelect)="onCuentaSelect($event)"
                            (onBlur)="onCuentaBlur()"
                            [showClear]="true"
                            (onClear)="onCuentaClear()"
                            class="flex-1 w-full"
                            styleClass="w-full"
                        />
                    </div>
                    @if (submitted() && !selectedCuenta) {
                        <small class="text-red-500 block mt-1">La cuenta de destino es requerida.</small>
                    }
                    @if (newCuentaMessage()) {
                        <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newCuentaMessage() }}</small>
                    }
                </div>

                <div class="col-span-12 mt-4">
                    <h5 class="text-xs font-bold text-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-2">Terceros</h5>
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label class="font-medium text-gray-700 block mb-2 text-sm">Proveedor</label>
                    <div class="flex align-items-center gap-2">
                        <p-autoComplete
                            [(ngModel)]="selectedProveedor"
                            [suggestions]="filteredProveedores()"
                            (completeMethod)="searchProveedores($event)"
                            optionLabel="nombre"
                            [dropdown]="true"
                            placeholder="Buscar proveedor..."
                            [forceSelection]="false"
                            [showEmptyMessage]="false"
                            (onSelect)="onProveedorSelect($event)"
                            (onBlur)="onProveedorBlur()"
                            class="flex-1 w-full"
                            styleClass="w-full"
                        />
                    </div>
                    @if (newProveedorMessage()) {
                        <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newProveedorMessage() }}</small>
                    }
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label class="font-medium text-gray-700 block mb-2 text-sm">Persona</label>
                    <div class="flex align-items-center gap-2">
                        <p-autoComplete
                            [(ngModel)]="selectedPersona"
                            [suggestions]="filteredPersonas()"
                            (completeMethod)="searchPersonas($event)"
                            optionLabel="nombre"
                            [dropdown]="true"
                            placeholder="Buscar persona..."
                            [forceSelection]="false"
                            [showEmptyMessage]="false"
                            (onSelect)="onPersonaSelect($event)"
                            (onBlur)="onPersonaBlur()"
                            class="flex-1 w-full"
                            styleClass="w-full"
                        />
                    </div>
                    @if (newPersonaMessage()) {
                        <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newPersonaMessage() }}</small>
                    }
                </div>

                <div class="col-span-12 field mt-3">
                    <label for="descripcion" class="font-semibold text-gray-700 block mb-2">Descripción / Notas</label>
                    <textarea id="descripcion" pTextarea [(ngModel)]="formData.descripcion" rows="3" class="w-full" styleClass="w-full" placeholder="Añadir detalles adicionales..."></textarea>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-end gap-2 p-3 surface-border border-top-1">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="onCancel()" />
                    <p-button label="Guardar Gasto" icon="pi pi-check" (onClick)="onSave()" />
                </div>
            </ng-template>
        </p-drawer>
    `,
    styles: [
        `
            :host ::ng-deep {
                .p-sidebar {
                    background: #ffffff; /* Fondo blanco limpio en lugar de gris */
                }
                .p-autocomplete {
                    width: 100%;
                }
                /* Ajuste para que los botones circulares no se deformen */
                .p-button.p-button-icon-only.p-button-rounded {
                    width: 2.5rem;
                    height: 2.5rem;
                    flex-shrink: 0;
                }
            }
        `
    ]
})
export class GastoFormModalComponent {
    private messageService = inject(MessageService);
    #confirmationService = inject(ConfirmationService);
    private conceptoStore = inject(ConceptoStore);
    private categoriaStore = inject(CategoriaStore);
    private proveedorStore = inject(ProveedorStore);
    private personaStore = inject(PersonaStore);
    private cuentaStore = inject(CuentaStore);
    private formaPagoStore = inject(FormaPagoStore);

    // Inputs/Outputs
    visible = input<boolean>(false);
    gasto = input<Partial<Gasto> | null>(null);
    visibleChange = output<boolean>();
    save = output<Partial<Gasto>>();
    cancel = output<void>();

    // Estado del formulario
    formData: GastoFormData = {};
    submitted = signal(false);

    // Selectores asíncronos
    selectedConcepto: CatalogItem | null = null;
    selectedCategoria: CatalogItem | null = null;
    selectedProveedor: CatalogItem | null = null;
    selectedPersona: CatalogItem | null = null;
    selectedCuenta: CatalogItem | null = null;
    selectedFormaPago: CatalogItem | null = null;

    filteredConceptos = signal<CatalogItem[]>([]);
    filteredCategorias = signal<CatalogItem[]>([]);
    filteredProveedores = signal<CatalogItem[]>([]);
    filteredPersonas = signal<CatalogItem[]>([]);
    filteredCuentas = signal<CatalogItem[]>([]);
    filteredFormasPago = signal<CatalogItem[]>([]);

    // Mensajes para valores nuevos
    newConceptoMessage = signal<string>('');
    newCategoriaMessage = signal<string>('');
    newFormaPagoMessage = signal<string>('');
    newProveedorMessage = signal<string>('');
    newPersonaMessage = signal<string>('');
    newCuentaMessage = signal<string>('');

    // Flags para evitar validación en blur después de selección
    private skipNextConceptoBlur = false;
    private skipNextCategoriaBlur = false;
    private skipNextFormaPagoBlur = false;
    private skipNextProveedorBlur = false;
    private skipNextPersonaBlur = false;
    private skipNextCuentaBlur = false;

    constructor() {
        effect(() => {
            this.isVisible = this.visible();
        });

        effect(() => {
            const gastoData = this.gasto();
            if (gastoData) {
                this.loadFormData();
            }
        });
    }

    isVisible = false;
    isEditMode = signal(false);

    private loadFormData() {
        const gastoData = this.gasto();

        if (gastoData?.id) {
            // Modo edición
            this.isEditMode.set(true);
            const fechaDate = gastoData.fecha ? new Date(gastoData.fecha) : new Date();
            fechaDate.setHours(0, 0, 0, 0);

            this.formData = {
                ...gastoData,
                fecha: fechaDate
            };

            this.selectedConcepto = gastoData.conceptoId && gastoData.conceptoNombre ? { id: gastoData.conceptoId, nombre: gastoData.conceptoNombre } : null;
            this.selectedCategoria = gastoData.categoriaId && gastoData.categoriaNombre ? { id: gastoData.categoriaId, nombre: gastoData.categoriaNombre } : null;
            this.selectedProveedor = gastoData.proveedorId && gastoData.proveedorNombre ? { id: gastoData.proveedorId, nombre: gastoData.proveedorNombre } : null;
            this.selectedPersona = gastoData.personaId && gastoData.personaNombre ? { id: gastoData.personaId, nombre: gastoData.personaNombre } : null;
            this.selectedCuenta = gastoData.cuentaId && gastoData.cuentaNombre ? { id: gastoData.cuentaId, nombre: gastoData.cuentaNombre } : null;
            this.selectedFormaPago = gastoData.formaPagoId && gastoData.formaPagoNombre ? { id: gastoData.formaPagoId, nombre: gastoData.formaPagoNombre } : null;
        } else {
            // Modo creación
            this.isEditMode.set(false);
            const fechaActual = new Date();
            fechaActual.setHours(0, 0, 0, 0);

            this.formData = {
                fecha: fechaActual,
                descripcion: ''
            };
            this.selectedConcepto = null;
            this.selectedCategoria = null;
            this.selectedProveedor = null;
            this.selectedPersona = null;
            this.selectedCuenta = null;
            this.selectedFormaPago = null;
        }
        this.submitted.set(false);
        this.newConceptoMessage.set('');
        this.newCategoriaMessage.set('');
        this.newFormaPagoMessage.set('');
        this.newProveedorMessage.set('');
        this.newPersonaMessage.set('');
        this.newCuentaMessage.set('');
    }

    // --- Métodos de búsqueda (Search) ---
    searchConceptos(event: AutoCompleteCompleteEvent) {
        const query = event.query;
        const categoriaId = this.selectedCategoria?.id;
        if (!query || query.length < 2) {
            this.conceptoStore
                .getRecent(5, categoriaId)
                .then((data) => this.filteredConceptos.set(data))
                .catch(() => this.filteredConceptos.set([]));
        } else {
            this.conceptoStore
                .search(query, 10, categoriaId)
                .then((data) => this.filteredConceptos.set(data))
                .catch(() => this.filteredConceptos.set([]));
        }
    }

    searchCategorias(event: AutoCompleteCompleteEvent) {
        const query = event.query;
        if (!query || query.length < 2) {
            this.categoriaStore
                .getRecent(5)
                .then((data) => this.filteredCategorias.set(data))
                .catch(() => this.filteredCategorias.set([]));
        } else {
            this.categoriaStore
                .search(query, 10)
                .then((data) => this.filteredCategorias.set(data))
                .catch(() => this.filteredCategorias.set([]));
        }
    }

    searchProveedores(event: AutoCompleteCompleteEvent) {
        const query = event.query;
        if (!query || query.length < 2) {
            this.proveedorStore
                .getRecent(5)
                .then((data) => this.filteredProveedores.set(data))
                .catch(() => this.filteredProveedores.set([]));
        } else {
            this.proveedorStore
                .search(query, 10)
                .then((data) => this.filteredProveedores.set(data))
                .catch(() => this.filteredProveedores.set([]));
        }
    }

    searchPersonas(event: AutoCompleteCompleteEvent) {
        const query = event.query;
        if (!query || query.length < 2) {
            this.personaStore
                .getRecent(5)
                .then((data) => this.filteredPersonas.set(data))
                .catch(() => this.filteredPersonas.set([]));
        } else {
            this.personaStore
                .search(query, 10)
                .then((data) => this.filteredPersonas.set(data))
                .catch(() => this.filteredPersonas.set([]));
        }
    }

    searchCuentas(event: AutoCompleteCompleteEvent) {
        const query = event.query;
        if (!query || query.length < 2) {
            this.cuentaStore
                .getRecent(5)
                .then((data) => this.filteredCuentas.set(data))
                .catch(() => this.filteredCuentas.set([]));
        } else {
            this.cuentaStore
                .search(query, 10)
                .then((data) => this.filteredCuentas.set(data))
                .catch(() => this.filteredCuentas.set([]));
        }
    }

    searchFormasPago(event: AutoCompleteCompleteEvent) {
        const query = event.query;
        if (!query || query.length < 2) {
            this.formaPagoStore
                .getRecent(5)
                .then((data) => this.filteredFormasPago.set(data))
                .catch(() => this.filteredFormasPago.set([]));
        } else {
            this.formaPagoStore
                .search(query, 10)
                .then((data) => this.filteredFormasPago.set(data))
                .catch(() => this.filteredFormasPago.set([]));
        }
    }

    // --- Eventos de selección y limpieza ---
    onConceptoSelect(event: any) {
        this.skipNextConceptoBlur = true;

        let value = event.value;
        this.formData.conceptoId = value.id;
        this.formData.conceptoNombre = value.nombre;
        this.newConceptoMessage.set('');

        // Auto-asignación de categoría si el concepto la tiene
        if (value.categoriaId && value.categoriaNombre) {
            const categoriaAsociada: CatalogItem = { id: value.categoriaId, nombre: value.categoriaNombre };
            this.selectedCategoria = categoriaAsociada;
            this.formData.categoriaId = categoriaAsociada.id;
            this.formData.categoriaNombre = categoriaAsociada.nombre;
            this.newCategoriaMessage.set(''); // Limpiar mensaje si se asigna una categoría existente
            this.messageService.add({ severity: 'info', summary: 'Info', detail: `Categoría ${value.categoriaNombre} asignada` });
        }
    }

    onConceptoBlur() {
        setTimeout(() => {
            // Si acabamos de seleccionar, no validar
            if (this.skipNextConceptoBlur) {
                this.skipNextConceptoBlur = false;
                return;
            }

            // Verificar si el usuario ha escrito un concepto nuevo
            if (typeof this.selectedConcepto === 'string' && (this.selectedConcepto as string).trim()) {
                const conceptoNombre = (this.selectedConcepto as string).trim();
                const existe = this.filteredConceptos().some((c) => c.nombre.toLowerCase() === conceptoNombre.toLowerCase());

                if (!existe) {
                    // El concepto no existe, crear uno temporal
                    this.selectedConcepto = { id: '', nombre: conceptoNombre };
                    this.formData.conceptoId = undefined;
                    this.formData.conceptoNombre = conceptoNombre;
                    this.newConceptoMessage.set(`Ha seleccionado un concepto "${conceptoNombre}" que no existe, se creará automáticamente.`);
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Concepto no encontrado',
                        detail: `El concepto "${conceptoNombre}" no existe, se creará automáticamente con la categoría asociada al guardar.`
                    });
                }
            }
        }, 200);
    }

    onCategoriaSelect(event: any) {
        this.skipNextCategoriaBlur = true;

        this.formData.categoriaId = event.id;
        this.formData.categoriaNombre = event.nombre;
        this.newCategoriaMessage.set('');
        // Limpiar concepto para forzar selección válida en la nueva categoría
        this.selectedConcepto = null;
        this.formData.conceptoId = undefined;
        this.formData.conceptoNombre = undefined;
        this.newConceptoMessage.set(''); // Limpiar mensaje de concepto al cambiar de categoría
    }

    onCategoriaBlur() {
        setTimeout(() => {
            // Si acabamos de seleccionar, no validar
            if (this.skipNextCategoriaBlur) {
                this.skipNextCategoriaBlur = false;
                return;
            }

            // Verificar si el usuario ha escrito una categoría nueva
            if (typeof this.selectedCategoria === 'string' && (this.selectedCategoria as string).trim()) {
                const categoriaNombre = (this.selectedCategoria as string).trim();
                const existe = this.filteredCategorias().some((c) => c.nombre.toLowerCase() === categoriaNombre.toLowerCase());

                if (!existe) {
                    // La categoría no existe, crear una temporal
                    this.selectedCategoria = { id: '', nombre: categoriaNombre };
                    this.formData.categoriaId = undefined;
                    this.formData.categoriaNombre = categoriaNombre;
                    this.newCategoriaMessage.set(`Ha seleccionado una categoría "${categoriaNombre}" que no existe, se creará automáticamente.`);
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Categoría no encontrada',
                        detail: `La categoría "${categoriaNombre}" no existe, se creará automáticamente al guardar.`
                    });
                }
            }
        }, 200);
    }

    onFormaPagoBlur() {
        setTimeout(() => {
            // Si acabamos de seleccionar, no validar
            if (this.skipNextFormaPagoBlur) {
                this.skipNextFormaPagoBlur = false;
                return;
            }

            // Verificar si el usuario ha escrito una forma de pago nueva
            if (typeof this.selectedFormaPago === 'string' && (this.selectedFormaPago as string).trim()) {
                const formaPagoNombre = (this.selectedFormaPago as string).trim();
                const existe = this.filteredFormasPago().some((f) => f.nombre.toLowerCase() === formaPagoNombre.toLowerCase());

                if (!existe) {
                    // La forma de pago no existe, crear una temporal
                    this.selectedFormaPago = { id: '', nombre: formaPagoNombre };
                    this.formData.formaPagoId = undefined;
                    this.formData.formaPagoNombre = formaPagoNombre;
                    this.newFormaPagoMessage.set(`Ha seleccionado una forma de pago "${formaPagoNombre}" que no existe, se creará automáticamente.`);
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Forma de pago no encontrada',
                        detail: `La forma de pago "${formaPagoNombre}" no existe, se creará automáticamente al guardar.`
                    });
                }
            }
        }, 200);
    }

    onProveedorSelect(event: any) {
        this.skipNextProveedorBlur = true;

        this.formData.proveedorId = event.id;
        this.formData.proveedorNombre = event.nombre;
        this.newProveedorMessage.set('');
    }

    onProveedorBlur() {
        setTimeout(() => {
            // Si acabamos de seleccionar, no validar
            if (this.skipNextProveedorBlur) {
                this.skipNextProveedorBlur = false;
                return;
            }

            // Verificar si el usuario ha escrito un proveedor nuevo
            if (typeof this.selectedProveedor === 'string' && (this.selectedProveedor as string).trim()) {
                const proveedorNombre = (this.selectedProveedor as string).trim();
                const existe = this.filteredProveedores().some((c) => c.nombre.toLowerCase() === proveedorNombre.toLowerCase());

                if (!existe) {
                    // El proveedor no existe, crear uno temporal
                    this.selectedProveedor = { id: '', nombre: proveedorNombre };
                    this.formData.proveedorId = undefined;
                    this.formData.proveedorNombre = proveedorNombre;
                    this.newProveedorMessage.set(`Ha seleccionado un proveedor "${proveedorNombre}" que no existe, se creará automáticamente.`);
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Proveedor no encontrado',
                        detail: `El proveedor "${proveedorNombre}" no existe, se creará automáticamente al guardar.`
                    });
                }
            }
        }, 200);
    }
    onPersonaSelect(event: any) {
        this.skipNextPersonaBlur = true;

        this.formData.personaId = event.id;
        this.formData.personaNombre = event.nombre;
        this.newPersonaMessage.set('');
    }

    onPersonaBlur() {
        setTimeout(() => {
            // Si acabamos de seleccionar, no validar
            if (this.skipNextPersonaBlur) {
                this.skipNextPersonaBlur = false;
                return;
            }

            // Verificar si el usuario ha escrito una persona nueva
            if (typeof this.selectedPersona === 'string' && (this.selectedPersona as string).trim()) {
                const personaNombre = (this.selectedPersona as string).trim();
                const existe = this.filteredPersonas().some((p) => p.nombre.toLowerCase() === personaNombre.toLowerCase());

                if (!existe) {
                    // La persona no existe, crear una temporal
                    this.selectedPersona = { id: '', nombre: personaNombre };
                    this.formData.personaId = undefined;
                    this.formData.personaNombre = personaNombre;
                    this.newPersonaMessage.set(`Ha seleccionado una persona "${personaNombre}" que no existe, se creará automáticamente.`);
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Persona no encontrada',
                        detail: `La persona "${personaNombre}" no existe, se creará automáticamente al guardar.`
                    });
                }
            }
        }, 200);
    }
    onCuentaSelect(event: any) {
        this.skipNextCuentaBlur = true;

        this.formData.cuentaId = event.id;
        this.formData.cuentaNombre = event.nombre;
        this.newCuentaMessage.set('');
    }

    onCuentaBlur() {
        setTimeout(() => {
            // Si acabamos de seleccionar, no validar
            if (this.skipNextCuentaBlur) {
                this.skipNextCuentaBlur = false;
                return;
            }

            // Verificar si el usuario ha escrito una cuenta nueva
            if (typeof this.selectedCuenta === 'string' && (this.selectedCuenta as string).trim()) {
                const cuentaNombre = (this.selectedCuenta as string).trim();
                const existe = this.filteredCuentas().some((c) => c.nombre.toLowerCase() === cuentaNombre.toLowerCase());

                if (!existe) {
                    // La cuenta no existe, crear una temporal
                    this.selectedCuenta = { id: '', nombre: cuentaNombre };
                    this.formData.cuentaId = undefined;
                    this.formData.cuentaNombre = cuentaNombre;
                    this.newCuentaMessage.set(`Ha seleccionado una cuenta "${cuentaNombre}" que no existe, se creará automáticamente.`);
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Cuenta no encontrada',
                        detail: `La cuenta "${cuentaNombre}" no existe, se creará automáticamente al guardar.`
                    });
                }
            }
        }, 200);
    }

    onFormaPagoSelect(event: any) {
        this.skipNextFormaPagoBlur = true;

        this.formData.formaPagoId = event.id;
        this.formData.formaPagoNombre = event.nombre;
        this.newFormaPagoMessage.set('');
    }

    onConceptoClear() {
        this.selectedConcepto = null;
        this.formData.conceptoId = undefined;
        this.formData.conceptoNombre = undefined;
        this.filteredConceptos.set([]);
        this.newConceptoMessage.set('');
    }
    onCategoriaClear() {
        this.selectedCategoria = null;
        this.formData.categoriaId = undefined;
        this.formData.categoriaNombre = undefined;
        this.filteredConceptos.set([]);
        this.newCategoriaMessage.set('');
    }
    onProveedorClear() {
        this.selectedProveedor = null;
        this.formData.proveedorId = undefined;
        this.formData.proveedorNombre = undefined;
        this.filteredProveedores.set([]);
        this.newProveedorMessage.set('');
    }
    onPersonaClear() {
        this.selectedPersona = null;
        this.formData.personaId = undefined;
        this.formData.personaNombre = undefined;
        this.filteredPersonas.set([]);
        this.newPersonaMessage.set('');
    }
    onCuentaClear() {
        this.selectedCuenta = null;
        this.formData.cuentaId = undefined;
        this.formData.cuentaNombre = undefined;
        this.filteredCuentas.set([]);
        this.newCuentaMessage.set('');
    }
    onFormaPagoClear() {
        this.selectedFormaPago = null;
        this.formData.formaPagoId = undefined;
        this.formData.formaPagoNombre = undefined;
        this.filteredFormasPago.set([]);
        this.newFormaPagoMessage.set('');
    }

    getConceptoPlaceholder(): string {
        if (this.selectedCategoria) return `Buscar concepto en ${this.selectedCategoria.nombre}...`;
        return 'Buscar o seleccionar concepto (Todas las categorías)';
    }

    private formatearFecha(fecha: Date | string | undefined): string {
        if (!fecha) {
            return new Date().toISOString().split('T')[0];
        }

        if (typeof fecha === 'string') {
            return fecha;
        }

        // Convertir Date a formato YYYY-MM-DD usando fecha local (sin afectar por zona horaria)
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    onSave() {
        this.submitted.set(true);

        // 1. Validación previa: Si faltan datos, detenemos el proceso de inmediato.
        if (!this.selectedConcepto || !this.formData.importe || this.formData.importe <= 0 || !this.selectedCuenta || !this.selectedFormaPago) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario Incompleto',
                detail: 'Por favor complete todos los campos requeridos.'
            });
            return;
        }

        // 2. Si los datos están bien, pedimos confirmación
        this.#confirmationService.confirm({
            message: '¿Está seguro de que desea registrar este gasto?',
            header: 'Confirmar Guardado',
            icon: 'pi pi-save',

            acceptLabel: 'Sí, guardar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-success',

            rejectButtonStyleClass: 'p-button-text p-button-danger',

            accept: () => {
                this.ejecutarGuardado();
            }
        });
    }

    private ejecutarGuardado() {
        const gastoToSave: Partial<Gasto> = {
            ...this.formData,
            conceptoId: this.selectedConcepto?.id || "00000000-0000-0000-0000-000000000000",
            categoriaId: this.selectedCategoria?.id || "00000000-0000-0000-0000-000000000000",
            cuentaId: this.selectedCuenta?.id || "00000000-0000-0000-0000-000000000000",
            formaPagoId: this.selectedFormaPago?.id || "00000000-0000-0000-0000-000000000000",

            // Opcionales (pueden ser null)
            proveedorId: this.selectedProveedor?.id || null,
            personaId: this.selectedPersona?.id || null,

            // Nombres para auto-creación
            categoriaNombre: this.selectedCategoria?.nombre,
            conceptoNombre: this.selectedConcepto?.nombre,
            proveedorNombre: this.selectedProveedor?.nombre,
            personaNombre: this.selectedPersona?.nombre,
            cuentaNombre: this.selectedCuenta?.nombre,
            formaPagoNombre: this.selectedFormaPago?.nombre,
            fecha: this.formatearFecha(this.formData.fecha)
        };

        this.save.emit(gastoToSave);
        this.closeModal();
    }

    onCancel() {
        if (this.hasUnsavedChanges()) {
            this.#confirmationService.confirm({
                message: '¿Está seguro de que desea salir? Se perderán los cambios no guardados.',
                header: 'Confirmar Cancelación',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Sí',
                rejectLabel: 'Cancelar',
                acceptButtonStyleClass: 'p-button-success',

                rejectButtonStyleClass: 'p-button-text p-button-danger',
                accept: () => {
                    // Esto SOLO se ejecuta si el usuario hace clic en "Sí"
                    this.cancel.emit();
                    this.closeModal();
                },
                reject: () => {
                    // Si rechaza, reabrimos el drawer
                    this.isVisible = true;
                }
            });
        } else {
            // No hay cambios, cerrar directamente
            this.cancel.emit();
            this.closeModal();
        }
    }

    handleDrawerHide() {
        // Este método se llama cuando el drawer se cierra (ESC, clic fuera, etc.)
        if (this.hasUnsavedChanges()) {
            // Si hay cambios sin guardar, mostrar confirmación
            this.#confirmationService.confirm({
                message: '¿Está seguro de que desea salir? Se perderán los cambios no guardados.',
                header: 'Confirmar Cancelación',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Sí',
                rejectLabel: 'Cancelar',
                acceptButtonStyleClass: 'p-button-success',
                rejectButtonStyleClass: 'p-button-text p-button-danger',
                accept: () => {
                    this.cancel.emit();
                    this.closeModal();
                },
                reject: () => {
                    // Si rechaza, reabrimos el drawer
                    this.isVisible = true;
                }
            });
        } else {
            // No hay cambios, permitir el cierre
            this.cancel.emit();
            this.closeModal();
        }
    }

    private hasUnsavedChanges(): boolean {
        return (
            this.selectedCategoria != null ||
            this.selectedConcepto != null ||
            this.formData.importe != null ||
            this.formData.descripcion != null ||
            this.formData.fecha != null ||
            this.formData.cuentaId != null ||
            this.formData.formaPagoId != null ||
            this.selectedProveedor != null ||
            this.selectedPersona != null
        );
    }

    private closeModal() {
        this.isVisible = false;
        this.visibleChange.emit(false);
        this.submitted.set(false);
    }
}
