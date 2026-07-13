import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/reportes`;

    /**
     * Descarga el reporte PDF de presupuesto financiero para el rango de fechas.
     * Las fechas van en formato ISO corto (yyyy-MM-dd).
     */
    descargarPresupuestoPdf(fechaInicio: string, fechaFin: string): Observable<Blob> {
        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin);

        return this.http.get(`${this.apiUrl}/presupuesto/pdf`, {
            params,
            responseType: 'blob',
            withCredentials: true
        });
    }

    /**
     * Descarga el reporte Excel de presupuesto financiero para el rango de fechas.
     * Las fechas van en formato ISO corto (yyyy-MM-dd).
     */
    descargarPresupuestoExcel(fechaInicio: string, fechaFin: string): Observable<Blob> {
        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin);

        return this.http.get(`${this.apiUrl}/presupuesto/excel`, {
            params,
            responseType: 'blob',
            withCredentials: true
        });
    }
}
