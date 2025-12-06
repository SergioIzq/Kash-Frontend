import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { CuentaService } from '@/core/services/api/cuenta.service';
import { Cuenta } from '@/core/models/cuenta.model';

interface CuentaState {
    cuentas: Cuenta[];
    loading: boolean;
    error: string | null;
}

const initialState: CuentaState = {
    cuentas: [],
    loading: false,
    error: null
};

export const CuentaStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods((store, cuentaService = inject(CuentaService)) => ({
        async search(query: string, limit: number = 10): Promise<Cuenta[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(cuentaService.search(query, limit));
                
                // Manejar Result<Cuenta[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const cuentas = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { cuentas, loading: false });
                    return cuentas;
                } else {
                    const errorMsg = response.error?.message || 'Error al buscar cuentas';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al buscar cuentas';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        async create(nombre: string): Promise<void> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(cuentaService.create(nombre));
                
                if (response.isSuccess) {
                    patchState(store, { loading: false });
                    return;
                }
                throw new Error(response.error?.message || 'Error al crear concepto');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        async getRecent(limit: number = 5): Promise<Cuenta[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(cuentaService.getRecent(limit));
                
                // Manejar Result<Cuenta[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const cuentas = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { loading: false });
                    return cuentas;
                } else {
                    const errorMsg = response.error?.message || 'Error al cargar cuentas recientes';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al cargar cuentas recientes';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        clearError() {
            patchState(store, { error: null });
        }
    }))
);
