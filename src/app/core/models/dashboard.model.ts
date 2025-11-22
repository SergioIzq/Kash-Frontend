export interface DashboardResumen {
    balanceTotal: number;
    ingresosMesActual: number;
    gastosMesActual: number;
    balanceMesActual: number;
    totalCuentas: number;
    cuentas: CuentaResumen[];
    topCategoriasGastos: CategoriaGasto[];
    ultimosMovimientos: MovimientoResumen[];
    comparativaMesAnterior: ComparativaMensual;
    gastoPromedioDiario: number;
    proyeccionGastosFinMes: number;
    diasTranscurridosMes: number;
    diasRestantesMes: number;
    historicoUltimos6Meses: HistoricoMensual[];
    alertas: Alerta[];
}

export interface CuentaResumen {
    id: string;
    nombre: string;
    saldo: number;
}

export interface CategoriaGasto {
    categoriaId: string;
    categoriaNombre: string;
    totalGastado: number;
    cantidadTransacciones: number;
    porcentajeDelTotal: number;
}

export interface MovimientoResumen {
    id: string;
    tipo: string;
    importe: number;
    fecha: string;
    concepto: string;
    categoria: string;
    cuenta: string;
}

export interface ComparativaMensual {
    ingresosMesAnterior: number;
    gastosMesAnterior: number;
    diferenciaIngresos: number;
    diferenciaGastos: number;
    porcentajeCambioIngresos: number;
    porcentajeCambioGastos: number;
}

export interface HistoricoMensual {
    anio: number;
    mes: number;
    mesNombre: string;
    totalIngresos: number;
    totalGastos: number;
    balance: number;
}

export interface Alerta {
    tipo: string; // "info", "warning", "danger", "success"
    titulo: string;
    mensaje: string;
    icono?: string;
}
