import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, firstValueFrom } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import { PersonaService } from '@/core/services/api/persona.service';
import { Persona } from '@/core/models/persona.model';
import { ErrorResponse } from '@/core/models/error-response.model';

interface PersonaState {
    personas: Persona[];
    totalRecords: number;
    loading: boolean;
    error: string | null;
}

const initialState: PersonaState = {
    personas: [],
    totalRecords: 0,
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
                    patchState(store, { personas: personas, loading: false });
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

        async create(nombre: string): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(personaService.create(nombre));

                if (response.isSuccess) {
                    patchState(store, { loading: false });
                    return response.value;
                }
                throw new Error(response.error?.message || 'Error al crear persona');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        loadPersonasPaginated: rxMethod<{
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
                    personaService.getPersonas(page, pageSize, searchTerm, sortColumn, sortOrder).pipe(
                        tapResponse({
                            next: (response) => {
                                patchState(store, {
                                    personas: response.items,
                                    totalRecords: response.totalCount,
                                    loading: false,
                                    error: null
                                });
                            },
                            error: (error: any) => {
                                console.error('[STORE] Error al cargar personas:', error);
                                patchState(store, {
                                    loading: false,
                                    error: error.userMessage || 'Error al cargar personas'
                                });
                            }
                        })
                    )
                )
            )
        ),

        async update(id: string, persona: Partial<Persona>): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(personaService.update(id, persona));

                if (response.isSuccess) {
                    patchState(store, { loading: false });
                    return response.value;
                }
                throw new Error(response.error?.message || 'Error al actualizar persona');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        deletePersona: rxMethod<string>(
            pipe(
                // Actualización Optimista: Lo borramos de la vista antes de ir al servidor
                tap((id) => {
                    patchState(store, (state) => ({
                        personas: state.personas.filter((p) => p.id !== id),
                        totalRecords: state.totalRecords - 1
                    }));
                }),
                switchMap((id) =>
                    personaService.delete(id).pipe(
                        tapResponse({
                            next: () => {},
                            error: (err: ErrorResponse) => {
                                console.error(err);
                                patchState(store, { error: err.detail || 'Error al eliminar persona' });
                            }
                        })
                    )
                )
            )
        ),

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
