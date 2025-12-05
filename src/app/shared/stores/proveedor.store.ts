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
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(proveedorService.search(query, limit));
                
                // Manejar Result<Proveedor[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const proveedores = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { proveedores, loading: false });
                    return proveedores;
                } else {
                    const errorMsg = response.error?.message || 'Error al buscar proveedores';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al buscar proveedores';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        async create(nombre: string): Promise<void> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(proveedorService.create(nombre));
                
                // Manejar Result<ProveedorItem>
                if (response.isSuccess && response.value) {
                    const nuevaProveedor = response.value;
                    
                    // Agregar a la lista local
                    patchState(store, { 
                        proveedores: [nuevaProveedor, ...store.proveedores()],
                        loading: false 
                    });
                    
                    return nuevaProveedor;
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

        async getRecent(limit: number = 5): Promise<Proveedor[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(proveedorService.getRecent(limit));
                
                // Manejar Result<Proveedor[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const proveedores = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { loading: false });
                    return proveedores;
                } else {
                    const errorMsg = response.error?.message || 'Error al cargar proveedores recientes';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al cargar proveedores recientes';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        clearError() {
            patchState(store, { error: null });
        }
    }))
);
