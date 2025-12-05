import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { PersonaService } from '@/core/services/api/persona.service';
import { Persona } from '@/core/models/persona.model';

interface PersonaState {
    personas: Persona[];
    loading: boolean;
    error: string | null;
}

const initialState: PersonaState = {
    personas: [],
    loading: false,
    error: null
};

export const PersonaStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods((store, personaService = inject(PersonaService)) => ({
        async search(query: string, limit: number = 10): Promise<Persona[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(personaService.search(query, limit));
                
                // Manejar Result<Persona[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const personas = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { personas, loading: false });
                    return personas;
                } else {
                    const errorMsg = response.error?.message || 'Error al buscar personas';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al buscar personas';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        async create(nombre: string): Promise<void> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(personaService.create(nombre));
                
                // Manejar Result<PersonaItem>
                if (response.isSuccess && response.value) {
                    const nuevaPersona = response.value;
                    
                    // Agregar a la lista local
                    patchState(store, { 
                        personas: [nuevaPersona, ...store.personas()],
                        loading: false 
                    });
                    
                    return nuevaPersona;
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

        async getRecent(limit: number = 5): Promise<Persona[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(personaService.getRecent(limit));
                
                // Manejar Result<Persona[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const personas = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { loading: false });
                    return personas;
                } else {
                    const errorMsg = response.error?.message || 'Error al cargar personas recientes';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al cargar personas recientes';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        clearError() {
            patchState(store, { error: null });
        }
    }))
);
