import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, debounceTime, firstValueFrom } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { IngresoService } from '@/core/services/api/ingreso.service';
import { Ingreso, IngresoCreate } from '@/core/models';
import { ErrorResponse } from '@/core/models/error-response.model';

interface IngresosState {
    ingresos: Ingreso[];
    selectedIngreso: Ingreso | null;
    loading: boolean;
    error: string | null;
    totalIngresos: number;
    totalRecords: number;
    filters: {
        fechaInicio: string;
        fechaFin: string;
        categoria: string;
        searchTerm: string;
        sortColumn: string;
        sortOrder: string;
    };
}

const initialState: IngresosState = {
    ingresos: [],
    selectedIngreso: null,
    loading: false,
    error: null,
    totalIngresos: 0,
    totalRecords: 0,
    filters: {
        fechaInicio: '',
        fechaFin: '',
        categoria: '',
        searchTerm: '',
        sortColumn: '',
        sortOrder: ''
    }
};

/**
 * Signal Store para gestión de ingresos
 * Optimizado con computed, cache y operaciones reactivas
 */
export const IngresosStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),

    withComputed((store) => ({
        // Total calculado de ingresos
        total: computed(() => {
            const ingresos = store.ingresos();
            if (!Array.isArray(ingresos)) return 0;
            return ingresos.reduce((sum, g) => sum + g.importe, 0);
        }),

        // Cantidad de ingresos
        count: computed(() => {
            const ingresos = store.ingresos();
            return Array.isArray(ingresos) ? ingresos.length : 0;
        }),

        // Ingresos filtrados por término de búsqueda
        filteredIngresos: computed(() => {
            const ingresos = store.ingresos();
            if (!Array.isArray(ingresos)) return [];

            const searchTerm = store.filters().searchTerm.toLowerCase();

            if (!searchTerm) return ingresos;

            return ingresos.filter(
                (g) => g.conceptoNombre.toLowerCase().includes(searchTerm) || g.categoriaNombre?.toLowerCase().includes(searchTerm) || g.clienteNombre?.toLowerCase().includes(searchTerm) || g.descripcion?.toLowerCase().includes(searchTerm)
            );
        }),

        // Ingresos por categoría
        ingresosPorCategoria: computed(() => {
            const ingresos = store.ingresos();
            if (!Array.isArray(ingresos)) return {};

            const categorias: Record<string, { total: number; count: number }> = {};

            ingresos.forEach((ingreso) => {
                const cat = ingreso.categoriaNombre || 'Sin categoría';
                if (!categorias[cat]) {
                    categorias[cat] = { total: 0, count: 0 };
                }
                categorias[cat].total += ingreso.importe;
                categorias[cat].count++;
            });

            return categorias;
        }),

        // Ingresos recientes (últimos 5)
        ingresosRecientes: computed(() => {
            const ingresos = store.ingresos();
            if (!Array.isArray(ingresos)) return [];

            return [...ingresos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 5);
        })
    })),

    withMethods((store, ingresoService = inject(IngresoService)) => ({
        // Cargar ingresos
        loadIngresos: rxMethod<void>(
            pipe(
                tap(() => patchState(store, { loading: true, error: null })),
                switchMap(() =>
                    ingresoService.getAllIngresos().pipe(
                        tapResponse({
                            next: (ingresos) => {
                                patchState(store, {
                                    ingresos,
                                    loading: false,
                                    error: null
                                });
                            },
                            error: (error: any) => {
                                patchState(store, {
                                    loading: false,
                                    error: error.userMessage || 'Error al cargar ingresos'
                                });
                            }
                        })
                    )
                )
            )
        ),

        // Cargar ingresos con paginación, búsqueda y ordenamiento
        loadIngresosPaginated: rxMethod<{
            page: number;
            pageSize: number;
            searchTerm?: string;
            sortColumn?: string;
            sortOrder?: string;
        }>(
            pipe(
                tap(({ page, pageSize, searchTerm, sortColumn, sortOrder }) => {
                    patchState(store, { loading: true, error: null });
                }),
                switchMap(({ page, pageSize, searchTerm, sortColumn, sortOrder }) =>
                    ingresoService.getIngresos(page, pageSize, searchTerm, sortColumn, sortOrder).pipe(
                        tapResponse({
                            next: (response) => {
                                patchState(store, {
                                    ingresos: response.items,
                                    totalRecords: response.totalCount,
                                    loading: false,
                                    error: null
                                });
                            },
                            error: (error: any) => {
                                console.error('[STORE] Error al cargar ingresos:', error);
                                patchState(store, {
                                    loading: false,
                                    error: error.userMessage || 'Error al cargar ingresos'
                                });
                            }
                        })
                    )
                )
            )
        ),

        // Cargar ingresos por período
        loadIngresosPorPeriodo: rxMethod<{ fechaInicio: string; fechaFin: string }>(
            pipe(
                tap(() => patchState(store, { loading: true, error: null })),
                switchMap(({ fechaInicio, fechaFin }) =>
                    ingresoService.getIngresosPorPeriodo(fechaInicio, fechaFin).pipe(
                        tapResponse({
                            next: (ingresos) => {
                                patchState(store, {
                                    ingresos,
                                    loading: false,
                                    filters: { ...store.filters(), fechaInicio, fechaFin }
                                });
                            },
                            error: (error: any) => {
                                patchState(store, {
                                    loading: false,
                                    error: error.userMessage || 'Error al cargar ingresos'
                                });
                            }
                        })
                    )
                )
            )
        ),

        // Crear ingreso
        async createIngreso(ingreso: IngresoCreate): Promise<string> {
            patchState(store, { loading: true, error: null });

            try {
                const newIngresoId = await firstValueFrom(ingresoService.create(ingreso));
                // El backend solo devuelve el ID, no el objeto completo
                // Necesitaremos recargar la lista o hacer un fetch del ingreso por ID
                patchState(store, { loading: false });
                return newIngresoId;
            } catch (error: any) {
                patchState(store, {
                    loading: false,
                    error: error.userMessage || 'Error al crear ingreso'
                });
                throw error;
            }
        },

        // Actualizar ingreso
        async updateIngreso(payload: { id: string; ingreso: Partial<Ingreso> }): Promise<void> {
            const { id, ingreso } = payload;
            patchState(store, { loading: true, error: null });

            try {
                await firstValueFrom(ingresoService.update(id, ingreso));

                // Actualizar estado local
                const ingresos = store.ingresos().map((g) => (g.id === id ? { ...g, ...ingreso } : g));
                patchState(store, { ingresos, loading: false });
            } catch (error: any) {
                patchState(store, {
                    loading: false,
                    error: error.userMessage || 'Error al actualizar ingreso'
                });
                throw error;
            }
        },

        // Eliminar ingreso
        deleteIngreso: rxMethod<string>(
            pipe(
                // 1. (Opcional) Actualización Optimista Inmediata: Lo borramos de la vista antes de ir al servidor
                tap((id) => {
                    patchState(store, (state) => ({
                        ingresos: state.ingresos.filter((g) => g.id !== id),
                        totalRecords: state.totalRecords - 1 // Ajustamos el contador visualmente
                    }));
                }),
                switchMap((id) =>
                    ingresoService.delete(id).pipe(
                        tapResponse({
                            next: () => {

                            },
                            error: (err: ErrorResponse) => {
                                // Si falla, tenemos que revertir el cambio (volver a poner el gasto)
                                // O simplemente mostrar el error y recargar la tabla real
                                console.error(err);
                                patchState(store, { error: err.detail || 'Error al eliminar ingreso' });
                            }
                        })
                    )
                )
            )
        ),

        // Buscar ingresos con debounce
        searchIngresos: rxMethod<string>(
            pipe(
                debounceTime(300), // Esperar 300ms después de dejar de escribir
                tap((searchTerm) => {
                    patchState(store, {
                        filters: { ...store.filters(), searchTerm }
                    });
                })
            )
        ),

        // Seleccionar ingreso
        selectIngreso(ingreso: Ingreso | null) {
            patchState(store, { selectedIngreso: ingreso });
        },

        // Actualizar filtros
        setFilters(filters: Partial<IngresosState['filters']>) {
            patchState(store, {
                filters: { ...store.filters(), ...filters }
            });
        },

        // Limpiar error
        clearError() {
            patchState(store, { error: null });
        }
    }))
);
