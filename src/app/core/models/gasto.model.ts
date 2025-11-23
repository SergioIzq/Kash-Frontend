export interface Gasto {
    id: string;
    importe: number;
    fecha: string;
    descripcion?: string;
    conceptoId: string;
    conceptoNombre: string;
    categoriaId: string;
    categoriaNombre: string;
    proveedorId: string;
    proveedorNombre: string;
    personaId: string;
    personaNombre: string;
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
    importe: number;
    fecha: string;
    descripcion?: string;
    conceptoId: string;
    categoriaId: string;
    proveedorId: string;
    personaId: string;
    cuentaId: string;
    formaPagoId: string;
}
