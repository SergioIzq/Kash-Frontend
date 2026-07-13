import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormaPagoStore } from '@/features/formas-pago/store/forma-pago.store';
import { FormaPago } from '@/core/models/forma-pago.model';
import { FormaPagoFormModalComponent } from '../components/forma-pago-form-modal.component';
import { BaseCrudListPage, CrudListViewComponent, CrudListConfig } from '@sergioizq/ngx-crud-ui';

@Component({
    selector: 'app-formas-pago-list-page',
    standalone: true,
    imports: [CrudListViewComponent, FormaPagoFormModalComponent],
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
            <app-forma-pago-form-modal
                [visible]="dialogVisible()"
                [formaPago]="current()"
                (visibleChange)="dialogVisible.set($event)"
                (save)="save($event)"
                (cancel)="hideDialog()"
            />
        </ngxc-crud-list-view>
    `
})
export class FormasPagoListPage extends BaseCrudListPage<FormaPago> {
    protected readonly store = inject(FormaPagoStore);

    protected readonly config: CrudListConfig<FormaPago> = {
        title: 'Gestión de Formas de Pago',
        newLabel: 'Nueva Forma de Pago',
        createLabel: 'Crear Forma de Pago',
        icon: 'pi pi-wallet',
        searchPlaceholder: 'Buscar formas de pago...',
        emptyTitle: 'No hay formas de pago',
        emptySubtitle: 'Comienza agregando tu primera forma de pago',
        countLabel: 'formas de pago',
        deleteConfirm: (name) => `la forma de pago "${name}"`,
        messages: {
            created: 'Forma de pago creada correctamente',
            updated: 'Forma de pago actualizada correctamente',
            deleted: 'Forma de pago eliminada correctamente'
        },
        glossary: {
            title: 'Glosario · Formas de Pago',
            intro: 'Catálogo de métodos de cobro y pago disponibles en la aplicación.',
            sections: [
                {
                    title: 'Acciones',
                    rows: [
                        { term: 'Nueva Forma de Pago', def: 'Abre el formulario para crear una forma de pago.' },
                        { term: 'Actualizar', def: 'Recarga el listado con los datos más recientes.' }
                    ]
                },
                {
                    title: 'Columnas',
                    rows: [
                        { term: 'Nombre', def: 'Nombre visible de la forma de pago.' },
                        { term: 'Acciones', def: 'Permite editar o eliminar el registro.' }
                    ]
                }
            ]
        }
    };

    protected createEntity(entity: Partial<FormaPago>): Promise<unknown> {
        return this.store.create(entity.nombre!);
    }
}
