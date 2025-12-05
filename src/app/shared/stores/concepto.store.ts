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
        async search(query: string, limit: number = 10): Promise<Concepto[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(conceptoService.search(query, limit));
                
                // Manejar Result<Concepto[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const conceptos = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { conceptos, loading: false });
                    return conceptos;
                } else {
                    const errorMsg = response.error?.message || 'Error al buscar conceptos';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al buscar conceptos';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        async create(nombre: string): Promise<Concepto> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(conceptoService.create(nombre));
                
                // Manejar Result<Concepto>
                if (response.isSuccess && response.value) {
                    const nuevoConcepto = response.value;
                    
                    // Agregar a la lista local
                    patchState(store, { 
                        conceptos: [nuevoConcepto, ...store.conceptos()],
                        loading: false 
                    });
                    
                    return nuevoConcepto;
                } else {
                    const errorMsg = response.error?.message || 'Error al crear concepto';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al crear concepto';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        async getRecent(limit: number = 5): Promise<Concepto[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(conceptoService.getRecent(limit));
                
                // Manejar Result<Concepto[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const conceptos = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { loading: false });
                    return conceptos;
                } else {
                    const errorMsg = response.error?.message || 'Error al cargar conceptos recientes';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al cargar conceptos recientes';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        clearError() {
            patchState(store, { error: null });
        }
    }))
);
