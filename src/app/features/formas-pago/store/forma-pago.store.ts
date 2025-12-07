import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, firstValueFrom } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import { FormaPagoService } from '@/core/services/api/forma-pago.service';
import { FormaPago } from '@/core/models/forma-pago.model';
import { ErrorResponse } from '@/core/models/error-response.model';

interface FormaPagoState {
    formasPago: FormaPago[];
    totalRecords: number;
    loading: boolean;
    error: string | null;
}

const initialState: FormaPagoState = {
    formasPago: [],
    totalRecords: 0,
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
                    const formasPago = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { formasPago, loading: false });
                    return formasPago;
                } else {
                    const errorMsg = response.error?.message || 'Error al buscar formas de pago';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al buscar formas de pago';
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
                throw new Error(response.error?.message || 'Error al crear forma de pago');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        loadFormasPagoPaginated: rxMethod<{
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
                    formaPagoService.getFormasPago(page, pageSize, searchTerm, sortColumn, sortOrder).pipe(
                        tapResponse({
                            next: (response) => {
                                patchState(store, {
                                    formasPago: response.items,
                                    totalRecords: response.totalCount,
                                    loading: false,
                                    error: null
                                });
                            },
                            error: (error: any) => {
                                console.error('[STORE] Error al cargar formas de pago:', error);
                                patchState(store, {
                                    loading: false,
                                    error: error.userMessage || 'Error al cargar formas de pago'
                                });
                            }
                        })
                    )
                )
            )
        ),

        async update(id: string, formaPago: Partial<FormaPago>): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(formaPagoService.update(id, formaPago));

                if (response.isSuccess) {
                    patchState(store, { loading: false });
                    return response.value;
                }
                throw new Error(response.error?.message || 'Error al actualizar forma de pago');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        deleteFormaPago: rxMethod<string>(
            pipe(
                // Actualización Optimista: Lo borramos de la vista antes de ir al servidor
                tap((id) => {
                    patchState(store, (state) => ({
                        formasPago: state.formasPago.filter((f) => f.id !== id),
                        totalRecords: state.totalRecords - 1
                    }));
                }),
                switchMap((id) =>
                    formaPagoService.delete(id).pipe(
                        tapResponse({
                            next: () => {},
                            error: (err: ErrorResponse) => {
                                console.error(err);
                                patchState(store, { error: err.detail || 'Error al eliminar forma de pago' });
                            }
                        })
                    )
                )
            )
        ),

        async getRecent(limit: number = 5): Promise<FormaPago[]> {
            patchState(store, { loading: true, error: null });
            try {
                const response = await firstValueFrom(formaPagoService.getRecent(limit));

                // Manejar Result<FormaPago[]> - el backend devuelve array directo en value
                if (response.isSuccess && response.value) {
                    const formasPago = Array.isArray(response.value) ? response.value : (response.value as any).items || [];
                    patchState(store, { loading: false });
                    return formasPago;
                } else {
                    const errorMsg = response.error?.message || 'Error al cargar formas de pago recientes';
                    patchState(store, { loading: false, error: errorMsg });
                    throw new Error(errorMsg);
                }
            } catch (err: any) {
                const errorMsg = err.message || 'Error al cargar formas de pago recientes';
                patchState(store, { loading: false, error: errorMsg });
                throw err;
            }
        },

        clearError() {
            patchState(store, { error: null });
        }
    }))
);
