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
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(personaService.search(query, limit));
                
                if (response.isSuccess && response.value) {
                    const personas = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { personas, loading: false });
                    return personas;
                }
                throw new Error(response.error?.message || 'Error al buscar personas');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        async create(nombre: string): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(personaService.create(nombre));
                
                if (response.isSuccess && response.value) {
                    patchState(store, { loading: false });
                    return response.value; // Retornar el UUID de la persona creada
                }
                throw new Error(response.error?.message || 'Error al crear persona');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        async getRecent(limit: number = 5): Promise<Persona[]> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(personaService.getRecent(limit));
                
                if (response.isSuccess && response.value) {
                    const personas = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { loading: false });
                    return personas;
                }
                throw new Error(response.error?.message || 'Error al cargar personas recientes');
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
