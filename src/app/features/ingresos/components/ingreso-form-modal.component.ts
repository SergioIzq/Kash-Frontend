import { Component, inject, input, output, effect, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { Ingreso } from '@/core/models';
import { Cliente } from '@/core/models/cliente.model';
import { Persona } from '@/core/models/persona.model';
import { Concepto } from '@/core/models/concepto.model';
import { ConceptoCreateModalComponent, CategoriaCreateModalComponent, ClienteCreateModalComponent, PersonaCreateModalComponent } from '@/shared/components';
import { Categoria } from '@/core/models/categoria.model';
import { ConceptoStore, CategoriaStore, ClienteStore, PersonaStore, CuentaStore, FormaPagoStore } from '@/shared/stores';

interface CatalogItem {
    id: string;
    nombre: string;
}

interface IngresoFormData extends Omit<Partial<Ingreso>, 'fecha'> {
    fecha?: Date | string; // Permitir Date para p-datepicker
}

@Component({
    selector: 'app-ingreso-form-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        DatePickerModule,
        AutoCompleteModule,
        ConceptoCreateModalComponent,
        CategoriaCreateModalComponent,
        ClienteCreateModalComponent,
        PersonaCreateModalComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-dialog [(visible)]="isVisible" [style]="{ width: '650px' }" [header]="isEditMode() ? 'Editar Ingreso' : 'Nuevo Ingreso'" [modal]="true" [contentStyle]="{ padding: '2rem' }" (onHide)="onCancel()" styleClass="p-fluid">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <!-- Concepto con Autocomplete + Botón crear -->
                    <div>
                        <label for="concepto" class="block font-bold mb-3">Concepto *</label>
                        <div class="flex gap-2">
                            <p-autoComplete
                                [(ngModel)]="selectedConcepto"
                                [placeholder]="getConceptoPlaceholder()"
                                [suggestions]="filteredConceptos()"
                                (completeMethod)="searchConceptos($event)"
                                [showClear]="true"
                                (onClear)="onConceptoClear()"
                                optionLabel="nombre"
                                [dropdown]="true"
                                placeholder="Buscar o seleccionar concepto"
                                class="flex-1"
                                [forceSelection]="true"
                                (onSelect)="onConceptoSelect($event)"
                            />
                            <p-button icon="pi pi-plus" [rounded]="true" severity="secondary" [outlined]="true" (click)="openCreateConcepto()" pTooltip="Crear nuevo concepto" />
                        </div>
                        @if (submitted() && !selectedConcepto) {
                            <small class="text-red-500"> El concepto es requerido. </small>
                        }
                    </div>

                    <!-- Categoría con Autocomplete + Botón crear -->
                    <div>
                        <label for="categoria" class="block font-bold mb-3">Categoría</label>
                        <div class="flex gap-2">
                            <p-autoComplete
                                [(ngModel)]="selectedCategoria"
                                [suggestions]="filteredCategorias()"
                                (completeMethod)="searchCategorias($event)"
                                [showClear]="true"
                                (onClear)="onCategoriaClear()"
                                optionLabel="nombre"
                                [dropdown]="true"
                                placeholder="Buscar o seleccionar categoría"
                                class="flex-1"
                                [forceSelection]="false"
                                (onSelect)="onCategoriaSelect($event)"
                            />
                            @if (submitted() && !selectedCategoria) {
                                <small class="text-red-500"> La categoría es requerida. </small>
                            }
                            <p-button icon="pi pi-plus" [rounded]="true" severity="secondary" [outlined]="true" (click)="openCreateCategoria()" pTooltip="Crear nueva categoría" />
                        </div>
                    </div>

                    <!-- Cliente con Autocomplete + Botón crear -->
                    <div>
                        <label for="cliente" class="block font-bold mb-3">Cliente *</label>
                        <div class="flex gap-2">
                            <p-autoComplete
                                [(ngModel)]="selectedCliente"
                                [suggestions]="filteredClientees()"
                                (completeMethod)="searchClientees($event)"
                                [showClear]="true"
                                (onClear)="onClienteClear()"
                                optionLabel="nombre"
                                [dropdown]="true"
                                placeholder="Buscar o seleccionar cliente"
                                styleClass="flex-1"
                                [forceSelection]="false"
                                (onSelect)="onClienteSelect($event)"
                            />
                            @if (submitted() && !selectedCliente) {
                                <small class="text-red-500"> El cliente es requerido. </small>
                            }
                            <p-button icon="pi pi-plus" [rounded]="true" severity="secondary" [outlined]="true" (click)="openCreateCliente()" pTooltip="Crear nuevo cliente" />
                        </div>
                    </div>

                    <!-- Persona con Autocomplete + Botón crear -->
                    <div>
                        <label for="persona" class="block font-bold mb-3">Persona *</label>
                        <div class="flex gap-2">
                            <p-autoComplete
                                [(ngModel)]="selectedPersona"
                                [suggestions]="filteredPersonas()"
                                (completeMethod)="searchPersonas($event)"
                                [showClear]="true"
                                (onClear)="onPersonaClear()"
                                optionLabel="nombre"
                                [dropdown]="true"
                                placeholder="Buscar o seleccionar persona"
                                styleClass="flex-1"
                                [forceSelection]="false"
                                (onSelect)="onPersonaSelect($event)"
                            />
                            @if (submitted() && !selectedPersona) {
                                <small class="text-red-500"> La persona es requerida. </small>
                            }
                            <p-button icon="pi pi-plus" [rounded]="true" severity="secondary" [outlined]="true" (click)="openCreatePersona()" pTooltip="Crear nueva persona" />
                        </div>
                    </div>

                    <!-- Cuenta con Autocomplete -->
                    <div>
                        <label for="cuenta" class="block font-bold mb-3">Cuenta *</label>
                        <div class="flex gap-2">
                            <p-autoComplete
                                [(ngModel)]="selectedCuenta"
                                [suggestions]="filteredCuentas()"
                                (completeMethod)="searchCuentas($event)"
                                [showClear]="true"
                                (onClear)="onCuentaClear()"
                                optionLabel="nombre"
                                [dropdown]="true"
                                placeholder="Buscar o seleccionar cuenta"
                                [forceSelection]="true"
                                (onSelect)="onCuentaSelect($event)"
                                fluid
                            />
                            @if (submitted() && !selectedCuenta) {
                                <small class="text-red-500"> La cuenta es requerida. </small>
                            }
                            <p-button icon="pi pi-plus" [rounded]="true" severity="secondary" [outlined]="true" (click)="openCreateCuenta()" pTooltip="Crear nueva cuenta" />
                        </div>
                    </div>

                    <!-- Forma de Pago con Autocomplete -->
                    <div>
                        <label for="formaPago" class="block font-bold mb-3">Forma de Pago *</label>
                        <div class="flex gap-2">
                            <p-autoComplete
                                [(ngModel)]="selectedFormaPago"
                                [suggestions]="filteredFormasPago()"
                                (completeMethod)="searchFormasPago($event)"
                                [showClear]="true"
                                (onClear)="onFormaPagoClear()"
                                optionLabel="nombre"
                                [dropdown]="true"
                                placeholder="Buscar o seleccionar forma de pago"
                                [forceSelection]="true"
                                (onSelect)="onFormaPagoSelect($event)"
                                fluid
                            />
                            @if (submitted() && !selectedFormaPago) {
                                <small class="text-red-500"> La forma de pago es requerida. </small>
                            }
                            <p-button icon="pi pi-plus" [rounded]="true" severity="secondary" [outlined]="true" (click)="openCreateFormaPago()" pTooltip="Crear nueva forma de pago" />
                        </div>
                    </div>

                    <!-- Importe -->
                    <div>
                        <label for="importe" class="block font-bold mb-3">Importe *</label>
                        <p-inputnumber id="importe" [(ngModel)]="formData.importe" mode="currency" currency="EUR" locale="es-ES" [min]="0" fluid />
                        @if (submitted() && !formData.importe) {
                            <small class="text-red-500"> El importe es requerido. </small>
                        }
                    </div>

                    <!-- Fecha -->
                    <div>
                        <label for="fecha" class="block font-bold mb-3">Fecha *</label>
                        <p-datepicker [(ngModel)]="formData.fecha" dateFormat="dd/mm/yy" iconDisplay="input" fluid />
                    </div>

                    <!-- Descripción -->
                    <div>
                        <label for="descripcion" class="block font-bold mb-3">Descripción</label>
                        <textarea id="descripcion" pTextarea [(ngModel)]="formData.descripcion" rows="3" fluid> </textarea>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="onCancel()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="onSave()" />
            </ng-template>
        </p-dialog>

        <!-- Modales inline para creación rápida -->
        <app-concepto-create-modal [visible]="showConceptoCreateModal" (visibleChange)="showConceptoCreateModal = $event" (created)="onConceptoCreated($event)" (cancel)="showConceptoCreateModal = false" />

        <app-categoria-create-modal [visible]="showCategoriaCreateModal" (visibleChange)="showCategoriaCreateModal = $event" (created)="onCategoriaCreated($event)" (cancel)="showCategoriaCreateModal = false" />

        <app-cliente-create-modal [visible]="showClienteCreateModal" (visibleChange)="showClienteCreateModal = $event" (created)="onClienteCreated($event)" (cancel)="showClienteCreateModal = false" />

        <app-persona-create-modal [visible]="showPersonaCreateModal" (visibleChange)="showPersonaCreateModal = $event" (created)="onPersonaCreated($event)" (cancel)="showPersonaCreateModal = false" />
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
export class IngresoFormModalComponent {
    private messageService = inject(MessageService);
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
    filteredClientees = signal<CatalogItem[]>([]);
    filteredPersonas = signal<CatalogItem[]>([]);
    filteredCuentas = signal<CatalogItem[]>([]);
    filteredFormasPago = signal<CatalogItem[]>([]);

    // Control de modales inline
    showConceptoCreateModal = false;
    showCategoriaCreateModal = false;
    showClienteCreateModal = false;
    showPersonaCreateModal = false;
    showFormaPagoCreateModal = false;
    showCuentaCreateModal = false;

    constructor() {
        // Sincronizar visible con isVisible interno
        effect(() => {
            this.isVisible = this.visible();
        });

        // Cargar datos cuando cambia el ingreso
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
            this.formData = {
                ...ingresoData,
                // Convertir fecha de string a Date para p-datepicker
                fecha: ingresoData.fecha ? new Date(ingresoData.fecha) : new Date()
            };

            // Cargar valores seleccionados en autocompletes como objetos completos
            this.selectedConcepto = ingresoData.conceptoId && ingresoData.conceptoNombre ? { id: ingresoData.conceptoId, nombre: ingresoData.conceptoNombre } : null;

            this.selectedCategoria = ingresoData.categoriaId && ingresoData.categoriaNombre ? { id: ingresoData.categoriaId, nombre: ingresoData.categoriaNombre } : null;

            this.selectedCliente = ingresoData.clienteId && ingresoData.clienteNombre ? { id: ingresoData.clienteId, nombre: ingresoData.clienteNombre } : null;

            this.selectedPersona = ingresoData.personaId && ingresoData.personaNombre ? { id: ingresoData.personaId, nombre: ingresoData.personaNombre } : null;

            this.selectedCuenta = ingresoData.cuentaId && ingresoData.cuentaNombre ? { id: ingresoData.cuentaId, nombre: ingresoData.cuentaNombre } : null;

            this.selectedFormaPago = ingresoData.formaPagoId && ingresoData.formaPagoNombre ? { id: ingresoData.formaPagoId, nombre: ingresoData.formaPagoNombre } : null;
        } else {
            // Modo creación
            this.isEditMode.set(false);
            this.formData = {
                importe: 0,
                fecha: new Date(), // Date object para p-datepicker
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
    }

    // Métodos de búsqueda asíncrona conectados con stores
    searchConceptos(event: AutoCompleteCompleteEvent) {
        const query = event.query;
        // Obtenemos el ID de la categoría seleccionada actualmente (si existe)
        const categoriaId = this.selectedCategoria?.id;

        // NOTA: Tu conceptoStore.search debe aceptar un tercer parámetro opcional para el filtro
        // Ejemplo: search(query, limit, categoriaId?)

        if (!query || query.length < 2) {
            this.conceptoStore
                .getRecent(5, categoriaId) // Asume que getRecent también acepta filtro
                .then((conceptos) => this.filteredConceptos.set(conceptos))
                .catch((err) => {
                    console.error('Error cargando conceptos:', err);
                    this.filteredConceptos.set([]);
                });
        } else {
            this.conceptoStore
                .search(query, 10, categoriaId) // <--- AQUI PASAMOS EL FILTRO
                .then((conceptos) => this.filteredConceptos.set(conceptos))
                .catch((err) => {
                    console.error('Error buscando conceptos:', err);
                    this.filteredConceptos.set([]);
                });
        }
    }

    searchCategorias(event: AutoCompleteCompleteEvent) {
        const query = event.query;

        if (!query || query.length < 2) {
            // Mostrar categorías recientes si la búsqueda está vacía
            this.categoriaStore
                .getRecent(5)
                .then((categorias) => this.filteredCategorias.set(categorias))
                .catch((err) => {
                    console.error('Error cargando categorías recientes:', err);
                    this.filteredCategorias.set([]);
                });
        } else {
            // Buscar categorías por término
            this.categoriaStore
                .search(query, 10)
                .then((categorias) => this.filteredCategorias.set(categorias))
                .catch((err) => {
                    console.error('Error buscando categorías:', err);
                    this.filteredCategorias.set([]);
                });
        }
    }

    searchClientees(event: AutoCompleteCompleteEvent) {
        const query = event.query;

        if (!query || query.length < 2) {
            // Mostrar clientees recientes si la búsqueda está vacía
            this.clienteStore
                .getRecent(5)
                .then((clientees) => this.filteredClientees.set(clientees))
                .catch((err) => {
                    console.error('Error cargando clientees recientes:', err);
                    this.filteredClientees.set([]);
                });
        } else {
            // Buscar clientees por término
            this.clienteStore
                .search(query, 10)
                .then((clientees) => this.filteredClientees.set(clientees))
                .catch((err) => {
                    console.error('Error buscando clientees:', err);
                    this.filteredClientees.set([]);
                });
        }
    }

    searchPersonas(event: AutoCompleteCompleteEvent) {
        const query = event.query;

        if (!query || query.length < 2) {
            // Mostrar personas recientes si la búsqueda está vacía
            this.personaStore
                .getRecent(5)
                .then((personas) => this.filteredPersonas.set(personas))
                .catch((err) => {
                    console.error('Error cargando personas recientes:', err);
                    this.filteredPersonas.set([]);
                });
        } else {
            // Buscar personas por término
            this.personaStore
                .search(query, 10)
                .then((personas) => this.filteredPersonas.set(personas))
                .catch((err) => {
                    console.error('Error buscando personas:', err);
                    this.filteredPersonas.set([]);
                });
        }
    }

    searchCuentas(event: AutoCompleteCompleteEvent) {
        const query = event.query;

        if (!query || query.length < 2) {
            // Mostrar cuentas recientes si la búsqueda está vacía
            this.cuentaStore
                .getRecent(5)
                .then((cuentas) => this.filteredCuentas.set(cuentas))
                .catch((err) => {
                    console.error('Error cargando cuentas recientes:', err);
                    this.filteredCuentas.set([]);
                });
        } else {
            // Buscar cuentas por término
            this.cuentaStore
                .search(query, 10)
                .then((cuentas) => this.filteredCuentas.set(cuentas))
                .catch((err) => {
                    console.error('Error buscando cuentas:', err);
                    this.filteredCuentas.set([]);
                });
        }
    }

    searchFormasPago(event: AutoCompleteCompleteEvent) {
        const query = event.query;

        if (!query || query.length < 2) {
            // Mostrar formas de pago recientes si la búsqueda está vacía
            this.formaPagoStore
                .getRecent(5)
                .then((formasPago) => this.filteredFormasPago.set(formasPago))
                .catch((err) => {
                    console.error('Error cargando formas de pago recientes:', err);
                    this.filteredFormasPago.set([]);
                });
        } else {
            // Buscar formas de pago por término
            this.formaPagoStore
                .search(query, 10)
                .then((formasPago) => this.filteredFormasPago.set(formasPago))
                .catch((err) => {
                    console.error('Error buscando formas de pago:', err);
                    this.filteredFormasPago.set([]);
                });
        }
    }

    // Eventos de selección
    // En tu componente IngresoFormModalComponent

    onConceptoSelect(event: any) {
        let value = event.value;
        // 1. Lógica existente
        this.formData.conceptoId = value.id;
        this.formData.conceptoNombre = value.nombre;

        // 2. NUEVA LÓGICA DE UX: Auto-seleccionar categoría
        // Verificamos si el concepto trae la info de su categoría (asegúrate que tu DTO de backend lo traiga)
        if (value.categoriaId && value.categoriaNombre) {
            // Creamos el objeto para el autocomplete de categoría
            const categoriaAsociada: CatalogItem = {
                id: value.categoriaId,
                nombre: value.categoriaNombre
            };

            // Actualizamos el modelo visual (el input)
            this.selectedCategoria = categoriaAsociada;

            // Actualizamos el modelo de datos (formData)
            this.formData.categoriaId = categoriaAsociada.id;
            this.formData.categoriaNombre = categoriaAsociada.nombre;

            // UX Extra: Mostrar un mensaje visual sutil (opcional con Toast)
            this.messageService.add({ severity: 'info', summary: 'Categoría asignada automáticamente', detail: value.categoriaNombre });
        }
    }

    onCategoriaSelect(event: any) {
        // 1. Asignar los datos de la categoría al formulario
        this.formData.categoriaId = event.id;
        this.formData.categoriaNombre = event.nombre;

        // 2. LOGICA NUEVA: Si cambiamos de categoría, limpiamos el concepto
        // para obligar al usuario a elegir uno válido para esta nueva categoría
        this.selectedConcepto = null;
        this.formData.conceptoId = undefined;
        this.formData.conceptoNombre = undefined;

        // Opcional: Enfocar el input de concepto automáticamente
    }

    onClienteSelect(event: any) {
        this.formData.clienteId = event.id;
        this.formData.clienteNombre = event.nombre;
    }

    onPersonaSelect(event: any) {
        this.formData.personaId = event.id;
        this.formData.personaNombre = event.nombre;
    }

    onCuentaSelect(event: any) {
        this.formData.cuentaId = event.id;
        this.formData.cuentaNombre = event.nombre;
    }

    onFormaPagoSelect(event: any) {
        this.formData.formaPagoId = event.id;
        this.formData.formaPagoNombre = event.nombre;
    }

    // Handlers para limpiar autocompletes
    onConceptoClear() {
        this.selectedConcepto = null;
        this.formData.conceptoId = undefined;
        this.formData.conceptoNombre = undefined;
        this.filteredConceptos.set([]);
    }

    onCategoriaClear() {
        this.selectedCategoria = null;
        this.formData.categoriaId = undefined;
        this.formData.categoriaNombre = undefined;
        // Al limpiar categoría, refrescamos conceptos para buscar sin filtro
        this.filteredConceptos.set([]);
    }

    onClienteClear() {
        this.selectedCliente = null;
        this.formData.clienteId = undefined;
        this.formData.clienteNombre = undefined;
        this.filteredClientees.set([]);
    }

    onPersonaClear() {
        this.selectedPersona = null;
        this.formData.personaId = undefined;
        this.formData.personaNombre = undefined;
        this.filteredPersonas.set([]);
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
    }

    // Abrir modales de creación inline
    openCreateConcepto() {
        this.showConceptoCreateModal = true;
    }

    openCreateCategoria() {
        this.showCategoriaCreateModal = true;
    }

    openCreateCliente() {
        this.showClienteCreateModal = true;
    }

    openCreatePersona() {
        this.showPersonaCreateModal = true;
    }

    openCreateFormaPago() {
        this.showFormaPagoCreateModal = true;
    }

    openCreateCuenta() {
        this.showCuentaCreateModal = true;
    }

    // Handlers cuando se crea un nuevo item
    onConceptoCreated(nuevoConcepto: Concepto) {
        this.showConceptoCreateModal = false;

        // Convertir a CatalogItem para el autocomplete
        const conceptoItem: CatalogItem = {
            id: nuevoConcepto.id,
            nombre: nuevoConcepto.nombre
        };

        // Seleccionar automáticamente el concepto recién creado
        this.selectedConcepto = conceptoItem;
        this.formData.conceptoId = conceptoItem.id;
        this.formData.conceptoNombre = conceptoItem.nombre;

        // Añadir a la lista de filtrados para que aparezca en el autocomplete
        this.filteredConceptos.set([conceptoItem, ...this.filteredConceptos()]);

        this.messageService.add({
            severity: 'success',
            summary: 'Concepto creado',
            detail: `Concepto "${nuevoConcepto.nombre}" creado y seleccionado correctamente`
        });
    }

    onCategoriaCreated(nuevaCategoria: Categoria) {
        this.showCategoriaCreateModal = false;

        // Seleccionar automáticamente la categoría recién creada
        this.selectedCategoria = {
            id: nuevaCategoria.id,
            nombre: nuevaCategoria.nombre
        };
        this.formData.categoriaId = nuevaCategoria.id;
        this.formData.categoriaNombre = nuevaCategoria.nombre;

        // Añadir a la lista de filtrados
        this.filteredCategorias.set([this.selectedCategoria, ...this.filteredCategorias()]);

        this.messageService.add({
            severity: 'success',
            summary: 'Categoría creada',
            detail: `Categoría "${nuevaCategoria.nombre}" creada y seleccionada correctamente`
        });
    }

    onClienteCreated(nuevoCliente: Cliente) {
        this.showClienteCreateModal = false;

        // Convertir a CatalogItem para el autocomplete
        const clienteItem: CatalogItem = {
            id: nuevoCliente.id,
            nombre: nuevoCliente.nombre
        };

        // Seleccionar automáticamente el cliente recién creado
        this.selectedCliente = clienteItem;
        this.formData.clienteId = clienteItem.id;
        this.formData.clienteNombre = clienteItem.nombre;

        // Añadir a la lista de filtrados
        this.filteredClientees.set([clienteItem, ...this.filteredClientees()]);

        this.messageService.add({
            severity: 'success',
            summary: 'Cliente creado',
            detail: `Cliente "${nuevoCliente.nombre}" creado y seleccionado correctamente`
        });
    }

    getConceptoPlaceholder(): string {
        if (this.selectedCategoria) {
            return `Buscar concepto en ${this.selectedCategoria.nombre}...`;
        }
        return 'Buscar o seleccionar concepto (Todas las categorías)';
    }

    onPersonaCreated(nuevaPersona: Persona) {
        this.showPersonaCreateModal = false;

        // Convertir a CatalogItem para el autocomplete
        const personaItem: CatalogItem = {
            id: nuevaPersona.id,
            nombre: nuevaPersona.nombre
        };

        // Seleccionar automáticamente la persona recién creada
        this.selectedPersona = personaItem;
        this.formData.personaId = personaItem.id;
        this.formData.personaNombre = personaItem.nombre;

        // Añadir a la lista de filtrados
        this.filteredPersonas.set([personaItem, ...this.filteredPersonas()]);

        this.messageService.add({
            severity: 'success',
            summary: 'Persona creada',
            detail: `Persona "${nuevaPersona.nombre}" creada y seleccionada correctamente`
        });
    }

    onSave() {
        this.submitted.set(true);

        // Validaciones
        if (!this.selectedConcepto || !this.formData.importe || this.formData.importe <= 0 || !this.selectedCuenta || !this.selectedFormaPago || !this.selectedPersona || !this.selectedCliente) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Por favor complete los campos requeridos (Concepto, Importe, Cuenta, Forma de Pago, Persona y Cliente)'
            });
            return;
        }

        // Preparar datos para guardar
        const ingresoToSave: Partial<Ingreso> = {
            ...this.formData,
            conceptoId: this.selectedConcepto.id,
            conceptoNombre: this.selectedConcepto.nombre,
            categoriaId: this.selectedCategoria?.id || '',
            categoriaNombre: this.selectedCategoria?.nombre || '',
            clienteId: this.selectedCliente?.id || '',
            clienteNombre: this.selectedCliente?.nombre || '',
            personaId: this.selectedPersona?.id || '',
            personaNombre: this.selectedPersona?.nombre || '',
            cuentaId: this.selectedCuenta.id,
            cuentaNombre: this.selectedCuenta.nombre,
            formaPagoId: this.selectedFormaPago.id,
            formaPagoNombre: this.selectedFormaPago.nombre,
            fecha: typeof this.formData.fecha === 'string' ? this.formData.fecha : new Date(this.formData.fecha!).toISOString().split('T')[0]
        };

        this.save.emit(ingresoToSave);
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
