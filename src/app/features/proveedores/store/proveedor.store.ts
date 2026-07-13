import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { ProveedorService } from '@/core/services/api/proveedor.service';
import { Proveedor } from '@/core/models/proveedor.model';
import { withCrudStore } from '@/shared/stores/with-crud-store';

export const ProveedorStore = signalStore(
    { providedIn: 'root' },
    withCrudStore<Proveedor, ProveedorService>({
        service: ProveedorService,
        singular: 'proveedor',
        plural: 'proveedores',
        load: (svc, q) => svc.getProveedores(q.page, q.pageSize, q.searchTerm, q.sortColumn, q.sortOrder),
        search: (svc, query, limit) => svc.search(query, limit),
        getRecent: (svc, limit) => svc.getRecent(limit),
        update: (svc, id, entity) => svc.update(id, entity),
        remove: (svc, id) => svc.delete(id)
    }),

    withComputed((store) => ({
        proveedores: computed(() => store.items())
    })),

    withMethods((store) => {
        const proveedorService = inject(ProveedorService);
        return {
            create(nombre: string): Promise<string> {
                return store.createOptimistic(
                    (id) => ({ id, nombre, fechaCreacion: new Date(), usuarioId: '' }),
                    proveedorService.create(nombre)
                );
            }
        };
    })
);
