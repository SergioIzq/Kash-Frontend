import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Result } from '@/core/models/common.model';
import { Concepto } from '@/core/models/concepto.model';

@Injectable({
    providedIn: 'root'
})
export class ConceptoService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/conceptos`;

    /**
     * Búsqueda ligera de conceptos por nombre
     * Solo devuelve {id, nombre} para rendimiento óptimo
     */
    search(search: string, limit: number = 10): Observable<Result<Concepto[]>> {
        let params = new HttpParams().set('search', search).set('limit', limit.toString());

        return this.http.get<Result<Concepto[]>>(`${this.apiUrl}/search`, { params });
    }

    /**
     * Obtener los conceptos más usados recientemente
     */
    getRecent(limit: number = 5): Observable<Result<Concepto[]>> {
        let params = new HttpParams().set('limit', limit.toString());

        return this.http.get<Result<Concepto[]>>(`${this.apiUrl}/recent`, { params });
    }

    /**
     * Crear un nuevo concepto
     */
    create(nombre: string): Observable<Result<void>> {
        return this.http.post<Result<void>>(this.apiUrl, { nombre });
    }
}
