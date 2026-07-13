import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CategoriaStore } from '@/features/categorias/store/categoria.store';
import { Categoria } from '@/core/models/categoria.model';
import { CategoriaFormModalComponent } from '../components/categoria-form-modal.component';
import { BaseCrudListPage, CrudListViewComponent, CrudListConfig } from '@/shared/components';

@Component({
    selector: 'app-categorias-list',
    standalone: true,
    imports: [CrudListViewComponent, CategoriaFormModalComponent],
    providers: [MessageService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-crud-list-view
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
            <app-categoria-form-modal
                [visible]="dialogVisible()"
                [categoria]="current()"
                (visibleChange)="dialogVisible.set($event)"
                (save)="save($event)"
                (cancel)="hideDialog()"
            />
        </app-crud-list-view>
    `
})
export class CategoriasListPage extends BaseCrudListPage<Categoria> {
    protected readonly store = inject(CategoriaStore);

    protected readonly config: CrudListConfig<Categoria> = {
        title: 'Gestión de Categorías',
        newLabel: 'Nueva Categoría',
        createLabel: 'Crear Categoría',
        icon: 'pi pi-tag',
        searchPlaceholder: 'Buscar categorías...',
        emptyTitle: 'No hay categorías',
        emptySubtitle: 'Comienza agregando tu primera categoría',
        countLabel: 'categorías',
        deleteConfirm: (name) => `la categoría "${name}"`,
        messages: {
            created: 'Categoría creada correctamente',
            updated: 'Categoría actualizada correctamente',
            deleted: 'Categoría eliminada correctamente'
        },
        glossary: {
            title: 'Glosario · Categorías',
            intro: 'Listado de categorías usadas para clasificar gastos e ingresos.',
            sections: [
                {
                    title: 'Acciones',
                    rows: [
                        { term: 'Nueva Categoría', def: 'Abre el formulario para crear una categoría.' },
                        { term: 'Actualizar', def: 'Recarga el listado con los datos más recientes.' },
                        { term: 'Editar', def: 'Abre el formulario para modificar la categoría seleccionada.' },
                        { term: 'Eliminar', def: 'Solicita confirmación para borrar la categoría seleccionada.' }
                    ]
                },
                {
                    title: 'Columnas',
                    rows: [
                        { term: 'Nombre', def: 'Nombre visible de la categoría.' },
                        { term: 'Acciones', def: 'Permite editar o eliminar el registro.' }
                    ]
                }
            ]
        }
    };

    protected createEntity(entity: Partial<Categoria>): Promise<unknown> {
        return this.store.create(entity.nombre!);
    }
}
