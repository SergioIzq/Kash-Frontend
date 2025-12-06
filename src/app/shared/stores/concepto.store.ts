import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ConceptoService } from '@/core/services/api/concepto.service';
import { Concepto } from '@/core/models/concepto.model';

interface ConceptoState {
    conceptos: Concepto[];
    loading: boolean;
    error: string | null;
}

const initialState: ConceptoState = {
    conceptos: [],
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
                
                if (response.isSuccess && response.value) {
                    patchState(store, { loading: false });
                    return response.value; // Retornar el UUID del concepto creado
                }
                throw new Error(response.error?.message || 'Error al crear concepto');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

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
