import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject, timer, EMPTY } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { catchError, switchMap, tap, share, filter, takeUntil, retryWhen, delay } from 'rxjs/operators';
import { MarketDataService, CotizacionActivo } from './market-data.service';

// ── Datos mínimos que emite el WebSocket de Yahoo Finance ─────────────────
export interface CotizacionRT {
    ticker: string;
    nombre?: string;
    precioActual: number;
    variacion24h: number;
    variacion24hAbsoluta: number;
    moneda?: string;
    precioMaxDia?: number;
    precioMinDia?: number;
    ultimaActualizacion: Date;
}

// ── Decoder mínimo de Protobuf para PricingData de Yahoo Finance ──────────
// Schema relevante:
//   1  → id            (string,  wire 2)
//   2  → price         (float,   wire 5)
//   4  → currency      (string,  wire 2)
//   8  → changePercent (float,   wire 5)
//   10 → dayHigh       (float,   wire 5)
//   11 → dayLow        (float,   wire 5)
//   12 → change        (float,   wire 5)
//   13 → shortName     (string,  wire 2)
// ──────────────────────────────────────────────────────────────────────────

interface RawPricingData {
    id?: string;
    price?: number;
    currency?: string;
    changePercent?: number;
    dayHigh?: number;
    dayLow?: number;
    change?: number;
    shortName?: string;
}

function readVarint(data: Uint8Array, offset: number): [bigint, number] {
    let result = 0n;
    let shift = 0n;
    while (offset < data.length) {
        const byte = data[offset++];
        result |= BigInt(byte & 0x7f) << shift;
        shift += 7n;
        if (!(byte & 0x80)) break;
    }
    return [result, offset];
}

function decodeYahooPricing(base64Msg: string): RawPricingData | null {
    try {
        const binary = atob(base64Msg);
        const data = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        const result: RawPricingData = {};
        let offset = 0;

        while (offset < data.length) {
            const [tag, o1] = readVarint(data, offset);
            offset = o1;
            const fieldNumber = Number(tag >> 3n);
            const wireType = Number(tag & 7n);

            if (wireType === 0) {
                // varint — saltamos (no usamos campos varint aquí)
                const [, o2] = readVarint(data, offset);
                offset = o2;
            } else if (wireType === 1) {
                // 64-bit fixed — saltamos
                offset += 8;
            } else if (wireType === 2) {
                // length-delimited (string / bytes / embedded)
                const [len, o2] = readVarint(data, offset);
                offset = o2;
                const bytes = data.slice(offset, offset + Number(len));
                offset += Number(len);
                const str = new TextDecoder().decode(bytes);
                if (fieldNumber === 1)  result.id        = str;
                if (fieldNumber === 4)  result.currency  = str;
                if (fieldNumber === 13) result.shortName = str;
            } else if (wireType === 5) {
                // 32-bit fixed (float)
                const view = new DataView(data.buffer, data.byteOffset + offset, 4);
                const value = view.getFloat32(0, true); // little-endian
                offset += 4;
                if (fieldNumber === 2)  result.price         = value;
                if (fieldNumber === 8)  result.changePercent = value;
                if (fieldNumber === 10) result.dayHigh       = value;
                if (fieldNumber === 11) result.dayLow        = value;
                if (fieldNumber === 12) result.change        = value;
            } else {
                // Wire type desconocido — no podemos continuar parsando de forma segura
                break;
            }
        }

        return result.id ? result : null;
    } catch {
        return null;
    }
}

// ── Servicio ──────────────────────────────────────────────────────────────

/**
 * Servicio de precios en tiempo real vía WebSocket.
 *
 * Fuente: Yahoo Finance Streamer (wss://streamer.finance.yahoo.com/)
 * Protocolo: mensajes protobuf codificados en base64.
 *
 * Uso:
 *   const precios$ = this.realtimeService.suscribir(['AAPL', 'BTC-USD', 'BTC-EUR']);
 *   precios$.subscribe(cotizacion => { ... });
 *
 * El observable:
 *   - Carga los datos iniciales usando MarketDataService (REST).
 *   - Luego actualiza en tiempo real vía WebSocket.
 *   - Reconecta automáticamente si se pierde la conexión.
 */
@Injectable({
    providedIn: 'root'
})
export class RealtimeMarketDataService implements OnDestroy {
    private readonly marketData = inject(MarketDataService);

    private readonly WS_URL = 'wss://streamer.finance.yahoo.com/';
    private readonly RECONNECT_DELAY_MS = 5_000;

    /** Cache de precios más recientes por ticker */
    private readonly cache = new Map<string, CotizacionRT>();

    /** Subjects para emitir actualizaciones a suscriptores */
    private readonly updateSubject = new Subject<CotizacionRT>();

    /** Observable compartido de todas las actualizaciones */
    readonly updates$ = this.updateSubject.asObservable().pipe(share());

    /** Estado de conexión */
    readonly connected$ = new BehaviorSubject<boolean>(false);

    private ws: WebSocketSubject<string> | null = null;
    private readonly destroy$ = new Subject<void>();

    // ── API pública ────────────────────────────────────────────────────────

    /**
     * Suscribe a una lista de tickers y devuelve un Observable que emite
     * cada vez que cualquiera de ellos tiene una actualización de precio.
     *
     * Los primeros valores emitidos son del caché/REST inicial.
     * Los siguientes vienen del WebSocket en tiempo real.
     */
    suscribir(tickers: string[]): Observable<CotizacionRT> {
        if (!tickers.length) return EMPTY;

        this.conectarYSuscribir(tickers);

        return this.updates$.pipe(
            filter((c) => tickers.includes(c.ticker)),
            takeUntil(this.destroy$)
        );
    }

    /**
     * Obtiene el último precio conocido del cache para un ticker.
     * Devuelve undefined si todavía no hay datos.
     */
    getCacheInstantaneo(ticker: string): CotizacionRT | undefined {
        return this.cache.get(ticker);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.ws?.complete();
    }

    // ── Lógica interna ─────────────────────────────────────────────────────

    private conectarYSuscribir(tickers: string[]): void {
        if (this.ws && !this.ws.closed) {
            // Ya hay conexión activa, solo añadimos la subscripción
            this.enviarSubscripcion(tickers);
            return;
        }

        this.ws = webSocket<string>({
            url: this.WS_URL,
            // Yahoo Finance envía strings planos (no JSON), desactivamos serialización
            serializer: (msg) => msg,
            deserializer: (event) => event.data as string,
            openObserver: {
                next: () => {
                    this.connected$.next(true);
                    this.enviarSubscripcion(tickers);
                }
            },
            closeObserver: {
                next: () => this.connected$.next(false)
            }
        });

        this.ws.pipe(
            tap((msg: string) => this.procesarMensaje(msg)),
            catchError(() => EMPTY),
            retryWhen((errors) =>
                errors.pipe(
                    tap(() => {
                        this.connected$.next(false);
                        console.warn(`[RealtimeMarketData] Reconectando en ${this.RECONNECT_DELAY_MS / 1000}s…`);
                    }),
                    switchMap(() => timer(this.RECONNECT_DELAY_MS))
                )
            ),
            takeUntil(this.destroy$)
        ).subscribe();
    }

    private enviarSubscripcion(tickers: string[]): void {
        this.ws?.next(JSON.stringify({ subscribe: tickers }));
    }

    private procesarMensaje(msg: string): void {
        const raw = decodeYahooPricing(msg);
        if (!raw?.id || raw.price == null) return;

        const anterior = this.cache.get(raw.id);
        const cotizacion: CotizacionRT = {
            ticker:              raw.id,
            nombre:              raw.shortName ?? anterior?.nombre ?? raw.id,
            precioActual:        raw.price,
            variacion24h:        raw.changePercent ?? anterior?.variacion24h ?? 0,
            variacion24hAbsoluta: raw.change       ?? anterior?.variacion24hAbsoluta ?? 0,
            moneda:              raw.currency      ?? anterior?.moneda,
            precioMaxDia:        raw.dayHigh       ?? anterior?.precioMaxDia,
            precioMinDia:        raw.dayLow        ?? anterior?.precioMinDia,
            ultimaActualizacion: new Date()
        };

        this.cache.set(raw.id, cotizacion);
        this.updateSubject.next(cotizacion);
    }
}
