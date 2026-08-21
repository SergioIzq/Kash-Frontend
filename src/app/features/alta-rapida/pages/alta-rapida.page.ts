import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteLazyLoadEvent } from 'primeng/autocomplete';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { MoneyInputComponent, TransaccionesHabitualesChipsComponent, TransaccionHabitualSeleccionada, CerrarTecladoBotonComponent } from '@/shared/components';

import { GastoService } from '@/core/services/api/gasto.service';
import { IngresoService } from '@/core/services/api/ingreso.service';
import { ConceptoService } from '@/core/services/api/concepto.service';
import { CategoriaService } from '@/core/services/api/categoria.service';
import { CuentaService } from '@/core/services/api/cuenta.service';
import { FormaPagoService } from '@/core/services/api/forma-pago.service';
import { ProveedorService } from '@/core/services/api/proveedor.service';
import { ClienteService } from '@/core/services/api/cliente.service';
import { PersonaService } from '@/core/services/api/persona.service';
import { GastosStore } from '@/features/gastos/stores/gastos.store';
import { IngresosStore } from '@/features/ingresos/stores/ingresos.store';
import { ConceptoStore } from '@/features/conceptos/store/concepto.store';
import { CategoriaStore } from '@/features/categorias/store/categoria.store';
import { CuentaStore } from '@/features/cuentas/store/cuenta.store';
import { FormaPagoStore } from '@/features/formas-pago/store/forma-pago.store';
import { ProveedorStore } from '@/features/proveedores/store/proveedor.store';
import { ClienteStore } from '@/features/clientes/store/cliente.store';
import { PersonaStore } from '@/features/personas/store/persona.store';
import { GastoCreate, IngresoCreate } from '@/core/models';

// Catálogo completo con scroll perezoso + botón "cerrar teclado" en el header del desplegable
import { CatalogItem, CargadorCatalogoScroll } from '@/shared/utils/catalogo-scroll.util';

type Tipo = 'gasto' | 'ingreso';

@Component({
    selector: 'app-alta-rapida-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, SelectButtonModule, AutoCompleteModule, DatePickerModule, TooltipModule, MoneyInputComponent, TransaccionesHabitualesChipsComponent, CerrarTecladoBotonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        `
            .alta-rapida-card {
                max-width: 42rem;
                margin: 0 auto;
            }

            /* Selector Gasto/Ingreso a ancho completo, botones repartidos a partes iguales */
            :host ::ng-deep .tipo-selector .p-selectbutton {
                display: flex;
                width: 100%;
            }
            :host ::ng-deep .tipo-selector .p-togglebutton {
                flex: 1 1 auto;
                justify-content: center;
            }

            .resumen-colapsado {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.75rem;
            }
            .resumen-colapsado .resumen-texto {
                word-break: break-word;
            }

            .acciones-footer {
                display: flex;
                justify-content: flex-end;
                gap: 0.5rem;
            }

            @media screen and (max-width: 640px) {
                .alta-rapida-card {
                    padding: 1.25rem 1rem;
                    margin-bottom: 0;
                    border-radius: 0;
                }

                /* En pantallas estrechas el texto del resumen y el botón "Cambiar"
                   se aprietan uno contra otro; se apilan para dejar sitio a ambos. */
                .resumen-colapsado {
                    flex-direction: column;
                    align-items: stretch;
                }
                :host ::ng-deep .resumen-colapsado .p-button {
                    align-self: flex-end;
                }

                /* Botones finales apilados y a ancho completo: más fáciles de pulsar
                   con el pulgar y evitan que "Guardar" quede diminuto junto a "Cancelar". */
                .acciones-footer {
                    flex-direction: column-reverse;
                    gap: 0.5rem;
                }
                :host ::ng-deep .acciones-footer .p-button {
                    width: 100%;
                    justify-content: center;
                }
            }
        `
    ],
    template: `
        <div class="card alta-rapida-card">
            <div class="flex align-items-center gap-3 mb-4">
                <i class="pi pi-bolt text-primary text-2xl"></i>
                <span class="font-bold text-2xl">Alta rápida</span>
            </div>
            <p class="text-500 mt-0 mb-4">Registra un gasto o ingreso cotidiano en dos pasos: concepto e importe. El resto se rellena a partir de tu último uso de ese concepto.</p>

            <div class="mb-4 tipo-selector">
                <p-selectbutton [options]="tipoOptions" [ngModel]="tipo()" (ngModelChange)="onTipoChange($event)" optionLabel="label" optionValue="value" [allowEmpty]="false" />
            </div>

            <app-transacciones-habituales-chips [tipo]="tipo()" [refresco]="habitualesRefresco()" (seleccionar)="onHabitualSeleccionado($event)" />

            <div class="field mb-3">
                <label class="font-semibold text-gray-700 block mb-2">Concepto</label>
                <p-autoComplete
                    #conceptoAc
                    [(ngModel)]="selectedConcepto"
                    [suggestions]="filteredConceptos()"
                    (completeMethod)="searchConceptos($event)"
                    [showClear]="true"
                    (onClear)="onConceptoClear()"
                    optionLabel="nombre"
                    [dropdown]="true"
                    [forceSelection]="false"
                    [showEmptyMessage]="false"
                    (onSelect)="onConceptoSelect($event)"
                    (onBlur)="onConceptoBlur()"
                    placeholder="¿Qué has pagado o cobrado?"
                    styleClass="w-full"
                    class="w-full"
                    inputStyleClass="font-semibold"
                    [lazy]="true"
                    [virtualScroll]="true"
                    [virtualScrollItemSize]="44"
                    (onLazyLoad)="onConceptoLazyLoad($event)"
                >
                    <ng-template pTemplate="header">
                        <app-cerrar-teclado-boton (cerrar)="conceptoAc.inputEL?.nativeElement?.blur()" />
                    </ng-template>
                </p-autoComplete>
                @if (submitted() && !selectedConcepto) {
                    <small class="text-red-500 block mt-1">El concepto es requerido.</small>
                }
                @if (newConceptoMessage()) {
                    <small class="text-blue-600 block mt-1"><i class="pi pi-info-circle"></i> {{ newConceptoMessage() }}</small>
                }
            </div>

            <div class="field mb-4">
                <label class="font-semibold text-gray-700 block mb-2">Importe</label>
                <app-money-input [ngModel]="formData.importe" (ngModelChange)="onImporteChange($event)" [inputClass]="tipo() === 'gasto' ? 'text-right font-bold text-2xl text-red-500' : 'text-right font-bold text-2xl text-green-600'" placeholder="0,00 €" />
                @if (submitted() && !formData.importe) {
                    <small class="text-red-500 block mt-1">El importe es requerido.</small>
                }
            </div>

            @if (!expandido()) {
                <div class="surface-50 border-round p-3 mb-4 resumen-colapsado">
                    <div class="text-sm text-700 flex-1 resumen-texto">
                        @if (resumenCompleto()) {
                            <i class="pi pi-bolt text-primary mr-1" pTooltip="Rellenado a partir del último uso de este concepto"></i>
                        }
                        {{ resumenTexto() }}
                    </div>
                    <p-button label="Cambiar" [text]="true" size="small" (onClick)="expandido.set(true)" />
                </div>
            } @else {
                <div class="flex flex-col gap-3 mb-4">
                    <div class="field">
                        <label class="font-medium text-gray-700 block mb-2 text-sm">Categoría</label>
                        <p-autoComplete
                            #categoriaAc
                            [(ngModel)]="selectedCategoria"
                            [suggestions]="filteredCategorias()"
                            (completeMethod)="searchCategorias($event)"
                            optionLabel="nombre"
                            [dropdown]="true"
                            [forceSelection]="false"
                            [showEmptyMessage]="false"
                            (onSelect)="onCategoriaSelect($event)"
                            (onBlur)="onCategoriaBlur()"
                            styleClass="w-full"
                            class="w-full"
                            [lazy]="true"
                            [virtualScroll]="true"
                            [virtualScrollItemSize]="44"
                            (onLazyLoad)="onCategoriaLazyLoad($event)"
                        >
                            <ng-template pTemplate="header">
                                <app-cerrar-teclado-boton (cerrar)="categoriaAc.inputEL?.nativeElement?.blur()" />
                            </ng-template>
                        </p-autoComplete>
                        @if (submitted() && !selectedCategoria) {
                            <small class="text-red-500 block mt-1">La categoría es requerida.</small>
                        }
                    </div>

                    <div class="field">
                        <label class="font-medium text-gray-700 block mb-2 text-sm">Cuenta</label>
                        <p-autoComplete
                            #cuentaAc
                            [(ngModel)]="selectedCuenta"
                            [suggestions]="filteredCuentas()"
                            (completeMethod)="searchCuentas($event)"
                            optionLabel="nombre"
                            [dropdown]="true"
                            [forceSelection]="false"
                            [showEmptyMessage]="false"
                            (onSelect)="onCuentaSelect($event)"
                            (onBlur)="onCuentaBlur()"
                            styleClass="w-full"
                            class="w-full"
                            [lazy]="true"
                            [virtualScroll]="true"
                            [virtualScrollItemSize]="44"
                            (onLazyLoad)="onCuentaLazyLoad($event)"
                        >
                            <ng-template pTemplate="header">
                                <app-cerrar-teclado-boton (cerrar)="cuentaAc.inputEL?.nativeElement?.blur()" />
                            </ng-template>
                        </p-autoComplete>
                        @if (submitted() && !selectedCuenta) {
                            <small class="text-red-500 block mt-1">La cuenta es requerida.</small>
                        }
                    </div>

                    <div class="field">
                        <label class="font-medium text-gray-700 block mb-2 text-sm">Forma de Pago</label>
                        <p-autoComplete
                            #formaPagoAc
                            [(ngModel)]="selectedFormaPago"
                            [suggestions]="filteredFormasPago()"
                            (completeMethod)="searchFormasPago($event)"
                            optionLabel="nombre"
                            [dropdown]="true"
                            [forceSelection]="false"
                            [showEmptyMessage]="false"
                            (onSelect)="onFormaPagoSelect($event)"
                            (onBlur)="onFormaPagoBlur()"
                            styleClass="w-full"
                            class="w-full"
                            [lazy]="true"
                            [virtualScroll]="true"
                            [virtualScrollItemSize]="44"
                            (onLazyLoad)="onFormaPagoLazyLoad($event)"
                        >
                            <ng-template pTemplate="header">
                                <app-cerrar-teclado-boton (cerrar)="formaPagoAc.inputEL?.nativeElement?.blur()" />
                            </ng-template>
                        </p-autoComplete>
                        @if (submitted() && !selectedFormaPago) {
                            <small class="text-red-500 block mt-1">La forma de pago es requerida.</small>
                        }
                    </div>

                    <div class="field">
                        <label class="font-medium text-gray-700 block mb-2 text-sm">{{ tipo() === 'gasto' ? 'Proveedor' : 'Cliente' }}</label>
                        <p-autoComplete
                            #terceroAc
                            [(ngModel)]="selectedTercero"
                            [suggestions]="filteredTerceros()"
                            (completeMethod)="searchTerceros($event)"
                            optionLabel="nombre"
                            [dropdown]="true"
                            [forceSelection]="false"
                            [showEmptyMessage]="false"
                            (onSelect)="onTerceroSelect($event)"
                            (onBlur)="onTerceroBlur()"
                            styleClass="w-full"
                            class="w-full"
                            [lazy]="true"
                            [virtualScroll]="true"
                            [virtualScrollItemSize]="44"
                            (onLazyLoad)="onTerceroLazyLoad($event)"
                        >
                            <ng-template pTemplate="header">
                                <app-cerrar-teclado-boton (cerrar)="terceroAc.inputEL?.nativeElement?.blur()" />
                            </ng-template>
                        </p-autoComplete>
                    </div>

                    <div class="field">
                        <label class="font-medium text-gray-700 block mb-2 text-sm">Persona</label>
                        <p-autoComplete
                            #personaAc
                            [(ngModel)]="selectedPersona"
                            [suggestions]="filteredPersonas()"
                            (completeMethod)="searchPersonas($event)"
                            optionLabel="nombre"
                            [dropdown]="true"
                            [forceSelection]="false"
                            [showEmptyMessage]="false"
                            (onSelect)="onPersonaSelect($event)"
                            (onBlur)="onPersonaBlur()"
                            styleClass="w-full"
                            class="w-full"
                            [lazy]="true"
                            [virtualScroll]="true"
                            [virtualScrollItemSize]="44"
                            (onLazyLoad)="onPersonaLazyLoad($event)"
                        >
                            <ng-template pTemplate="header">
                                <app-cerrar-teclado-boton (cerrar)="personaAc.inputEL?.nativeElement?.blur()" />
                            </ng-template>
                        </p-autoComplete>
                    </div>

                    @if (resumenCompleto()) {
                        <div class="flex justify-content-end">
                            <p-button label="Listo" [text]="true" size="small" (onClick)="expandido.set(false)" />
                        </div>
                    }
                </div>
            }

            <div class="field mb-4">
                <label class="font-semibold text-gray-700 block mb-2">Fecha</label>
                <p-datePicker [(ngModel)]="fecha" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" class="w-full" />
            </div>

            <div class="acciones-footer">
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="cancelar()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="guardando()" (onClick)="guardar()" />
            </div>
        </div>
    `
})
export class AltaRapidaPage {
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly gastoService = inject(GastoService);
    private readonly ingresoService = inject(IngresoService);
    private readonly gastosStore = inject(GastosStore);
    private readonly ingresosStore = inject(IngresosStore);
    private readonly conceptoStore = inject(ConceptoStore);
    private readonly categoriaStore = inject(CategoriaStore);
    private readonly cuentaStore = inject(CuentaStore);
    private readonly formaPagoStore = inject(FormaPagoStore);
    private readonly proveedorStore = inject(ProveedorStore);
    private readonly clienteStore = inject(ClienteStore);
    private readonly personaStore = inject(PersonaStore);
    private readonly conceptoService = inject(ConceptoService);
    private readonly categoriaService = inject(CategoriaService);
    private readonly cuentaService = inject(CuentaService);
    private readonly formaPagoService = inject(FormaPagoService);
    private readonly proveedorService = inject(ProveedorService);
    private readonly clienteService = inject(ClienteService);
    private readonly personaService = inject(PersonaService);

    // Catálogo completo con scroll perezoso (aparece al seguir bajando tras "recientes"/búsqueda)
    private readonly conceptoScroll = new CargadorCatalogoScroll<CatalogItem>((page, pageSize) => this.conceptoService.getConceptos(page, pageSize, '', 'nombre', 'asc', this.selectedCategoria?.id));
    private readonly categoriaScroll = new CargadorCatalogoScroll<CatalogItem>((page, pageSize) => this.categoriaService.getCategorias(page, pageSize, '', 'nombre', 'asc'));
    private readonly cuentaScroll = new CargadorCatalogoScroll<CatalogItem>((page, pageSize) => this.cuentaService.getCuentas(page, pageSize, '', 'nombre', 'asc'));
    private readonly formaPagoScroll = new CargadorCatalogoScroll<CatalogItem>((page, pageSize) => this.formaPagoService.getFormasPago(page, pageSize, '', 'nombre', 'asc'));
    private readonly terceroScroll = new CargadorCatalogoScroll<CatalogItem>((page, pageSize) =>
        this.tipo() === 'gasto' ? this.proveedorService.getProveedores(page, pageSize, '', 'nombre', 'asc') : this.clienteService.getClientes(page, pageSize, '', 'nombre', 'asc')
    );
    private readonly personaScroll = new CargadorCatalogoScroll<CatalogItem>((page, pageSize) => this.personaService.getPersonas(page, pageSize, '', 'nombre', 'asc'));

    readonly tipoOptions = [
        { label: 'Gasto', value: 'gasto' as Tipo },
        { label: 'Ingreso', value: 'ingreso' as Tipo }
    ];

    tipo = signal<Tipo>('gasto');
    submitted = signal(false);
    guardando = signal(false);
    expandido = signal(false);
    /** Se incrementa tras crear correctamente para forzar la recarga de habituales. */
    habitualesRefresco = signal(0);

    formData: { importe?: number } = {};
    fecha: Date = this.hoy();

    selectedConcepto: CatalogItem | null = null;
    selectedCategoria: CatalogItem | null = null;
    selectedCuenta: CatalogItem | null = null;
    selectedFormaPago: CatalogItem | null = null;
    selectedTercero: CatalogItem | null = null;
    selectedPersona: CatalogItem | null = null;

    filteredConceptos = signal<CatalogItem[]>([]);
    filteredCategorias = signal<CatalogItem[]>([]);
    filteredCuentas = signal<CatalogItem[]>([]);
    filteredFormasPago = signal<CatalogItem[]>([]);
    filteredTerceros = signal<CatalogItem[]>([]);
    filteredPersonas = signal<CatalogItem[]>([]);

    newConceptoMessage = signal<string>('');

    private skipNextConceptoBlur = false;
    private skipNextCategoriaBlur = false;
    private skipNextCuentaBlur = false;
    private skipNextFormaPagoBlur = false;
    private skipNextTerceroBlur = false;
    private skipNextPersonaBlur = false;

    resumenCompleto = computed(() => !!this.selectedCategoria && !!this.selectedCuenta && !!this.selectedFormaPago);

    resumenTexto = computed(() => {
        const partes = [this.selectedCategoria?.nombre, this.selectedCuenta?.nombre, this.selectedFormaPago?.nombre, this.selectedTercero?.nombre, this.selectedPersona?.nombre].filter((p): p is string => !!p);
        return partes.length ? partes.join(' · ') : 'Completa categoría, cuenta y forma de pago para poder guardar.';
    });

    private hoy(): Date {
        const fecha = new Date();
        fecha.setHours(0, 0, 0, 0);
        return fecha;
    }

    onTipoChange(tipo: Tipo): void {
        this.tipo.set(tipo);
        this.resetFormulario();
        // El tercero cambia de catálogo (Proveedor/Cliente) según el tipo: reiniciar su scroll
        // para no arrastrar páginas del catálogo anterior.
        this.terceroScroll.reset();
    }

    private resetFormulario(): void {
        this.formData = {};
        this.fecha = this.hoy();
        this.selectedConcepto = null;
        this.selectedCategoria = null;
        this.selectedCuenta = null;
        this.selectedFormaPago = null;
        this.selectedTercero = null;
        this.selectedPersona = null;
        this.expandido.set(false);
        this.submitted.set(false);
        this.newConceptoMessage.set('');
        this.filteredConceptos.set([]);
        this.filteredCategorias.set([]);
        this.filteredCuentas.set([]);
        this.filteredFormasPago.set([]);
        this.filteredTerceros.set([]);
        this.filteredPersonas.set([]);
        this.conceptoScroll.reset();
        this.categoriaScroll.reset();
        this.cuentaScroll.reset();
        this.formaPagoScroll.reset();
        this.terceroScroll.reset();
        this.personaScroll.reset();
    }

    onImporteChange(value: number | null): void {
        this.formData.importe = value ?? undefined;
    }

    // --- Búsquedas ---
    searchConceptos(event: AutoCompleteCompleteEvent): void {
        const query = event.query;
        const categoriaId = this.selectedCategoria?.id;
        const call = !query || query.length < 2 ? this.conceptoStore.getRecent(5, categoriaId) : this.conceptoStore.search(query, 10, categoriaId);
        call
            .then((data) => {
                this.filteredConceptos.set(data);
                this.conceptoScroll.reset(data.length);
            })
            .catch(() => this.filteredConceptos.set([]));
    }

    onConceptoLazyLoad(event: AutoCompleteLazyLoadEvent): void {
        this.conceptoScroll.cargarPagina(event, this.filteredConceptos()).then((resultado) => {
            if (resultado) this.filteredConceptos.set(resultado);
        });
    }

    searchCategorias(event: AutoCompleteCompleteEvent): void {
        const query = event.query;
        const call = !query || query.length < 2 ? this.categoriaStore.getRecent(5) : this.categoriaStore.search(query, 10);
        call
            .then((data) => {
                this.filteredCategorias.set(data);
                this.categoriaScroll.reset(data.length);
            })
            .catch(() => this.filteredCategorias.set([]));
    }

    onCategoriaLazyLoad(event: AutoCompleteLazyLoadEvent): void {
        this.categoriaScroll.cargarPagina(event, this.filteredCategorias()).then((resultado) => {
            if (resultado) this.filteredCategorias.set(resultado);
        });
    }

    searchCuentas(event: AutoCompleteCompleteEvent): void {
        const query = event.query;
        const call = !query || query.length < 2 ? this.cuentaStore.getRecent(5) : this.cuentaStore.search(query, 10);
        call
            .then((data) => {
                this.filteredCuentas.set(data);
                this.cuentaScroll.reset(data.length);
            })
            .catch(() => this.filteredCuentas.set([]));
    }

    onCuentaLazyLoad(event: AutoCompleteLazyLoadEvent): void {
        this.cuentaScroll.cargarPagina(event, this.filteredCuentas()).then((resultado) => {
            if (resultado) this.filteredCuentas.set(resultado);
        });
    }

    searchFormasPago(event: AutoCompleteCompleteEvent): void {
        const query = event.query;
        const call = !query || query.length < 2 ? this.formaPagoStore.getRecent(5) : this.formaPagoStore.search(query, 10);
        call
            .then((data) => {
                this.filteredFormasPago.set(data);
                this.formaPagoScroll.reset(data.length);
            })
            .catch(() => this.filteredFormasPago.set([]));
    }

    onFormaPagoLazyLoad(event: AutoCompleteLazyLoadEvent): void {
        this.formaPagoScroll.cargarPagina(event, this.filteredFormasPago()).then((resultado) => {
            if (resultado) this.filteredFormasPago.set(resultado);
        });
    }

    searchTerceros(event: AutoCompleteCompleteEvent): void {
        const query = event.query;
        const store = this.tipo() === 'gasto' ? this.proveedorStore : this.clienteStore;
        const call = !query || query.length < 2 ? store.getRecent(5) : store.search(query, 10);
        call
            .then((data) => {
                this.filteredTerceros.set(data);
                this.terceroScroll.reset(data.length);
            })
            .catch(() => this.filteredTerceros.set([]));
    }

    onTerceroLazyLoad(event: AutoCompleteLazyLoadEvent): void {
        this.terceroScroll.cargarPagina(event, this.filteredTerceros()).then((resultado) => {
            if (resultado) this.filteredTerceros.set(resultado);
        });
    }

    searchPersonas(event: AutoCompleteCompleteEvent): void {
        const query = event.query;
        const call = !query || query.length < 2 ? this.personaStore.getRecent(5) : this.personaStore.search(query, 10);
        call
            .then((data) => {
                this.filteredPersonas.set(data);
                this.personaScroll.reset(data.length);
            })
            .catch(() => this.filteredPersonas.set([]));
    }

    onPersonaLazyLoad(event: AutoCompleteLazyLoadEvent): void {
        this.personaScroll.cargarPagina(event, this.filteredPersonas()).then((resultado) => {
            if (resultado) this.filteredPersonas.set(resultado);
        });
    }

    // --- Concepto ---
    onConceptoSelect(event: any): void {
        this.skipNextConceptoBlur = true;
        const value = event.value;
        this.selectedConcepto = value;
        this.newConceptoMessage.set('');

        if (value.categoriaId && value.categoriaNombre) {
            this.selectedCategoria = { id: value.categoriaId, nombre: value.categoriaNombre };
        }

        if (value.id) {
            this.aplicarSugerencia(value.id);
        } else {
            // Concepto nuevo: no hay sugerencia posible, hace falta rellenar a mano.
            this.expandido.set(true);
        }
    }

    onConceptoClear(): void {
        this.selectedConcepto = null;
        this.filteredConceptos.set([]);
        this.newConceptoMessage.set('');
        this.conceptoScroll.reset();
    }

    onConceptoBlur(): void {
        setTimeout(() => {
            if (this.skipNextConceptoBlur) {
                this.skipNextConceptoBlur = false;
                return;
            }
            if (typeof this.selectedConcepto === 'string' && (this.selectedConcepto as string).trim()) {
                const nombre = (this.selectedConcepto as string).trim();
                const existe = this.filteredConceptos().some((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
                if (!existe) {
                    this.selectedConcepto = { id: '', nombre };
                    this.newConceptoMessage.set(`Ha seleccionado un concepto "${nombre}" que no existe, se creará automáticamente.`);
                    this.expandido.set(true);
                }
            }
        }, 200);
    }

    /** Pre-rellena categoría/cuenta/forma de pago/tercero/persona a partir del último uso de este concepto. */
    private async aplicarSugerencia(conceptoId: string): Promise<void> {
        try {
            const service = this.tipo() === 'gasto' ? this.gastoService : this.ingresoService;
            const sugerencia: any = await firstValueFrom(service.getSugerencia(conceptoId));
            if (!sugerencia) {
                this.expandido.set(true);
                return;
            }

            if (sugerencia.categoriaId) this.selectedCategoria = { id: sugerencia.categoriaId, nombre: sugerencia.categoriaNombre };
            if (sugerencia.cuentaId) this.selectedCuenta = { id: sugerencia.cuentaId, nombre: sugerencia.cuentaNombre };
            if (sugerencia.formaPagoId) this.selectedFormaPago = { id: sugerencia.formaPagoId, nombre: sugerencia.formaPagoNombre };
            // El importe NUNCA se pre-rellena: el usuario lo introduce siempre a mano.

            const terceroId = this.tipo() === 'gasto' ? sugerencia.proveedorId : sugerencia.clienteId;
            const terceroNombre = this.tipo() === 'gasto' ? sugerencia.proveedorNombre : sugerencia.clienteNombre;
            if (terceroId) this.selectedTercero = { id: terceroId, nombre: terceroNombre ?? '' };
            if (sugerencia.personaId) this.selectedPersona = { id: sugerencia.personaId, nombre: sugerencia.personaNombre ?? '' };

            this.expandido.set(!this.resumenCompleto());
        } catch {
            // Mejora no crítica: si falla, el usuario simplemente rellena los campos a mano.
            this.expandido.set(true);
        }
    }

    // --- Habituales ---
    onHabitualSeleccionado(habitual: TransaccionHabitualSeleccionada): void {
        this.selectedConcepto = { id: habitual.conceptoId, nombre: habitual.conceptoNombre };
        this.selectedCategoria = habitual.categoriaId ? { id: habitual.categoriaId, nombre: habitual.categoriaNombre ?? '' } : null;
        this.selectedCuenta = { id: habitual.cuentaId, nombre: habitual.cuentaNombre };
        this.selectedFormaPago = { id: habitual.formaPagoId, nombre: habitual.formaPagoNombre };
        this.selectedTercero = habitual.terceroId ? { id: habitual.terceroId, nombre: habitual.terceroNombre ?? '' } : null;
        this.selectedPersona = habitual.personaId ? { id: habitual.personaId, nombre: habitual.personaNombre ?? '' } : null;
        // Nota: el backend no devuelve el importe del último uso de la combinación (solo
        // concepto/categoría/cuenta/formaPago/tercero/persona + veces/ultimoUso), así que el
        // importe se deja vacío para que el usuario lo confirme. Ver aviso al usuario sobre esta
        // limitación de alcance frente a lo descrito en specs/transacciones-habituales/spec.md.
        this.expandido.set(false);
        this.newConceptoMessage.set('');
    }

    // --- Categoría ---
    onCategoriaSelect(event: any): void {
        this.skipNextCategoriaBlur = true;
        this.selectedCategoria = event;
        // El catálogo completo de Concepto se filtra por categoría: al cambiarla hay que
        // reiniciar el scroll para no arrastrar páginas de la categoría anterior.
        this.conceptoScroll.reset();
    }

    onCategoriaBlur(): void {
        setTimeout(() => {
            if (this.skipNextCategoriaBlur) {
                this.skipNextCategoriaBlur = false;
                return;
            }
            if (typeof this.selectedCategoria === 'string' && (this.selectedCategoria as string).trim()) {
                const nombre = (this.selectedCategoria as string).trim();
                const existe = this.filteredCategorias().some((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
                if (!existe) {
                    this.selectedCategoria = { id: '', nombre };
                }
            }
        }, 200);
    }

    // --- Cuenta ---
    onCuentaSelect(event: any): void {
        this.skipNextCuentaBlur = true;
        this.selectedCuenta = event;
    }

    onCuentaBlur(): void {
        setTimeout(() => {
            if (this.skipNextCuentaBlur) {
                this.skipNextCuentaBlur = false;
                return;
            }
            if (typeof this.selectedCuenta === 'string' && (this.selectedCuenta as string).trim()) {
                const nombre = (this.selectedCuenta as string).trim();
                const existe = this.filteredCuentas().some((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
                if (!existe) {
                    this.selectedCuenta = { id: '', nombre };
                }
            }
        }, 200);
    }

    // --- Forma de pago ---
    onFormaPagoSelect(event: any): void {
        this.skipNextFormaPagoBlur = true;
        this.selectedFormaPago = event;
    }

    onFormaPagoBlur(): void {
        setTimeout(() => {
            if (this.skipNextFormaPagoBlur) {
                this.skipNextFormaPagoBlur = false;
                return;
            }
            if (typeof this.selectedFormaPago === 'string' && (this.selectedFormaPago as string).trim()) {
                const nombre = (this.selectedFormaPago as string).trim();
                const existe = this.filteredFormasPago().some((f) => f.nombre.toLowerCase() === nombre.toLowerCase());
                if (!existe) {
                    this.selectedFormaPago = { id: '', nombre };
                }
            }
        }, 200);
    }

    // --- Tercero (proveedor/cliente) ---
    onTerceroSelect(event: any): void {
        this.skipNextTerceroBlur = true;
        this.selectedTercero = event;
    }

    onTerceroBlur(): void {
        setTimeout(() => {
            if (this.skipNextTerceroBlur) {
                this.skipNextTerceroBlur = false;
                return;
            }
            if (typeof this.selectedTercero === 'string' && (this.selectedTercero as string).trim()) {
                const nombre = (this.selectedTercero as string).trim();
                const existe = this.filteredTerceros().some((t) => t.nombre.toLowerCase() === nombre.toLowerCase());
                if (!existe) {
                    this.selectedTercero = { id: '', nombre };
                }
            }
        }, 200);
    }

    // --- Persona ---
    onPersonaSelect(event: any): void {
        this.skipNextPersonaBlur = true;
        this.selectedPersona = event;
    }

    onPersonaBlur(): void {
        setTimeout(() => {
            if (this.skipNextPersonaBlur) {
                this.skipNextPersonaBlur = false;
                return;
            }
            if (typeof this.selectedPersona === 'string' && (this.selectedPersona as string).trim()) {
                const nombre = (this.selectedPersona as string).trim();
                const existe = this.filteredPersonas().some((p) => p.nombre.toLowerCase() === nombre.toLowerCase());
                if (!existe) {
                    this.selectedPersona = { id: '', nombre };
                }
            }
        }, 200);
    }

    private formatearFecha(fecha: Date): string {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    cancelar(): void {
        this.router.navigate(['/']);
    }

    async guardar(): Promise<void> {
        this.submitted.set(true);

        if (!this.selectedConcepto || !this.formData.importe || this.formData.importe <= 0 || !this.selectedCategoria || !this.selectedCuenta || !this.selectedFormaPago) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Completa concepto, importe, categoría, cuenta y forma de pago.' });
            this.expandido.set(true);
            return;
        }

        this.guardando.set(true);
        try {
            if (this.tipo() === 'gasto') {
                const gasto: GastoCreate = {
                    conceptoId: this.selectedConcepto.id || undefined!,
                    conceptoNombre: this.selectedConcepto.nombre,
                    categoriaId: this.selectedCategoria.id || undefined!,
                    categoriaNombre: this.selectedCategoria.nombre,
                    cuentaId: this.selectedCuenta.id || undefined!,
                    cuentaNombre: this.selectedCuenta.nombre,
                    formaPagoId: this.selectedFormaPago.id || undefined!,
                    formaPagoNombre: this.selectedFormaPago.nombre,
                    proveedorId: this.selectedTercero?.id || null,
                    proveedorNombre: this.selectedTercero?.nombre,
                    personaId: this.selectedPersona?.id || null,
                    personaNombre: this.selectedPersona?.nombre,
                    importe: this.formData.importe,
                    fecha: this.formatearFecha(this.fecha)
                };
                await this.gastosStore.createGasto(gasto);
            } else {
                const ingreso: IngresoCreate = {
                    conceptoId: this.selectedConcepto.id || undefined!,
                    conceptoNombre: this.selectedConcepto.nombre,
                    categoriaId: this.selectedCategoria.id || undefined!,
                    categoriaNombre: this.selectedCategoria.nombre,
                    cuentaId: this.selectedCuenta.id || undefined!,
                    cuentaNombre: this.selectedCuenta.nombre,
                    formaPagoId: this.selectedFormaPago.id || undefined!,
                    formaPagoNombre: this.selectedFormaPago.nombre,
                    clienteId: this.selectedTercero?.id || null,
                    clienteNombre: this.selectedTercero?.nombre,
                    personaId: this.selectedPersona?.id || null,
                    personaNombre: this.selectedPersona?.nombre,
                    importe: this.formData.importe,
                    fecha: this.formatearFecha(this.fecha)
                };
                await this.ingresosStore.createIngreso(ingreso);
            }

            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: this.tipo() === 'gasto' ? 'Gasto registrado correctamente.' : 'Ingreso registrado correctamente.' });
            this.habitualesRefresco.update((v) => v + 1);
            this.resetFormulario();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: (error as any)?.userMessage || 'No se pudo guardar la transacción.' });
        } finally {
            this.guardando.set(false);
        }
    }
}
