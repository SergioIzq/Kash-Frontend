import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Result } from '@/core/models/common.model';
import { Categoria } from '@/core/models/categoria.model';

@Injectable({
    providedIn: 'root'
})
export class CategoriaService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/categorias`;

    /**
     * Búsqueda ligera de categorias por nombre
     * Solo devuelve {id, nombre} para rendimiento óptimo
     */
    search(search: string, limit: number = 10): Observable<Result<Categoria[]>> {
        let params = new HttpParams().set('search', search).set('limit', limit.toString());

        return this.http.get<Result<Categoria[]>>(`${this.apiUrl}/search`, { params });
    }

    /**
     * Obtener los categorias más usados recientemente
     */
    getRecent(limit: number = 5): Observable<Result<Categoria[]>> {
        let params = new HttpParams().set('limit', limit.toString());

        return this.http.get<Result<Categoria[]>>(`${this.apiUrl}/recent`, { params });
    }

    /**
     * Crear un nuevo categoria
     */
    create(nombre: string): Observable<Result<void>> {
        return this.http.post<Result<void>>(this.apiUrl, { nombre });
    }
}
