import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Ingreso, ResumenIngresos, IngresoCreate } from '../../models';
import { ApiResponse, PaginatedResponse } from '@/core/models/common.model';

@Injectable({
    providedIn: 'root'
})
export class IngresoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/ingresos`;
    
    // Cache para resumen
    private resumenCache$?: Observable<ResumenIngresos>;

    /**
     * Obtener todos los ingresos con paginación, búsqueda y ordenamiento
     */
    getIngresos(
        page: number = 1, 
        pageSize: number = 10,
        searchTerm?: string,
        sortColumn?: string,
        sortOrder?: string
    ): Observable<PaginatedResponse<Ingreso>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());
        
        if (searchTerm) {
            params = params.set('searchTerm', searchTerm);
        }
        if (sortColumn) {
            params = params.set('sortColumn', sortColumn);
        }
        if (sortOrder) {
            params = params.set('sortOrder', sortOrder);
        }
        
        // API devuelve ApiResponse<PaginatedResponse<Ingreso>>, extraer data
        return this.http.get<ApiResponse<PaginatedResponse<Ingreso>>>(`${this.apiUrl}/paginated`, { params })
            .pipe(map(response => response.data));
    }

    /**
     * Obtener todos los ingresos sin paginación (para compatibilidad)
     */
    getAllIngresos(): Observable<Ingreso[]> {
        return this.http.get<ApiResponse<PaginatedResponse<Ingreso>>>(this.apiUrl, {
            params: new HttpParams().set('pageSize', '1000')
        }).pipe(
            map(response => response.data.items),
            shareReplay({ bufferSize: 1, refCount: true })
        );
    }

    /**
     * Obtener ingresos por período
     */
    getIngresosPorPeriodo(fechaInicio: string, fechaFin: string): Observable<Ingreso[]> {
        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin)
            .set('pageSize', '1000');
        
        return this.http.get<ApiResponse<PaginatedResponse<Ingreso>>>(`${this.apiUrl}/periodo`, { params }).pipe(
            map(response => response.data.items),
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
        return this.http.get<ApiResponse<Ingreso>>(`${this.apiUrl}/${id}`)
            .pipe(map(response => response.data));
    }

    /**
     * Crear ingreso
     */
    create(ingreso: IngresoCreate): Observable<Ingreso> {
        return this.http.post<ApiResponse<Ingreso>>(this.apiUrl, ingreso).pipe(
            map(response => {
                this.invalidateCache();
                return response.data;
            })
        );
    }

    /**
     * Actualizar ingreso
     */
    update(id: string, ingreso: Partial<Ingreso>): Observable<Ingreso> {
        return this.http.put<ApiResponse<Ingreso>>(`${this.apiUrl}/${id}`, ingreso).pipe(
            map(response => {
                this.invalidateCache();
                return response.data;
            })
        );
    }

    /**
     * Eliminar ingreso
     */
    delete(id: string): Observable<void> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
            map(response => {
                this.invalidateCache();
                return response.data;
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
