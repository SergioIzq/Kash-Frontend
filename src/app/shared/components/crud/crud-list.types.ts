import { Signal } from '@angular/core';
import { GlossaryConfig } from '../help-glossary.component';

/**
 * Severidades soportadas por p-tag (PrimeNG).
 */
export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

/**
 * Evento de carga perezosa emitido por p-table / p-dataView (subconjunto tipado
 * de los campos que realmente usamos).
 */
export interface ListLazyLoadEvent {
    first?: number | null;
    rows?: number | null;
    sortField?: string | string[] | null;
    sortOrder?: number | null;
}

/**
 * Parámetros de carga paginada server-side compartidos por todos los stores CRUD.
 */
export interface PaginatedQuery {
    page: number;
    pageSize: number;
    searchTerm?: string;
    sortColumn?: string;
    sortOrder?: string;
}

/**
 * Contrato mínimo que debe cumplir un signal store para poder gobernar una
 * pantalla de listado CRUD genérica (ver {@link BaseCrudListPage}).
 *
 * Cada store de catálogo lo satisface exponiendo:
 * - `items`         → alias del array de entidades (además del selector con nombre propio)
 * - `totalRecords`  → total de registros server-side
 * - `loading`       → estado de carga
 * - `loadPaginated` → carga paginada (rxMethod)
 * - `update`        → actualización optimista
 * - `remove`        → borrado optimista (rxMethod)
 *
 * `create` NO forma parte del contrato porque su aridad varía entre entidades
 * (p.ej. Concepto necesita `categoriaId`); cada página lo resuelve en su
 * implementación de {@link BaseCrudListPage.createEntity}.
 */
export interface CrudStore<T extends { id: string }> {
    items: Signal<T[]>;
    totalRecords: Signal<number>;
    loading: Signal<boolean>;
    loadPaginated: (query: PaginatedQuery) => unknown;
    update: (id: string, entity: Partial<T>) => Promise<unknown>;
    remove: (id: string) => unknown;
}

/**
 * Definición de una columna adicional (más allá de la columna de título).
 */
export interface CrudColumn<T = any> {
    /** Campo por el que ordena (pSortableColumn) y clave lógica de la columna. */
    field: string;
    /** Cabecera visible. */
    header: string;
    /** Si la columna es ordenable. Por defecto false. */
    sortable?: boolean;
    /** Ancho mínimo CSS (p.ej. '12rem'). */
    minWidth?: string;
    /** Tipo de render. 'text' por defecto. */
    type?: 'text' | 'tag';
    /** Valor a mostrar (por defecto se lee `row[field]`). Útil para tags/derivados. */
    value?: (row: T) => string;
    /** Severidad del p-tag cuando `type === 'tag'`. */
    severity?: (row: T) => TagSeverity;
}

/**
 * Configuración declarativa de una pantalla de listado CRUD.
 * Reemplaza el HTML/labels duplicados en cada `*-list.page.ts`.
 */
export interface CrudListConfig<T = any> {
    /** Título de la tarjeta, p.ej. "Gestión de Categorías". */
    title: string;
    /** Texto del botón "Nuevo/a X". */
    newLabel: string;
    /** Texto del botón del estado vacío, p.ej. "Crear Categoría". */
    createLabel: string;
    /** Icono PrimeNG de la entidad, p.ej. "pi pi-tag". */
    icon: string;
    /** Placeholder del buscador. */
    searchPlaceholder: string;
    /** Título del estado vacío, p.ej. "No hay categorías". */
    emptyTitle: string;
    /** Subtítulo del estado vacío. */
    emptySubtitle: string;
    /** Plural en minúscula para el pie de paginación, p.ej. "categorías". */
    countLabel: string;
    /** Campo usado como título de cada fila/tarjeta. Por defecto 'nombre'. */
    titleField?: string;
    /** Columnas adicionales a la de título (opcional). */
    columns?: CrudColumn<T>[];
    /** Configuración del glosario de ayuda (opcional). */
    glossary?: GlossaryConfig;
    /** Genera el fragmento del mensaje de confirmación de borrado, p.ej. `la categoría "Ocio"`. */
    deleteConfirm: (name: string) => string;
    /** Mensajes de feedback tras las operaciones. */
    messages: {
        created: string;
        updated: string;
        deleted: string;
    };
}
