export interface ReglaCategorizacion {
    id: string;
    patron: string;
    tipo: 'gasto' | 'ingreso' | null;
    categoriaNombre: string;
    conceptoNombre: string | null;
    proveedorNombre: string | null;
    formaPagoNombre: string | null;
    prioridad: number;
    activo: boolean;
    usuarioId: string;
    fechaCreacion: string | null;
}

export type ReglaCategorizacionCreate = Pick<
    ReglaCategorizacion,
    'patron' | 'tipo' | 'categoriaNombre' | 'conceptoNombre' | 'proveedorNombre' | 'formaPagoNombre' | 'prioridad' | 'activo'
>;
