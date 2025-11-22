export interface Ingreso {
    id: number;
    concepto: string;
    cantidad: number;
    fecha: string;
    tipo?: string;
    fuente?: string;
    descripcion?: string;
    usuarioId?: number;
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
