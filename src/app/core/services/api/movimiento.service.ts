import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
    ColumnMapping,
    ImportarMovimientosResult,
    MovimientoConfirmar,
    PreviewMovimientosResult
} from '../../models/movimiento-import.model';
import { Result } from '@/core/models/common.model';

@Injectable({
    providedIn: 'root'
})
export class MovimientoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/movimientos`;

    /**
     * Importa gastos e ingresos desde un extracto bancario (CSV o PDF).
     * El backend detecta el tipo de fichero automáticamente.
     * POST /api/movimientos/importar  (multipart/form-data)
     */
    importarExtracto(mapping: ColumnMapping, file: File): Observable<ImportarMovimientosResult> {
        const formData = new FormData();
        formData.append('mapping', JSON.stringify(mapping));
        formData.append('file', file, file.name);
        return this.http
            .post<Result<ImportarMovimientosResult>>(`${this.apiUrl}/importar`, formData)
            .pipe(map((r) => r.value));
    }

    /**
     * Previsualiza los movimientos que se crearían (sin crearlos), marcando duplicados.
     * POST /api/movimientos/previsualizar  (multipart/form-data)
     */
    previsualizar(mapping: ColumnMapping, file: File): Observable<PreviewMovimientosResult> {
        const formData = new FormData();
        formData.append('mapping', JSON.stringify(mapping));
        formData.append('file', file, file.name);
        return this.http
            .post<Result<PreviewMovimientosResult>>(`${this.apiUrl}/previsualizar`, formData)
            .pipe(map((r) => r.value));
    }

    /**
     * Crea los movimientos ya revisados y editados por el usuario.
     * POST /api/movimientos/confirmar  (application/json)
     */
    confirmar(movimientos: MovimientoConfirmar[]): Observable<ImportarMovimientosResult> {
        return this.http
            .post<Result<ImportarMovimientosResult>>(`${this.apiUrl}/confirmar`, { movimientos })
            .pipe(map((r) => r.value));
    }
}
