export interface Ingreso {
    id: string;
    importe: number;
    fecha: string;
    descripcion?: string;
    conceptoId: string;
    conceptoNombre: string;
    categoriaId: string;
    categoriaNombre: string;
    clienteId: string;
    clienteNombre: string;
    personaId: string;
    personaNombre: string;
    cuentaId: string;
    cuentaNombre: string;
    formaPagoId: string;
    formaPagoNombre: string;
    usuarioId: string;
}

export interface PaginatedResponseIngreso<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface ResumenIngresos {
    total: number;
    cantidad: number;
    ingresos: Ingreso[];
    porTipo?: Record<string, number>;
}

export interface IngresoCreate {
    concepto: string;
    cantidad: number;
    fecha: string;
    tipo?: string;
    fuente?: string;
    descripcion?: string;
}
