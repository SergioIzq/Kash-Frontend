export interface ResumenFinanciero {
    totalGastos: number;
    cantidadGastos: number;
    totalIngresos: number;
    cantidadIngresos: number;
    balance?: number;
    periodoInicio?: string;
    periodoFin?: string;
    gastoPorCategoria?: Record<string, number>;
    ingresoPorTipo?: Record<string, number>;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface ListResponse<T> {
    items: T[];
    count: number;
}
