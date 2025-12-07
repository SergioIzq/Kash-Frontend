import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { TraspasoService } from '@/core/services/api/traspaso.service';
import { Traspaso, TraspasoCreate } from '@/core/models/traspaso.model';

interface TraspasosState {
    traspasos: Traspaso[];
    selectedTraspaso: Traspaso | null;
    loading: boolean;
    error: string | null;
    totalRecords: number;
}

const initialState: TraspasosState = {
    traspasos: [],
    selectedTraspaso: null,
    loading: false,
    error: null,
    totalRecords: 0
};

export const TraspasosStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed((store) => ({
        count: computed(() => store.traspasos().length)
    })),
    withMethods((store, traspasoService = inject(TraspasoService)) => ({
        loadTraspasosPaginated: rxMethod<{
            page: number;
            pageSize: number;
            searchTerm?: string;
            sortColumn?: string;
            sortOrder?: string;
        }>(
            pipe(
                tap(({ page, pageSize, searchTerm, sortColumn, sortOrder }) => {
                    patchState(store, { loading: true, error: null });
                }),
                switchMap(({ page, pageSize, searchTerm, sortColumn, sortOrder }) =>
                    traspasoService.getTraspasos(page, pageSize, searchTerm, sortColumn, sortOrder).pipe(
                        tapResponse({
                            next: (response) => {
                                patchState(store, {
                                    traspasos: response.items,
                                    totalRecords: response.totalCount,
                                    loading: false,
                                    error: null
                                });
                            },
                            error: (error: any) => {
                                console.error('[STORE] Error al cargar traspasos:', error);
                                patchState(store, {
                                    loading: false,
                                    error: error.userMessage || 'Error al cargar traspasos'
                                });
                            }
                        })
                    )
                )
            )
        ),


        // Crear traspaso
        async createTraspaso(traspaso: TraspasoCreate): Promise<string> {
            patchState(store, { loading: true, error: null });

            try {
                const newTraspasoId = await firstValueFrom(traspasoService.create(traspaso));
                // El backend solo devuelve el ID, no el objeto completo
                // Necesitaremos recargar la lista o hacer un fetch del traspaso por ID
                patchState(store, { loading: false });
                return newTraspasoId;
            } catch (error: any) {
                patchState(store, {
                    loading: false,
                    error: error.userMessage || 'Error al crear traspaso'
                });
                throw error;
            }
        },

        // Actualizar traspaso
        async updateTraspaso(payload: { id: string; traspaso: Partial<Traspaso> }): Promise<void> {
            const { id, traspaso } = payload;
            patchState(store, { loading: true, error: null });

            try {
                await firstValueFrom(traspasoService.update(id, traspaso));

                // Actualizar estado local
                const traspasos = store.traspasos().map((g) => (g.id === id ? { ...g, ...traspaso } : g));
                patchState(store, { traspasos, loading: false });
            } catch (error: any) {
                patchState(store, {
                    loading: false,
                    error: error.userMessage || 'Error al actualizar traspaso'
                });
                throw error;
            }
        },

        deleteTraspaso: rxMethod<string>(
            pipe(
                tap((id) => {
                    // Eliminación optimista
                    const filteredTraspasos = store.traspasos().filter((t) => t.id !== id);
                    patchState(store, { traspasos: filteredTraspasos });
                }),
                switchMap((id) =>
                    traspasoService.delete(id).pipe(
                        tapResponse({
                            next: () => {
                                // Eliminación exitosa
                                patchState(store, { error: null });
                            },
                            error: (error: Error) => {
                                patchState(store, { error: error.message });
                            }
                        })
                    )
                )
            )
        )
    }))
);
