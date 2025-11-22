import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardResumen, HistoricoMensual } from '../../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/dashboard`;

    getResumen(params?: {
        fechaInicio?: string;
        fechaFin?: string;
        cuentaId?: string;
        categoriaId?: string;
    }): Observable<DashboardResumen> {
        let httpParams = new HttpParams();
        if (params?.fechaInicio) httpParams = httpParams.set('fechaInicio', params.fechaInicio);
        if (params?.fechaFin) httpParams = httpParams.set('fechaFin', params.fechaFin);
        if (params?.cuentaId) httpParams = httpParams.set('cuentaId', params.cuentaId);
        if (params?.categoriaId) httpParams = httpParams.set('categoriaId', params.categoriaId);
        return this.http.get<DashboardResumen>(`${this.apiUrl}/resumen`, { 
            params: httpParams,
            withCredentials: true 
        });
    }

    getHistorico(meses: number = 12): Observable<HistoricoMensual[]> {
        const params = new HttpParams().set('meses', meses);
        return this.http.get<HistoricoMensual[]>(`${this.apiUrl}/historico`, { 
            params,
            withCredentials: true 
        });
    }
}
