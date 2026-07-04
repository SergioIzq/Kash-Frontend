import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { ReglaCategorizacionService } from '@/core/services/api/regla-categorizacion.service';
import { ReglaCategorizacion, ReglaCategorizacionCreate } from '@/core/models/regla-categorizacion.model';

interface ReglaCategorizacionState {
    reglas: ReglaCategorizacion[];
    totalRecords: number;
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
}

const initialState: ReglaCategorizacionState = {
    reglas: [],
    totalRecords: 0,
    loading: false,
    error: null,
    lastUpdated: null
};

export const ReglaCategorizacionStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),

    withComputed((store) => ({
        totalReglas: computed(() => store.reglas().length),
        hasData: computed(() => store.reglas().length > 0),
        reglasOrdenadas: computed(() => [...store.reglas()].sort((a, b) => a.prioridad - b.prioridad))
    })),

    withMethods((store, reglaService = inject(ReglaCategorizacionService)) => ({
        loadReglasPaginated: rxMethod<{
            page: number;
            pageSize: number;
            searchTerm?: string;
            sortColumn?: string;
            sortOrder?: string;
        }>(
            pipe(
                tap(() => patchState(store, { loading: true, error: null })),
                switchMap(({ page, pageSize, searchTerm, sortColumn, sortOrder }) =>
                    reglaService.getPagedList(page, pageSize, searchTerm, sortColumn, sortOrder).pipe(
                        tapResponse({
                            next: (response) =>
                                patchState(store, {
                                    reglas: response.items,
                                    totalRecords: response.totalCount,
                                    loading: false,
                                    error: null,
                                    lastUpdated: Date.now()
                                }),
                            error: (error: any) =>
                                patchState(store, {
                                    loading: false,
                                    error: error.userMessage || 'Error al cargar las reglas de categorización'
                                })
                        })
                    )
                )
            )
        ),

        async create(regla: ReglaCategorizacionCreate): Promise<string> {
            patchState(store, { loading: true, error: null });
            try {
                const id = await firstValueFrom(reglaService.create(regla));
                patchState(store, { loading: false, lastUpdated: Date.now() });
                return id;
            } catch (err: any) {
                patchState(store, { loading: false, error: err.userMessage || 'Error al crear la regla' });
                throw err;
            }
        },

        async update(id: string, regla: ReglaCategorizacionCreate): Promise<void> {
            const anterior = store.reglas().find((r) => r.id === id);
            if (anterior) {
                patchState(store, {
                    reglas: store.reglas().map((r) => (r.id === id ? { ...r, ...regla } : r)),
                    loading: true,
                    error: null
                });
            }
            try {
                await firstValueFrom(reglaService.update(id, regla));
                patchState(store, { loading: false, lastUpdated: Date.now() });
            } catch (err: any) {
                if (anterior) {
                    patchState(store, { reglas: store.reglas().map((r) => (r.id === id ? anterior : r)) });
                }
                patchState(store, { loading: false, error: err.userMessage || 'Error al actualizar la regla' });
                throw err;
            }
        },

        deleteRegla: rxMethod<string>(
            pipe(
                switchMap((id) => {
                    const eliminada = store.reglas().find((r) => r.id === id);
                    const totalAnterior = store.totalRecords();

                    patchState(store, (state) => ({
                        reglas: state.reglas.filter((r) => r.id !== id),
                        totalRecords: state.totalRecords - 1
                    }));

                    return reglaService.delete(id).pipe(
                        tapResponse({
                            next: () => patchState(store, { lastUpdated: Date.now() }),
                            error: (err: any) => {
                                if (eliminada) {
                                    patchState(store, (state) => ({
                                        reglas: [...state.reglas, eliminada].sort((a, b) => a.prioridad - b.prioridad),
                                        totalRecords: totalAnterior,
                                        error: err.userMessage || 'Error al eliminar la regla'
                                    }));
                                } else {
                                    patchState(store, { error: err.userMessage || 'Error al eliminar la regla' });
                                }
                            }
                        })
                    );
                })
            )
        ),

        clearError(): void {
            patchState(store, { error: null });
        }
    }))
);
