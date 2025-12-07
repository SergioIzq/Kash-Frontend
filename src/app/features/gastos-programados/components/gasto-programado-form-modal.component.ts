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
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { GastoProgramado, Frecuencia } from '@/core/models/gasto-programado.model';
import { Proveedor } from '@/core/models/proveedor.model';
import { Persona } from '@/core/models/persona.model';
import { Concepto } from '@/core/models/concepto.model';
import { CategoriaCreateModalComponent, ProveedorCreateModalComponent, PersonaCreateModalComponent, CuentaCreateModalComponent, FormaPagoCreateModalComponent } from '@/shared/components';
import { Categoria } from '@/core/models/categoria.model';
import { Cuenta } from '@/core/models/cuenta.model';
import { FormaPago } from '@/core/models/forma-pago.model';
import { FormaPagoStore } from '@/features/formas-pago/store/forma-pago.store';
import { ProveedorStore } from '@/features/proveedores/store/proveedor.store';
import { CuentaStore } from '@/features/cuentas/store/cuenta.store';
import { ConceptoCreateModalComponent } from '@/features/conceptos/components/concepto-create-modal.component';
import { ConceptoStore } from '@/features/conceptos/store/concepto.store';
import { CategoriaStore } from '@/features/categorias/store/categoria.store';
import { PersonaStore } from '@/features/personas/store/persona.store';

interface CatalogItem {
    id: string;
    nombre: string;
}

interface GastoProgramadoFormData extends Omit<Partial<GastoProgramado>, 'fechaEjecucion'> {
    fechaEjecucion?: Date | string;
}

@Component({
    selector: 'app-gasto-programado-form-modal',
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
        SelectModule,
        CheckboxModule,
        ConceptoCreateModalComponent,
        CategoriaCreateModalComponent,
        ProveedorCreateModalComponent,
        PersonaCreateModalComponent,
        FormaPagoCreateModalComponent,
        CuentaCreateModalComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-dialog 
            [(visible)]="isVisible" 
            [style]="{ width: '650px' }" 
            [header]="isEditMode() ? 'Editar Gasto Programado' : 'Nuevo Gasto Programado'" 
            [modal]="true" 
            [contentStyle]="{ padding: '2rem' }" 
            (onHide)="onCancel()" 
            styleClass="p-fluid"
        >
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

                    <!-- Proveedor con Autocomplete + Botón crear -->
                    <div>
                        <label for="proveedor" class="block font-bold mb-3">Proveedor *</label>
                        <div class="flex gap-2">
                            <p-autoComplete
                                [(ngModel)]="selectedProveedor"
                                [suggestions]="filteredProveedores()"
                                (completeMethod)="searchProveedores($event)"
                                [showClear]="true"
                                (onClear)="onProveedorClear()"
                                optionLabel="nombre"
                                [dropdown]="true"
                                placeholder="Buscar o seleccionar proveedor"
                                styleClass="flex-1"
                                [forceSelection]="false"
                                (onSelect)="onProveedorSelect($event)"
                            />
                            @if (submitted() && !selectedProveedor) {
                                <small class="text-red-500"> El proveedor es requerido. </small>
                            }
                            <p-button icon="pi pi-plus" [rounded]="true" severity="secondary" [outlined]="true" (click)="openCreateProveedor()" pTooltip="Crear nuevo proveedor" />
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
                                class="flex-1"
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

                    <!-- CAMPOS ESPECÍFICOS DE PROGRAMACIÓN -->
                    
                    <!-- Frecuencia -->
                    <div>
                        <label for="frecuencia" class="block font-bold mb-3">Frecuencia *</label>
                        <p-select 
                            id="frecuencia" 
                            [(ngModel)]="formData.frecuencia" 
                            [options]="frecuenciaOptions" 
                            optionLabel="label" 
                            optionValue="value"
                            placeholder="Seleccionar frecuencia"
                            fluid
                        />
                        @if (submitted() && !formData.frecuencia) {
                            <small class="text-red-500"> La frecuencia es requerida. </small>
                        }
                    </div>

                    <!-- Fecha de Ejecución -->
                    <div>
                        <label for="fechaEjecucion" class="block font-bold mb-3">Próxima Ejecución *</label>
                        <p-datepicker 
                            [(ngModel)]="formData.fechaEjecucion" 
                            dateFormat="dd/mm/yy" 
                            iconDisplay="input" 
                            [showTime]="true"
                            [showSeconds]="false"
                            hourFormat="24"
                            fluid 
                        />
                        @if (submitted() && !formData.fechaEjecucion) {
                            <small class="text-red-500"> La fecha de ejecución es requerida. </small>
                        }
                    </div>

                    <!-- Estado Activo -->
                    <div class="flex items-center gap-3">
                        <p-checkbox 
                            [(ngModel)]="formData.activo" 
                            [binary]="true" 
                            inputId="activo"
                        />
                        <label for="activo" class="font-bold">Activo (El gasto se ejecutará automáticamente)</label>
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

        <app-proveedor-create-modal [visible]="showProveedorCreateModal" (visibleChange)="showProveedorCreateModal = $event" (created)="onProveedorCreated($event)" (cancel)="showProveedorCreateModal = false" />

        <app-persona-create-modal [visible]="showPersonaCreateModal" (visibleChange)="showPersonaCreateModal = $event" (created)="onPersonaCreated($event)" (cancel)="showPersonaCreateModal = false" />
        
        <app-forma-pago-create-modal [visible]="showFormaPagoCreateModal" (visibleChange)="showFormaPagoCreateModal = $event" (created)="onFormaPagoCreated($event)" (cancel)="showFormaPagoCreateModal = false" />
        
        <app-cuenta-create-modal [visible]="showCuentaCreateModal" (visibleChange)="showCuentaCreateModal = $event" (created)="onCuentaCreated($event)" (cancel)="showCuentaCreateModal = false" />
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
export class GastoProgramadoFormModalComponent {
    private messageService = inject(MessageService);
    private conceptoStore = inject(ConceptoStore);
    private categoriaStore = inject(CategoriaStore);
    private proveedorStore = inject(ProveedorStore);
    private personaStore = inject(PersonaStore);
    private cuentaStore = inject(CuentaStore);
    private formaPagoStore = inject(FormaPagoStore);

    // Inputs/Outputs
    visible = input<boolean>(false);
    gastoProgramado = input<Partial<GastoProgramado> | null>(null);
    visibleChange = output<boolean>();
    save = output<Partial<GastoProgramado>>();
    cancel = output<void>();

    // Estado del formulario
    formData: GastoProgramadoFormData = {
        activo: true,
        frecuencia: 'MENSUAL'
    };
    submitted = signal(false);

    // Opciones de frecuencia
    frecuenciaOptions = [
        { label: 'Diario', value: 'DIARIO' },
        { label: 'Semanal', value: 'SEMANAL' },
        { label: 'Mensual', value: 'MENSUAL' },
        { label: 'Anual', value: 'ANUAL' }
    ];

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

    // Control de modales inline
    showConceptoCreateModal = false;
    showCategoriaCreateModal = false;
    showProveedorCreateModal = false;
    showPersonaCreateModal = false;
    showFormaPagoCreateModal = false;
    showCuentaCreateModal = false;

    constructor() {
        // Sincronizar visible con isVisible interno
        effect(() => {
            this.isVisible = this.visible();
        });

        // Cargar datos cuando cambia el gasto programado
        effect(() => {
            const gastoData = this.gastoProgramado();
            if (gastoData) {
                this.loadFormData();
            }
        });
    }

    isVisible = false;

    isEditMode = signal(false);

    private loadFormData() {
        const gastoData = this.gastoProgramado();

        if (gastoData?.id) {
            // Modo edición
            this.isEditMode.set(true);
            this.formData = {
                ...gastoData,
                fechaEjecucion: gastoData.fechaEjecucion ? new Date(gastoData.fechaEjecucion) : new Date()
            };

            // Cargar valores seleccionados en autocompletes
            this.selectedConcepto = gastoData.conceptoId && gastoData.conceptoNombre ? { id: gastoData.conceptoId, nombre: gastoData.conceptoNombre } : null;
            this.selectedCategoria = gastoData.categoriaId && gastoData.categoriaNombre ? { id: gastoData.categoriaId, nombre: gastoData.categoriaNombre } : null;
            this.selectedProveedor = gastoData.proveedorId && gastoData.proveedorNombre ? { id: gastoData.proveedorId, nombre: gastoData.proveedorNombre } : null;
            this.selectedPersona = gastoData.personaId && gastoData.personaNombre ? { id: gastoData.personaId, nombre: gastoData.personaNombre } : null;
            this.selectedCuenta = gastoData.cuentaId && gastoData.cuentaNombre ? { id: gastoData.cuentaId, nombre: gastoData.cuentaNombre } : null;
            this.selectedFormaPago = gastoData.formaPagoId && gastoData.formaPagoNombre ? { id: gastoData.formaPagoId, nombre: gastoData.formaPagoNombre } : null;
        } else {
            // Modo creación
            this.isEditMode.set(false);
            this.formData = {
                importe: 0,
                fechaEjecucion: new Date(),
                descripcion: '',
                frecuencia: 'MENSUAL',
                activo: true
            };
            this.selectedConcepto = null;
            this.selectedCategoria = null;
            this.selectedProveedor = null;
            this.selectedPersona = null;
            this.selectedCuenta = null;
            this.selectedFormaPago = null;
        }

        this.submitted.set(false);
    }

    // Métodos de búsqueda asíncrona
    searchConceptos(event: AutoCompleteCompleteEvent) {
        const query = event.query;
        const categoriaId = this.selectedCategoria?.id;

        if (!query || query.length < 2) {
            this.conceptoStore
                .getRecent(5, categoriaId)
                .then((conceptos) => this.filteredConceptos.set(conceptos))
                .catch((err) => {
                    console.error('Error cargando conceptos:', err);
                    this.filteredConceptos.set([]);
                });
        } else {
            this.conceptoStore
                .search(query, 10, categoriaId)
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
            this.categoriaStore
                .getRecent(5)
                .then((categorias) => this.filteredCategorias.set(categorias))
                .catch((err) => {
                    console.error('Error cargando categorías:', err);
                    this.filteredCategorias.set([]);
                });
        } else {
            this.categoriaStore
                .search(query, 10)
                .then((categorias) => this.filteredCategorias.set(categorias))
                .catch((err) => {
                    console.error('Error buscando categorías:', err);
                    this.filteredCategorias.set([]);
                });
        }
    }

    searchProveedores(event: AutoCompleteCompleteEvent) {
        const query = event.query;

        if (!query || query.length < 2) {
            this.proveedorStore
                .getRecent(5)
                .then((proveedores) => this.filteredProveedores.set(proveedores))
                .catch((err) => {
                    console.error('Error cargando proveedores:', err);
                    this.filteredProveedores.set([]);
                });
        } else {
            this.proveedorStore
                .search(query, 10)
                .then((proveedores) => this.filteredProveedores.set(proveedores))
                .catch((err) => {
                    console.error('Error buscando proveedores:', err);
                    this.filteredProveedores.set([]);
                });
        }
    }

    searchPersonas(event: AutoCompleteCompleteEvent) {
        const query = event.query;

        if (!query || query.length < 2) {
            this.personaStore
                .getRecent(5)
                .then((personas) => this.filteredPersonas.set(personas))
                .catch((err) => {
                    console.error('Error cargando personas:', err);
                    this.filteredPersonas.set([]);
                });
        } else {
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
            this.cuentaStore
                .getRecent(5)
                .then((cuentas) => this.filteredCuentas.set(cuentas))
                .catch((err) => {
                    console.error('Error cargando cuentas:', err);
                    this.filteredCuentas.set([]);
                });
        } else {
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
            this.formaPagoStore
                .getRecent(5)
                .then((formasPago) => this.filteredFormasPago.set(formasPago))
                .catch((err) => {
                    console.error('Error cargando formas de pago:', err);
                    this.filteredFormasPago.set([]);
                });
        } else {
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
    onConceptoSelect(event: any) {
        let value = event.value;
        this.formData.conceptoId = value.id;
        this.formData.conceptoNombre = value.nombre;

        if (value.categoriaId && value.categoriaNombre) {
            const categoriaAsociada: CatalogItem = {
                id: value.categoriaId,
                nombre: value.categoriaNombre
            };

            this.selectedCategoria = categoriaAsociada;
            this.formData.categoriaId = categoriaAsociada.id;
            this.formData.categoriaNombre = categoriaAsociada.nombre;

            this.messageService.add({ 
                severity: 'info', 
                summary: 'Categoría asignada automáticamente', 
                detail: value.categoriaNombre 
            });
        }
    }

    onCategoriaSelect(event: any) {
        this.formData.categoriaId = event.id;
        this.formData.categoriaNombre = event.nombre;

        this.selectedConcepto = null;
        this.formData.conceptoId = undefined;
        this.formData.conceptoNombre = undefined;
    }

    onProveedorSelect(event: any) {
        this.formData.proveedorId = event.id;
        this.formData.proveedorNombre = event.nombre;
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
        this.filteredConceptos.set([]);
    }

    onProveedorClear() {
        this.selectedProveedor = null;
        this.formData.proveedorId = undefined;
        this.formData.proveedorNombre = undefined;
        this.filteredProveedores.set([]);
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

    openCreateProveedor() {
        this.showProveedorCreateModal = true;
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

        const conceptoItem: CatalogItem = {
            id: nuevoConcepto.id,
            nombre: nuevoConcepto.nombre
        };

        this.selectedConcepto = conceptoItem;
        this.formData.conceptoId = conceptoItem.id;
        this.formData.conceptoNombre = conceptoItem.nombre;

        this.filteredConceptos.set([conceptoItem, ...this.filteredConceptos()]);

        this.messageService.add({
            severity: 'success',
            summary: 'Concepto creado',
            detail: `Concepto "${nuevoConcepto.nombre}" creado y seleccionado correctamente`
        });
    }

    onCategoriaCreated(nuevaCategoria: Categoria) {
        this.showCategoriaCreateModal = false;

        this.selectedCategoria = {
            id: nuevaCategoria.id,
            nombre: nuevaCategoria.nombre
        };
        this.formData.categoriaId = nuevaCategoria.id;
        this.formData.categoriaNombre = nuevaCategoria.nombre;

        this.filteredCategorias.set([this.selectedCategoria, ...this.filteredCategorias()]);

        this.messageService.add({
            severity: 'success',
            summary: 'Categoría creada',
            detail: `Categoría "${nuevaCategoria.nombre}" creada y seleccionada correctamente`
        });
    }

    onProveedorCreated(nuevoProveedor: Proveedor) {
        this.showProveedorCreateModal = false;

        const proveedorItem: CatalogItem = {
            id: nuevoProveedor.id,
            nombre: nuevoProveedor.nombre
        };

        this.selectedProveedor = proveedorItem;
        this.formData.proveedorId = proveedorItem.id;
        this.formData.proveedorNombre = proveedorItem.nombre;

        this.filteredProveedores.set([proveedorItem, ...this.filteredProveedores()]);

        this.messageService.add({
            severity: 'success',
            summary: 'Proveedor creado',
            detail: `Proveedor "${nuevoProveedor.nombre}" creado y seleccionado correctamente`
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

        const personaItem: CatalogItem = {
            id: nuevaPersona.id,
            nombre: nuevaPersona.nombre
        };

        this.selectedPersona = personaItem;
        this.formData.personaId = personaItem.id;
        this.formData.personaNombre = personaItem.nombre;

        this.filteredPersonas.set([personaItem, ...this.filteredPersonas()]);

        this.messageService.add({
            severity: 'success',
            summary: 'Persona creada',
            detail: `Persona "${nuevaPersona.nombre}" creada y seleccionada correctamente`
        });
    }

    onCuentaCreated(nuevaCuenta: Cuenta) {
        this.showCuentaCreateModal = false;

        const cuentaItem: CatalogItem = {
            id: nuevaCuenta.id,
            nombre: nuevaCuenta.nombre
        };

        this.selectedCuenta = cuentaItem;
        this.formData.cuentaId = cuentaItem.id;
        this.formData.cuentaNombre = cuentaItem.nombre;

        this.filteredCuentas.set([cuentaItem, ...this.filteredCuentas()]);

        this.messageService.add({
            severity: 'success',
            summary: 'Cuenta creada',
            detail: `Cuenta "${nuevaCuenta.nombre}" creada y seleccionada correctamente`
        });
    }

    onFormaPagoCreated(nuevaFormaPago: FormaPago) {
        this.showFormaPagoCreateModal = false;

        const formaPagoItem: CatalogItem = {
            id: nuevaFormaPago.id,
            nombre: nuevaFormaPago.nombre
        };

        this.selectedFormaPago = formaPagoItem;
        this.formData.formaPagoId = formaPagoItem.id;
        this.formData.formaPagoNombre = formaPagoItem.nombre;

        this.filteredFormasPago.set([formaPagoItem, ...this.filteredFormasPago()]);

        this.messageService.add({
            severity: 'success',
            summary: 'Forma de Pago creada',
            detail: `Forma de Pago "${nuevaFormaPago.nombre}" creada y seleccionada correctamente`
        });
    }

    onSave() {
        this.submitted.set(true);

        // Validaciones
        if (!this.selectedConcepto || 
            !this.formData.importe || 
            this.formData.importe <= 0 || 
            !this.selectedCuenta || 
            !this.selectedFormaPago || 
            !this.selectedPersona || 
            !this.selectedProveedor ||
            !this.formData.frecuencia ||
            !this.formData.fechaEjecucion) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Por favor complete todos los campos requeridos'
            });
            return;
        }

        // Preparar datos para guardar
        const gastoToSave: Partial<GastoProgramado> = {
            ...this.formData,
            conceptoId: this.selectedConcepto.id,
            conceptoNombre: this.selectedConcepto.nombre,
            categoriaId: this.selectedCategoria?.id || '',
            categoriaNombre: this.selectedCategoria?.nombre || '',
            proveedorId: this.selectedProveedor?.id || '',
            proveedorNombre: this.selectedProveedor?.nombre || '',
            personaId: this.selectedPersona?.id || '',
            personaNombre: this.selectedPersona?.nombre || '',
            cuentaId: this.selectedCuenta.id,
            cuentaNombre: this.selectedCuenta.nombre,
            formaPagoId: this.selectedFormaPago.id,
            formaPagoNombre: this.selectedFormaPago.nombre,
            fechaEjecucion: typeof this.formData.fechaEjecucion === 'string' 
                ? this.formData.fechaEjecucion 
                : new Date(this.formData.fechaEjecucion!).toISOString(),
            frecuencia: this.formData.frecuencia as Frecuencia,
            activo: this.formData.activo ?? true
        };

        this.save.emit(gastoToSave);
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
