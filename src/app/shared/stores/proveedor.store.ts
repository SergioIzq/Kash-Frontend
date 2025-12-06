import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ProveedorService } from '@/core/services/api/proveedor.service';
import { Proveedor } from '@/core/models/proveedor.model';

interface ProveedorState {
    proveedores: Proveedor[];
    loading: boolean;
    error: string | null;
}

const initialState: ProveedorState = {
    proveedores: [],
    loading: false,
    error: null
};

export const ProveedorStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods((store, proveedorService = inject(ProveedorService)) => ({
        async search(query: string, limit: number = 10): Promise<Proveedor[]> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(proveedorService.search(query, limit));
                
                if (response.isSuccess && response.value) {
                    const proveedores = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { proveedores, loading: false });
                    return proveedores;
                }
                throw new Error(response.error?.message || 'Error al buscar proveedores');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        async create(nombre: string): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(proveedorService.create(nombre));
                
                if (response.isSuccess && response.value) {
                    patchState(store, { loading: false });
                    return response.value; // Retornar el UUID del proveedor creado
                }
                throw new Error(response.error?.message || 'Error al crear proveedor');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        async getRecent(limit: number = 5): Promise<Proveedor[]> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(proveedorService.getRecent(limit));
                
                if (response.isSuccess && response.value) {
                    const proveedores = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { loading: false });
                    return proveedores;
                }
                throw new Error(response.error?.message || 'Error al cargar proveedores recientes');
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
