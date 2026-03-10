export type TipoInversion = 'etf' | 'accion' | 'cripto' | 'bono' | 'fondo' | 'mercado_privado' | 'otro';

export const TIPOS_INVERSION_CONFIG: {
    value: TipoInversion;
    label: string;
    icon: string;
    color: string;
    hint: string;
}[] = [
    { value: 'etf', label: 'ETF', icon: 'pi pi-chart-bar', color: '#3B82F6', hint: 'Ej: SPY, QQQ, IWDA.AS' },
    { value: 'accion', label: 'Acción', icon: 'pi pi-building', color: '#8B5CF6', hint: 'Ej: AAPL, MSFT, NVDA' },
    { value: 'cripto', label: 'Criptomoneda', icon: 'pi pi-bitcoin', color: '#F59E0B', hint: 'Ej: BTC-USD, ETH-USD, SOL-USD' },
    { value: 'bono', label: 'Bono / Renta Fija', icon: 'pi pi-file', color: '#10B981', hint: 'Ej: TLT, IEF' },
    { value: 'fondo', label: 'Fondo de Inversión', icon: 'pi pi-briefcase', color: '#06B6D4', hint: 'Ej: 0P0000XVAO.F' },
    { value: 'mercado_privado', label: 'Mercado Privado', icon: 'pi pi-lock', color: '#EF4444', hint: 'Sin cotización pública' },
    { value: 'otro', label: 'Otro', icon: 'pi pi-question-circle', color: '#6B7280', hint: 'Cualquier activo' },
];

export interface Inversion {
    id: string;
    /** Nombre descriptivo del activo, ej: "Apple Inc.", "Bitcoin" */
    nombre: string;
    /** Ticker de Yahoo Finance: AAPL, SPY, BTC-USD, ETH-USD, etc. */
    ticker: string;
    tipo: TipoInversion;
    cantidad: number;
    /** Precio medio de compra por unidad */
    precioCompra: number;
    /** Moneda del activo: USD, EUR, etc. */
    moneda: string;
    fechaCompra: string;
    descripcion?: string;
    /** Plataforma donde está la inversión: "Interactive Brokers", "Binance", "Trade Republic" */
    plataforma?: string;
    usuarioId: string;
}

export interface InversionCreate {
    nombre: string;
    ticker: string;
    tipo: TipoInversion;
    cantidad: number;
    precioCompra: number;
    moneda: string;
    fechaCompra: string;
    descripcion?: string;
    plataforma?: string;
}

/** Inversión enriquecida con datos de mercado en tiempo real */
export interface InversionConPrecio extends Inversion {
    precioActual: number | null;
    /** cantidad × precioActual */
    valorActual: number | null;
    /** cantidad × precioCompra */
    valorInvertido: number;
    /** valorActual - valorInvertido */
    gananciaAbsoluta: number | null;
    /** ((precioActual - precioCompra) / precioCompra) × 100 */
    gananciaPorcentaje: number | null;
    /** Variación % del mercado en las últimas 24h */
    variacion24h: number | null;
    variacion24hAbsoluta: number | null;
    cargandoPrecio: boolean;
    ultimaActualizacion: Date | null;
}

export interface ResumenPortfolio {
    valorTotal: number;
    valorInvertido: number;
    gananciaAbsoluta: number;
    gananciaPorcentaje: number;
    variacion24hAbsoluta: number;
    variacion24hPorcentaje: number;
    cantidadPosiciones: number;
}

// ── Import de extractos ──────────────────────────────────────────────────────

export type BrokerFormat = 'generic' | 'trade_republic' | 'degiro' | 'interactive_brokers' | 'binance';

export interface ImportErrorLinea {
    /** 1-based line number in the CSV file */
    linea: number;
    /** Raw content of the failing line */
    contenido: string;
    /** Human-readable reason for the failure */
    razon: string;
}

export interface ImportarExtractoResult {
    importadas: number;
    duplicadas: number;
    errores: ImportErrorLinea[];
}
