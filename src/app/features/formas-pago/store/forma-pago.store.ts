import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { FormaPagoService } from '@/core/services/api/forma-pago.service';
import { FormaPago } from '@/core/models/forma-pago.model';
import { withCrudStore } from '@/shared/stores/with-crud-store';

export const FormaPagoStore = signalStore(
    { providedIn: 'root' },
    withCrudStore<FormaPago, FormaPagoService>({
        service: FormaPagoService,
        singular: 'forma de pago',
        plural: 'formas de pago',
        load: (svc, q) => svc.getFormasPago(q.page, q.pageSize, q.searchTerm, q.sortColumn, q.sortOrder),
        search: (svc, query, limit) => svc.search(query, limit),
        getRecent: (svc, limit) => svc.getRecent(limit),
        update: (svc, id, entity) => svc.update(id, entity),
        remove: (svc, id) => svc.delete(id)
    }),

    withComputed((store) => ({
        formasPago: computed(() => store.items())
    })),

    withMethods((store) => {
        const formaPagoService = inject(FormaPagoService);
        return {
            create(nombre: string): Promise<string> {
                return store.createOptimistic(
                    (id) => ({ id, nombre, fechaCreacion: new Date(), usuarioId: '' }),
                    formaPagoService.create(nombre)
                );
            }
        };
    })
);
