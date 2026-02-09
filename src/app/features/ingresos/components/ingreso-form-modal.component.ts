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
import { Ingreso } from '@/core/models';

// Stores
import { ClienteStore } from '@/features/clientes/store/cliente.store';
import { FormaPagoStore } from '@/features/formas-pago/store/forma-pago.store';
import { CuentaStore } from '@/features/cuentas/store/cuenta.store';
import { ConceptoStore } from '@/features/conceptos/store/concepto.store';
import { CategoriaStore } from '@/features/categorias/store/categoria.store';
import { PersonaStore } from '@/features/personas/store/persona.store';

interface CatalogItem {
    id: string;
    nombre: string;
}

interface IngresoFormData extends Omit<Partial<Ingreso>, 'fecha'> {
    fecha?: Date | string;
}

@Component({
    selector: 'app-ingreso-form-modal',
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
        <p-drawer [(visible)]="isVisible" position="right" [style]="{ width: '600px', maxWidth: '100vw' }" [modal]="true" [blockScroll]="true" (onHide)="onCancel()" styleClass="p-sidebar-md surface-ground">
            <ng-template pTemplate="header">
                <div class="flex align-items-center gap-2">
                    <span class="font-bold text-xl text-900">{{ isEditMode() ? 'Editar Ingreso' : 'Nuevo Ingreso' }}</span>
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
                            [forceSelection]="true"
                            (onSelect)="onCuentaSelect($event)"
                            class="flex-1 w-full"
                            styleClass="w-full"
                        />
                    </div>
                    @if (submitted() && !selectedCuenta) {
                        <small class="text-red-500 block mt-1">La cuenta de destino es requerida.</small>
                    }
                </div>

                <div class="col-span-12 mt-4">
                    <h5 class="text-xs font-bold text-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-2">Terceros</h5>
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label class="font-medium text-gray-700 block mb-2 text-sm">Cliente</label>
                    <div class="flex align-items-center gap-2">
                        <p-autoComplete
                            [(ngModel)]="selectedCliente"
                            [suggestions]="filteredClientes()"
                            (completeMethod)="searchClientes($event)"
                            optionLabel="nombre"
                            [dropdown]="true"
                            placeholder="Buscar cliente..."
                            [forceSelection]="false"
                            [showEmptyMessage]="false"
                            (onSelect)="onClienteSelect($event)"
                            (onBlur)="onClienteBlur()"
                            class="flex-1 w-full"
                            styleClass="w-full"
                        />
                    </div>
                    @if (newClienteMessage()) {
                        <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newClienteMessage() }}</small>
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
                    <p-button label="Guardar Ingreso" icon="pi pi-check" (onClick)="onSave()" />
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
export class IngresoFormModalComponent {
    private messageService = inject(MessageService);
    #confirmationService = inject(ConfirmationService);
    private conceptoStore = inject(ConceptoStore);
    private categoriaStore = inject(CategoriaStore);
    private clienteStore = inject(ClienteStore);
    private personaStore = inject(PersonaStore);
    private cuentaStore = inject(CuentaStore);
    private formaPagoStore = inject(FormaPagoStore);

    // Inputs/Outputs
    visible = input<boolean>(false);
    ingreso = input<Partial<Ingreso> | null>(null);
    visibleChange = output<boolean>();
    save = output<Partial<Ingreso>>();
    cancel = output<void>();

    // Estado del formulario
    formData: IngresoFormData = {};
    submitted = signal(false);

    // Selectores asíncronos
    selectedConcepto: CatalogItem | null = null;
    selectedCategoria: CatalogItem | null = null;
    selectedCliente: CatalogItem | null = null;
    selectedPersona: CatalogItem | null = null;
    selectedCuenta: CatalogItem | null = null;
    selectedFormaPago: CatalogItem | null = null;

    filteredConceptos = signal<CatalogItem[]>([]);
    filteredCategorias = signal<CatalogItem[]>([]);
    filteredClientes = signal<CatalogItem[]>([]);
    filteredPersonas = signal<CatalogItem[]>([]);
    filteredCuentas = signal<CatalogItem[]>([]);
    filteredFormasPago = signal<CatalogItem[]>([]);

    // Mensajes para valores nuevos
    newConceptoMessage = signal<string>('');
    newCategoriaMessage = signal<string>('');
    newFormaPagoMessage = signal<string>('');
    newClienteMessage = signal<string>('');
    newPersonaMessage = signal<string>('');

    constructor() {
        effect(() => {
            this.isVisible = this.visible();
        });

        effect(() => {
            const ingresoData = this.ingreso();
            if (ingresoData) {
                this.loadFormData();
            }
        });
    }

    isVisible = false;
    isEditMode = signal(false);

    private loadFormData() {
        const ingresoData = this.ingreso();

        if (ingresoData?.id) {
            // Modo edición
            this.isEditMode.set(true);
            const fechaDate = ingresoData.fecha ? new Date(ingresoData.fecha) : new Date();
            fechaDate.setHours(0, 0, 0, 0);

            this.formData = {
                ...ingresoData,
                fecha: fechaDate
            };

            this.selectedConcepto = ingresoData.conceptoId && ingresoData.conceptoNombre ? { id: ingresoData.conceptoId, nombre: ingresoData.conceptoNombre } : null;
            this.selectedCategoria = ingresoData.categoriaId && ingresoData.categoriaNombre ? { id: ingresoData.categoriaId, nombre: ingresoData.categoriaNombre } : null;
            this.selectedCliente = ingresoData.clienteId && ingresoData.clienteNombre ? { id: ingresoData.clienteId, nombre: ingresoData.clienteNombre } : null;
            this.selectedPersona = ingresoData.personaId && ingresoData.personaNombre ? { id: ingresoData.personaId, nombre: ingresoData.personaNombre } : null;
            this.selectedCuenta = ingresoData.cuentaId && ingresoData.cuentaNombre ? { id: ingresoData.cuentaId, nombre: ingresoData.cuentaNombre } : null;
            this.selectedFormaPago = ingresoData.formaPagoId && ingresoData.formaPagoNombre ? { id: ingresoData.formaPagoId, nombre: ingresoData.formaPagoNombre } : null;
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
            this.selectedCliente = null;
            this.selectedPersona = null;
            this.selectedCuenta = null;
            this.selectedFormaPago = null;
        }
        this.submitted.set(false);
        this.newConceptoMessage.set('');
        this.newCategoriaMessage.set('');
        this.newFormaPagoMessage.set('');
        this.newClienteMessage.set('');
        this.newPersonaMessage.set('');
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

    searchClientes(event: AutoCompleteCompleteEvent) {
        const query = event.query;
        if (!query || query.length < 2) {
            this.clienteStore
                .getRecent(5)
                .then((data) => this.filteredClientes.set(data))
                .catch(() => this.filteredClientes.set([]));
        } else {
            this.clienteStore
                .search(query, 10)
                .then((data) => this.filteredClientes.set(data))
                .catch(() => this.filteredClientes.set([]));
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
            }
        }
    }

    onCategoriaSelect(event: any) {
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
            }
        }
    }

    onFormaPagoBlur() {
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
            }
        }
    }

    onClienteSelect(event: any) {
        this.formData.clienteId = event.id;
        this.formData.clienteNombre = event.nombre;
        this.newClienteMessage.set('');
    }

    onClienteBlur() {
        // Verificar si el usuario ha escrito un cliente nuevo
        if (typeof this.selectedCliente === 'string' && (this.selectedCliente as string).trim()) {
            const clienteNombre = (this.selectedCliente as string).trim();
            const existe = this.filteredClientes().some((c) => c.nombre.toLowerCase() === clienteNombre.toLowerCase());

            if (!existe) {
                // El cliente no existe, crear uno temporal
                this.selectedCliente = { id: '', nombre: clienteNombre };
                this.formData.clienteId = undefined;
                this.formData.clienteNombre = clienteNombre;
                this.newClienteMessage.set(`Ha seleccionado un cliente "${clienteNombre}" que no existe, se creará automáticamente.`);
            }
        }
    }
    onPersonaSelect(event: any) {
        this.formData.personaId = event.id;
        this.formData.personaNombre = event.nombre;
        this.newPersonaMessage.set('');
    }

    onPersonaBlur() {
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
            }
        }
    }
    onCuentaSelect(event: any) {
        this.formData.cuentaId = event.id;
        this.formData.cuentaNombre = event.nombre;
    }
    onFormaPagoSelect(event: any) {
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
    onClienteClear() {
        this.selectedCliente = null;
        this.formData.clienteId = undefined;
        this.formData.clienteNombre = undefined;
        this.filteredClientes.set([]);
        this.newClienteMessage.set('');
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
            message: '¿Está seguro de que desea registrar este ingreso?',
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
        const ingresoToSave: Partial<Ingreso> = {
            ...this.formData,
            conceptoId: this.selectedConcepto?.id,
            conceptoNombre: this.selectedConcepto?.nombre,
            categoriaId: this.selectedCategoria?.id || undefined,
            categoriaNombre: this.selectedCategoria?.nombre || undefined,
            clienteId: this.selectedCliente?.id || undefined,
            clienteNombre: this.selectedCliente?.nombre || undefined,
            personaId: this.selectedPersona?.id || undefined,
            personaNombre: this.selectedPersona?.nombre || undefined,
            cuentaId: this.selectedCuenta?.id || undefined,
            cuentaNombre: this.selectedCuenta?.nombre || undefined,
            formaPagoId: this.selectedFormaPago?.id || undefined,
            formaPagoNombre: this.selectedFormaPago?.nombre || undefined,
            fecha: this.formatearFecha(this.formData.fecha)
        };

        this.save.emit(ingresoToSave);
        this.closeModal();
    }

    onCancel() {
        if (
            this.selectedCategoria != null ||
            this.selectedConcepto != null ||
            this.formData.importe != null ||
            this.formData.descripcion != null ||
            this.formData.fecha != null ||
            this.formData.cuentaId != null ||
            this.formData.formaPagoId != null ||
            this.selectedCliente != null ||
            this.selectedPersona != null
        ) {
            this.#confirmationService.confirm({
                message: '¿Está seguro de que desea cancelar? Se perderán los cambios no guardados.',
                header: 'Confirmar Cancelación',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    // Esto SOLO se ejecuta si el usuario hace clic en "Sí"
                    this.cancel.emit();
                    this.closeModal();
                },
                reject: () => {
                    return;
                }
            });
        }
    }

    private closeModal() {
        this.isVisible = false;
        this.visibleChange.emit(false);
        this.submitted.set(false);
    }
}
