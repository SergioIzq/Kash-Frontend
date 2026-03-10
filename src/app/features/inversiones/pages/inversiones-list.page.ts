import { Component, inject, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { InversionesStore } from '../stores/inversiones.store';
import { InversionConPrecio, TIPOS_INVERSION_CONFIG, TipoInversion } from '@/core/models/inversion.model';
import { InversionFormModalComponent } from '../components/inversion-form-modal.component';
import { ImportExtractoModalComponent } from '../components/import-extracto-modal.component';
import { BasePageComponent, BasePageTemplateComponent } from '@/shared/components';

@Component({
    selector: 'app-inversiones-list-page',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TableModule,
        ToolbarModule,
        TagModule,
        TooltipModule,
        SkeletonModule,
        ChartModule,
        ProgressSpinnerModule,
        InversionFormModalComponent,
        ImportExtractoModalComponent,
        BasePageTemplateComponent
    ],
    providers: [DecimalPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
        .kpi-card {
            border-radius: 12px;
            padding: 1.5rem;
            transition: box-shadow 0.2s;
        }
        .kpi-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.12); }
        .gain { color: #22c55e; }
        .loss { color: #ef4444; }
        .neutral { color: var(--text-color-secondary); }
        .ticker-badge {
            font-family: monospace;
            font-size: .75rem;
            padding: .2rem .5rem;
            border-radius: 4px;
            background: var(--surface-200);
        }
    `],
    template: `
        <app-base-page-template
            [loading]="store.loading() && !store.hasData()"
            [skeletonType]="'card'"
        >
            <div class="card surface-ground px-4 py-5 md:px-6 lg:px-8">

                <!-- ── Header ─────────────────────────────────────────── -->
                <div class="flex align-items-center justify-between mb-5">
                    <div>
                        <h2 class="text-3xl font-bold m-0">Mi Portfolio</h2>
                        @if (store.lastPricesUpdated()) {
                            <p class="text-500 text-sm mt-1 m-0">
                                Precios actualizados {{ store.lastPricesUpdated() | date: 'HH:mm:ss' }}
                                @if (store.pricesLoading()) {
                                    <i class="pi pi-spin pi-spinner ml-2 text-xs"></i>
                                }
                            </p>
                        }
                    </div>
                    <div class="flex gap-2">
                        <p-button
                            icon="pi pi-refresh"
                            severity="secondary"
                            [outlined]="true"
                            pTooltip="Actualizar precios"
                            [loading]="store.pricesLoading()"
                            (onClick)="refreshPrices()"
                        />
                        <p-button
                            label="Importar"
                            icon="pi pi-upload"
                            severity="secondary"
                            [outlined]="true"
                            pTooltip="Importar extracto de bróker (CSV)"
                            (onClick)="openImport()"
                        />
                        <p-button
                            label="Nueva inversión"
                            icon="pi pi-plus"
                            (onClick)="openNew()"
                        />
                    </div>
                </div>

                <!-- ── KPI Cards ──────────────────────────────────────── -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">

                    <!-- Valor total -->
                    <div class="surface-card kpi-card shadow-1">
                        <div class="flex align-items-center justify-between mb-3">
                            <span class="text-500 font-medium text-sm">Valor del portfolio</span>
                            <div class="surface-100 border-round p-2">
                                <i class="pi pi-wallet text-primary"></i>
                            </div>
                        </div>
                        <div class="text-2xl font-bold text-900">
                            {{ resumen().valorTotal | number: '1.2-2' }} {{ monedaDisplay() }}
                        </div>
                        <div class="text-500 text-sm mt-1">
                            {{ resumen().cantidadPosiciones }} posicion{{ resumen().cantidadPosiciones === 1 ? '' : 'es' }}
                        </div>
                    </div>

                    <!-- Capital invertido -->
                    <div class="surface-card kpi-card shadow-1">
                        <div class="flex align-items-center justify-between mb-3">
                            <span class="text-500 font-medium text-sm">Capital invertido</span>
                            <div class="surface-100 border-round p-2">
                                <i class="pi pi-arrow-down text-blue-500"></i>
                            </div>
                        </div>
                        <div class="text-2xl font-bold text-900">
                            {{ resumen().valorInvertido | number: '1.2-2' }} {{ monedaDisplay() }}
                        </div>
                        <div class="text-500 text-sm mt-1">Precio medio de compra</div>
                    </div>

                    <!-- P&L total -->
                    <div class="surface-card kpi-card shadow-1">
                        <div class="flex align-items-center justify-between mb-3">
                            <span class="text-500 font-medium text-sm">Ganancia / Pérdida</span>
                            <div class="surface-100 border-round p-2">
                                <i class="pi pi-chart-line"
                                   [class.text-green-500]="resumen().gananciaAbsoluta >= 0"
                                   [class.text-red-500]="resumen().gananciaAbsoluta < 0"></i>
                            </div>
                        </div>
                        <div class="text-2xl font-bold"
                             [class.gain]="resumen().gananciaAbsoluta >= 0"
                             [class.loss]="resumen().gananciaAbsoluta < 0">
                            {{ resumen().gananciaAbsoluta >= 0 ? '+' : '' }}{{ resumen().gananciaAbsoluta | number: '1.2-2' }} {{ monedaDisplay() }}
                        </div>
                        <div class="text-sm mt-1"
                             [class.gain]="resumen().gananciaPorcentaje >= 0"
                             [class.loss]="resumen().gananciaPorcentaje < 0">
                            {{ resumen().gananciaPorcentaje >= 0 ? '+' : '' }}{{ resumen().gananciaPorcentaje | number: '1.2-2' }}%
                            total
                        </div>
                    </div>

                    <!-- Variación 24h -->
                    <div class="surface-card kpi-card shadow-1">
                        <div class="flex align-items-center justify-between mb-3">
                            <span class="text-500 font-medium text-sm">Hoy</span>
                            <div class="surface-100 border-round p-2">
                                <i class="pi pi-clock text-orange-500"></i>
                            </div>
                        </div>
                        <div class="text-2xl font-bold"
                             [class.gain]="resumen().variacion24hAbsoluta >= 0"
                             [class.loss]="resumen().variacion24hAbsoluta < 0">
                            {{ resumen().variacion24hAbsoluta >= 0 ? '+' : '' }}{{ resumen().variacion24hAbsoluta | number: '1.2-2' }} {{ monedaDisplay() }}
                        </div>
                        <div class="text-sm mt-1"
                             [class.gain]="resumen().variacion24hPorcentaje >= 0"
                             [class.loss]="resumen().variacion24hPorcentaje < 0">
                            {{ resumen().variacion24hPorcentaje >= 0 ? '+' : '' }}{{ resumen().variacion24hPorcentaje | number: '1.2-2' }}%
                            (24h)
                        </div>
                    </div>
                </div>

                <!-- ── Charts Row ──────────────────────────────────────── -->
                @if (store.hasData()) {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

                        <!-- Donut: Asset allocation -->
                        <div class="surface-card shadow-1 border-round p-4 lg:col-span-1">
                            <h4 class="mt-0 mb-4 font-semibold">Distribución por tipo</h4>
                            @if (donutChartData().labels.length > 0) {
                                <p-chart
                                    type="doughnut"
                                    [data]="donutChartData()"
                                    [options]="donutChartOptions"
                                    height="220"
                                />
                            } @else {
                                <div class="flex align-items-center justify-center h-10rem text-500">
                                    <span>Sin datos de precios</span>
                                </div>
                            }
                        </div>

                        <!-- Bar: P&L by position -->
                        <div class="surface-card shadow-1 border-round p-4 lg:col-span-2">
                            <h4 class="mt-0 mb-4 font-semibold">P&L por posición (%)</h4>
                            @if (barChartData().labels.length > 0) {
                                <p-chart
                                    type="bar"
                                    [data]="barChartData()"
                                    [options]="barChartOptions"
                                    height="220"
                                />
                            } @else {
                                <div class="flex align-items-center justify-center h-10rem text-500">
                                    <span>Actualizando precios...</span>
                                </div>
                            }
                        </div>
                    </div>
                }

                <!-- ── Positions Table ─────────────────────────────────── -->
                <div class="surface-card shadow-1 border-round p-4">
                    <p-toolbar styleClass="mb-4 gap-2 border-0 surface-card p-0">
                        <ng-template #start>
                            <h4 class="m-0 font-semibold">Posiciones</h4>
                        </ng-template>
                        <ng-template #end>
                            <p-button icon="pi pi-upload" label="Exportar" severity="secondary" [outlined]="true" (onClick)="exportCSV()" />
                        </ng-template>
                    </p-toolbar>

                    <p-table
                        [value]="posiciones()"
                        [loading]="store.loading()"
                        [loadingIcon]="'none'"
                        [rowHover]="true"
                        [sortField]="'gananciaPorcentaje'"
                        [sortOrder]="-1"
                        [tableStyle]="{ 'min-width': '60rem' }"
                        styleClass="p-datatable-gridlines"
                        dataKey="id"
                    >
                        <ng-template #header>
                            <tr>
                                <th pSortableColumn="nombre" style="min-width:14rem">
                                    Activo <p-sortIcon field="nombre" />
                                </th>
                                <th style="min-width:8rem">Tipo</th>
                                <th pSortableColumn="cantidad" style="min-width:8rem">
                                    Cantidad <p-sortIcon field="cantidad" />
                                </th>
                                <th pSortableColumn="precioCompra" style="min-width:10rem">
                                    P. Compra <p-sortIcon field="precioCompra" />
                                </th>
                                <th pSortableColumn="precioActual" style="min-width:10rem">
                                    P. Actual <p-sortIcon field="precioActual" />
                                </th>
                                <th pSortableColumn="valorActual" style="min-width:10rem">
                                    Valor <p-sortIcon field="valorActual" />
                                </th>
                                <th pSortableColumn="gananciaPorcentaje" style="min-width:12rem">
                                    P&L <p-sortIcon field="gananciaPorcentaje" />
                                </th>
                                <th pSortableColumn="variacion24h" style="min-width:8rem">
                                    24h <p-sortIcon field="variacion24h" />
                                </th>
                                <th style="min-width:8rem">Acciones</th>
                            </tr>
                        </ng-template>

                        <ng-template #body let-pos>
                            <tr>
                                <!-- Nombre + ticker + plataforma -->
                                <td style="padding: 1rem">
                                    <div class="flex align-items-center gap-3">
                                        <div class="w-2rem h-2rem border-round flex align-items-center justify-center"
                                             [style.background]="tipoColor(pos.tipo) + '20'">
                                            <i [class]="tipoIcon(pos.tipo)"
                                               [style.color]="tipoColor(pos.tipo)"
                                               class="text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="font-semibold">{{ pos.nombre }}</div>
                                            <div class="flex gap-2 mt-1">
                                                @if (pos.ticker) {
                                                    <span class="ticker-badge">{{ pos.ticker }}</span>
                                                }
                                                @if (pos.plataforma) {
                                                    <span class="text-400 text-xs">{{ pos.plataforma }}</span>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <!-- Tipo -->
                                <td>
                                    <p-tag
                                        [value]="tipoLabel(pos.tipo)"
                                        [style]="{ background: tipoColor(pos.tipo) + '20', color: tipoColor(pos.tipo), border: '1px solid ' + tipoColor(pos.tipo) + '40' }"
                                    />
                                </td>

                                <!-- Cantidad -->
                                <td>{{ pos.cantidad | number: '1.0-8' }}</td>

                                <!-- Precio compra -->
                                <td>
                                    {{ pos.precioCompra | number: '1.2-4' }}
                                    <span class="text-400 text-xs ml-1">{{ pos.moneda }}</span>
                                </td>

                                <!-- Precio actual -->
                                <td>
                                    @if (pos.cargandoPrecio) {
                                        <p-skeleton width="5rem" height="1.2rem" />
                                    } @else if (pos.precioActual !== null) {
                                        <span [class.gain]="pos.precioActual >= pos.precioCompra"
                                              [class.loss]="pos.precioActual < pos.precioCompra">
                                            {{ pos.precioActual | number: '1.2-4' }}
                                        </span>
                                        <span class="text-400 text-xs ml-1">{{ pos.moneda }}</span>
                                    } @else {
                                        <span class="text-400">N/D</span>
                                    }
                                </td>

                                <!-- Valor actual -->
                                <td>
                                    @if (pos.valorActual !== null) {
                                        <span class="font-semibold">{{ pos.valorActual | number: '1.2-2' }}</span>
                                        <span class="text-400 text-xs ml-1">{{ pos.moneda }}</span>
                                    } @else {
                                        <span class="text-400">—</span>
                                    }
                                </td>

                                <!-- P&L -->
                                <td>
                                    @if (pos.gananciaAbsoluta !== null) {
                                        <div class="flex flex-col gap-1">
                                            <span class="font-bold"
                                                  [class.gain]="pos.gananciaAbsoluta >= 0"
                                                  [class.loss]="pos.gananciaAbsoluta < 0">
                                                {{ pos.gananciaAbsoluta >= 0 ? '+' : '' }}{{ pos.gananciaAbsoluta | number: '1.2-2' }} {{ pos.moneda }}
                                            </span>
                                            <span class="text-sm"
                                                  [class.gain]="pos.gananciaPorcentaje! >= 0"
                                                  [class.loss]="pos.gananciaPorcentaje! < 0">
                                                {{ pos.gananciaPorcentaje! >= 0 ? '+' : '' }}{{ pos.gananciaPorcentaje | number: '1.2-2' }}%
                                            </span>
                                        </div>
                                    } @else {
                                        <span class="text-400">—</span>
                                    }
                                </td>

                                <!-- Variación 24h -->
                                <td>
                                    @if (pos.variacion24h !== null) {
                                        <span [class.gain]="pos.variacion24h >= 0"
                                              [class.loss]="pos.variacion24h < 0"
                                              class="font-semibold">
                                            {{ pos.variacion24h >= 0 ? '+' : '' }}{{ pos.variacion24h | number: '1.2-2' }}%
                                        </span>
                                    } @else {
                                        <span class="text-400">—</span>
                                    }
                                </td>

                                <!-- Acciones -->
                                <td>
                                    <div class="flex gap-1">
                                        <p-button
                                            icon="pi pi-pencil"
                                            [rounded]="true"
                                            [outlined]="true"
                                            size="small"
                                            pTooltip="Editar"
                                            (onClick)="editInversion(pos)"
                                        />
                                        <p-button
                                            icon="pi pi-trash"
                                            severity="danger"
                                            [rounded]="true"
                                            [outlined]="true"
                                            size="small"
                                            pTooltip="Eliminar"
                                            (onClick)="deleteInversion(pos)"
                                        />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template #loadingbody>
                            <tr *ngFor="let i of [1,2,3,4,5]">
                                <td style="padding:1rem"><p-skeleton /></td>
                                <td><p-skeleton width="5rem"/></td>
                                <td><p-skeleton width="4rem"/></td>
                                <td><p-skeleton width="6rem"/></td>
                                <td><p-skeleton width="6rem"/></td>
                                <td><p-skeleton width="6rem"/></td>
                                <td><p-skeleton width="8rem"/></td>
                                <td><p-skeleton width="4rem"/></td>
                                <td><div class="flex gap-2"><p-skeleton shape="circle" size="2rem"/><p-skeleton shape="circle" size="2rem"/></div></td>
                            </tr>
                        </ng-template>

                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="9" style="padding: 2rem">
                                    <div class="text-center py-8">
                                        <i class="pi pi-chart-line text-500 text-5xl mb-3 block"></i>
                                        <p class="text-900 font-semibold text-xl mb-2">Sin posiciones</p>
                                        <p class="text-600 mb-4">Añade tu primera inversión para empezar a trackear tu portfolio</p>
                                        <p-button label="Añadir inversión" icon="pi pi-plus" (onClick)="openNew()" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>

            </div>

            <!-- ── Form Modal ─────────────────────────────────────────── -->
            <app-inversion-form-modal
                [visible]="showDialog()"
                [inversion]="currentInversion()"
                (visibleChange)="showDialog.set($event)"
                (save)="onSave($event)"
                (cancel)="showDialog.set(false)"
            />

            <!-- ── Import Modal ───────────────────────────────────────── -->
            <app-import-extracto-modal
                [visible]="showImportDialog()"
                (visibleChange)="showImportDialog.set($event)"
                (imported)="onImported($event)"
            />
        </app-base-page-template>
    `
})
export class InversionesListPage extends BasePageComponent implements OnInit, OnDestroy {
    readonly store = inject(InversionesStore);

    protected override loadingSignal = this.store.loading;
    protected override skeletonType = 'card' as const;

    // ── UI State ──────────────────────────────────────────────────────────────
    showDialog = signal(false);
    showImportDialog = signal(false);
    currentInversion = signal<Partial<InversionConPrecio> | null>(null);

    // ── Computed ──────────────────────────────────────────────────────────────
    posiciones = computed(() => this.store.inversionesConPrecio());
    resumen = computed(() => this.store.resumenPortfolio());
    monedaDisplay = computed(() => {
        const posiciones = this.posiciones();
        if (!posiciones.length) return '';
        // Show the most common currency in the portfolio
        const counts: Record<string, number> = {};
        for (const p of posiciones) counts[p.moneda] = (counts[p.moneda] ?? 0) + 1;
        return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '';
    });

    // ── Chart computed ────────────────────────────────────────────────────────
    donutChartData = computed(() => {
        const dist = this.store.distribucionPorTipo();
        const isDark = document.documentElement.classList.contains('app-dark');

        return {
            labels: dist.labels,
            datasets: [{
                data: dist.data,
                backgroundColor: dist.colors.map((c) => c + 'CC'),
                borderColor: dist.colors,
                borderWidth: 2,
                hoverOffset: 8
            }]
        };
    });

    donutChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => {
                        const val: number = ctx.parsed;
                        const total: number = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const pct = ((val / total) * 100).toFixed(1);
                        return ` ${ctx.label}: ${val.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (${pct}%)`;
                    }
                }
            }
        }
    };

    barChartData = computed(() => {
        const posiciones = this.posiciones().filter((p) => p.gananciaPorcentaje !== null);
        if (!posiciones.length) return { labels: [], datasets: [] };

        const sorted = [...posiciones].sort((a, b) => (b.gananciaPorcentaje ?? 0) - (a.gananciaPorcentaje ?? 0));

        return {
            labels: sorted.map((p) => p.ticker || p.nombre),
            datasets: [{
                label: 'P&L %',
                data: sorted.map((p) => Math.round((p.gananciaPorcentaje ?? 0) * 100) / 100),
                backgroundColor: sorted.map((p) =>
                    (p.gananciaPorcentaje ?? 0) >= 0 ? '#22c55e80' : '#ef444480'
                ),
                borderColor: sorted.map((p) =>
                    (p.gananciaPorcentaje ?? 0) >= 0 ? '#22c55e' : '#ef4444'
                ),
                borderWidth: 2,
                borderRadius: 4
            }]
        };
    });

    barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => ` ${ctx.parsed.y >= 0 ? '+' : ''}${ctx.parsed.y.toFixed(2)}%`
                }
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(0,0,0,.05)' },
                ticks: { callback: (v: any) => `${v > 0 ? '+' : ''}${v}%` }
            },
            x: { grid: { display: false } }
        }
    };

    // ── Auto-refresh interval ─────────────────────────────────────────────────
    private refreshInterval: ReturnType<typeof setInterval> | null = null;
    private readonly REFRESH_INTERVAL_MS = 60_000; // 1 minute

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.store.loadInversiones();
        // After loading inversiones, refresh prices once and then start interval
        const unsub = setInterval(() => {
            if (this.store.hasData()) {
                clearInterval(unsub);
                this.store.refreshPrices();
                this.startPriceRefresh();
            }
        }, 300);
    }

    ngOnDestroy(): void {
        this.stopPriceRefresh();
    }

    private startPriceRefresh(): void {
        this.refreshInterval = setInterval(() => {
            if (!document.hidden) {
                this.store.refreshPrices();
            }
        }, this.REFRESH_INTERVAL_MS);
    }

    private stopPriceRefresh(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // ── Actions ───────────────────────────────────────────────────────────────
    openNew(): void {
        this.currentInversion.set(null);
        this.showDialog.set(true);
    }

    openImport(): void {
        this.showImportDialog.set(true);
    }

    onImported(count: number): void {
        this.showSuccess(`${count} inversión${count !== 1 ? 'es' : ''} importada${count !== 1 ? 's' : ''} correctamente`);
        setTimeout(() => this.store.refreshPrices(), 600);
    }

    editInversion(pos: InversionConPrecio): void {
        this.currentInversion.set({ ...pos });
        this.showDialog.set(true);
    }

    async onSave(payload: any): Promise<void> {
        const { id, ...inversionData } = payload;

        if (id) {
            try {
                await this.store.updateInversion({ id, inversion: inversionData });
                this.showSuccess('Inversión actualizada correctamente');
                this.showDialog.set(false);
                this.store.refreshPrices();
            } catch (err: any) {
                this.showError(err.userMessage || 'Error al actualizar la inversión');
            }
        } else {
            try {
                await this.store.createInversion(inversionData);
                this.showSuccess('Inversión añadida correctamente');
                this.showDialog.set(false);
                this.store.refreshPrices();
            } catch (err: any) {
                this.showError(err.userMessage || 'Error al crear la inversión');
            }
        }
    }

    deleteInversion(pos: InversionConPrecio): void {
        this.confirmAction(
            `¿Eliminar la posición "${pos.nombre}" (${pos.ticker})?`,
            async () => {
                try {
                    await this.store.deleteInversion(pos.id);
                    this.showSuccess('Posición eliminada');
                } catch (err: any) {
                    this.showError(err.userMessage || 'Error al eliminar la inversión');
                }
            },
            {
                header: 'Confirmar eliminación',
                acceptLabel: 'Sí, eliminar',
                rejectLabel: 'Cancelar',
                successMessage: undefined
            }
        );
    }

    refreshPrices(): void {
        this.store.refreshPrices();
    }

    exportCSV(): void {
        const posiciones = this.posiciones();
        if (!posiciones.length) { this.showWarning('No hay posiciones para exportar'); return; }

        const headers = ['Nombre', 'Ticker', 'Tipo', 'Cantidad', 'Precio Compra', 'Precio Actual', 'Valor Invertido', 'Valor Actual', 'P&L €', 'P&L %', '24h %', 'Moneda', 'Plataforma', 'Fecha Compra'];
        const rows = posiciones.map((p) => [
            p.nombre, p.ticker, p.tipo,
            p.cantidad,
            p.precioCompra,
            p.precioActual ?? '',
            p.valorInvertido,
            p.valorActual ?? '',
            p.gananciaAbsoluta ?? '',
            p.gananciaPorcentaje ?? '',
            p.variacion24h ?? '',
            p.moneda, p.plataforma ?? '', p.fechaCompra
        ]);

        let csv = '\uFEFF' + headers.join(',') + '\n';
        rows.forEach((r) => { csv += r.map((f) => `"${f}"`).join(',') + '\n'; });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    tipoLabel(tipo: TipoInversion): string {
        return TIPOS_INVERSION_CONFIG.find((t) => t.value === tipo)?.label ?? tipo;
    }

    tipoIcon(tipo: TipoInversion): string {
        return TIPOS_INVERSION_CONFIG.find((t) => t.value === tipo)?.icon ?? 'pi pi-question-circle';
    }

    tipoColor(tipo: TipoInversion): string {
        return TIPOS_INVERSION_CONFIG.find((t) => t.value === tipo)?.color ?? '#6B7280';
    }
}
