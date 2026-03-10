import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface CotizacionActivo {
    ticker: string;
    nombre: string;
    precioActual: number;
    moneda: string;
    /** Variación porcentual respecto al cierre anterior (≈ 24h en días hábiles) */
    variacion24h: number;
    variacion24hAbsoluta: number;
    ultimaActualizacion: Date;
}

// ── Yahoo Finance v8 chart endpoint ────────────────────────────────────────
// Funciona desde el navegador sin API key.
// Para producción con nginx, puedes proxear el dominio:
//   location /yahoo-finance/ {
//       proxy_pass https://query2.finance.yahoo.com/;
//       proxy_set_header Host query2.finance.yahoo.com;
//   }
//
// Tickers soportados:
//   Acciones / ETFs:   AAPL · MSFT · NVDA · SPY · QQQ · IWDA.AS
//   Criptomonedas:     BTC-USD · ETH-USD · SOL-USD · BNB-USD
//   Bonos (ETF proxy): TLT · IEF · AGG
// ───────────────────────────────────────────────────────────────────────────

interface YahooChartMeta {
    currency: string;
    symbol: string;
    shortName?: string;
    longName?: string;
    regularMarketPrice: number;
    previousClose?: number;
    chartPreviousClose?: number;
    regularMarketChangePercent?: number;
}

interface YahooChartResponse {
    chart: {
        result: Array<{ meta: YahooChartMeta }> | null;
        error: unknown;
    };
}

/**
 * Servicio de datos de mercado en tiempo real.
 * Fuente: Yahoo Finance API pública (sin API key).
 *
 * Para activos de tipo "mercado_privado" no se llama a la API
 * — el precio debe actualizarse manualmente.
 */
@Injectable({
    providedIn: 'root'
})
export class MarketDataService {
    private readonly http = inject(HttpClient);

    private readonly yahooChartUrl = 'https://query2.finance.yahoo.com/v8/finance/chart';

    /**
     * Obtiene la cotización actual de varios tickers en paralelo.
     * Los tickers no reconocidos o con errores devuelven `null` en su posición.
     */
    getCotizaciones(tickers: string[]): Observable<CotizacionActivo[]> {
        if (!tickers.length) return of([]);

        const calls: Observable<CotizacionActivo | null>[] = tickers.map((ticker) =>
            this.getCotizacion(ticker)
        );

        return forkJoin(calls).pipe(
            map((results) => results.filter((r): r is CotizacionActivo => r !== null))
        );
    }

    /** Obtiene la cotización de un único ticker */
    getCotizacion(ticker: string): Observable<CotizacionActivo | null> {
        const url = `${this.yahooChartUrl}/${encodeURIComponent(ticker)}?interval=1d&range=1d`;

        return this.http.get<YahooChartResponse>(url).pipe(
            map((response) => {
                const result = response?.chart?.result?.[0];
                if (!result) return null;

                const meta = result.meta;
                const prev = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
                const varPct = meta.regularMarketChangePercent
                    ?? ((meta.regularMarketPrice - prev) / prev) * 100;
                const varAbs = meta.regularMarketPrice - prev;

                return {
                    ticker: meta.symbol,
                    nombre: meta.shortName ?? meta.longName ?? meta.symbol,
                    precioActual: meta.regularMarketPrice,
                    moneda: meta.currency,
                    variacion24h: varPct,
                    variacion24hAbsoluta: varAbs,
                    ultimaActualizacion: new Date()
                } satisfies CotizacionActivo;
            }),
            catchError(() => of(null))
        );
    }
}
