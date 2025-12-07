import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { CategoriaService } from '@/core/services/api/categoria.service';
import { Categoria } from '@/core/models/categoria.model';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { ErrorResponse } from '@/core/models/error-response.model';

interface CategoriaState {
    categorias: Categoria[];
    totalRecords: number;
    loading: boolean;
    error: string | null;
}

const initialState: CategoriaState = {
    categorias: [],
    totalRecords: 0,
    loading: false,
    error: null
};

export const CategoriaStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods((store, categoriaService = inject(CategoriaService)) => ({
        async search(query: string, limit: number = 10): Promise<Categoria[]> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(categoriaService.search(query, limit));

                if (response.isSuccess && response.value) {
                    patchState(store, { categorias: response.value, loading: false });
                    return response.value;
                }
                throw new Error(response.error?.message || 'Error al buscar categorías');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        async create(nombre: string): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(categoriaService.create(nombre));

                if (response.isSuccess && response.value) {
                    patchState(store, { loading: false });
                    return response.value; // Retornar el UUID de la categoría creada
                }
                throw new Error(response.error?.message || 'Error al crear categoría');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        async getRecent(limit: number = 5): Promise<Categoria[]> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(categoriaService.getRecent(limit));

                if (response.isSuccess && response.value) {
                    const categorias = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { loading: false });
                    return categorias;
                }
                throw new Error(response.error?.message || 'Error al cargar categorías recientes');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        loadCategoriasPaginated: rxMethod<{
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
                    categoriaService.getCategorias(page, pageSize, searchTerm, sortColumn, sortOrder).pipe(
                        tapResponse({
                            next: (response) => {
                                patchState(store, {
                                    categorias: response.items,
                                    totalRecords: response.totalCount,
                                    loading: false,
                                    error: null
                                });
                            },
                            error: (error: any) => {
                                console.error('[STORE] Error al cargar cuentas:', error);
                                patchState(store, {
                                    loading: false,
                                    error: error.userMessage || 'Error al cargar cuentas'
                                });
                            }
                        })
                    )
                )
            )
        ),

        deleteCategoria: rxMethod<string>(
            pipe(
                // 1. (Opcional) Actualización Optimista Inmediata: Lo borramos de la vista antes de ir al servidor
                tap((id) => {
                    patchState(store, (state) => ({
                        categorias: state.categorias.filter((c) => c.id !== id),
                        totalRecords: state.totalRecords - 1 // Ajustamos el contador visualmente
                    }));
                }),
                switchMap((id) =>
                    categoriaService.delete(id).pipe(
                        tapResponse({
                            next: () => {},
                            error: (err: ErrorResponse) => {
                                console.error(err);
                                patchState(store, { error: err.detail || 'Error al eliminar cuenta' });
                            }
                        })
                    )
                )
            )
        ),

        async update(id: string, concepto: Partial<Categoria>): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(categoriaService.update(id, concepto));

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

        clearError() {
            patchState(store, { error: null });
        }
    }))
);
