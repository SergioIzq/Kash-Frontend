import { Type, computed, inject } from '@angular/core';
import { signalStoreFeature, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { Observable, firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { Result, PaginatedList } from '@/core/models/common.model';
import { ErrorResponse } from '@/core/models/error-response.model';
import { PaginatedQuery } from '@/shared/components/crud/crud-list.types';

/**
 * Entidad mínima gestionable por {@link withCrudStore}.
 */
export interface CrudEntity {
    id: string;
    nombre?: string;
}

/**
 * Forma del error HTTP enriquecido por el interceptor (campo `userMessage`).
 */
interface HttpErrorLike {
    userMessage?: string;
}

/**
 * Estado común de un store CRUD de catálogo.
 */
export interface CrudStoreState<T> {
    items: T[];
    totalRecords: number;
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
    searchCache: Map<string, T[]>;
}

/**
 * Adaptador que conecta el feature genérico con el servicio API concreto de la
 * entidad. Aísla las diferencias de nombres de método (`getCategorias` vs
 * `getConceptos`...) y el parámetro extra opcional (`categoriaId` en conceptos).
 */
export interface CrudServiceAdapter<T extends CrudEntity, Svc> {
    /** Clase del servicio a inyectar. */
    service: Type<Svc>;
    /** Nombre en singular para los mensajes de error, p.ej. "categoría". */
    singular: string;
    /** Nombre en plural para los mensajes de error, p.ej. "categorías". */
    plural: string;
    /** Carga paginada server-side. */
    load: (svc: Svc, query: PaginatedQuery) => Observable<PaginatedList<T>>;
    /** Búsqueda ligera (autocomplete). `extra` = filtro opcional (p.ej. categoriaId). */
    search: (svc: Svc, query: string, limit: number, extra?: string) => Observable<Result<T[]>>;
    /** Registros usados recientemente. `extra` = filtro opcional. */
    getRecent: (svc: Svc, limit: number, extra?: string) => Observable<Result<T[]>>;
    /** Actualización. */
    update: (svc: Svc, id: string, entity: Partial<T>) => Observable<Result<string>>;
    /** Borrado. El valor de la respuesta se ignora (solo importa éxito/error),
     *  por lo que se acepta tanto `Observable<void>` como `Observable<Result<void>>`. */
    remove: (svc: Svc, id: string) => Observable<unknown>;
    /** Comparador para reordenar tras un rollback de borrado. Por defecto por `nombre`. */
    compare?: (a: T, b: T) => number;
}

const initialCrudState = <T>(): CrudStoreState<T> => ({
    items: [],
    totalRecords: 0,
    loading: false,
    error: null,
    lastUpdated: null,
    searchCache: new Map<string, T[]>()
});

/**
 * Feature de NgRx Signals que aporta todo el comportamiento común de un store
 * CRUD de catálogo (estado, computed y métodos con actualización optimista y
 * rollback). Elimina el código duplicado byte a byte entre los stores de
 * categorías, proveedores, clientes, personas, conceptos y formas de pago.
 *
 * Cada store concreto lo compone y añade únicamente:
 * - un alias con el nombre propio de la colección (`categorias`, `proveedores`...)
 * - su método `create` (aridad variable) apoyándose en `createOptimistic`.
 */
export function withCrudStore<T extends CrudEntity, Svc>(adapter: CrudServiceAdapter<T, Svc>) {
    const compare = adapter.compare ?? ((a: T, b: T) => (a.nombre ?? '').localeCompare(b.nombre ?? ''));

    return signalStoreFeature(
        withState<CrudStoreState<T>>(initialCrudState<T>()),

        withComputed((store) => ({
            hasData: computed(() => store.items().length > 0)
        })),

        withComputed((store) => ({
            isSyncing: computed(() => store.loading() && store.hasData())
        })),

        withMethods((store) => {
            const svc = inject(adapter.service);

            return {
                /** Carga paginada (con orden y búsqueda) server-side. */
                loadPaginated: rxMethod<PaginatedQuery>(
                    pipe(
                        tap(() => patchState(store, { loading: true, error: null })),
                        switchMap((query) =>
                            adapter.load(svc, query).pipe(
                                tapResponse({
                                    next: (response: PaginatedList<T>) => {
                                        patchState(store, {
                                            items: response.items,
                                            totalRecords: response.totalCount,
                                            loading: false,
                                            error: null,
                                            lastUpdated: Date.now(),
                                            searchCache: new Map<string, T[]>()
                                        });
                                    },
                                    error: (error: HttpErrorLike) => {
                                        console.error(`[STORE] Error al cargar ${adapter.plural}:`, error);
                                        patchState(store, {
                                            loading: false,
                                            error: error.userMessage || `Error al cargar ${adapter.plural}`
                                        });
                                    }
                                })
                            )
                        )
                    )
                ),

                /** Búsqueda ligera con caché en memoria (para autocompletes). */
                async search(query: string, limit: number = 10, extra?: string): Promise<T[]> {
                    const cacheKey = `${query}_${limit}_${extra ?? ''}`;
                    const cached = store.searchCache().get(cacheKey);
                    if (cached) {
                        return cached;
                    }

                    patchState(store, { loading: true, error: null });
                    try {
                        const response = await firstValueFrom(adapter.search(svc, query, limit, extra));

                        if (response.isSuccess && response.value) {
                            const list = Array.isArray(response.value) ? response.value : [];
                            const newCache = new Map(store.searchCache());
                            newCache.set(cacheKey, list);
                            patchState(store, { loading: false, searchCache: newCache, lastUpdated: Date.now() });
                            return list;
                        }

                        throw new Error(response.error?.message || `Error al buscar ${adapter.plural}`);
                    } catch (err) {
                        patchState(store, { loading: false, error: (err as Error).message });
                        throw err;
                    }
                },

                /** Registros usados recientemente. */
                async getRecent(limit: number = 5, extra?: string): Promise<T[]> {
                    patchState(store, { loading: true, error: null });
                    try {
                        const response = await firstValueFrom(adapter.getRecent(svc, limit, extra));

                        if (response.isSuccess && response.value) {
                            const list = Array.isArray(response.value) ? response.value : [];
                            patchState(store, { loading: false });
                            return list;
                        }

                        throw new Error(response.error?.message || `Error al cargar ${adapter.plural} recientes`);
                    } catch (err) {
                        patchState(store, { loading: false, error: (err as Error).message });
                        throw err;
                    }
                },

                /**
                 * Alta con actualización optimista. `buildEntity(id)` construye la
                 * entidad (temporal con id provisional y definitiva con el id real),
                 * absorbiendo las diferencias de campos entre entidades.
                 */
                async createOptimistic(buildEntity: (id: string) => T, request$: Observable<Result<string>>): Promise<string> {
                    const tempId = `temp_${Date.now()}`;
                    const tempEntity = buildEntity(tempId);

                    patchState(store, {
                        items: [...store.items(), tempEntity],
                        loading: true,
                        error: null
                    });

                    try {
                        const response = await firstValueFrom(request$);

                        if (response.isSuccess) {
                            const realEntity = buildEntity(response.value);
                            patchState(store, {
                                items: store.items().map((e) => (e.id === tempId ? realEntity : e)),
                                loading: false,
                                lastUpdated: Date.now(),
                                searchCache: new Map<string, T[]>()
                            });
                            return response.value;
                        }

                        throw new Error(response.error?.message || `Error al crear ${adapter.singular}`);
                    } catch (err) {
                        patchState(store, {
                            items: store.items().filter((e) => e.id !== tempId),
                            loading: false,
                            error: (err as Error).message
                        });
                        throw err;
                    }
                },

                /** Actualización con rollback optimista. */
                async update(id: string, entity: Partial<T>): Promise<string> {
                    const previous = store.items().find((e) => e.id === id);

                    if (previous) {
                        patchState(store, {
                            items: store.items().map((e) => (e.id === id ? { ...e, ...entity } : e)),
                            loading: true,
                            error: null
                        });
                    }

                    try {
                        const response = await firstValueFrom(adapter.update(svc, id, entity));

                        if (response.isSuccess) {
                            patchState(store, {
                                loading: false,
                                lastUpdated: Date.now(),
                                searchCache: new Map<string, T[]>()
                            });
                            return response.value;
                        }

                        throw new Error(response.error?.message || `Error al actualizar ${adapter.singular}`);
                    } catch (err) {
                        if (previous) {
                            patchState(store, { items: store.items().map((e) => (e.id === id ? previous : e)) });
                        }
                        patchState(store, { loading: false, error: (err as Error).message });
                        throw err;
                    }
                },

                /** Borrado con actualización optimista y rollback ordenado. */
                remove: rxMethod<string>(
                    pipe(
                        switchMap((id) => {
                            const removed = store.items().find((e) => e.id === id);
                            const previousTotal = store.totalRecords();

                            patchState(store, (state) => ({
                                items: state.items.filter((e) => e.id !== id),
                                totalRecords: state.totalRecords - 1,
                                searchCache: new Map<string, T[]>()
                            }));

                            return adapter.remove(svc, id).pipe(
                                tapResponse({
                                    next: () => patchState(store, { lastUpdated: Date.now() }),
                                    error: (err: ErrorResponse) => {
                                        console.error(`[STORE] Error al eliminar ${adapter.singular}:`, err);
                                        if (removed) {
                                            patchState(store, (state) => ({
                                                items: [...state.items, removed].sort(compare),
                                                totalRecords: previousTotal,
                                                error: err.detail || `Error al eliminar ${adapter.singular}`
                                            }));
                                        } else {
                                            patchState(store, { error: err.detail || `Error al eliminar ${adapter.singular}` });
                                        }
                                    }
                                })
                            );
                        })
                    )
                ),

                clearError() {
                    patchState(store, { error: null });
                }
            };
        })
    );
}
