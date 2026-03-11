import { Component, inject, input, output, effect, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import { Inversion, InversionCreate, TipoInversion, TIPOS_INVERSION_CONFIG } from '@/core/models/inversion.model';

interface InversionFormData {
    id?: string;
    nombre: string;
    ticker: string;
    tipo: TipoInversion;
    cantidad: number | null;
    precioCompra: number | null;
    moneda: string;
    fechaCompra: Date | null;
    plataforma: string;
    descripcion: string;
}

const MONEDAS = [
    { label: 'USD – Dólar', value: 'USD' },
    { label: 'EUR – Euro', value: 'EUR' },
    { label: 'GBP – Libra', value: 'GBP' },
    { label: 'CHF – Franco suizo', value: 'CHF' },
    { label: 'JPY – Yen', value: 'JPY' },
    { label: 'BTC – Bitcoin', value: 'BTC' },
];

function emptyForm(): InversionFormData {
    return {
        nombre: '',
        ticker: '',
        tipo: 'etf',
        cantidad: null,
        precioCompra: null,
        moneda: 'USD',
        fechaCompra: new Date(),
        plataforma: '',
        descripcion: ''
    };
}

@Component({
    selector: 'app-inversion-form-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DrawerModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        DatePickerModule,
        SelectModule,
        TooltipModule,
        TagModule,
        ConfirmDialogModule,
        ToastModule
    ],
    providers: [ConfirmationService, MessageService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-drawer
            [visible]="visible()"
            (visibleChange)="handleDrawerHide($event)"
            position="right"
            styleClass="!w-full md:!w-[600px]"
            [blockScroll]="true"
        >
            <ng-template #header>
                <div class="flex align-items-center gap-3">
                    <i class="pi pi-chart-line text-primary text-xl"></i>
                    <span class="font-bold text-xl">{{ formData().id ? 'Editar Inversión' : 'Nueva Inversión' }}</span>
                </div>
            </ng-template>

            <div class="flex flex-col gap-5 px-1">
                <!-- Tipo de activo -->
                <div class="field">
                    <label class="font-semibold mb-2 block">Tipo de activo <span class="text-red-500">*</span></label>
                    <div class="grid grid-cols-2 gap-2">
                        @for (tipo of tiposInversion; track tipo.value) {
                            <button
                                type="button"
                                class="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all text-left"
                                [style.border-color]="formData().tipo === tipo.value ? tipo.color : 'transparent'"
                                [style.background]="formData().tipo === tipo.value ? tipo.color + '15' : 'var(--surface-ground)'"
                                (click)="setTipo(tipo.value)"
                            >
                                <i [class]="tipo.icon" [style.color]="tipo.color" class="text-lg"></i>
                                <div class="flex flex-col">
                                    <span class="font-semibold text-sm">{{ tipo.label }}</span>
                                    <span class="text-xs text-500">{{ tipo.hint }}</span>
                                </div>
                            </button>
                        }
                    </div>
                </div>

                <!-- Nombre y Ticker -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="field">
                        <label class="font-semibold mb-2 block">Nombre <span class="text-red-500">*</span></label>
                        <input
                            pInputText
                            type="text"
                            [(ngModel)]="formData().nombre"
                            (ngModelChange)="patchForm({ nombre: $event })"
                            placeholder="Ej: Bitcoin, Apple Inc."
                            class="w-full"
                            [class.ng-invalid]="submitted() && !formData().nombre"
                        />
                        @if (submitted() && !formData().nombre) {
                            <small class="text-red-500">El nombre es obligatorio</small>
                        }
                    </div>

                    <div class="field">
                        <label class="font-semibold mb-2 block">
                            Ticker
                            @if (formData().tipo !== 'mercado_privado') {
                                <span class="text-red-500">*</span>
                            }
                            <i
                                class="pi pi-question-circle ml-1 text-400 cursor-pointer"
                                [pTooltip]="tickerTooltip()"
                                tooltipPosition="top"
                            ></i>
                        </label>
                        <input
                            pInputText
                            type="text"
                            [value]="formData().ticker"
                            (input)="patchForm({ ticker: $any($event.target).value.toUpperCase() })"
                            [placeholder]="tipoConfig()?.hint ?? 'Ej: AAPL'"
                            class="w-full font-mono"
                            [disabled]="formData().tipo === 'mercado_privado'"
                            [class.ng-invalid]="submitted() && !formData().ticker && formData().tipo !== 'mercado_privado'"
                        />
                        @if (submitted() && !formData().ticker && formData().tipo !== 'mercado_privado') {
                            <small class="text-red-500">El ticker es obligatorio</small>
                        }
                    </div>
                </div>

                <!-- Cantidad y Precio de compra -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="field">
                        <label class="font-semibold mb-2 block">Cantidad <span class="text-red-500">*</span></label>
                        <p-inputnumber
                            [ngModel]="formData().cantidad"
                            (ngModelChange)="patchForm({ cantidad: $event })"
                            placeholder="0"
                            [minFractionDigits]="0"
                            [maxFractionDigits]="8"
                            [min]="0"
                            class="w-full"
                            styleClass="w-full"
                            [class.ng-invalid]="submitted() && !formData().cantidad"
                        />
                        @if (submitted() && !formData().cantidad) {
                            <small class="text-red-500">La cantidad es obligatoria</small>
                        }
                    </div>

                    <div class="field">
                        <label class="font-semibold mb-2 block">Precio medio de compra <span class="text-red-500">*</span></label>
                        <p-inputnumber
                            [ngModel]="formData().precioCompra"
                            (ngModelChange)="patchForm({ precioCompra: $event })"
                            placeholder="0.00"
                            [minFractionDigits]="2"
                            [maxFractionDigits]="8"
                            [min]="0"
                            class="w-full"
                            styleClass="w-full"
                            [class.ng-invalid]="submitted() && !formData().precioCompra"
                        />
                        @if (submitted() && !formData().precioCompra) {
                            <small class="text-red-500">El precio es obligatorio</small>
                        }
                    </div>
                </div>

                <!-- Moneda y Fecha de compra -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="field">
                        <label class="font-semibold mb-2 block">Moneda <span class="text-red-500">*</span></label>
                        <p-select
                            [ngModel]="formData().moneda"
                            (ngModelChange)="patchForm({ moneda: $event })"
                            [options]="monedas"
                            optionLabel="label"
                            optionValue="value"
                            class="w-full"
                            styleClass="w-full"
                        />
                    </div>

                    <div class="field">
                        <label class="font-semibold mb-2 block">Fecha de compra <span class="text-red-500">*</span></label>
                        <p-datepicker
                            [ngModel]="formData().fechaCompra"
                            (ngModelChange)="patchForm({ fechaCompra: $event })"
                            [showIcon]="true"
                            dateFormat="dd/mm/yy"
                            [maxDate]="today"
                            class="w-full"
                            styleClass="w-full"
                        />
                        @if (submitted() && !formData().fechaCompra) {
                            <small class="text-red-500">La fecha es obligatoria</small>
                        }
                    </div>
                </div>

                <!-- Valor invertido (calculado) -->
                @if (formData().cantidad && formData().precioCompra) {
                    <div class="surface-50 border-round p-3 flex justify-between align-items-center">
                        <span class="text-600 text-sm">Valor total invertido</span>
                        <span class="font-bold text-lg">
                            {{ (formData().cantidad! * formData().precioCompra!) | number: '1.2-2' }} {{ formData().moneda }}
                        </span>
                    </div>
                }

                <!-- Plataforma (opcional) -->
                <div class="field">
                    <label class="font-semibold mb-2 block">Plataforma <span class="text-400 font-normal">(opcional)</span></label>
                    <input
                        pInputText
                        type="text"
                        [value]="formData().plataforma"
                        (input)="patchForm({ plataforma: $any($event.target).value })"
                        placeholder="Ej: Interactive Brokers, Binance, Trade Republic"
                        class="w-full"
                    />
                </div>

                <!-- Descripción (opcional) -->
                <div class="field">
                    <label class="font-semibold mb-2 block">Notas <span class="text-400 font-normal">(opcional)</span></label>
                    <textarea
                        pTextarea
                        [value]="formData().descripcion"
                        (input)="patchForm({ descripcion: $any($event.target).value })"
                        placeholder="Notas sobre esta inversión..."
                        rows="2"
                        class="w-full resize-none"
                    ></textarea>
                </div>
            </div>

            <ng-template #footer>
                <div class="flex gap-2 justify-end">
                    <p-button
                        label="Cancelar"
                        icon="pi pi-times"
                        severity="secondary"
                        [outlined]="true"
                        (onClick)="onCancel()"
                    />
                    <p-button
                        [label]="formData().id ? 'Guardar cambios' : 'Añadir inversión'"
                        icon="pi pi-check"
                        (onClick)="onSave()"
                    />
                </div>
            </ng-template>
        </p-drawer>

        <p-confirmdialog />
        <p-toast position="bottom-center" />
    `
})
export class InversionFormModalComponent {
    private readonly confirmationService = inject(ConfirmationService);

    // Inputs / Outputs
    visible = input.required<boolean>();
    inversion = input<Partial<Inversion> | null>(null);

    visibleChange = output<boolean>();
    save = output<InversionCreate & { id?: string }>();
    cancel = output<void>();

    // State
    formData = signal<InversionFormData>(emptyForm());
    submitted = signal<boolean>(false);

    readonly tiposInversion = TIPOS_INVERSION_CONFIG;
    readonly monedas = MONEDAS;
    readonly today = new Date();

    // Computed
    tipoConfig = computed(() =>
        TIPOS_INVERSION_CONFIG.find((t) => t.value === this.formData().tipo) ?? null
    );

    tickerTooltip = computed(() => {
        const tipo = this.formData().tipo;
        if (tipo === 'mercado_privado') return 'Los activos de mercado privado no tienen cotización pública';
        if (tipo === 'cripto') return 'Usa el par de Yahoo Finance: BTC-USD, ETH-USD, SOL-USD';
        if (tipo === 'etf') return 'Ticker de Yahoo Finance: SPY, QQQ. ETFs europeos: IWDA.AS, CSPX.L';
        return 'Ticker de Yahoo Finance. Ej: AAPL, MSFT, NVDA';
    });

    // Reactive
    constructor() {
        effect(() => {
            const inv = this.inversion();
            if (inv && inv.id) {
                // Editing existing
                this.formData.set({
                    id: inv.id,
                    nombre: inv.nombre ?? '',
                    ticker: inv.ticker ?? '',
                    tipo: inv.tipo ?? 'etf',
                    cantidad: inv.cantidad ?? null,
                    precioCompra: inv.precioCompra ?? null,
                    moneda: inv.moneda ?? 'USD',
                    fechaCompra: inv.fechaCompra ? new Date(inv.fechaCompra) : new Date(),
                    plataforma: inv.plataforma ?? '',
                    descripcion: inv.descripcion ?? ''
                });
            } else {
                this.formData.set(emptyForm());
            }
            this.submitted.set(false);
        });
    }

    // Methods
    patchForm(patch: Partial<InversionFormData>): void {
        this.formData.update((prev) => ({ ...prev, ...patch }));
    }

    setTipo(tipo: TipoInversion): void {
        this.patchForm({
            tipo,
            ticker: tipo === 'mercado_privado' ? '' : this.formData().ticker
        });
    }

    private isValid(): boolean {
        const d = this.formData();
        if (!d.nombre.trim()) return false;
        if (d.tipo !== 'mercado_privado' && !d.ticker.trim()) return false;
        if (!d.cantidad || d.cantidad <= 0) return false;
        if (!d.precioCompra || d.precioCompra <= 0) return false;
        if (!d.fechaCompra) return false;
        return true;
    }

    onSave(): void {
        this.submitted.set(true);
        if (!this.isValid()) return;

        const d = this.formData();
        const payload: InversionCreate & { id?: string } = {
            nombre: d.nombre.trim(),
            ticker: d.ticker.trim().toUpperCase(),
            tipo: d.tipo,
            cantidad: d.cantidad!,
            precioCompra: d.precioCompra!,
            moneda: d.moneda,
            fechaCompra: d.fechaCompra!.toISOString().split('T')[0],
            plataforma: d.plataforma?.trim() || undefined,
            descripcion: d.descripcion?.trim() || undefined,
            ...(d.id ? { id: d.id } : {})
        };

        this.save.emit(payload);
    }

    onCancel(): void {
        if (this.hasUnsavedChanges()) {
            this.confirmationService.confirm({
                message: '¿Descartar los cambios?',
                header: 'Cambios sin guardar',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Sí, descartar',
                rejectLabel: 'Seguir editando',
                accept: () => this.closeDrawer()
            });
        } else {
            this.closeDrawer();
        }
    }

    handleDrawerHide(visible: boolean): void {
        if (!visible) this.onCancel();
    }

    private closeDrawer(): void {
        this.submitted.set(false);
        this.formData.set(emptyForm());
        this.cancel.emit();
        this.visibleChange.emit(false);
    }

    private hasUnsavedChanges(): boolean {
        const d = this.formData();
        const orig = this.inversion();
        if (!orig?.id) {
            return !!(d.nombre || d.ticker || d.cantidad || d.precioCompra || d.plataforma || d.descripcion);
        }
        return (
            d.nombre !== (orig.nombre ?? '') ||
            d.ticker !== (orig.ticker ?? '') ||
            d.tipo !== (orig.tipo ?? 'etf') ||
            d.cantidad !== (orig.cantidad ?? null) ||
            d.precioCompra !== (orig.precioCompra ?? null)
        );
    }
}
