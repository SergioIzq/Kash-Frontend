import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { CategoriaService } from '@/core/services/api/categoria.service';
import { Categoria } from '@/core/models/categoria.model';
import { withCrudStore } from '@sergioizq/ngrx-crud-store';

export const CategoriaStore = signalStore(
    { providedIn: 'root' },
    withCrudStore<Categoria, CategoriaService>({
        service: CategoriaService,
        singular: 'categoría',
        plural: 'categorías',
        load: (svc, q) => svc.getCategorias(q.page, q.pageSize, q.searchTerm, q.sortColumn, q.sortOrder),
        search: (svc, query, limit) => svc.search(query, limit),
        getRecent: (svc, limit) => svc.getRecent(limit),
        update: (svc, id, entity) => svc.update(id, entity),
        remove: (svc, id) => svc.delete(id)
    }),

    // Alias con el nombre propio de la colección (consumido por otros stores/componentes)
    withComputed((store) => ({
        categorias: computed(() => store.items())
    })),

    withMethods((store) => {
        const categoriaService = inject(CategoriaService);
        return {
            create(nombre: string): Promise<string> {
                return store.createOptimistic(
                    (id) => ({ id, nombre, descripcion: '', fechaCreacion: new Date(), usuarioId: '' }),
                    categoriaService.create(nombre)
                );
            }
        };
    })
);
