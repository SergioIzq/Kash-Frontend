import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Result } from '@/core/models/common.model';
import { Proveedor } from '@/core/models/proveedor.model';

@Injectable({
    providedIn: 'root'
})
export class ProveedorService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/proveedores`;

    /**
     * Búsqueda ligera de personas por nombre
     * Solo devuelve {id, nombre} para rendimiento óptimo
     */
    search(search: string, limit: number = 10): Observable<Result<Proveedor[]>> {
        let params = new HttpParams().set('search', search).set('limit', limit.toString());

        return this.http.get<Result<Proveedor[]>>(`${this.apiUrl}/search`, { params });
    }

    /**
     * Obtener los personas más usados recientemente
     */
    getRecent(limit: number = 5): Observable<Result<Proveedor[]>> {
        let params = new HttpParams().set('limit', limit.toString());

        return this.http.get<Result<Proveedor[]>>(`${this.apiUrl}/recent`, { params });
    }

    /**
     * Crear un nuevo persona
     */
    create(nombre: string): Observable<Result<void>> {
        return this.http.post<Result<void>>(this.apiUrl, { nombre });
    }
}
