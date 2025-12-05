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
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(categoriaService.search(query, limit));
                
                // Manejar Result<Categoria[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const categorias = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { categorias, loading: false });
                    return categorias;
                } else {
                    const errorMsg = response.error?.message || 'Error al buscar categorías';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al buscar categorías';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        async create(nombre: string): Promise<void> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(categoriaService.create(nombre));
                
                // Manejar Result<CategoriaItem>
                if (response.isSuccess && response.value) {
                    const nuevaCategoria = response.value;
                    
                    // Agregar a la lista local
                    patchState(store, { 
                        categorias: [nuevaCategoria, ...store.categorias()],
                        loading: false 
                    });
                    
                    return nuevaCategoria;
                } else {
                    const errorMsg = response.error?.message || 'Error al crear categoría';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al crear categoría';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        async getRecent(limit: number = 5): Promise<Categoria[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(categoriaService.getRecent(limit));
                
                // Manejar Result<Categoria[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const categorias = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { loading: false });
                    return categorias;
                } else {
                    const errorMsg = response.error?.message || 'Error al cargar categorías recientes';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al cargar categorías recientes';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        clearError() {
            patchState(store, { error: null });
        }
    }))
);
