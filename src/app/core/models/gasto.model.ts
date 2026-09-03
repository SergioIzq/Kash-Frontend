import { PaginatedList } from './common.model';

export interface Gasto {
    id: string;
    importe: number;
    fecha: string;
    descripcion?: string;
    conceptoId: string;
    conceptoNombre: string;
    categoriaId: string;
    categoriaNombre: string;
    proveedorId?: string | null;
    proveedorNombre?: string | null;
    personaId?: string | null;
    personaNombre?: string | null;
    cuentaId: string;
    cuentaNombre: string;
    formaPagoId: string;
    formaPagoNombre: string;
    usuarioId: string;
}

export interface ResumenGastos {
    total: number;
    cantidad: number;
    gastos: Gasto[];
    porCategoria?: Record<string, number>;
}

// Respuesta de GET /gastos/periodo: el listado paginado del periodo junto con la suma del
// importe de TODOS los registros que cumplen el filtro de fecha (no solo los de la página
// actual). Espejo del `PeriodoResult<GastoDto>` del backend.
export interface GastosPeriodoResponse {
    pagina: PaginatedList<Gasto>;
    sumaImporte: number;
}

// Combinación completa de campos de gasto que el usuario repite con frecuencia
// (ver capability transacciones-habituales). No representa una transacción
// individual: no tiene id ni fecha puntual, sino veces/ultimoUso.
export interface GastoHabitual {
    conceptoId: string;
    conceptoNombre: string;
    categoriaId?: string | null;
    categoriaNombre?: string | null;
    cuentaId: string;
    cuentaNombre: string;
    formaPagoId: string;
    formaPagoNombre: string;
    proveedorId?: string | null;
    proveedorNombre?: string | null;
    personaId?: string | null;
    personaNombre?: string | null;
    veces: number;
    ultimoUso: string;
}

export interface GastoCreate {
    tempid?: string;
    importe: number;
    fecha: string;
    descripcion?: string;
    conceptoId: string;
    conceptoNombre: string;
    categoriaId: string;
    categoriaNombre: string;
    proveedorId?: string | null;
    proveedorNombre?: string | null;
    personaId?: string | null;
    personaNombre?: string | null;
    cuentaId: string;
    cuentaNombre: string;
    formaPagoId: string;
    formaPagoNombre: string;
}
