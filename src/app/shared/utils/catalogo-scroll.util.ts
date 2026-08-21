import { Observable, firstValueFrom } from 'rxjs';
import { PaginatedList } from '@/core/models/common.model';

export interface CatalogItem {
    id: string;
    nombre: string;
}

/** Tamaño de página para el scroll perezoso de catálogos completos en los selectores. */
export const CATALOGO_SCROLL_PAGE_SIZE = 30;

/**
 * Acumula, por selector, las páginas de un catálogo cargadas mediante scroll perezoso
 * dentro de un `p-autoComplete` en modo `[lazy]` + `[virtualScroll]`.
 *
 * El propio `p-scroller` interno de PrimeNG solo virtualiza el renderizado del array que
 * se le pasa por `[suggestions]`; es responsabilidad del consumidor mantener ese array
 * con las páginas ya cargadas (confirmado leyendo `node_modules/primeng/fesm2022/
 * primeng-autocomplete.mjs` y `primeng-scroller.mjs`: `[items]="visibleOptions()"`, que
 * es directamente la señal de `suggestions`). El `Scroller` ya deduplica peticiones para
 * el mismo rango (`isLazyStateChanged`), pero no garantiza que las páginas lleguen en
 * orden (un scroll rápido puede pedir una página alta antes de que termine una anterior),
 * así que cada página se escribe en su posición exacta del array (relleno disperso) en
 * vez de simplemente concatenar al final.
 */
export class CargadorCatalogoScroll<T extends CatalogItem> {
    private readonly paginasCargadas = new Set<number>();
    private cargando = false;
    private offset = 0;

    constructor(
        private readonly fetchPage: (page: number, pageSize: number) => Observable<PaginatedList<T>>,
        private readonly pageSize: number = CATALOGO_SCROLL_PAGE_SIZE
    ) {}

    /**
     * Carga (si hace falta) la página correspondiente al evento de scroll y devuelve el
     * array resultante para asignar a `suggestions`. Devuelve `null` si esa página ya
     * estaba cargada, si ya hay una carga en curso (evita peticiones duplicadas), o si el
     * evento todavía cae dentro del prefijo de "recientes"/búsqueda (ver `offset` en `reset`).
     *
     * El catálogo completo se pagina de forma independiente al prefijo ya presente en
     * `actual` (los "recientes" o el resultado de una búsqueda): sus páginas se escriben a
     * partir de `offset`, nunca desde la posición 0, para no reemplazar ese prefijo cuando
     * el usuario sigue bajando en el scroll (ver `design.md`, Non-Goals).
     */
    async cargarPagina(event: { first: number; last: number }, actual: readonly T[]): Promise<T[] | null> {
        const posicionRelativa = event.first - this.offset;
        if (posicionRelativa < 0) {
            return null;
        }

        const page = Math.floor(posicionRelativa / this.pageSize) + 1;
        if (this.paginasCargadas.has(page) || this.cargando) {
            return null;
        }

        this.cargando = true;
        try {
            const respuesta = await firstValueFrom(this.fetchPage(page, this.pageSize));
            this.paginasCargadas.add(page);

            const inicio = this.offset + (page - 1) * this.pageSize;
            const resultado = [...actual];
            if (resultado.length < inicio + respuesta.items.length) {
                resultado.length = inicio + respuesta.items.length;
            }
            respuesta.items.forEach((item, i) => {
                resultado[inicio + i] = item;
            });
            return resultado;
        } finally {
            this.cargando = false;
        }
    }

    /**
     * Reinicia el estado. Se llama cada vez que `completeMethod` fija un nuevo punto de
     * partida (recientes o búsqueda), pasando `offset` = número de elementos de ese prefijo
     * para que el paginado del catálogo completo empiece a escribir justo después, sin
     * pisarlo.
     */
    reset(offset: number = 0): void {
        this.paginasCargadas.clear();
        this.cargando = false;
        this.offset = offset;
    }
}
