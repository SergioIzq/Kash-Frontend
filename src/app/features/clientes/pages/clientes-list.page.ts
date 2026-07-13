import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ClienteStore } from '../store/cliente.store';
import { Cliente } from '@/core/models/cliente.model';
import { ClienteFormModalComponent } from '../components/cliente-form-modal.component';
import { BaseCrudListPage, CrudListViewComponent, CrudListConfig } from '@sergioizq/ngx-crud-ui';

@Component({
    selector: 'app-clientes-list-page',
    standalone: true,
    imports: [CrudListViewComponent, ClienteFormModalComponent],
    providers: [MessageService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <ngxc-crud-list-view
            [config]="config"
            [items]="store.items()"
            [totalRecords]="store.totalRecords()"
            [loading]="store.loading()"
            [pageSize]="pageSize()"
            [searchValue]="searchTerm()"
            (lazyLoad)="onLazyLoad($event)"
            (search)="onSearch($event)"
            (newItem)="openNew()"
            (editItem)="edit($event)"
            (deleteItem)="delete($event)"
            (refreshList)="refresh()"
        >
            <app-cliente-form-modal
                [visible]="dialogVisible()"
                [cliente]="current()"
                (visibleChange)="dialogVisible.set($event)"
                (save)="save($event)"
                (cancel)="hideDialog()"
            />
        </ngxc-crud-list-view>
    `
})
export class ClientesListPage extends BaseCrudListPage<Cliente> {
    protected readonly store = inject(ClienteStore);

    protected readonly config: CrudListConfig<Cliente> = {
        title: 'Gestión de Clientes',
        newLabel: 'Nuevo Cliente',
        createLabel: 'Crear Cliente',
        icon: 'pi pi-credit-card',
        searchPlaceholder: 'Buscar clientes...',
        emptyTitle: 'No hay clientes',
        emptySubtitle: 'Comienza agregando tu primera cliente',
        countLabel: 'clientes',
        deleteConfirm: (name) => `el cliente "${name}"`,
        messages: {
            created: 'Cliente creado correctamente',
            updated: 'Cliente actualizado correctamente',
            deleted: 'Cliente eliminado correctamente'
        },
        glossary: {
            title: 'Glosario · Clientes',
            intro: 'Listado de clientes disponibles para seleccionar en ingresos y otros movimientos.',
            sections: [
                {
                    title: 'Acciones',
                    rows: [
                        { term: 'Nuevo Cliente', def: 'Abre el formulario para crear un cliente.' },
                        { term: 'Actualizar', def: 'Recarga el listado con los datos más recientes.' }
                    ]
                },
                {
                    title: 'Columnas',
                    rows: [
                        { term: 'Nombre', def: 'Nombre visible del cliente en el listado.' },
                        { term: 'Acciones', def: 'Permite editar o eliminar el cliente.' }
                    ]
                }
            ]
        }
    };

    protected createEntity(entity: Partial<Cliente>): Promise<unknown> {
        return this.store.create(entity.nombre!);
    }
}
