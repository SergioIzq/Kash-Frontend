import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Inversion } from '@/core/models/inversion.model';

// ── Tipos públicos ──────────────────────────────────────────────────────────

export type PeriodoKey = '1D' | '1S' | '1M' | '3M' | 'YTD' | '1A';

export interface RendimientoPeriodo {
    periodo: PeriodoKey;
    label: string;
    gananciaAbsoluta: number;
    gananciaPorcentaje: number;
    valorInicio: number;
    valorFin: number;
}

export interface PortfolioChartData {
    periodo: PeriodoKey;
    rendimiento: RendimientoPeriodo;
    /** Etiquetas del eje X (hora para 1D, fechas para el resto) */
    labels: string[];
    /** Valor total del portfolio en cada punto temporal */
    values: number[];
    cargando: boolean;
}

// ── Yahoo Finance chart response ────────────────────────────────────────────

interface YahooQuote { close: (number | null)[]; }
interface YahooChartResult {
    meta: {
        currency: string;
        symbol: string;
        regularMarketPrice: number;
        chartPreviousClose: number;
        regularMarketPreviousClose?: number;
    };
    timestamp: number[];
    indicators: { quote: YahooQuote[] };
}
interface YahooChartResponse { chart: { result: YahooChartResult[] | null; error: unknown }; }

// ── Configuración de períodos ───────────────────────────────────────────────

export const PERIODOS: { key: PeriodoKey; label: string; interval: string; range: string }[] = [
    { key: '1D',  label: '1D',        interval: '5m',  range: '1d'  },
    { key: '1S',  label: '1 sem',     interval: '1d',  range: '5d'  },
    { key: '1M',  label: '1 mes',     interval: '1d',  range: '1mo' },
    { key: '3M',  label: '3 meses',   interval: '1d',  range: '3mo' },
    { key: 'YTD', label: 'Este año',  interval: '1d',  range: 'ytd' },
    { key: '1A',  label: '1 año',     interval: '1d',  range: '1y'  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatLabel(ts: number, periodo: PeriodoKey): string {
    const d = new Date(ts * 1000);
    if (periodo === '1D') {
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    if (periodo === '1S') {
        return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ── Servicio ────────────────────────────────────────────────────────────────

/**
 * Obtiene datos históricos de Yahoo Finance para construir la gráfica de
 * evolución del portfolio y calcular el rendimiento en un período dado.
 *
 * Lógica de posiciones:
 *  - Si el activo fue comprado ANTES del inicio del período → usa el primer
 *    cierre histórico disponible como precio de referencia.
 *  - Si fue comprado DURANTE el período → aparece en la gráfica desde su
 *    fecha de compra usando el precioCompra del usuario como base.
 *  - Si fue comprado DESPUÉS del período → se ignora.
 */
@Injectable({ providedIn: 'root' })
export class PortfolioPerformanceService {
    private readonly http = inject(HttpClient);
    private readonly yahooUrl = '/v8/finance/chart';

    /**
     * Devuelve puntos de la gráfica + rendimiento para un período concreto.
     */
    getChartData(
        periodo: PeriodoKey,
        inversiones: Inversion[],
        cotizacionesActuales: Record<string, number>
    ): Observable<PortfolioChartData> {
        const config = PERIODOS.find((p) => p.key === periodo)!;
        const tickers = [...new Set(
            inversiones
                .filter((inv) => inv.tipo !== 'mercado_privado' && inv.ticker)
                .map((inv) => inv.ticker.toUpperCase())
        )];

        if (!tickers.length) return of(this.emptyChart(periodo));

        return forkJoin(tickers.map((t) => this.fetchOHLC(t, config.interval, config.range))).pipe(
            map((results) => {
                const hist: Record<string, YahooChartResult> = {};
                tickers.forEach((t, i) => { if (results[i]) hist[t] = results[i]!; });
                return this.buildChartData(periodo, inversiones, cotizacionesActuales, hist);
            }),
            catchError(() => of(this.emptyChart(periodo)))
        );
    }

    /**
     * Calcula rendimiento para TODOS los períodos en una sola ronda de peticiones
     * (range=1y cubre todos los períodos excepto 1D – que usa el rendimiento del store).
     */
    getAllRendimientos(
        inversiones: Inversion[],
        cotizacionesActuales: Record<string, number>
    ): Observable<RendimientoPeriodo[]> {
        const tickers = [...new Set(
            inversiones
                .filter((inv) => inv.tipo !== 'mercado_privado' && inv.ticker)
                .map((inv) => inv.ticker.toUpperCase())
        )];
        if (!tickers.length) return of([]);

        return forkJoin(tickers.map((t) => this.fetchOHLC(t, '1d', '1y'))).pipe(
            map((results) => {
                const hist: Record<string, YahooChartResult> = {};
                tickers.forEach((t, i) => { if (results[i]) hist[t] = results[i]!; });
                return PERIODOS.map((p) =>
                    this.buildChartData(p.key, inversiones, cotizacionesActuales, hist).rendimiento
                );
            }),
            catchError(() => of([]))
        );
    }

    // ── Privado ─────────────────────────────────────────────────────────────

    private fetchOHLC(ticker: string, interval: string, range: string): Observable<YahooChartResult | null> {
        const url = `${this.yahooUrl}/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
        return this.http.get<YahooChartResponse>(url).pipe(
            map((r) => r?.chart?.result?.[0] ?? null),
            catchError(() => of(null))
        );
    }

    private buildChartData(
        periodo: PeriodoKey,
        inversiones: Inversion[],
        cotizacionesActuales: Record<string, number>,
        histories: Record<string, YahooChartResult>
    ): PortfolioChartData {
        // Unión de todos los timestamps disponibles
        const allTs = new Set<number>();
        for (const h of Object.values(histories)) h.timestamp.forEach((t) => allTs.add(t));
        const sortedTs = [...allTs].sort((a, b) => a - b);

        if (!sortedTs.length) return this.emptyChart(periodo);

        const labels: string[] = [];
        const values: number[] = [];

        for (const ts of sortedTs) {
            let total = 0;
            let hasData = false;

            for (const inv of inversiones) {
                if (inv.tipo === 'mercado_privado') continue;
                const ticker = inv.ticker.toUpperCase();
                // Excluir posiciones que aún no existían en este punto
                if (new Date(inv.fechaCompra).getTime() / 1000 > ts) continue;

                const h = histories[ticker];
                if (!h) {
                    const p = cotizacionesActuales[ticker];
                    if (p) { total += inv.cantidad * p; hasData = true; }
                    continue;
                }

                // Cierre más reciente sin superar el timestamp actual
                const closes = h.indicators.quote[0].close;
                let precio: number | null = null;
                for (let i = h.timestamp.length - 1; i >= 0; i--) {
                    if (h.timestamp[i] <= ts && closes[i] != null) { precio = closes[i]; break; }
                }

                if (precio != null) { total += inv.cantidad * precio; hasData = true; }
            }

            if (hasData) {
                labels.push(formatLabel(ts, periodo));
                values.push(Math.round(total * 100) / 100);
            }
        }

        // Sustituir el último punto por precio de mercado actual (tiempo real)
        if (values.length > 0) {
            let fin = 0;
            for (const inv of inversiones) {
                if (inv.tipo === 'mercado_privado') continue;
                const p = cotizacionesActuales[inv.ticker.toUpperCase()];
                if (p) fin += inv.cantidad * p;
            }
            if (fin > 0) {
                values[values.length - 1] = Math.round(fin * 100) / 100;
                labels[labels.length - 1] = 'Ahora';
            }
        }

        // Para 1D usamos el cierre oficial de ayer (chartPreviousClose) como base,
        // no el primer candle intradía (apertura de hoy). El resto de períodos
        // usan el primer punto histórico disponible.
        let valorInicio = values[0] ?? 0;
        if (periodo === '1D') {
            let prevCloseTotal = 0;
            let hasPrevClose = false;
            for (const inv of inversiones) {
                if (inv.tipo === 'mercado_privado') continue;
                const ticker = inv.ticker.toUpperCase();
                const prevClose = histories[ticker]?.meta?.chartPreviousClose
                    ?? histories[ticker]?.meta?.regularMarketPreviousClose;
                if (prevClose) {
                    prevCloseTotal += inv.cantidad * prevClose;
                    hasPrevClose = true;
                }
            }
            if (hasPrevClose) valorInicio = Math.round(prevCloseTotal * 100) / 100;
        }

        const valorFin           = values[values.length - 1] ?? 0;
        const gananciaAbsoluta   = valorFin - valorInicio;
        const gananciaPorcentaje = valorInicio > 0 ? (gananciaAbsoluta / valorInicio) * 100 : 0;

        return {
            periodo,
            rendimiento: {
                periodo,
                label: PERIODOS.find((p) => p.key === periodo)!.label,
                gananciaAbsoluta,
                gananciaPorcentaje,
                valorInicio,
                valorFin
            },
            labels,
            values,
            cargando: false
        };
    }

    private emptyChart(periodo: PeriodoKey): PortfolioChartData {
        return {
            periodo,
            rendimiento: {
                periodo,
                label: PERIODOS.find((p) => p.key === periodo)!.label,
                gananciaAbsoluta: 0,
                gananciaPorcentaje: 0,
                valorInicio: 0,
                valorFin: 0
            },
            labels: [],
            values: [],
            cargando: false
        };
    }
}
