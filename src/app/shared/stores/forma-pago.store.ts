import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { FormaPagoService } from '@/core/services/api/forma-pago.service';
import { FormaPago } from '@/core/models/forma-pago.model';

interface FormaPagoState {
    formaPagos: FormaPago[];
    loading: boolean;
    error: string | null;
}

const initialState: FormaPagoState = {
    formaPagos: [],
    loading: false,
    error: null
};

export const FormaPagoStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods((store, formaPagoService = inject(FormaPagoService)) => ({
        async search(query: string, limit: number = 10): Promise<FormaPago[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(formaPagoService.search(query, limit));

                // Manejar Result<FormaPago[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const formaPagos = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { formaPagos, loading: false });
                    return formaPagos;
                } else {
                    const errorMsg = response.error?.message || 'Error al buscar formaPagos';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al buscar formaPagos';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        async create(nombre: string): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(formaPagoService.create(nombre));

                if (response.isSuccess) {
                    patchState(store, { loading: false });
                    return response.value;
                }
                throw new Error(response.error?.message || 'Error al crear concepto');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        async getRecent(limit: number = 5): Promise<FormaPago[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(formaPagoService.getRecent(limit));

                // Manejar Result<FormaPago[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const formaPagos = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { loading: false });
                    return formaPagos;
                } else {
                    const errorMsg = response.error?.message || 'Error al cargar formaPagos recientes';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al cargar formaPagos recientes';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        clearError() {
            patchState(store, { error: null });
        }
    }))
);
