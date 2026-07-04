/**
 * Configuración de importación de extractos bancarios.
 * Se serializa a JSON y se envía en el campo 'mapping' del multipart.
 * Refleja el ColumnMapping del backend (deserialización case-insensitive).
 */
export interface ColumnMapping {
    // Estructura del fichero (CSV)
    delimiter?: string | null;
    hasHeader: boolean;
    skipRows: number;

    // Columnas (nombre de cabecera o índice 0-based)
    fechaColumn: string;
    conceptoColumn: string;
    importeColumn?: string | null;
    cargoColumn?: string | null;
    abonoColumn?: string | null;

    // Formatos
    fechaFormatos?: string[] | null;
    decimalSeparator: 'auto' | 'coma' | 'punto';

    // Específico de PDF
    lineRegex?: string | null;
    amountPosition: 'first' | 'last';

    // Clasificación por defecto
    cuentaNombre: string;
    formaPagoNombre: string;
    categoriaGastoNombre: string;
    categoriaIngresoNombre: string;
    conceptoNombre: string;
}

export interface MovimientoImportError {
    linea: number;
    contenido: string;
    razon: string;
}

/** Movimiento propuesto por el backend en la previsualización (antes de crearlo). */
export interface MovimientoPreview {
    id: string;
    fecha: string;
    descripcion: string;
    importe: number;
    tipo: 'gasto' | 'ingreso';
    cuentaNombre: string;
    categoriaNombre: string;
    conceptoNombre: string;
    formaPagoNombre: string;
    proveedorNombre: string | null;
    esDuplicado: boolean;
    /** true si una regla de auto-categorización asignó la clasificación de esta fila. */
    reglaAplicada: boolean;
    reglaPatron: string | null;
}

export interface PreviewMovimientosResult {
    movimientos: MovimientoPreview[];
    errores: MovimientoImportError[];
}

/** Movimiento ya revisado/editado que se envía al backend para crearse tal cual. */
export interface MovimientoConfirmar {
    fecha: string;
    descripcion: string;
    importe: number;
    tipo: 'gasto' | 'ingreso';
    cuentaNombre: string;
    categoriaNombre: string;
    conceptoNombre: string;
    formaPagoNombre: string;
    proveedorNombre: string | null;
}

export interface ImportarMovimientosResult {
    gastosCreados: number;
    ingresosCreados: number;
    duplicados: number;
    fallidos: number;
    errores: MovimientoImportError[];
}

/** Valores por defecto sensatos para el formulario de importación. */
export function defaultColumnMapping(): ColumnMapping {
    return {
        delimiter: null,
        hasHeader: true,
        skipRows: 0,
        fechaColumn: 'Fecha',
        conceptoColumn: 'Concepto',
        importeColumn: 'Importe',
        cargoColumn: null,
        abonoColumn: null,
        fechaFormatos: null,
        decimalSeparator: 'auto',
        lineRegex: null,
        amountPosition: 'first',
        cuentaNombre: '',
        formaPagoNombre: 'Transferencia',
        categoriaGastoNombre: 'Sin clasificar',
        categoriaIngresoNombre: 'Sin clasificar',
        conceptoNombre: 'Importado del banco'
    };
}
