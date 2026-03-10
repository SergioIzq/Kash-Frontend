import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, firstValueFrom, Subscription } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { InversionService } from '@/core/services/api/inversion.service';
import { MarketDataService, CotizacionActivo } from '../services/market-data.service';
import { RealtimeMarketDataService } from '../services/realtime-market-data.service';
import { PortfolioPerformanceService, RendimientoPeriodo, PortfolioChartData, PeriodoKey } from '../services/portfolio-performance.service';
import { Inversion, InversionCreate, InversionConPrecio, ResumenPortfolio, TIPOS_INVERSION_CONFIG, BrokerFormat, ImportarExtractoResult } from '@/core/models/inversion.model';

interface InversionesState {
    inversiones: Inversion[];
    cotizaciones: Record<string, CotizacionActivo>;
    rendimientos: RendimientoPeriodo[];
    chartData: PortfolioChartData | null;
    selectedPeriodo: PeriodoKey;
    loading: boolean;
    pricesLoading: boolean;
    rendimientosLoading: boolean;
    chartLoading: boolean;
    importing: boolean;
    wsConnected: boolean;
    error: string | null;
    lastUpdated: number | null;
    lastPricesUpdated: number | null;
}

const initialState: InversionesState = {
    inversiones: [],
    cotizaciones: {},
    rendimientos: [],
    chartData: null,
    selectedPeriodo: '1M',
    loading: false,
    pricesLoading: false,
    rendimientosLoading: false,
    chartLoading: false,
    importing: false,
    wsConnected: false,
    error: null,
    lastUpdated: null,
    lastPricesUpdated: null
};

export const InversionesStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),

    withComputed((store) => ({
        /** Inversiones enriquecidas con datos de mercado */
        inversionesConPrecio: computed((): InversionConPrecio[] => {
            const inversiones = store.inversiones();
            const cotizaciones = store.cotizaciones();
            const pricesLoading = store.pricesLoading();

            return inversiones.map((inv) => {
                const cot = cotizaciones[inv.ticker.toUpperCase()];
                const valorInvertido = inv.cantidad * inv.precioCompra;

                if (!cot) {
                    // No hay precio de mercado todavía
                    const sinPrecio = inv.tipo === 'mercado_privado';
                    return {
                        ...inv,
                        precioActual: null,
                        valorActual: null,
                        valorInvertido,
                        gananciaAbsoluta: null,
                        gananciaPorcentaje: null,
                        variacion24h: null,
                        variacion24hAbsoluta: null,
                        cargandoPrecio: !sinPrecio && pricesLoading,
                        ultimaActualizacion: null
                    };
                }

                const precioActual = cot.precioActual;
                const valorActual = inv.cantidad * precioActual;
                const gananciaAbsoluta = valorActual - valorInvertido;
                const gananciaPorcentaje = ((precioActual - inv.precioCompra) / inv.precioCompra) * 100;

                return {
                    ...inv,
                    precioActual,
                    valorActual,
                    valorInvertido,
                    gananciaAbsoluta,
                    gananciaPorcentaje,
                    variacion24h: cot.variacion24h,
                    variacion24hAbsoluta: cot.variacion24hAbsoluta * inv.cantidad,
                    cargandoPrecio: false,
                    ultimaActualizacion: cot.ultimaActualizacion
                };
            });
        }),

        hasData: computed(() => store.inversiones().length > 0)
    })),

    withComputed((store) => ({
        /** Resumen del portfolio (KPIs) */
        resumenPortfolio: computed((): ResumenPortfolio => {
            const posiciones = store.inversionesConPrecio();
            const conPrecio = posiciones.filter((p) => p.valorActual !== null);

            const valorTotal = conPrecio.reduce((s, p) => s + (p.valorActual ?? 0), 0);
            const valorInvertido = posiciones.reduce((s, p) => s + p.valorInvertido, 0);
            const valorInvertidoConPrecio = conPrecio.reduce((s, p) => s + p.valorInvertido, 0);
            const gananciaAbsoluta = valorTotal - valorInvertidoConPrecio;
            const gananciaPorcentaje = valorInvertidoConPrecio > 0
                ? (gananciaAbsoluta / valorInvertidoConPrecio) * 100
                : 0;
            const variacion24hAbsoluta = conPrecio.reduce((s, p) => s + (p.variacion24hAbsoluta ?? 0), 0);
            const variacion24hPorcentaje = valorTotal - variacion24hAbsoluta > 0
                ? (variacion24hAbsoluta / (valorTotal - variacion24hAbsoluta)) * 100
                : 0;

            return {
                valorTotal,
                valorInvertido,
                gananciaAbsoluta,
                gananciaPorcentaje,
                variacion24hAbsoluta,
                variacion24hPorcentaje,
                cantidadPosiciones: posiciones.length
            };
        }),

        /** Distribución del valor actual por tipo de activo (para gráfico donut) */
        distribucionPorTipo: computed((): { labels: string[]; data: number[]; colors: string[] } => {
            const posiciones = store.inversionesConPrecio();
            const grouped: Record<string, number> = {};

            for (const pos of posiciones) {
                const valor = pos.valorActual ?? pos.valorInvertido;
                grouped[pos.tipo] = (grouped[pos.tipo] ?? 0) + valor;
            }

            const sortedEntries = Object.entries(grouped).sort(([, a], [, b]) => b - a);
            const labels: string[] = [];
            const data: number[] = [];
            const colors: string[] = [];

            for (const [tipo, valor] of sortedEntries) {
                const config = TIPOS_INVERSION_CONFIG.find((t) => t.value === tipo);
                labels.push(config?.label ?? tipo);
                data.push(Math.round(valor * 100) / 100);
                colors.push(config?.color ?? '#6B7280');
            }

            return { labels, data, colors };
        })
    })),

    withMethods((store, inversionService = inject(InversionService), marketDataService = inject(MarketDataService), realtimeService = inject(RealtimeMarketDataService), performanceService = inject(PortfolioPerformanceService)) => {
        let rtSub: Subscription | null = null;
        let connSub: Subscription | null = null;

        return ({
        loadInversiones: rxMethod<void>(
            pipe(
                tap(() => patchState(store, { loading: true, error: null })),
                switchMap(() =>
                    inversionService.getAllInversiones().pipe(
                        tapResponse({
                            next: (inversiones) => {
                                patchState(store, { inversiones, loading: false, lastUpdated: Date.now() });
                            },
                            error: (err: any) =>
                                patchState(store, { loading: false, error: err.userMessage || 'Error al cargar inversiones' })
                        })
                    )
                )
            )
        ),

        refreshPrices: rxMethod<void>(
            pipe(
                tap(() => {
                    const tickers = store
                        .inversiones()
                        .filter((inv) => inv.tipo !== 'mercado_privado' && inv.ticker)
                        .map((inv) => inv.ticker.toUpperCase());

                    if (!tickers.length) return;

                    patchState(store, { pricesLoading: true });
                }),
                switchMap(() => {
                    const tickers = store
                        .inversiones()
                        .filter((inv) => inv.tipo !== 'mercado_privado' && inv.ticker)
                        .map((inv) => inv.ticker.toUpperCase());

                    if (!tickers.length) return [[]];

                    return marketDataService.getCotizaciones(tickers).pipe(
                        tapResponse({
                            next: (cotizaciones) => {
                                const map: Record<string, CotizacionActivo> = {};
                                for (const c of cotizaciones) {
                                    map[c.ticker.toUpperCase()] = c;
                                }
                                patchState(store, {
                                    cotizaciones: map,
                                    pricesLoading: false,
                                    lastPricesUpdated: Date.now()
                                });
                            },
                            error: () => patchState(store, { pricesLoading: false })
                        })
                    );
                })
            )
        ),

        loadRendimientos: rxMethod<void>(
            pipe(
                tap(() => patchState(store, { rendimientosLoading: true })),
                switchMap(() => {
                    const inversiones = store.inversiones().filter((inv) => inv.tipo !== 'mercado_privado');
                    const cotizaciones = store.cotizaciones();
                    const preciosActuales: Record<string, number> = {};
                    for (const [ticker, cot] of Object.entries(cotizaciones)) {
                        preciosActuales[ticker] = cot.precioActual;
                    }

                    if (!inversiones.length || !Object.keys(preciosActuales).length) {
                        patchState(store, { rendimientosLoading: false });
                        return [[]];
                    }

                    return performanceService.getAllRendimientos(inversiones, preciosActuales).pipe(
                        tapResponse({
                            next: (rendimientos) => patchState(store, { rendimientos, rendimientosLoading: false }),
                            error: () => patchState(store, { rendimientosLoading: false })
                        })
                    );
                })
            )
        ),

        selectPeriodoAndLoadChart: rxMethod<PeriodoKey>(
            pipe(
                tap((periodo) => patchState(store, { selectedPeriodo: periodo, chartLoading: true })),
                switchMap((periodo) => {
                    const inversiones = store.inversiones().filter((inv) => inv.tipo !== 'mercado_privado');
                    const cotizaciones = store.cotizaciones();
                    const preciosActuales: Record<string, number> = {};
                    for (const [ticker, cot] of Object.entries(cotizaciones)) {
                        preciosActuales[ticker] = cot.precioActual;
                    }

                    if (!inversiones.length || !Object.keys(preciosActuales).length) {
                        patchState(store, { chartLoading: false });
                        return [null];
                    }

                    return performanceService.getChartData(periodo, inversiones, preciosActuales).pipe(
                        tapResponse({
                            next: (chartData) => patchState(store, { chartData, chartLoading: false }),
                            error: () => patchState(store, { chartLoading: false })
                        })
                    );
                })
            )
        ),

        async createInversion(inversion: InversionCreate): Promise<string> {
            const tempId = `temp_${Date.now()}`;
            const tempInversion: Inversion = {
                id: tempId,
                usuarioId: '',
                ...inversion
            };

            patchState(store, { inversiones: [tempInversion, ...store.inversiones()], error: null });

            try {
                const newId = await firstValueFrom(inversionService.create(inversion));
                patchState(store, {
                    inversiones: store.inversiones().map((i) => (i.id === tempId ? { ...tempInversion, id: newId } : i)),
                    lastUpdated: Date.now()
                });
                return newId;
            } catch (err: any) {
                patchState(store, {
                    inversiones: store.inversiones().filter((i) => i.id !== tempId),
                    error: err.userMessage || 'Error al crear inversión'
                });
                throw err;
            }
        },

        async updateInversion(payload: { id: string; inversion: Partial<Inversion> }): Promise<void> {
            const { id, inversion } = payload;
            const anterior = store.inversiones().find((i) => i.id === id);
            patchState(store, {
                inversiones: store.inversiones().map((i) => (i.id === id ? { ...i, ...inversion } : i)),
                loading: true,
                error: null
            });

            try {
                await firstValueFrom(inversionService.update(id, inversion));
                patchState(store, { loading: false, lastUpdated: Date.now() });
            } catch (err: any) {
                if (anterior) {
                    patchState(store, { inversiones: store.inversiones().map((i) => (i.id === id ? anterior : i)) });
                }
                patchState(store, { loading: false, error: err.userMessage || 'Error al actualizar inversión' });
                throw err;
            }
        },

        async deleteInversion(id: string): Promise<void> {
            const anterior = store.inversiones();
            patchState(store, { inversiones: anterior.filter((i) => i.id !== id) });

            try {
                await firstValueFrom(inversionService.delete(id));
                patchState(store, { lastUpdated: Date.now() });
            } catch (err: any) {
                patchState(store, { inversiones: anterior, error: err.userMessage || 'Error al eliminar inversión' });
                throw err;
            }
        },

        async importarExtracto(brokerFormat: BrokerFormat, file: File): Promise<ImportarExtractoResult> {
            patchState(store, { importing: true, error: null });
            try {
                const result = await firstValueFrom(inversionService.importarExtracto(brokerFormat, file));
                // Reload persisted inversiones so newly imported ones appear
                const inversiones = await firstValueFrom(inversionService.getAllInversiones());
                patchState(store, { inversiones, importing: false, lastUpdated: Date.now() });
                return result;
            } catch (err: any) {
                patchState(store, { importing: false, error: err.userMessage || 'Error al importar el extracto' });
                throw err;
            }
        },

        /** Inicia la conexión WebSocket de tiempo real para los tickers del portfolio. */
        startRealtime(): void {
            const tickers = store
                .inversiones()
                .filter((inv) => inv.tipo !== 'mercado_privado' && inv.ticker)
                .map((inv) => inv.ticker.toUpperCase());

            if (!tickers.length) return;

            // Desuscribirse si ya había una conexión previa
            rtSub?.unsubscribe();
            connSub?.unsubscribe();

            // Estado de conexión
            connSub = realtimeService.connected$.subscribe((connected) => {
                patchState(store, { wsConnected: connected });
            });

            // Actualizaciones de precio en tiempo real
            rtSub = realtimeService.suscribir(tickers).subscribe((cotizacion) => {
                const current = { ...store.cotizaciones() };
                const prev = current[cotizacion.ticker];
                current[cotizacion.ticker] = {
                    ticker:              cotizacion.ticker,
                    nombre:              cotizacion.nombre  ?? prev?.nombre  ?? cotizacion.ticker,
                    precioActual:        cotizacion.precioActual,
                    moneda:              cotizacion.moneda  ?? prev?.moneda  ?? '',
                    variacion24h:        cotizacion.variacion24h,
                    variacion24hAbsoluta: cotizacion.variacion24hAbsoluta,
                    ultimaActualizacion: cotizacion.ultimaActualizacion
                };
                patchState(store, { cotizaciones: current, lastPricesUpdated: Date.now() });
            });
        },

        /** Detiene la conexión WebSocket. */
        stopRealtime(): void {
            rtSub?.unsubscribe();
            connSub?.unsubscribe();
            rtSub = null;
            connSub = null;
            patchState(store, { wsConnected: false });
        },

        clearError(): void {
            patchState(store, { error: null });
        }
    });
    })
);
