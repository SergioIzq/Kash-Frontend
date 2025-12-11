import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { IngresoProgramadoService } from '@/core/services/api/ingreso-programado.service';
import { IngresoProgramado } from '@/core/models/ingreso-programado.model';

interface IngresosProgramadosState {
    ingresosProgramados: IngresoProgramado[];
    selectedIngreso: IngresoProgramado | null;
    loading: boolean;
    error: string | null;
    totalRecords: number;
}

const initialState: IngresosProgramadosState = {
    ingresosProgramados: [],
    selectedIngreso: null,
    loading: false,
    error: null,
    totalRecords: 0
};

export const IngresosProgramadosStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),

    withComputed((store) => ({
        count: computed(() => store.ingresosProgramados().length),
        activos: computed(() => store.ingresosProgramados().filter(i => i.activo)),
        inactivos: computed(() => store.ingresosProgramados().filter(i => !i.activo))
    })),

    withMethods((store, service = inject(IngresoProgramadoService)) => ({
        loadIngresosProgramadosPaginated: rxMethod<{
            page: number;
            pageSize: number;
            searchTerm?: string;
            sortColumn?: string;
            sortOrder?: string;
        }>(
            pipe(
                tap(() => patchState(store, { loading: true })),
                switchMap(({ page, pageSize, searchTerm, sortColumn, sortOrder }) =>
                    service.getIngresosProgramados(page, pageSize, searchTerm, sortColumn, sortOrder).pipe(
                        tapResponse({
                            next: (response) => {
                                patchState(store, {
                                    ingresosProgramados: response.items,
                                    totalRecords: response.totalCount,
                                    loading: false,
                                    error: null
                                });
                            },
                            error: (error: any) => {
                                patchState(store, {
                                    loading: false,
                                    error: error.message || 'Error al cargar ingresos programados'
                                });
                            }
                        })
                    )
                )
            )
        ),

        createIngreso: rxMethod<any>(
            pipe(
                tap(() => patchState(store, { loading: true })),
                switchMap((ingreso) =>
                    service.create(ingreso).pipe(
                        tapResponse({
                            next: () => {
                                patchState(store, { loading: false, error: null });
                            },
                            error: (error: any) => {
                                patchState(store, {
                                    loading: false,
                                    error: error.message || 'Error al crear ingreso programado'
                                });
                            }
                        })
                    )
                )
            )
        ),

        async update(id: string, ingreso: Partial<IngresoProgramado>): Promise<string> {
            patchState(store, { loading: true });
            try {
                const response = await firstValueFrom(service.update(id, ingreso));

                if (response.isSuccess) {
                    patchState(store, { loading: false });
                    return response.value;
                }
                throw new Error(response.error?.message || 'Error al actualizar proveedor');
            } catch (err) {
                patchState(store, { loading: false });
                throw err;
            }
        },

        deleteIngreso: rxMethod<string>(
            pipe(
                tap((id) => {
                    const ingresos = store.ingresosProgramados().filter((i) => i.id !== id);
                    patchState(store, { ingresosProgramados: ingresos });
                }),
                switchMap((id) =>
                    service.delete(id).pipe(
                        tapResponse({
                            next: () => {
                                patchState(store, { error: null });
                            },
                            error: (error: any) => {
                                patchState(store, {
                                    error: error.message || 'Error al eliminar ingreso programado'
                                });
                            }
                        })
                    )
                )
            )
        ),

        selectIngreso(ingreso: IngresoProgramado | null) {
            patchState(store, { selectedIngreso: ingreso });
        },

        clearError() {
            patchState(store, { error: null });
        }
    }))
);
