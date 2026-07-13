import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { ConceptoService } from '@/core/services/api/concepto.service';
import { Concepto } from '@/core/models/concepto.model';
import { withCrudStore } from '@/shared/stores/with-crud-store';

export const ConceptoStore = signalStore(
    { providedIn: 'root' },
    withCrudStore<Concepto, ConceptoService>({
        service: ConceptoService,
        singular: 'concepto',
        plural: 'conceptos',
        load: (svc, q) => svc.getConceptos(q.page, q.pageSize, q.searchTerm, q.sortColumn, q.sortOrder),
        // `extra` transporta el categoriaId opcional para filtrar la búsqueda.
        search: (svc, query, limit, extra) => svc.search(query, limit, extra),
        getRecent: (svc, limit, extra) => svc.getRecent(limit, extra),
        update: (svc, id, entity) => svc.update(id, entity),
        remove: (svc, id) => svc.delete(id)
    }),

    withComputed((store) => ({
        conceptos: computed(() => store.items())
    })),

    withMethods((store) => {
        const conceptoService = inject(ConceptoService);
        return {
            create(nombre: string, categoriaId: string): Promise<string> {
                return store.createOptimistic(
                    (id) => ({ id, nombre, categoriaId, fechaCreacion: new Date(), usuarioId: '' }),
                    conceptoService.create(nombre, categoriaId)
                );
            }
        };
    })
);
