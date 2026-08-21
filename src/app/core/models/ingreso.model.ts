export interface Ingreso {
    id: string;
    importe: number;
    fecha: string;
    descripcion?: string;
    conceptoId: string;
    conceptoNombre: string;
    categoriaId: string;
    categoriaNombre: string;
    clienteId?: string | null;
    clienteNombre?: string | null;
    personaId?: string | null;
    personaNombre?: string | null;
    cuentaId: string;
    cuentaNombre: string;
    formaPagoId: string;
    formaPagoNombre: string;
    usuarioId: string;
}

export interface ResumenIngresos {
    total: number;
    cantidad: number;
    ingresos: Ingreso[];
    porCategoria?: Record<string, number>;
}

// Combinación completa de campos de ingreso que el usuario repite con frecuencia
// (ver capability transacciones-habituales). Equivalente a GastoHabitual, con
// clienteId/clienteNombre en vez de proveedorId/proveedorNombre.
export interface IngresoHabitual {
    conceptoId: string;
    conceptoNombre: string;
    categoriaId?: string | null;
    categoriaNombre?: string | null;
    cuentaId: string;
    cuentaNombre: string;
    formaPagoId: string;
    formaPagoNombre: string;
    clienteId?: string | null;
    clienteNombre?: string | null;
    personaId?: string | null;
    personaNombre?: string | null;
    veces: number;
    ultimoUso: string;
}

export interface IngresoCreate {
    tempid?: string;
    importe: number;
    fecha: string;
    descripcion?: string;
    conceptoId: string;
    conceptoNombre: string;
    categoriaId: string;
    categoriaNombre: string;
    clienteId?: string | null;
    clienteNombre?: string | null;
    personaId?: string | null;
    personaNombre?: string | null;
    cuentaId: string;
    cuentaNombre: string;
    formaPagoId: string;
    formaPagoNombre: string;
}
