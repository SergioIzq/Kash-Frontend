export interface Concepto {
    id: string;
    nombre: string;
    categoriaId: string;
    categoriaNombre?: string;
    fechaCreacion: Date;
    usuarioId: string;
}