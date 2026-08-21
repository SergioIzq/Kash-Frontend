import { Component, inject, input, output, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule, MultiSelectFilterEvent, MultiSelectLazyLoadEvent } from 'primeng/multiselect';
import { ConceptoService } from '@/core/services/api/concepto.service';
import { CategoriaService } from '@/core/services/api/categoria.service';
import { ProveedorService } from '@/core/services/api/proveedor.service';
import { ClienteService } from '@/core/services/api/cliente.service';
import { PersonaService } from '@/core/services/api/persona.service';
import { CatalogItem, CargadorCatalogoScroll } from '@/shared/utils/catalogo-scroll.util';
import { ExportarExcelFiltros } from '@/core/models/exportar-excel-filtros.model';

export type { ExportarExcelFiltros };

/**
 * Diálogo de exportación a Excel compartido por los listados de Gastos e Ingresos: filtros
 * opcionales y combinables (fecha, concepto, categoría, proveedor/cliente, persona, búsqueda
 * actual de la tabla). El propio diálogo solo arma el objeto de filtros y lo emite por
 * `(exportar)`; la página consumidora hace la llamada HTTP y decide cuándo cerrar el diálogo
 * (`visible = false`) o mantenerlo abierto si la exportación falla.
 */
@Component({
    selector: 'app-exportar-excel-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, CheckboxModule, DatePickerModule, MultiSelectModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-dialog [(visible)]="isVisible" [style]="{ width: '520px' }" header="Exportar a Excel" [modal]="true" [contentStyle]="{ padding: '1.5rem' }" (onHide)="onCancel()" styleClass="p-fluid">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    @if (searchTermActual()) {
                        <div class="flex align-items-center gap-2">
                            <p-checkbox [binary]="true" inputId="usarBusquedaActual" [(ngModel)]="usarBusquedaActual" />
                            <label for="usarBusquedaActual" class="text-sm">
                                Usar la búsqueda actual de la tabla: <strong>"{{ searchTermActual() }}"</strong>
                            </label>
                        </div>
                    }

                    <div class="flex flex-col gap-2">
                        <label class="font-medium text-gray-700 text-sm">Rango de fechas</label>
                        <p-datePicker [ngModel]="rango()" (ngModelChange)="rango.set($event)" selectionMode="range" dateFormat="dd/mm/yy" [showIcon]="true" [numberOfMonths]="2" [readonlyInput]="true" placeholder="Todo el histórico" appendTo="body" styleClass="w-full" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium text-gray-700 text-sm">Categoría(s)</label>
                        <p-multiSelect
                            [(ngModel)]="selectedCategorias"
                            [options]="filteredCategorias()"
                            optionLabel="nombre"
                            dataKey="id"
                            display="chip"
                            [filter]="true"
                            (onFilter)="onCategoriaFilter($event)"
                            [lazy]="true"
                            [virtualScroll]="true"
                            [virtualScrollItemSize]="38"
                            (onLazyLoad)="onCategoriaLazyLoad($event)"
                            placeholder="Todas las categorías"
                            appendTo="body"
                            styleClass="w-full"
                        />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium text-gray-700 text-sm">Concepto(s)</label>
                        <p-multiSelect
                            [(ngModel)]="selectedConceptos"
                            [options]="filteredConceptos()"
                            optionLabel="nombre"
                            dataKey="id"
                            display="chip"
                            [filter]="true"
                            (onFilter)="onConceptoFilter($event)"
                            [lazy]="true"
                            [virtualScroll]="true"
                            [virtualScrollItemSize]="38"
                            (onLazyLoad)="onConceptoLazyLoad($event)"
                            placeholder="Todos los conceptos"
                            appendTo="body"
                            styleClass="w-full"
                        />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium text-gray-700 text-sm">{{ tercerosLabel() }}</label>
                        <p-multiSelect
                            [(ngModel)]="selectedTerceros"
                            [options]="filteredTerceros()"
                            optionLabel="nombre"
                            dataKey="id"
                            display="chip"
                            [filter]="true"
                            (onFilter)="onTerceroFilter($event)"
                            [lazy]="true"
                            [virtualScroll]="true"
                            [virtualScrollItemSize]="38"
                            (onLazyLoad)="onTerceroLazyLoad($event)"
                            [placeholder]="'Todos' + (tipo() === 'gasto' ? ' los proveedores' : ' los clientes')"
                            appendTo="body"
                            styleClass="w-full"
                        />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-medium text-gray-700 text-sm">Persona(s)</label>
                        <p-multiSelect
                            [(ngModel)]="selectedPersonas"
                            [options]="filteredPersonas()"
                            optionLabel="nombre"
                            dataKey="id"
                            display="chip"
                            [filter]="true"
                            (onFilter)="onPersonaFilter($event)"
                            [lazy]="true"
                            [virtualScroll]="true"
                            [virtualScrollItemSize]="38"
                            (onLazyLoad)="onPersonaLazyLoad($event)"
                            placeholder="Todas las personas"
                            appendTo="body"
                            styleClass="w-full"
                        />
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="onCancel()" [disabled]="exportando()" />
                <p-button label="Exportar" icon="pi pi-file-excel" (click)="onExportar()" [loading]="exportando()" />
            </ng-template>
        </p-dialog>
    `
})
export class ExportarExcelDialogComponent {
    tipo = input.required<'gasto' | 'ingreso'>();
    visible = input<boolean>(false);
    visibleChange = output<boolean>();
    searchTermActual = input<string>('');
    exportando = input<boolean>(false);
    exportar = output<ExportarExcelFiltros>();

    private readonly conceptoService = inject(ConceptoService);
    private readonly categoriaService = inject(CategoriaService);
    private readonly proveedorService = inject(ProveedorService);
    private readonly clienteService = inject(ClienteService);
    private readonly personaService = inject(PersonaService);

    isVisible = false;

    rango = signal<Date[] | null>(null);
    usarBusquedaActual = signal(false);

    selectedCategorias: CatalogItem[] = [];
    selectedConceptos: CatalogItem[] = [];
    selectedTerceros: CatalogItem[] = [];
    selectedPersonas: CatalogItem[] = [];

    filteredCategorias = signal<CatalogItem[]>([]);
    filteredConceptos = signal<CatalogItem[]>([]);
    filteredTerceros = signal<CatalogItem[]>([]);
    filteredPersonas = signal<CatalogItem[]>([]);

    tercerosLabel = computed(() => (this.tipo() === 'gasto' ? 'Proveedor(es)' : 'Cliente(s)'));

    private readonly categoriaScroll = new CargadorCatalogoScroll<CatalogItem>((page, pageSize) => this.categoriaService.getCategorias(page, pageSize, '', 'nombre', 'asc'));
    private readonly conceptoScroll = new CargadorCatalogoScroll<CatalogItem>((page, pageSize) => this.conceptoService.getConceptos(page, pageSize, '', 'nombre', 'asc'));
    private readonly terceroScroll = new CargadorCatalogoScroll<CatalogItem>((page, pageSize) =>
        this.tipo() === 'gasto' ? this.proveedorService.getProveedores(page, pageSize, '', 'nombre', 'asc') : this.clienteService.getClientes(page, pageSize, '', 'nombre', 'asc')
    );
    private readonly personaScroll = new CargadorCatalogoScroll<CatalogItem>((page, pageSize) => this.personaService.getPersonas(page, pageSize, '', 'nombre', 'asc'));

    constructor() {
        effect(() => {
            this.isVisible = this.visible();
            if (this.visible()) {
                this.resetFiltros();
            }
        });
    }

    private resetFiltros(): void {
        this.rango.set(null);
        this.usarBusquedaActual.set(false);
        this.selectedCategorias = [];
        this.selectedConceptos = [];
        this.selectedTerceros = [];
        this.selectedPersonas = [];
        this.filteredCategorias.set([]);
        this.filteredConceptos.set([]);
        this.filteredTerceros.set([]);
        this.filteredPersonas.set([]);
        this.categoriaScroll.reset();
        this.conceptoScroll.reset();
        this.terceroScroll.reset();
        this.personaScroll.reset();
    }

    // --- Categoría ---
    onCategoriaFilter(event: MultiSelectFilterEvent): void {
        const texto = (event.filter ?? '').toString().trim();
        this.categoriaScroll.reset();
        if (texto.length < 2) {
            this.filteredCategorias.set([]);
            return;
        }
        this.categoriaService.search(texto, 20).subscribe({
            next: (result) => this.filteredCategorias.set(result.value ?? []),
            error: () => this.filteredCategorias.set([])
        });
    }

    onCategoriaLazyLoad(event: MultiSelectLazyLoadEvent): void {
        this.categoriaScroll.cargarPagina(event, this.filteredCategorias()).then((resultado) => {
            if (resultado) this.filteredCategorias.set(resultado);
        });
    }

    // --- Concepto ---
    onConceptoFilter(event: MultiSelectFilterEvent): void {
        const texto = (event.filter ?? '').toString().trim();
        this.conceptoScroll.reset();
        if (texto.length < 2) {
            this.filteredConceptos.set([]);
            return;
        }
        this.conceptoService.search(texto, 20).subscribe({
            next: (result) => this.filteredConceptos.set(result.value ?? []),
            error: () => this.filteredConceptos.set([])
        });
    }

    onConceptoLazyLoad(event: MultiSelectLazyLoadEvent): void {
        this.conceptoScroll.cargarPagina(event, this.filteredConceptos()).then((resultado) => {
            if (resultado) this.filteredConceptos.set(resultado);
        });
    }

    // --- Tercero (Proveedor en Gastos / Cliente en Ingresos) ---
    onTerceroFilter(event: MultiSelectFilterEvent): void {
        const texto = (event.filter ?? '').toString().trim();
        this.terceroScroll.reset();
        if (texto.length < 2) {
            this.filteredTerceros.set([]);
            return;
        }
        const busqueda$ = this.tipo() === 'gasto' ? this.proveedorService.search(texto, 20) : this.clienteService.search(texto, 20);
        busqueda$.subscribe({
            next: (result) => this.filteredTerceros.set(result.value ?? []),
            error: () => this.filteredTerceros.set([])
        });
    }

    onTerceroLazyLoad(event: MultiSelectLazyLoadEvent): void {
        this.terceroScroll.cargarPagina(event, this.filteredTerceros()).then((resultado) => {
            if (resultado) this.filteredTerceros.set(resultado);
        });
    }

    // --- Persona ---
    onPersonaFilter(event: MultiSelectFilterEvent): void {
        const texto = (event.filter ?? '').toString().trim();
        this.personaScroll.reset();
        if (texto.length < 2) {
            this.filteredPersonas.set([]);
            return;
        }
        this.personaService.search(texto, 20).subscribe({
            next: (result) => this.filteredPersonas.set(result.value ?? []),
            error: () => this.filteredPersonas.set([])
        });
    }

    onPersonaLazyLoad(event: MultiSelectLazyLoadEvent): void {
        this.personaScroll.cargarPagina(event, this.filteredPersonas()).then((resultado) => {
            if (resultado) this.filteredPersonas.set(resultado);
        });
    }

    onCancel(): void {
        this.isVisible = false;
        this.visibleChange.emit(false);
    }

    onExportar(): void {
        const [fechaInicio, fechaFin] = this.rango() ?? [null, null];

        const filtros: ExportarExcelFiltros = {
            fechaInicio: fechaInicio ? this.toIsoDate(fechaInicio) : undefined,
            fechaFin: fechaFin ? this.toIsoDate(fechaFin) : undefined,
            searchTerm: this.usarBusquedaActual() && this.searchTermActual() ? this.searchTermActual() : undefined,
            categoriaIds: this.selectedCategorias.length ? this.selectedCategorias.map((c) => c.id) : undefined,
            conceptoIds: this.selectedConceptos.length ? this.selectedConceptos.map((c) => c.id) : undefined,
            personaIds: this.selectedPersonas.length ? this.selectedPersonas.map((p) => p.id) : undefined
        };

        if (this.tipo() === 'gasto') {
            filtros.proveedorIds = this.selectedTerceros.length ? this.selectedTerceros.map((t) => t.id) : undefined;
        } else {
            filtros.clienteIds = this.selectedTerceros.length ? this.selectedTerceros.map((t) => t.id) : undefined;
        }

        this.exportar.emit(filtros);
    }

    private toIsoDate(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}
