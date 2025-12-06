import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ClienteService } from '@/core/services/api/cliente.service';
import { Cliente } from '@/core/models/cliente.model';

interface ClienteState {
    clientes: Cliente[];
    loading: boolean;
    error: string | null;
}

const initialState: ClienteState = {
    clientes: [],
    loading: false,
    error: null
};

export const ClienteStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods((store, clienteService = inject(ClienteService)) => ({
        async search(query: string, limit: number = 10): Promise<Cliente[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(clienteService.search(query, limit));
                
                // Manejar Result<Cliente[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const clientes = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { clientes, loading: false });
                    return clientes;
                } else {
                    const errorMsg = response.error?.message || 'Error al buscar clientes';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al buscar clientes';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        async create(nombre: string): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(clienteService.create(nombre));
                
                if (response.isSuccess && response.value) {
                    patchState(store, { loading: false });
                    return response.value; // Retornar el UUID
                }
                throw new Error(response.error?.message || 'Error al crear cliente');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        async getRecent(limit: number = 5): Promise<Cliente[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(clienteService.getRecent(limit));
                
                // Manejar Result<Cliente[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const clientes = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { loading: false });
                    return clientes;
                } else {
                    const errorMsg = response.error?.message || 'Error al cargar clientes recientes';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al cargar clientes recientes';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        clearError() {
            patchState(store, { error: null });
        }
    }))
);
