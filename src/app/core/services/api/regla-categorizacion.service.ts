import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ReglaCategorizacion, ReglaCategorizacionCreate } from '../../models/regla-categorizacion.model';
import { PaginatedList, Result } from '@/core/models/common.model';

@Injectable({
    providedIn: 'root'
})
export class ReglaCategorizacionService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/reglas-categorizacion`;

    getPagedList(
        page: number,
        pageSize: number,
        searchTerm?: string,
        sortColumn?: string,
        sortOrder?: string
    ): Observable<PaginatedList<ReglaCategorizacion>> {
        let params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
        if (searchTerm) params = params.set('searchTerm', searchTerm);
        if (sortColumn) params = params.set('sortColumn', sortColumn);
        if (sortOrder) params = params.set('sortOrder', sortOrder);

        return this.http
            .get<Result<PaginatedList<ReglaCategorizacion>>>(this.apiUrl, { params })
            .pipe(map((r) => r.value));
    }

    getById(id: string): Observable<ReglaCategorizacion> {
        return this.http.get<Result<ReglaCategorizacion>>(`${this.apiUrl}/${id}`).pipe(map((r) => r.value));
    }

    create(regla: ReglaCategorizacionCreate): Observable<string> {
        return this.http.post<Result<string>>(this.apiUrl, regla).pipe(map((r) => r.value));
    }

    update(id: string, regla: ReglaCategorizacionCreate): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, regla);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
