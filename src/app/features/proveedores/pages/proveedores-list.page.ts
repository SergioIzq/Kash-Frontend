import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProveedorStore } from '../store/proveedor.store';
import { Proveedor } from '@/core/models/proveedor.model';
import { ProveedorFormModalComponent } from '../components/proveedor-form-modal.component';
import { BaseCrudListPage, CrudListViewComponent, CrudListConfig } from '@sergioizq/ngx-crud-ui';

@Component({
    selector: 'app-proveedores-list-page',
    standalone: true,
    imports: [CrudListViewComponent, ProveedorFormModalComponent],
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
            <app-proveedor-form-modal
                [visible]="dialogVisible()"
                [proveedor]="current()"
                (visibleChange)="dialogVisible.set($event)"
                (save)="save($event)"
                (cancel)="hideDialog()"
            />
        </ngxc-crud-list-view>
    `
})
export class ProveedoresListPage extends BaseCrudListPage<Proveedor> {
    protected readonly store = inject(ProveedorStore);

    protected readonly config: CrudListConfig<Proveedor> = {
        title: 'Gestión de Proveedores',
        newLabel: 'Nuevo Proveedor',
        createLabel: 'Crear Proveedor',
        icon: 'pi pi-credit-card',
        searchPlaceholder: 'Buscar proveedores...',
        emptyTitle: 'No hay proveedores',
        emptySubtitle: 'Comienza agregando tu primer proveedor',
        countLabel: 'proveedores',
        deleteConfirm: (name) => `el proveedor "${name}"`,
        messages: {
            created: 'Proveedor creado correctamente',
            updated: 'Proveedor actualizado correctamente',
            deleted: 'Proveedor eliminado correctamente'
        },
        glossary: {
            title: 'Glosario · Proveedores',
            intro: 'Catálogo de proveedores que se utilizan en los gastos y movimientos relacionados.',
            sections: [
                {
                    title: 'Acciones',
                    rows: [
                        { term: 'Nuevo Proveedor', def: 'Abre el formulario para crear un proveedor.' },
                        { term: 'Actualizar', def: 'Recarga el listado con los datos más recientes.' },
                        { term: 'Editar', def: 'Abre el formulario para modificar el proveedor seleccionado.' },
                        { term: 'Eliminar', def: 'Solicita confirmación para borrar el proveedor seleccionado.' }
                    ]
                },
                {
                    title: 'Columnas',
                    rows: [
                        { term: 'Nombre', def: 'Nombre visible del proveedor.' },
                        { term: 'Acciones', def: 'Permite editar o eliminar el registro.' }
                    ]
                }
            ]
        }
    };

    protected createEntity(entity: Partial<Proveedor>): Promise<unknown> {
        return this.store.create(entity.nombre!);
    }
}
