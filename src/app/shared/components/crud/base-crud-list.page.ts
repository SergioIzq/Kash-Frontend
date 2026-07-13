import { inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { LayoutService } from '@/layout/service/layout.service';
import { BasePageComponent } from '../base/base-page.component';
import { CrudListConfig, CrudStore, ListLazyLoadEvent } from './crud-list.types';

/**
 * Clase base para las pantallas de listado CRUD (categorías, proveedores,
 * clientes, personas, conceptos, formas de pago...).
 *
 * Centraliza TODO el comportamiento que antes estaba duplicado literalmente en
 * cada `*-list.page.ts`:
 * - estado de paginación / búsqueda / ordenación (signals)
 * - búsqueda con debounce (500ms)
 * - manejo del lazy-load de la tabla
 * - recarga, refresco, alta/edición (diálogo) y borrado con confirmación
 *
 * La subclase solo aporta:
 * - `store`  → un signal store que cumpla {@link CrudStore}
 * - `config` → la configuración declarativa de la pantalla ({@link CrudListConfig})
 * - `createEntity()` → cómo crear la entidad (aridad variable según el store)
 *
 * Hereda de {@link BasePageComponent} los helpers de toast/confirmación.
 */
export abstract class BaseCrudListPage<T extends { id: string; nombre?: string }> extends BasePageComponent {
    /** Store concreto de la entidad. Debe cumplir el contrato {@link CrudStore}. */
    protected abstract readonly store: CrudStore<T>;

    /** Configuración declarativa de la pantalla. */
    protected abstract readonly config: CrudListConfig<T>;

    /** Crea la entidad a partir del valor emitido por el modal (aridad variable). */
    protected abstract createEntity(entity: Partial<T>): Promise<unknown>;

    protected readonly layout = inject(LayoutService);

    protected override skeletonType = 'table' as const;

    // Estado de paginación / filtros / orden
    readonly pageSize = signal(10);
    readonly pageNumber = signal(1);
    readonly searchTerm = signal('');
    readonly sortColumn = signal('nombre');
    readonly sortOrder = signal<'asc' | 'desc'>('asc');

    // Estado del diálogo de alta/edición
    readonly dialogVisible = signal(false);
    readonly current = signal<Partial<T>>({});

    private readonly searchSubject = new Subject<string>();

    constructor() {
        super();

        // Búsqueda con debounce: resetea a la primera página y recarga.
        this.searchSubject
            .pipe(debounceTime(500), distinctUntilChanged(), takeUntilDestroyed())
            .subscribe((value) => {
                this.searchTerm.set(value);
                this.pageNumber.set(1);
                this.reload();
            });
    }

    /** Maneja el lazy-load de la tabla/dataview (paginación + orden). */
    onLazyLoad(event: ListLazyLoadEvent): void {
        const first = event.first ?? 0;
        const rows = event.rows ?? this.pageSize();
        this.pageNumber.set(rows ? first / rows + 1 : 1);
        this.pageSize.set(rows);

        if (event.sortField) {
            this.sortColumn.set(Array.isArray(event.sortField) ? event.sortField[0] : event.sortField);
            this.sortOrder.set(event.sortOrder === 1 ? 'asc' : 'desc');
        }

        this.reload();
    }

    /** Entrada del buscador (alimenta el Subject con debounce). */
    onSearch(value: string): void {
        this.searchSubject.next(value);
    }

    /** Recarga la página actual con los filtros vigentes. */
    protected reload(): void {
        this.store.loadPaginated({
            page: this.pageNumber(),
            pageSize: this.pageSize(),
            searchTerm: this.searchTerm() || undefined,
            sortColumn: this.sortColumn() || undefined,
            sortOrder: this.sortOrder() || undefined
        });
    }

    /** Botón "Actualizar": limpia búsqueda, vuelve a la página 1 y recarga. */
    refresh(): void {
        this.pageNumber.set(1);
        this.searchTerm.set('');
        this.reload();
        this.showInfo('Datos actualizados', 'Actualización');
    }

    /** Abre el diálogo en modo alta. */
    openNew(): void {
        this.current.set({});
        this.dialogVisible.set(true);
    }

    /** Cierra el diálogo y limpia el registro en edición. */
    hideDialog(): void {
        this.dialogVisible.set(false);
        this.current.set({});
    }

    /** Abre el diálogo en modo edición con una copia del registro. */
    edit(entity: T): void {
        this.current.set({ ...entity });
        this.dialogVisible.set(true);
    }

    /** Persiste el alta o la edición según haya `id` en el registro actual. */
    async save(entity: Partial<T>): Promise<void> {
        const editing = this.current();
        try {
            if (editing.id) {
                await this.store.update(editing.id, entity);
                this.showSuccess(this.config.messages.updated);
            } else {
                await this.createEntity(entity);
                this.showSuccess(this.config.messages.created);
            }
            this.hideDialog();
        } catch (error) {
            this.showError((error as Error)?.message || 'No se pudo guardar el registro');
        }
    }

    /** Solicita confirmación y borra (el store aplica borrado optimista con rollback). */
    delete(entity: T): void {
        this.confirmAction(
            `¿Estás seguro de eliminar ${this.config.deleteConfirm(entity.nombre ?? '')}?`,
            () => {
                this.store.remove(entity.id);
            },
            {
                header: 'Confirmar eliminación',
                acceptLabel: 'Sí, eliminar',
                rejectLabel: 'Cancelar',
                successMessage: this.config.messages.deleted
            }
        );
    }
}
