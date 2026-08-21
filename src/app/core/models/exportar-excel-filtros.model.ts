/**
 * Filtros opcionales y combinables para la exportación a Excel de Gastos/Ingresos. Un campo
 * ausente no restringe el resultado por ese filtro; las fechas van en formato ISO corto
 * (yyyy-MM-dd).
 */
export interface ExportarExcelFiltros {
    fechaInicio?: string;
    fechaFin?: string;
    searchTerm?: string;
    conceptoIds?: string[];
    categoriaIds?: string[];
    proveedorIds?: string[];
    clienteIds?: string[];
    personaIds?: string[];
}
