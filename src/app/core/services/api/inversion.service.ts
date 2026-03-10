import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Inversion, InversionCreate, BrokerFormat, ImportarExtractoResult } from '../../models/inversion.model';
import { PaginatedList, Result } from '@/core/models/common.model';

@Injectable({
    providedIn: 'root'
})
export class InversionService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/inversiones`;

    getInversiones(page: number = 1, pageSize: number = 100): Observable<PaginatedList<Inversion>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());

        return this.http
            .get<Result<PaginatedList<Inversion>>>(this.apiUrl, { params })
            .pipe(map((r) => r.value));
    }

    getAllInversiones(): Observable<Inversion[]> {
        return this.getInversiones(1, 1000).pipe(map((r) => r.items));
    }

    getById(id: string): Observable<Inversion> {
        return this.http
            .get<Result<Inversion>>(`${this.apiUrl}/${id}`)
            .pipe(map((r) => r.value));
    }

    create(inversion: InversionCreate): Observable<string> {
        return this.http
            .post<Result<string>>(this.apiUrl, inversion)
            .pipe(map((r) => r.value));
    }

    update(id: string, inversion: Partial<Inversion>): Observable<string> {
        return this.http
            .put<Result<string>>(`${this.apiUrl}/${id}`, inversion)
            .pipe(map((r) => r.value));
    }

    delete(id: string): Observable<void> {
        return this.http
            .delete<void>(`${this.apiUrl}/${id}`, { observe: 'response' })
            .pipe(map(() => undefined as void));
    }

    /**
     * Sends a CSV file to the backend for parsing and bulk import.
     * The `brokerFormat` tells the backend which column layout to use.
     * POST /api/inversiones/importar  (multipart/form-data)
     */
    importarExtracto(brokerFormat: BrokerFormat, file: File): Observable<ImportarExtractoResult> {
        const formData = new FormData();
        formData.append('brokerFormat', brokerFormat);
        formData.append('file', file, file.name);
        return this.http
            .post<Result<ImportarExtractoResult>>(`${this.apiUrl}/importar`, formData)
            .pipe(map((r) => r.value));
    }
}
