import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, firstValueFrom } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import { ConceptoService } from '@/core/services/api/concepto.service';
import { Concepto } from '@/core/models/concepto.model';
import { ErrorResponse } from '@/core/models/error-response.model';

interface ConceptoState {
    conceptos: Concepto[];
    totalRecords: number;
    loading: boolean;
    error: string | null;
}

const initialState: ConceptoState = {
    conceptos: [],
    totalRecords: 0,
    loading: false,
    error: null
};

export const ConceptoStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods((store, conceptoService = inject(ConceptoService)) => ({
        async search(query: string, limit: number = 10, categoriaId?: string): Promise<Concepto[]> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(conceptoService.search(query, limit, categoriaId));

                if (response.isSuccess && response.value) {
                    const conceptos = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { conceptos, loading: false });
                    return conceptos;
                }
                throw new Error(response.error?.message || 'Error al buscar conceptos');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        async create(nombre: string, categoriaId: string): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(conceptoService.create(nombre, categoriaId));

                if (response.isSuccess) {
                    patchState(store, { loading: false });
                    return response.value;
                }
                throw new Error(response.error?.message || 'Error al crear concepto');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        loadConceptosPaginated: rxMethod<{
            page: number;
            pageSize: number;
            searchTerm?: string;
            sortColumn?: string;
            sortOrder?: string;
        }>(
            pipe(
                tap(() => {
                    patchState(store, { loading: true, error: null });
                }),
                switchMap(({ page, pageSize, searchTerm, sortColumn, sortOrder }) =>
                    conceptoService.getConceptos(page, pageSize, searchTerm, sortColumn, sortOrder).pipe(
                        tapResponse({
                            next: (response) => {
                                patchState(store, {
                                    conceptos: response.items,
                                    totalRecords: response.totalCount,
                                    loading: false,
                                    error: null
                                });
                            },
                            error: (error: any) => {
                                console.error('[STORE] Error al cargar conceptos:', error);
                                patchState(store, {
                                    loading: false,
                                    error: error.userMessage || 'Error al cargar conceptos'
                                });
                            }
                        })
                    )
                )
            )
        ),

        async update(id: string, concepto: Partial<Concepto>): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(conceptoService.update(id, concepto));

                if (response.isSuccess) {
                    patchState(store, { loading: false });
                    return response.value;
                }
                throw new Error(response.error?.message || 'Error al actualizar concepto');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        deleteConcepto: rxMethod<string>(
            pipe(
                // 1. (Opcional) Actualización Optimista Inmediata: Lo borramos de la vista antes de ir al servidor
                tap((id) => {
                    patchState(store, (state) => ({
                        conceptos: state.conceptos.filter((c) => c.id !== id),
                        totalRecords: state.totalRecords - 1 // Ajustamos el contador visualmente
                    }));
                }),
                switchMap((id) =>
                    conceptoService.delete(id).pipe(
                        tapResponse({
                            next: () => {},
                            error: (err: ErrorResponse) => {
                                console.error(err);
                                patchState(store, { error: err.detail || 'Error al eliminar concepto' });
                            }
                        })
                    )
                )
            )
        ),

        async getRecent(limit: number = 5, categoriaId?: string): Promise<Concepto[]> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(conceptoService.getRecent(limit, categoriaId));

                if (response.isSuccess && response.value) {
                    const conceptos = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { loading: false });
                    return conceptos;
                }
                throw new Error(response.error?.message || 'Error al cargar conceptos recientes');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        clearError() {
            patchState(store, { error: null });
        }
    }))
);
