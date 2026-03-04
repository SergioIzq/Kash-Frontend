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
