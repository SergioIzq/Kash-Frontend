import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { CategoriaService } from '@/core/services/api/categoria.service';
import { Categoria } from '@/core/models/categoria.model';

interface CategoriaState {
    categorias: Categoria[];
    loading: boolean;
    error: string | null;
}

const initialState: CategoriaState = {
    categorias: [],
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

        clearError() {
            patchState(store, { error: null });
        }
    }))
);
