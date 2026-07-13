import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { PersonaService } from '@/core/services/api/persona.service';
import { Persona } from '@/core/models/persona.model';
import { withCrudStore } from '@sergioizq/ngrx-crud-store';

export const PersonaStore = signalStore(
    { providedIn: 'root' },
    withCrudStore<Persona, PersonaService>({
        service: PersonaService,
        singular: 'persona',
        plural: 'personas',
        load: (svc, q) => svc.getPersonas(q.page, q.pageSize, q.searchTerm, q.sortColumn, q.sortOrder),
        search: (svc, query, limit) => svc.search(query, limit),
        getRecent: (svc, limit) => svc.getRecent(limit),
        update: (svc, id, entity) => svc.update(id, entity),
        remove: (svc, id) => svc.delete(id)
    }),

    withComputed((store) => ({
        personas: computed(() => store.items())
    })),

    withMethods((store) => {
        const personaService = inject(PersonaService);
        return {
            create(nombre: string): Promise<string> {
                return store.createOptimistic(
                    (id) => ({ id, nombre, fechaCreacion: new Date(), usuarioId: '' }),
                    personaService.create(nombre)
                );
            }
        };
    })
);
