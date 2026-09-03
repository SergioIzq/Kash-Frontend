export type FiltroPeriodoRapido = 'hoy' | 'semana' | 'mes';

export interface RangoFecha {
    fechaInicio: string;
    fechaFin: string;
}

function toIsoDate(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function inicioDeSemana(fecha: Date): Date {
    // Semana de lunes a domingo (convención es-ES). getDay(): 0=domingo..6=sábado.
    const dia = fecha.getDay();
    const diasDesdeElLunes = dia === 0 ? 6 : dia - 1;
    const inicio = new Date(fecha);
    inicio.setDate(fecha.getDate() - diasDesdeElLunes);
    return inicio;
}

/**
 * Calcula el rango [fechaInicio, fechaFin] (formato YYYY-MM-DD, fecha local) para
 * los filtros rápidos "Hoy", "Esta semana" y "Este mes". fechaFin es siempre hoy:
 * estos filtros muestran movimientos "hasta ahora", no periodos futuros.
 */
export function calcularRangoFecha(filtro: FiltroPeriodoRapido): RangoFecha {
    const hoy = new Date();
    const fechaFin = toIsoDate(hoy);

    switch (filtro) {
        case 'hoy':
            return { fechaInicio: fechaFin, fechaFin };
        case 'semana':
            return { fechaInicio: toIsoDate(inicioDeSemana(hoy)), fechaFin };
        case 'mes':
            return { fechaInicio: toIsoDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), fechaFin };
    }
}
