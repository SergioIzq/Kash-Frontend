import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { ClienteService } from '@/core/services/api/cliente.service';
import { Cliente } from '@/core/models/cliente.model';
import { withCrudStore } from '@/shared/stores/with-crud-store';

export const ClienteStore = signalStore(
    { providedIn: 'root' },
    withCrudStore<Cliente, ClienteService>({
        service: ClienteService,
        singular: 'cliente',
        plural: 'clientes',
        load: (svc, q) => svc.getClientes(q.page, q.pageSize, q.searchTerm, q.sortColumn, q.sortOrder),
        search: (svc, query, limit) => svc.search(query, limit),
        getRecent: (svc, limit) => svc.getRecent(limit),
        update: (svc, id, entity) => svc.update(id, entity),
        remove: (svc, id) => svc.delete(id)
    }),

    withComputed((store) => ({
        clientes: computed(() => store.items())
    })),

    withMethods((store) => {
        const clienteService = inject(ClienteService);
        return {
            create(nombre: string): Promise<string> {
                return store.createOptimistic(
                    (id) => ({ id, nombre, fechaCreacion: new Date(), usuarioId: '' }),
                    clienteService.create(nombre)
                );
            }
        };
    })
);
