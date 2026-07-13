import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { CuentaService } from '@/core/services/api/cuenta.service';
import { Cuenta } from '@/core/models/cuenta.model';
import { withCrudStore } from '@/shared/stores/with-crud-store';

export const CuentaStore = signalStore(
    { providedIn: 'root' },
    withCrudStore<Cuenta, CuentaService>({
        service: CuentaService,
        singular: 'cuenta',
        plural: 'cuentas',
        load: (svc, q) => svc.getCuentas(q.page, q.pageSize, q.searchTerm, q.sortColumn, q.sortOrder),
        search: (svc, query, limit) => svc.search(query, limit),
        getRecent: (svc, limit) => svc.getRecent(limit),
        update: (svc, id, entity) => svc.update(id, entity),
        remove: (svc, id) => svc.delete(id)
    }),

    withComputed((store) => ({
        cuentas: computed(() => store.items()),
        // Saldo total de todas las cuentas
        saldoTotal: computed(() => store.items().reduce((sum, cuenta) => sum + (cuenta.saldo || 0), 0))
    })),

    withMethods((store) => {
        const cuentaService = inject(CuentaService);
        return {
            create(nombre: string, saldo: number): Promise<string> {
                return store.createOptimistic(
                    (id) => ({ id, nombre, saldo, fechaCreacion: new Date(), usuarioId: '' }),
                    cuentaService.create(nombre, saldo)
                );
            }
        };
    })
);
