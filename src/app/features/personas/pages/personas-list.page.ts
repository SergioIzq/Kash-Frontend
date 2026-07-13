import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PersonaStore } from '../store/persona.store';
import { Persona } from '@/core/models/persona.model';
import { PersonaFormModalComponent } from '../components/persona-form-modal.component';
import { BaseCrudListPage, CrudListViewComponent, CrudListConfig } from '@sergioizq/ngx-crud-ui';

@Component({
    selector: 'app-personas-list-page',
    standalone: true,
    imports: [CrudListViewComponent, PersonaFormModalComponent],
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
            <app-persona-form-modal
                [visible]="dialogVisible()"
                [persona]="current()"
                (visibleChange)="dialogVisible.set($event)"
                (save)="save($event)"
                (cancel)="hideDialog()"
            />
        </ngxc-crud-list-view>
    `
})
export class PersonasListPage extends BaseCrudListPage<Persona> {
    protected readonly store = inject(PersonaStore);

    protected readonly config: CrudListConfig<Persona> = {
        title: 'Gestión de Personas',
        newLabel: 'Nueva Persona',
        createLabel: 'Crear Persona',
        icon: 'pi pi-user',
        searchPlaceholder: 'Buscar personas...',
        emptyTitle: 'No hay personas',
        emptySubtitle: 'Comienza agregando tu primera persona',
        countLabel: 'personas',
        deleteConfirm: (name) => `la persona "${name}"`,
        messages: {
            created: 'Persona creada correctamente',
            updated: 'Persona actualizada correctamente',
            deleted: 'Persona eliminada correctamente'
        },
        glossary: {
            title: 'Glosario · Personas',
            intro: 'Lista de personas que pueden relacionarse con movimientos o entidades del sistema.',
            sections: [
                {
                    title: 'Acciones',
                    rows: [
                        { term: 'Nueva Persona', def: 'Abre el formulario para crear una persona.' },
                        { term: 'Actualizar', def: 'Recarga el listado con los datos más recientes.' }
                    ]
                },
                {
                    title: 'Columnas',
                    rows: [
                        { term: 'Nombre', def: 'Nombre de la persona registrada.' },
                        { term: 'Acciones', def: 'Permite editar o eliminar el registro.' }
                    ]
                }
            ]
        }
    };

    protected createEntity(entity: Partial<Persona>): Promise<unknown> {
        return this.store.create(entity.nombre!);
    }
}
