import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, firstValueFrom } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import { CuentaService } from '@/core/services/api/cuenta.service';
import { Cuenta } from '@/core/models/cuenta.model';
import { ErrorResponse } from '@/core/models/error-response.model';

interface CuentaState {
    cuentas: Cuenta[];
    totalRecords: number;
    loading: boolean;
    error: string | null;
}

const initialState: CuentaState = {
    cuentas: [],
    totalRecords: 0,
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

        async create(nombre: string, saldo: number): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(cuentaService.create(nombre, saldo));

                if (response.isSuccess) {
                    patchState(store, { loading: false });
                    return response.value;
                }
                throw new Error(response.error?.message || 'Error al crear cuenta');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        loadCuentasPaginated: rxMethod<{
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
                    cuentaService.getCuentas(page, pageSize, searchTerm, sortColumn, sortOrder).pipe(
                        tapResponse({
                            next: (response) => {
                                patchState(store, {
                                    cuentas: response.items,
                                    totalRecords: response.totalCount,
                                    loading: false,
                                    error: null
                                });
                            },
                            error: (error: any) => {
                                console.error('[STORE] Error al cargar cuentas:', error);
                                patchState(store, {
                                    loading: false,
                                    error: error.userMessage || 'Error al cargar cuentas'
                                });
                            }
                        })
                    )
                )
            )
        ),

        async update(id: string, cuenta: Partial<Cuenta>): Promise<Cuenta> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(cuentaService.update(id, cuenta));

                if (response.isSuccess) {
                    patchState(store, { loading: false });
                    return response.value;
                }
                throw new Error(response.error?.message || 'Error al actualizar cuenta');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        deleteCuenta: rxMethod<string>(
            pipe(
                // 1. (Opcional) Actualización Optimista Inmediata: Lo borramos de la vista antes de ir al servidor
                tap((id) => {
                    patchState(store, (state) => ({
                        cuentas: state.cuentas.filter((c) => c.id !== id),
                        totalRecords: state.totalRecords - 1 // Ajustamos el contador visualmente
                    }));
                }),
                switchMap((id) =>
                    cuentaService.delete(id).pipe(
                        tapResponse({
                            next: () => {},
                            error: (err: ErrorResponse) => {
                                console.error(err);
                                patchState(store, { error: err.detail || 'Error al eliminar cuenta' });
                            }
                        })
                    )
                )
            )
        ),

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
