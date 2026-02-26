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
import { IngresoProgramado } from '@/core/models/ingreso-programado.model';

// Stores
import { ClienteStore } from '@/features/clientes/store/cliente.store';
import { FormaPagoStore } from '@/features/formas-pago/store/forma-pago.store';
import { CuentaStore } from '@/features/cuentas/store/cuenta.store';
import { ConceptoStore } from '@/features/conceptos/store/concepto.store';
import { CategoriaStore } from '@/features/categorias/store/categoria.store';
import { PersonaStore } from '@/features/personas/store/persona.store';
import { ToastModule } from 'primeng/toast';

interface CatalogItem {
    id: string;
    nombre: string;
}

// Interfaz para el formulario: Omitimos fechaEjecucion original (string) para usar Date
interface IngresoProgramadoFormData extends Omit<Partial<IngresoProgramado>, 'fechaEjecucion'> {
    fechaEjecucion?: Date | null;
}

@Component({
    selector: 'app-ingreso-programado-form-modal',
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
        ToastModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-toast position="top-right" />
        <p-drawer 
            [(visible)]="isVisible" 
            position="right" 
            [style]="{ width: '600px', maxWidth: '100vw' }" 
            [modal]="true" 
            [blockScroll]="true"
            (onHide)="onCancel()" 
            styleClass="p-sidebar-md surface-ground">
            
            <ng-template pTemplate="header">
                <div class="flex align-items-center gap-2">
                    <span class="font-bold text-xl text-900">{{ isEditMode() ? 'Editar Ingreso Programado' : 'Nuevo Ingreso Programado' }}</span>
                </div>
            </ng-template>

            <div class="grid grid-cols-12 gap-4 p-fluid py-2">
                <div class="col-span-12 field">
                    <label for="concepto" class="font-semibold text-gray-700 block mb-2">Concepto *</label>
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
                    <label for="importe" class="font-semibold text-gray-700 block mb-2">Importe *</label>
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
                        <small class="text-red-500 block mt-1">Requerido.</small>
                    }
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label for="fechaEjecucion" class="font-semibold text-gray-700 block mb-2">Fecha y Hora de Ejecución *</label>
                    <p-datePicker 
                        [(ngModel)]="formData.fechaEjecucion" 
                        dateFormat="dd/mm/yy" 
                        [showIcon]="true" 
                        [showTime]="true" 
                        hourFormat="24" 
                        appendTo="body" 
                        styleClass="w-full" 
                        class="w-full" 
                    />
                    @if (!formData.fechaEjecucion) {
                        <small class="text-gray-500">Fecha y hora en la que se generará el movimiento.</small>
                    }
                </div>

                <div class="col-span-12 mt-4">
                    <h5 class="text-xs font-bold text-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-2">Configuración de Recurrencia</h5>
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label class="font-medium text-gray-700 block mb-2 text-sm">Frecuencia *</label>
                    <p-select
                        [options]="frecuencias"
                        [(ngModel)]="formData.frecuencia"
                        placeholder="Selecciona frecuencia"
                        class="w-full"
                        styleClass="w-full"
                        [showClear]="true">
                    </p-select>
                    @if (submitted() && !formData.frecuencia) {
                        <small class="text-red-500 block mt-1">Requerida.</small>
                    }
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label for="activo" class="font-medium text-gray-700 block mb-2 text-sm">Estado</label>
                    <div class="flex items-center gap-2 h-10">
                        <p-toggleswitch [(ngModel)]="formData.activo" inputId="activo"></p-toggleswitch>
                        <label for="activo" class="text-sm font-medium text-gray-700 cursor-pointer">{{ formData.activo ? 'Activo' : 'Inactivo' }}</label>
                    </div>
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
                    @if (newCategoriaMessage()) {
                        <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newCategoriaMessage() }}</small>
                    }
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label class="font-medium text-gray-700 block mb-2 text-sm">Forma de Pago *</label>
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
                        class="w-full"
                        styleClass="w-full"
                    />
                    @if (submitted() && !selectedFormaPago) {
                        <small class="text-red-500 block mt-1">Requerida.</small>
                    }
                    @if (newFormaPagoMessage()) {
                        <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newFormaPagoMessage() }}</small>
                    }
                </div>

                <div class="col-span-12 field">
                    <label class="font-medium text-gray-700 block mb-2 text-sm">Cuenta de Destino *</label>
                    <p-autoComplete
                        [(ngModel)]="selectedCuenta"
                        [suggestions]="filteredCuentas()"
                        (completeMethod)="searchCuentas($event)"
                        optionLabel="nombre"
                        [dropdown]="true"
                        placeholder="Seleccionar cuenta bancaria / caja..."
                        [forceSelection]="false"
                        [showEmptyMessage]="false"
                        [showClear]="true"
                        (onClear)="onCuentaClear()"
                        (onSelect)="onCuentaSelect($event)"
                        (onBlur)="onCuentaBlur()"
                        class="w-full"
                        styleClass="w-full"
                    />
                    @if (submitted() && !selectedCuenta) {
                        <small class="text-red-500 block mt-1">Requerida.</small>
                    }
                    @if (newCuentaMessage()) {
                        <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newCuentaMessage() }}</small>
                    }
                </div>

                <div class="col-span-12 mt-4">
                    <h5 class="text-xs font-bold text-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-2">Terceros</h5>
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label class="font-medium text-gray-700 block mb-2 text-sm">Cliente</label>
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
                        class="w-full"
                        styleClass="w-full"
                    />
                    @if (newClienteMessage()) {
                        <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newClienteMessage() }}</small>
                    }
                </div>

                <div class="col-span-12 md:col-span-6 field">
                    <label class="font-medium text-gray-700 block mb-2 text-sm">Persona</label>
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
                        class="w-full"
                        styleClass="w-full"
                    />
                    @if (newPersonaMessage()) {
                        <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newPersonaMessage() }}</small>
                    }
                </div>

                <div class="col-span-12 field">
                    <label for="descripcion" class="font-medium text-gray-700 block mb-2 text-sm">Descripción / Notas</label>
                    <textarea id="descripcion" pTextarea [(ngModel)]="formData.descripcion" rows="3" class="w-full" placeholder="Añadir detalles adicionales..."></textarea>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-end gap-2 border-top-1 surface-border pt-3">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" [rounded]="true" severity="secondary" (onClick)="onCancel()" />
                    <p-button label="{{ isEditMode() ? 'Actualizar' : 'Guardar' }}" icon="pi pi-check" [rounded]="true" severity="primary" (onClick)="onSave()" />
                </div>
            </ng-template>
        </p-drawer>


    `,
    styles: [`
        :host ::ng-deep {
            .p-sidebar { background: #f8f9fa; }
            .p-autocomplete { width: 100%; }
            .p-inputgroup button { flex-shrink: 0; }
            .p-datepicker { width: 100%; }
            /* Asegura que el p-select ocupe el ancho correcto */
            .p-select { width: 100%; }
        }
    `]
})
export class IngresoProgramadoFormModalComponent {
    private messageService = inject(MessageService);
    private conceptoStore = inject(ConceptoStore);
    private categoriaStore = inject(CategoriaStore);
    private clienteStore = inject(ClienteStore);
    private personaStore = inject(PersonaStore);
    private cuentaStore = inject(CuentaStore);
    private formaPagoStore = inject(FormaPagoStore);

    // Inputs/Outputs
    visible = input<boolean>(false);
    ingresoProgramado = input<Partial<IngresoProgramado> | null>(null);
    save = output<Partial<IngresoProgramado>>();
    cancel = output<void>();

    // Estado
    isVisible = false;
    isEditMode = signal(false);
    submitted = signal(false);

    // Inicializamos con un Date para que el datepicker no falle
    formData: IngresoProgramadoFormData = { activo: true, fechaEjecucion: new Date() };

    // Opciones estáticas
    frecuencias = [
        { label: 'Diario', value: 'DIARIO' },
        { label: 'Semanal', value: 'SEMANAL' },
        { label: 'Mensual', value: 'MENSUAL' },
        { label: 'Anual', value: 'ANUAL' }
    ];

    // Selectores asíncronos (sin cambios en la lógica)
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
    newCuentaMessage = signal<string>('');

    // Flags para evitar validación en blur después de selección
    private skipNextConceptoBlur = false;
    private skipNextCategoriaBlur = false;
    private skipNextFormaPagoBlur = false;
    private skipNextClienteBlur = false;
    private skipNextPersonaBlur = false;
    private skipNextCuentaBlur = false;

    constructor() {
        effect(() => {
            this.isVisible = this.visible();
        });

        effect(() => {
            const data = this.ingresoProgramado();
            if (data) {
                this.loadFormData();
            }
        });
    }

    private loadFormData() {
        const data = this.ingresoProgramado();

        if (data?.id) {
            this.isEditMode.set(true);
            this.formData = {
                ...data,
                // Conversión clave: string (ISO) -> Date object para el componente
                fechaEjecucion: data.fechaEjecucion ? new Date(data.fechaEjecucion) : new Date()
            };

            this.selectedConcepto = data.conceptoId && data.conceptoNombre ? { id: data.conceptoId, nombre: data.conceptoNombre } : null;
            this.selectedCategoria = data.categoriaId && data.categoriaNombre ? { id: data.categoriaId, nombre: data.categoriaNombre } : null;
            this.selectedCliente = data.clienteId && data.clienteNombre ? { id: data.clienteId, nombre: data.clienteNombre } : null;
            this.selectedPersona = data.personaId && data.personaNombre ? { id: data.personaId, nombre: data.personaNombre } : null;
            this.selectedCuenta = data.cuentaId && data.cuentaNombre ? { id: data.cuentaId, nombre: data.cuentaNombre } : null;
            this.selectedFormaPago = data.formaPagoId && data.formaPagoNombre ? { id: data.formaPagoId, nombre: data.formaPagoNombre } : null;
        } else {
            this.isEditMode.set(false);
            this.formData = {
                importe: undefined,
                activo: true,
                frecuencia: 'MENSUAL',
                fechaEjecucion: new Date(),
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
        this.newCuentaMessage.set('');
    }

    // --- Search Logic (Generic) ---
    private genericSearch(store: any, event: any, signalUpdater: any) {
        const query = event.query;
        if (!query || query.length < 2) {
            store.getRecent(5).then((d: any) => signalUpdater.set(d)).catch(() => signalUpdater.set([]));
        } else {
            store.search(query, 10).then((d: any) => signalUpdater.set(d)).catch(() => signalUpdater.set([]));
        }
    }

    searchConceptos(event: AutoCompleteCompleteEvent) {
        const query = event.query;
        const categoriaId = this.selectedCategoria?.id;
        if (!query || query.length < 2) {
            this.conceptoStore.getRecent(5, categoriaId).then((d: CatalogItem[]) => this.filteredConceptos.set(d)).catch(() => this.filteredConceptos.set([]));
        } else {
            this.conceptoStore.search(query, 10, categoriaId).then((d: CatalogItem[]) => this.filteredConceptos.set(d)).catch(() => this.filteredConceptos.set([]));
        }
    }

    searchCategorias(event: AutoCompleteCompleteEvent) { this.genericSearch(this.categoriaStore, event, this.filteredCategorias); }
    searchClientes(event: AutoCompleteCompleteEvent) { this.genericSearch(this.clienteStore, event, this.filteredClientes); }
    searchPersonas(event: AutoCompleteCompleteEvent) { this.genericSearch(this.personaStore, event, this.filteredPersonas); }
    searchCuentas(event: AutoCompleteCompleteEvent) { this.genericSearch(this.cuentaStore, event, this.filteredCuentas); }
    searchFormasPago(event: AutoCompleteCompleteEvent) { this.genericSearch(this.formaPagoStore, event, this.filteredFormasPago); }

    // --- Selecciones ---
    onConceptoSelect(event: any) {
        this.skipNextConceptoBlur = true;
        const value = event.value;
        this.formData.conceptoId = value.id;
        this.formData.conceptoNombre = value.nombre;
        this.newConceptoMessage.set('');
        if (value.categoriaId && value.categoriaNombre) {
            const cat = { id: value.categoriaId, nombre: value.categoriaNombre };
            this.selectedCategoria = cat;
            this.formData.categoriaId = cat.id;
            this.formData.categoriaNombre = cat.nombre;
            this.newCategoriaMessage.set('');
            this.messageService.add({ severity: 'info', summary: 'Info', detail: `Categoría ${value.categoriaNombre} asignada` });
        }
    }

    onConceptoBlur() {
        setTimeout(() => {
            if (this.skipNextConceptoBlur) { this.skipNextConceptoBlur = false; return; }
            if (typeof this.selectedConcepto === 'string' && (this.selectedConcepto as string).trim()) {
                const nombre = (this.selectedConcepto as string).trim();
                if (!this.filteredConceptos().some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
                    this.selectedConcepto = { id: '', nombre };
                    this.formData.conceptoId = undefined;
                    this.formData.conceptoNombre = nombre;
                    this.newConceptoMessage.set(`Se creará el concepto "${nombre}" automáticamente al guardar.`);
                    this.messageService.add({ severity: 'info', summary: 'Concepto no encontrado', detail: `El concepto "${nombre}" no existe, se creará automáticamente al guardar.` });
                }
            }
        }, 200);
    }

    onCategoriaSelect(event: any) {
        this.skipNextCategoriaBlur = true;
        this.formData.categoriaId = event.id;
        this.formData.categoriaNombre = event.nombre;
        this.newCategoriaMessage.set('');
        this.selectedConcepto = null;
        this.formData.conceptoId = undefined;
        this.formData.conceptoNombre = undefined;
        this.newConceptoMessage.set('');
    }

    onCategoriaBlur() {
        setTimeout(() => {
            if (this.skipNextCategoriaBlur) { this.skipNextCategoriaBlur = false; return; }
            if (typeof this.selectedCategoria === 'string' && (this.selectedCategoria as string).trim()) {
                const nombre = (this.selectedCategoria as string).trim();
                if (!this.filteredCategorias().some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
                    this.selectedCategoria = { id: '', nombre };
                    this.formData.categoriaId = undefined;
                    this.formData.categoriaNombre = nombre;
                    this.newCategoriaMessage.set(`Se creará la categoría "${nombre}" automáticamente al guardar.`);
                    this.messageService.add({ severity: 'info', summary: 'Categoría no encontrada', detail: `La categoría "${nombre}" no existe, se creará automáticamente al guardar.` });
                }
            }
        }, 200);
    }

    onClienteSelect(event: any) {
        this.skipNextClienteBlur = true;
        this.formData.clienteId = event.id; this.formData.clienteNombre = event.nombre;
        this.newClienteMessage.set('');
    }

    onClienteBlur() {
        setTimeout(() => {
            if (this.skipNextClienteBlur) { this.skipNextClienteBlur = false; return; }
            if (typeof this.selectedCliente === 'string' && (this.selectedCliente as string).trim()) {
                const nombre = (this.selectedCliente as string).trim();
                if (!this.filteredClientes().some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
                    this.selectedCliente = { id: '', nombre };
                    this.formData.clienteId = undefined;
                    this.formData.clienteNombre = nombre;
                    this.newClienteMessage.set(`Se creará el cliente "${nombre}" automáticamente al guardar.`);
                    this.messageService.add({ severity: 'info', summary: 'Cliente no encontrado', detail: `El cliente "${nombre}" no existe, se creará automáticamente al guardar.` });
                }
            }
        }, 200);
    }

    onPersonaSelect(event: any) {
        this.skipNextPersonaBlur = true;
        this.formData.personaId = event.id; this.formData.personaNombre = event.nombre;
        this.newPersonaMessage.set('');
    }

    onPersonaBlur() {
        setTimeout(() => {
            if (this.skipNextPersonaBlur) { this.skipNextPersonaBlur = false; return; }
            if (typeof this.selectedPersona === 'string' && (this.selectedPersona as string).trim()) {
                const nombre = (this.selectedPersona as string).trim();
                if (!this.filteredPersonas().some(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
                    this.selectedPersona = { id: '', nombre };
                    this.formData.personaId = undefined;
                    this.formData.personaNombre = nombre;
                    this.newPersonaMessage.set(`Se creará la persona "${nombre}" automáticamente al guardar.`);
                    this.messageService.add({ severity: 'info', summary: 'Persona no encontrada', detail: `La persona "${nombre}" no existe, se creará automáticamente al guardar.` });
                }
            }
        }, 200);
    }

    onCuentaSelect(event: any) {
        this.skipNextCuentaBlur = true;
        this.formData.cuentaId = event.id; this.formData.cuentaNombre = event.nombre;
        this.newCuentaMessage.set('');
    }

    onCuentaBlur() {
        setTimeout(() => {
            if (this.skipNextCuentaBlur) { this.skipNextCuentaBlur = false; return; }
            if (typeof this.selectedCuenta === 'string' && (this.selectedCuenta as string).trim()) {
                const nombre = (this.selectedCuenta as string).trim();
                if (!this.filteredCuentas().some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
                    this.selectedCuenta = { id: '', nombre };
                    this.formData.cuentaId = undefined;
                    this.formData.cuentaNombre = nombre;
                    this.newCuentaMessage.set(`Se creará la cuenta "${nombre}" automáticamente al guardar.`);
                    this.messageService.add({ severity: 'info', summary: 'Cuenta no encontrada', detail: `La cuenta "${nombre}" no existe, se creará automáticamente al guardar.` });
                }
            }
        }, 200);
    }

    onFormaPagoSelect(event: any) {
        this.skipNextFormaPagoBlur = true;
        this.formData.formaPagoId = event.id; this.formData.formaPagoNombre = event.nombre;
        this.newFormaPagoMessage.set('');
    }

    onFormaPagoBlur() {
        setTimeout(() => {
            if (this.skipNextFormaPagoBlur) { this.skipNextFormaPagoBlur = false; return; }
            if (typeof this.selectedFormaPago === 'string' && (this.selectedFormaPago as string).trim()) {
                const nombre = (this.selectedFormaPago as string).trim();
                if (!this.filteredFormasPago().some(f => f.nombre.toLowerCase() === nombre.toLowerCase())) {
                    this.selectedFormaPago = { id: '', nombre };
                    this.formData.formaPagoId = undefined;
                    this.formData.formaPagoNombre = nombre;
                    this.newFormaPagoMessage.set(`Se creará la forma de pago "${nombre}" automáticamente al guardar.`);
                    this.messageService.add({ severity: 'info', summary: 'Forma de pago no encontrada', detail: `La forma de pago "${nombre}" no existe, se creará automáticamente al guardar.` });
                }
            }
        }, 200);
    }

    onConceptoClear() { this.selectedConcepto = null; this.formData.conceptoId = undefined; this.newConceptoMessage.set(''); }
    onCategoriaClear() { this.selectedCategoria = null; this.formData.categoriaId = undefined; this.newCategoriaMessage.set(''); }
    onCuentaClear() { this.selectedCuenta = null; this.formData.cuentaId = undefined; this.newCuentaMessage.set(''); }

    getConceptoPlaceholder(): string {
        return this.selectedCategoria ? `Buscar en ${this.selectedCategoria.nombre}...` : 'Buscar concepto...';
    }

    onSave() {
        this.submitted.set(true);

        if (!this.selectedConcepto || !this.formData.importe || !this.formData.frecuencia ||
            !this.selectedCuenta || !this.selectedFormaPago || !this.formData.fechaEjecucion) {
            this.messageService.add({ severity: 'warn', summary: 'Incompleto', detail: 'Revise los campos requeridos (*)' });
            return;
        }

        const fecha = this.formData.fechaEjecucion instanceof Date
            ? this.formData.fechaEjecucion
            : new Date();

        // Restamos el offset local (en milisegundos) para compensar la conversión a UTC
        const fechaLocal = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000));

        // Convertimos a ISO y cortamos los primeros 19 caracteres (YYYY-MM-DDTHH:mm:ss)
        const fechaEjecucionStr = fechaLocal.toISOString().slice(0, 19);
        const toSave: Partial<IngresoProgramado> = {
            ...this.formData,
            // IDs y Nombres
            conceptoId: this.selectedConcepto.id || '00000000-0000-0000-0000-000000000000',
            conceptoNombre: this.selectedConcepto.nombre,
            categoriaId: this.selectedCategoria?.id || '00000000-0000-0000-0000-000000000000',
            categoriaNombre: this.selectedCategoria?.nombre || '',
            clienteId: this.selectedCliente?.id || null,
            clienteNombre: this.selectedCliente?.nombre || null,
            personaId: this.selectedPersona?.id || null,
            personaNombre: this.selectedPersona?.nombre || null,
            cuentaId: this.selectedCuenta.id || '00000000-0000-0000-0000-000000000000',
            cuentaNombre: this.selectedCuenta.nombre,
            formaPagoId: this.selectedFormaPago.id || '00000000-0000-0000-0000-000000000000',
            formaPagoNombre: this.selectedFormaPago.nombre,
            descripcion: this.formData.descripcion || null,


            // Conversión inversa: Date object -> String (ISO completo) para el backend
            fechaEjecucion: fechaEjecucionStr
        };

        this.save.emit(toSave);
        this.closeModal();
    }

    onCancel() { this.cancel.emit(); this.closeModal(); }

    private closeModal() {
        this.isVisible = false;
        this.submitted.set(false);
    }
}