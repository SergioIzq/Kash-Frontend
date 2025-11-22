import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Ingreso, ResumenIngresos, IngresoCreate } from '../../models';

@Injectable({
    providedIn: 'root'
})
export class IngresoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/ingresos`;
    
    // Cache para resumen
    private resumenCache$?: Observable<ResumenIngresos>;

    /**
     * Obtener todos los ingresos con cache
     */
    getIngresos(): Observable<Ingreso[]> {
        return this.http.get<Ingreso[]>(this.apiUrl).pipe(
            shareReplay({ bufferSize: 1, refCount: true })
        );
    }

    /**
     * Obtener ingresos por período
     */
    getIngresosPorPeriodo(fechaInicio: string, fechaFin: string): Observable<Ingreso[]> {
        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin);
        
        return this.http.get<Ingreso[]>(`${this.apiUrl}/periodo`, { params }).pipe(
            shareReplay({ bufferSize: 1, refCount: true })
        );
    }

    /**
     * Obtener resumen de ingresos con cache
     */
    getResumen(fechaInicio?: string, fechaFin?: string): Observable<ResumenIngresos> {
        let params = new HttpParams();
        if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
        if (fechaFin) params = params.set('fechaFin', fechaFin);
        
        // Usar cache solo si no hay parámetros de fecha
        if (!fechaInicio && !fechaFin && this.resumenCache$) {
            return this.resumenCache$;
        }
        
        this.resumenCache$ = this.http.get<ResumenIngresos>(`${this.apiUrl}/resumen`, { params }).pipe(
            shareReplay({ bufferSize: 1, refCount: true })
        );
        
        return this.resumenCache$;
    }

    /**
     * Alias para mantener compatibilidad
     */
    getResumenIngresos(fechaInicio: string, fechaFin: string): Observable<ResumenIngresos> {
        return this.getResumen(fechaInicio, fechaFin);
    }

    /**
     * Obtener ingreso por ID
     */
    getById(id: number): Observable<Ingreso> {
        return this.http.get<Ingreso>(`${this.apiUrl}/${id}`);
    }

    /**
     * Crear ingreso
     */
    create(ingreso: IngresoCreate): Observable<Ingreso> {
        return this.http.post<Ingreso>(this.apiUrl, ingreso).pipe(
            map(response => {
                this.invalidateCache();
                return response;
            })
        );
    }

    /**
     * Actualizar ingreso
     */
    update(id: number, ingreso: Partial<Ingreso>): Observable<Ingreso> {
        return this.http.put<Ingreso>(`${this.apiUrl}/${id}`, ingreso).pipe(
            map(response => {
                this.invalidateCache();
                return response;
            })
        );
    }

    /**
     * Eliminar ingreso
     */
    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            map(response => {
                this.invalidateCache();
                return response;
            })
        );
    }

    /**
     * Invalidar cache
     */
    private invalidateCache(): void {
        this.resumenCache$ = undefined;
    }
}
