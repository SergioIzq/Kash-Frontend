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
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';

import { InversionesStore } from '../stores/inversiones.store';
import { InversionConPrecio, TIPOS_INVERSION_CONFIG, TipoInversion } from '@/core/models/inversion.model';
import { PERIODOS } from '../services/portfolio-performance.service';
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
        DialogModule,
        DividerModule,
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
        .live-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            flex-shrink: 0;
        }
        .live-dot.connected {
            background: #22c55e;
            box-shadow: 0 0 0 0 rgba(34,197,94,.6);
            animation: pulse-green 2s infinite;
        }
        .live-dot.disconnected {
            background: #94a3b8;
        }
        @keyframes pulse-green {
            0%   { box-shadow: 0 0 0 0 rgba(34,197,94,.6); }
            70%  { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
            100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        .help-section-title {
            font-size: .7rem;
            font-weight: 700;
            letter-spacing: .08em;
            text-transform: uppercase;
            color: var(--text-color-secondary);
            margin: 0 0 .75rem 0;
        }
        .help-row {
            display: flex;
            gap: .75rem;
            align-items: flex-start;
            padding: .5rem 0;
        }
        .help-icon-wrap {
            width: 2rem;
            height: 2rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .help-term {
            font-weight: 600;
            font-size: .875rem;
            color: var(--text-color);
        }
        .help-def {
            font-size: .8rem;
            color: var(--text-color-secondary);
            margin-top: .15rem;
            line-height: 1.5;
        }
        .period-card {
            border-radius: 10px;
            padding: 1rem 1.25rem;
            transition: box-shadow .2s;
            border: 1px solid var(--surface-border);
        }
        .period-card:hover { box-shadow: 0 3px 12px rgba(0,0,0,.1); }
        .period-label {
            font-size: .7rem;
            font-weight: 700;
            letter-spacing: .07em;
            text-transform: uppercase;
            color: var(--text-color-secondary);
        }
        .period-btn {
            padding: .35rem .9rem;
            border-radius: 20px;
            border: none;
            background: transparent;
            font-size: .8rem;
            font-weight: 600;
            cursor: pointer;
            color: var(--text-color-secondary);
            transition: background .15s, color .15s;
        }
        .period-btn:hover { background: var(--surface-200); color: var(--text-color); }
        .period-btn:focus { outline: none; }
        .period-btn.active {
            background: var(--primary-color);
            color: var(--primary-color-text, #fff);
        }
        /* ── Responsive ─────────────────────────────────────────── */
        .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: .75rem;
            margin-bottom: 1.25rem;
        }
        .page-header-actions {
            display: flex;
            flex-wrap: wrap;
            gap: .5rem;
        }
        .kpi-value {
            font-size: 1.35rem;
            font-weight: 700;
            color: var(--text-color);
            word-break: break-all;
        }
        .chart-period-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: .75rem;
            margin-bottom: 1rem;
        }
        .period-selector {
            display: flex;
            flex-wrap: wrap;
            gap: .25rem;
            background: var(--surface-ground);
            border-radius: 8px;
            padding: .25rem;
        }
        .table-scroll-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 480px) {
            .kpi-value { font-size: 1.1rem; }
            .period-btn { padding: .3rem .6rem; font-size: .75rem; }
            .kpi-card { padding: 1rem; }
        }
        /* Hide button labels on very small screens, keep icons */
        @media (max-width: 600px) {
            .btn-label-hide .p-button-label { display: none; }
            .btn-label-hide.p-button { padding: .5rem; }
        }
    `],
    template: `
        <app-base-page-template
            [loading]="store.loading() && !store.hasData()"
            [skeletonType]="'card'"
        >
            <div class="px-3 py-4 md:px-5">

                <!-- ── Header ─────────────────────────────────────────── -->
                <div class="page-header">
                    <div>
                        <h2 class="text-2xl md:text-3xl font-bold m-0">Mi Portfolio</h2>
                        <div class="flex align-items-center gap-2 mt-1">
                            <span class="live-dot" [class.connected]="store.wsConnected()" [class.disconnected]="!store.wsConnected()"></span>
                            @if (store.wsConnected()) {
                                <span class="text-green-500 text-sm font-medium">LIVE</span>
                            } @else if (store.lastPricesUpdated()) {
                                <span class="text-500 text-sm">
                                    Actualizado {{ store.lastPricesUpdated() | date: 'HH:mm:ss' }}
                                    @if (store.pricesLoading()) {
                                        <i class="pi pi-spin pi-spinner ml-1 text-xs"></i>
                                    }
                                </span>
                            } @else {
                                <span class="text-400 text-sm">Sin datos en tiempo real</span>
                            }
                        </div>
                    </div>
                    <div class="page-header-actions">
                        <p-button
                            icon="pi pi-question-circle"
                            severity="secondary"
                            [outlined]="true"
                            [rounded]="true"
                            pTooltip="Ayuda / Glosario"
                            (onClick)="showHelp.set(true)"
                        />
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
                            styleClass="btn-label-hide"
                            pTooltip="Importar extracto de bróker (CSV)"
                            (onClick)="openImport()"
                        />
                        <p-button
                            label="Nueva inversión"
                            icon="pi pi-plus"
                            styleClass="btn-label-hide"
                            (onClick)="openNew()"
                        />
                    </div>
                </div>

                <!-- ── KPI Cards ──────────────────────────────────────── -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

                    <div class="surface-card kpi-card border-round shadow-1">
                        <div class="flex align-items-center justify-between mb-3">
                            <span class="text-500 font-medium text-sm">Valor del portfolio</span>
                            <div class="surface-100 border-round p-2">
                                <i class="pi pi-wallet text-primary"></i>
                            </div>
                        </div>
                        <div class="kpi-value">
                            {{ resumen().valorTotal | number: '1.2-2' }} {{ monedaDisplay() }}
                        </div>
                        <div class="text-500 text-sm mt-1">
                            {{ resumen().cantidadPosiciones }} posicion{{ resumen().cantidadPosiciones === 1 ? '' : 'es' }}
                        </div>
                    </div>

                    <!-- Capital invertido -->
                    <div class="surface-card kpi-card border-round shadow-1">
                        <div class="flex align-items-center justify-between mb-3">
                            <span class="text-500 font-medium text-sm">Capital invertido</span>
                            <div class="surface-100 border-round p-2">
                                <i class="pi pi-arrow-down text-blue-500"></i>
                            </div>
                        </div>
                        <div class="kpi-value">
                            {{ resumen().valorInvertido | number: '1.2-2' }} {{ monedaDisplay() }}
                        </div>
                        <div class="text-500 text-sm mt-1">Precio medio de compra</div>
                    </div>

                    <!-- P&L total -->
                    <div class="surface-card kpi-card border-round shadow-1">
                        <div class="flex align-items-center justify-between mb-3">
                            <span class="text-500 font-medium text-sm">Ganancia / Pérdida</span>
                            <div class="surface-100 border-round p-2">
                                <i class="pi pi-chart-line"
                                   [class.text-green-500]="resumen().gananciaAbsoluta >= 0"
                                   [class.text-red-500]="resumen().gananciaAbsoluta < 0"></i>
                            </div>
                        </div>
                        <div class="kpi-value"
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
                    <div class="surface-card kpi-card border-round shadow-1">
                        <div class="flex align-items-center justify-between mb-3">
                            <span class="text-500 font-medium text-sm">Hoy</span>
                            <div class="surface-100 border-round p-2">
                                <i class="pi pi-clock text-orange-500"></i>
                            </div>
                        </div>
                        <div class="kpi-value"
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

                <!-- ── Portfolio chart (Trade Republic style) ─────────── -->
                @if (store.hasData()) {
                    <div class="surface-card shadow-1 border-round p-4 mb-4">

                        <!-- Top: P&L del período seleccionado -->
                        <div class="chart-period-header">
                            <div>
                                @if (store.chartData(); as cd) {
                                    <div class="text-2xl font-bold mb-1"
                                         [class.gain]="cd.rendimiento.gananciaAbsoluta >= 0"
                                         [class.loss]="cd.rendimiento.gananciaAbsoluta < 0">
                                        {{ cd.rendimiento.gananciaAbsoluta >= 0 ? '+' : '' }}{{ cd.rendimiento.gananciaAbsoluta | number: '1.2-2' }} {{ monedaDisplay() }}
                                    </div>
                                    <div class="text-sm"
                                         [class.gain]="cd.rendimiento.gananciaPorcentaje >= 0"
                                         [class.loss]="cd.rendimiento.gananciaPorcentaje < 0">
                                        {{ cd.rendimiento.gananciaPorcentaje >= 0 ? '+' : '' }}{{ cd.rendimiento.gananciaPorcentaje | number: '1.2-2' }}%
                                        <span class="text-400 ml-1">({{ cd.rendimiento.label }})</span>
                                    </div>
                                } @else {
                                    <p-skeleton width="10rem" height="2rem" styleClass="mb-1" />
                                    <p-skeleton width="6rem" height="1rem" />
                                }
                            </div>
                            <!-- Selector de período -->
                            <div class="period-selector">
                                @for (p of periodos; track p.key) {
                                    <button
                                        class="period-btn"
                                        [class.active]="store.selectedPeriodo() === p.key"
                                        (click)="selectPeriodo(p.key)"
                                    >{{ p.label }}</button>
                                }
                            </div>
                        </div>

                        <!-- Gráfica de línea -->
                        @if (store.chartLoading()) {
                            <p-skeleton height="140px" borderRadius="8px" />
                        } @else if (portfolioLineChart(); as lineData) {
                            <p-chart
                                type="line"
                                [data]="lineData"
                                [options]="portfolioLineOptions"
                                height="140"
                            />
                        } @else {
                            <div class="flex align-items-center justify-center" style="height:140px">
                                <div class="text-center text-500">
                                    <i class="pi pi-chart-line text-3xl mb-2 block"></i>
                                    <p class="text-sm m-0">Sin datos para este período</p>
                                    <p-button label="Reintentar" size="small" severity="secondary" [outlined]="true" styleClass="mt-2" (onClick)="selectPeriodo(store.selectedPeriodo())" />
                                </div>
                            </div>
                        }
                    </div>
                }

                <!-- ── Charts Row ──────────────────────────────────────── -->
                @if (store.hasData()) {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">

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
                            <p-button icon="pi pi-download" label="Exportar" severity="secondary" [outlined]="true" styleClass="btn-label-hide" (onClick)="exportCSV()" />
                        </ng-template>
                    </p-toolbar>

                    <div class="table-scroll-wrapper">
                    <p-table
                        [value]="posiciones()"
                        [loading]="store.loading()"
                        [loadingIcon]="'none'"
                        [rowHover]="true"
                        [sortField]="'gananciaPorcentaje'"
                        [sortOrder]="-1"
                        [tableStyle]="{ 'min-width': '60rem' }"
                        styleClass="p-datatable-sm"
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
                                <td>
                                    <div class="flex align-items-center gap-2">
                                        <i [class]="tipoIcon(pos.tipo)"
                                           [style.color]="tipoColor(pos.tipo)"
                                           style="font-size:1rem;flex-shrink:0"></i>
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

            <!-- ── Help Dialog ────────────────────────────────────────── -->
            <p-dialog
                header="Glosario · Mi Portfolio"
                [visible]="showHelp()"
                (visibleChange)="showHelp.set($event)"
                [modal]="true"
                [draggable]="false"
                [resizable]="false"
                [style]="{ width: '42rem', maxWidth: '95vw' }"
                styleClass="help-dialog"
            >
                <!-- KPIs -->
                <p class="help-section-title">Tarjetas resumen</p>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#6366f110">
                        <i class="pi pi-wallet" style="color:#6366f1"></i>
                    </div>
                    <div>
                        <div class="help-term">Valor del portfolio</div>
                        <div class="help-def">Suma del valor actual de mercado de todas tus posiciones (cantidad × precio actual). Refleja cuánto valen hoy tus inversiones si las vendieras todas.</div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#3b82f610">
                        <i class="pi pi-arrow-down" style="color:#3b82f6"></i>
                    </div>
                    <div>
                        <div class="help-term">Capital invertido</div>
                        <div class="help-def">Dinero total que pusiste en el mercado: suma de (cantidad × precio de compra) para todas las posiciones. Es tu coste base real.</div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#22c55e10">
                        <i class="pi pi-chart-line" style="color:#22c55e"></i>
                    </div>
                    <div>
                        <div class="help-term">Ganancia / Pérdida (P&amp;L total)</div>
                        <div class="help-def">Diferencia entre el valor actual del portfolio y el capital invertido. Positivo = estás en beneficio; negativo = en pérdida. El porcentaje muestra el rendimiento total acumulado sobre tu inversión.</div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#f9731610">
                        <i class="pi pi-clock" style="color:#f97316"></i>
                    </div>
                    <div>
                        <div class="help-term">Hoy (variación 24 h)</div>
                        <div class="help-def">Cuánto ha subido o bajado el valor total de tu portfolio respecto al cierre del día anterior. Se calcula aplicando la variación diaria de cada activo a la cantidad que posees.</div>
                    </div>
                </div>

                <p-divider />

                <!-- Tabla -->
                <p class="help-section-title">Columnas de la tabla de posiciones</p>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#8b5cf610">
                        <i class="pi pi-tag" style="color:#8b5cf6"></i>
                    </div>
                    <div>
                        <div class="help-term">Activo</div>
                        <div class="help-def">Nombre del instrumento financiero. Debajo aparece el <em>ticker</em> (símbolo bursátil, p. ej. <code>AAPL</code>, <code>BTC-USD</code>) y la plataforma donde lo tienes.</div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#06b6d410">
                        <i class="pi pi-th-large" style="color:#06b6d4"></i>
                    </div>
                    <div>
                        <div class="help-term">Tipo</div>
                        <div class="help-def">Categoría del activo: Acción, ETF, Criptomoneda, Bono, Fondo, Mercado privado, etc.</div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#64748b10">
                        <i class="pi pi-hashtag" style="color:#64748b"></i>
                    </div>
                    <div>
                        <div class="help-term">Cantidad</div>
                        <div class="help-def">Número de títulos, participaciones o monedas que posees. Para fracciones muestra hasta 8 decimales.</div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#64748b10">
                        <i class="pi pi-shopping-cart" style="color:#64748b"></i>
                    </div>
                    <div>
                        <div class="help-term">P. Compra (Precio de compra)</div>
                        <div class="help-def">Precio medio al que compraste el activo. Es el coste por unidad que usas como referencia para calcular la ganancia.</div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#64748b10">
                        <i class="pi pi-chart-bar" style="color:#64748b"></i>
                    </div>
                    <div>
                        <div class="help-term">P. Actual (Precio actual)</div>
                        <div class="help-def">Último precio de mercado obtenido en tiempo real vía WebSocket de Yahoo Finance. En verde si supera el precio de compra; en rojo si está por debajo.</div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#64748b10">
                        <i class="pi pi-wallet" style="color:#64748b"></i>
                    </div>
                    <div>
                        <div class="help-term">Valor</div>
                        <div class="help-def">Valor actual de la posición completa: <strong>cantidad × precio actual</strong>.</div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#22c55e10">
                        <i class="pi pi-percentage" style="color:#22c55e"></i>
                    </div>
                    <div>
                        <div class="help-term">P&amp;L por posición (Profit &amp; Loss)</div>
                        <div class="help-def">Ganancia o pérdida <em>no realizada</em> de esta posición concreta: <strong>valor actual − capital invertido</strong>. Muestra el importe absoluto y el porcentaje de retorno. Solo se materializa si vendes.</div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#f9731610">
                        <i class="pi pi-clock" style="color:#f97316"></i>
                    </div>
                    <div>
                        <div class="help-term">24 h</div>
                        <div class="help-def">Variación porcentual del precio entre el cierre de ayer y ahora mismo. Indica el movimiento del activo durante la jornada actual.</div>
                    </div>
                </div>

                <p-divider />

                <!-- Gráfica de evolución -->
                <p class="help-section-title">Gráfica de evolución del portfolio</p>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#22c55e10">
                        <i class="pi pi-chart-line" style="color:#22c55e"></i>
                    </div>
                    <div>
                        <div class="help-term">Línea de valor a lo largo del tiempo</div>
                        <div class="help-def">
                            Muestra cómo ha evolucionado el valor total de tu portfolio en el período seleccionado.
                            Cada punto equivale a <strong>suma(cantidad × precio histórico)</strong> para todas las posiciones activas en ese instante.
                            El último punto siempre usa el precio de mercado en tiempo real.
                            El color de la línea y del gradiente de relleno es <span style="color:#22c55e">verde</span> si el período es positivo y <span style="color:#ef4444">rojo</span> si es negativo.
                        </div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#6366f110">
                        <i class="pi pi-calendar" style="color:#6366f1"></i>
                    </div>
                    <div>
                        <div class="help-term">Selector de período (1D · 1 sem · 1 mes · 3 meses · Este año · 1 año)</div>
                        <div class="help-def">
                            Cambia el rango temporal de la gráfica. El número y el porcentaje encima de la gráfica reflejan
                            la ganancia/pérdida <em>dentro de ese período concreto</em>, no el P&amp;L total acumulado desde la compra.
                            <ul class="mt-1 mb-0 pl-3">
                                <li><strong>1D</strong> — desde el cierre oficial de ayer hasta ahora. Intervalos de 5 minutos.</li>
                                <li><strong>1 sem</strong> — últimos 5 días de mercado. Intervalos diarios.</li>
                                <li><strong>1 mes / 3 meses / 1 año</strong> — cierres diarios del período correspondiente.</li>
                                <li><strong>Este año</strong> — desde el 1 de enero del año en curso.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#f9731610">
                        <i class="pi pi-info-circle" style="color:#f97316"></i>
                    </div>
                    <div>
                        <div class="help-term">¿Cómo se trata cada posición?</div>
                        <div class="help-def">
                            <ul class="mt-0 mb-0 pl-3">
                                <li><strong>Comprada antes del inicio del período</strong> → se usa el primer cierre histórico disponible como precio de referencia inicial.</li>
                                <li><strong>Comprada durante el período</strong> → entra en la gráfica desde su fecha de compra usando el precio de compra registrado como base.</li>
                                <li><strong>Comprada después del período</strong> → no se incluye (era inexistente en esas fechas).</li>
                                <li><strong>Activos de mercado privado</strong> → excluidos de la gráfica y del cálculo de rendimiento por período (no tienen precio de mercado).</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#3b82f610">
                        <i class="pi pi-arrow-right-arrow-left" style="color:#3b82f6"></i>
                    </div>
                    <div>
                        <div class="help-term">Base de cálculo para 1D</div>
                        <div class="help-def">
                            El período de un día usa el <strong>cierre oficial de ayer</strong> (<code>chartPreviousClose</code> de Yahoo Finance) como punto de partida,
                            igual que lo hace tu broker. Esto evita que la apertura del mercado deje un gap visual respecto al verdadero cambio diario.
                        </div>
                    </div>
                </div>

                <p-divider />

                <!-- Gráficos -->
                <p class="help-section-title">Gráficos de distribución</p>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#6366f110">
                        <i class="pi pi-chart-pie" style="color:#6366f1"></i>
                    </div>
                    <div>
                        <div class="help-term">Distribución por tipo</div>
                        <div class="help-def">Gráfico donut que muestra qué porcentaje del valor total de tu portfolio representa cada categoría de activo (acciones, ETFs, cripto…).</div>
                    </div>
                </div>

                <div class="help-row">
                    <div class="help-icon-wrap" style="background:#22c55e10">
                        <i class="pi pi-chart-bar" style="color:#22c55e"></i>
                    </div>
                    <div>
                        <div class="help-term">P&amp;L por posición (%)</div>
                        <div class="help-def">Gráfico de barras con el rendimiento porcentual de cada posición. Barras verdes = en beneficio; rojas = en pérdida. Ordenadas de mayor a menor retorno.</div>
                    </div>
                </div>

                <p-divider />

                <!-- Indicadores -->
                <p class="help-section-title">Indicadores de estado</p>

                <div class="help-row">
                    <div style="padding-top:.4rem">
                        <span class="live-dot connected" style="display:inline-block"></span>
                    </div>
                    <div>
                        <div class="help-term">LIVE (punto verde pulsante)</div>
                        <div class="help-def">El portfolio está recibiendo actualizaciones de precio en tiempo real vía WebSocket. Los precios se actualizan automáticamente cada vez que el mercado mueve el activo, sin necesidad de recargar.</div>
                    </div>
                </div>

                <div class="help-row">
                    <div style="padding-top:.4rem">
                        <span class="live-dot disconnected" style="display:inline-block"></span>
                    </div>
                    <div>
                        <div class="help-term">Sin conexión en tiempo real (punto gris)</div>
                        <div class="help-def">El WebSocket está desconectado. Los precios muestran el último valor conocido. Usa el botón <strong>Actualizar precios</strong> para obtener datos frescos via REST, o espera a que reconecte automáticamente.</div>
                    </div>
                </div>

                <ng-template pTemplate="footer">
                    <p-button label="Cerrar" icon="pi pi-times" severity="secondary" (onClick)="showHelp.set(false)" />
                </ng-template>
            </p-dialog>
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
    showHelp = signal(false);
    currentInversion = signal<Partial<InversionConPrecio> | null>(null);

    readonly periodos = PERIODOS;

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

    // ── Chart computed ───────────────────────────────────────────────────
    portfolioLineChart = computed(() => {
        const cd = this.store.chartData();
        if (!cd?.labels.length) return null;
        const isGain = (cd.rendimiento.gananciaAbsoluta ?? 0) >= 0;
        const color  = isGain ? '#22c55e' : '#ef4444';
        return {
            labels: cd.labels,
            datasets: [{
                data: cd.values,
                borderColor: color,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                tension: 0.3,
                fill: true,
                backgroundColor: (ctx: any) => {
                    const canvas = ctx.chart?.canvas;
                    if (!canvas) return color + '20';
                    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, canvas.height);
                    gradient.addColorStop(0, color + '40');
                    gradient.addColorStop(1, color + '00');
                    return gradient;
                }
            }]
        };
    });

    readonly portfolioLineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => ` ${ctx.parsed.y.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { maxTicksLimit: 8, maxRotation: 0, font: { size: 11 } }
            },
            y: {
                position: 'right' as const,
                grid: { color: 'rgba(0,0,0,.04)' },
                ticks: {
                    font: { size: 11 },
                    callback: (v: any) => v.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                }
            }
        }
    };

    // ── Chart computed (donut / bar) ────────────────────────────────────────
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

    // ── Auto-refresh: replaced by WebSocket realtime ─────────────────────────

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.store.loadInversiones();
        const unsub = setInterval(() => {
            if (this.store.hasData()) {
                clearInterval(unsub);
                this.store.refreshPrices();
                setTimeout(() => this.store.startRealtime(), 800);
                // Cargar gráfica del período por defecto (1M) una vez haya precios
                setTimeout(() => this.store.selectPeriodoAndLoadChart('1M'), 2000);
            }
        }, 300);
    }

    ngOnDestroy(): void {
        this.store.stopRealtime();
    }

    // ── Actions ──────────────────────────────────────────────────────────────
    selectPeriodo(key: string): void {
        this.store.selectPeriodoAndLoadChart(key as any);
    }

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
