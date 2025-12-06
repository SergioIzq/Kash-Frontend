import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Result } from '@/core/models/common.model';
import { Cuenta } from '@/core/models/cuenta.model';

@Injectable({
    providedIn: 'root'
})
export class CuentaService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/cuentas`;

    /**
     * Búsqueda ligera de cuentas por nombre
     * Solo devuelve {id, nombre} para rendimiento óptimo
     */
    search(search: string, limit: number = 10): Observable<Result<Cuenta[]>> {
        let params = new HttpParams().set('search', search).set('limit', limit.toString());

        return this.http.get<Result<Cuenta[]>>(`${this.apiUrl}/search`, { params });
    }

    /**
     * Obtener los cuentas más usados recientemente
     */
    getRecent(limit: number = 5): Observable<Result<Cuenta[]>> {
        let params = new HttpParams().set('limit', limit.toString());

        return this.http.get<Result<Cuenta[]>>(`${this.apiUrl}/recent`, { params });
    }

    /**
     * Crear un nuevo concepto
     */
    create(nombre: string): Observable<Result<string>> {
        return this.http.post<Result<string>>(this.apiUrl, { nombre });
    }
}
