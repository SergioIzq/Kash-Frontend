import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConceptoStore } from '../store/concepto.store';
import { Concepto } from '@/core/models/concepto.model';
import { ConceptoCreateModalComponent } from '../components/concepto-create-modal.component';
import { BaseCrudListPage, CrudListViewComponent, CrudListConfig, TagSeverity } from '@/shared/components';

@Component({
    selector: 'app-conceptos-list',
    standalone: true,
    imports: [CrudListViewComponent, ConceptoCreateModalComponent],
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
            <app-concepto-create-modal
                [visible]="dialogVisible()"
                [concepto]="current()"
                (visibleChange)="dialogVisible.set($event)"
                (save)="save($event)"
                (cancel)="hideDialog()"
            />
        </app-crud-list-view>
    `
})
export class ConceptosListPage extends BaseCrudListPage<Concepto> {
    protected readonly store = inject(ConceptoStore);

    private readonly tagSeverities: TagSeverity[] = ['info', 'success', 'warn', 'danger', 'secondary', 'contrast'];
    private readonly categoriaSeverityMap = new Map<string, TagSeverity>();

    protected readonly config: CrudListConfig<Concepto> = {
        title: 'Gestión de Conceptos',
        newLabel: 'Nuevo Concepto',
        createLabel: 'Crear Concepto',
        icon: 'pi pi-bookmark',
        searchPlaceholder: 'Buscar conceptos...',
        emptyTitle: 'No hay conceptos',
        emptySubtitle: 'Comienza agregando tu primer concepto',
        countLabel: 'conceptos',
        deleteConfirm: (name) => `el concepto "${name}"`,
        messages: {
            created: 'Concepto creado correctamente',
            updated: 'Concepto actualizado correctamente',
            deleted: 'Concepto eliminado correctamente'
        },
        columns: [
            {
                field: 'categoriaId',
                header: 'Categoría',
                sortable: true,
                type: 'tag',
                value: (concepto) => concepto.categoriaNombre || 'Sin categoría',
                severity: (concepto) => this.getCategoriaSeverity(concepto.categoriaId)
            }
        ],
        glossary: {
            title: 'Glosario · Conceptos',
            intro: 'Los conceptos agrupan ingresos y gastos y pueden asociarse a una categoría.',
            sections: [
                {
                    title: 'Acciones',
                    rows: [
                        { term: 'Nuevo Concepto', def: 'Abre el formulario para crear un concepto.' },
                        { term: 'Actualizar', def: 'Recarga el listado con los datos más recientes.' }
                    ]
                },
                {
                    title: 'Columnas',
                    rows: [
                        { term: 'Nombre', def: 'Nombre del concepto.' },
                        { term: 'Categoría', def: 'Categoría asignada al concepto o el texto Sin categoría.' },
                        { term: 'Acciones', def: 'Permite editar o eliminar el registro.' }
                    ]
                }
            ]
        }
    };

    /** Asigna una severidad estable (por color) a cada categoría para el p-tag. */
    getCategoriaSeverity(categoriaId: string): TagSeverity {
        if (!this.categoriaSeverityMap.has(categoriaId)) {
            const index = this.categoriaSeverityMap.size % this.tagSeverities.length;
            this.categoriaSeverityMap.set(categoriaId, this.tagSeverities[index]);
        }
        return this.categoriaSeverityMap.get(categoriaId)!;
    }

    protected createEntity(entity: Partial<Concepto>): Promise<unknown> {
        return this.store.create(entity.nombre!, entity.categoriaId!);
    }
}
