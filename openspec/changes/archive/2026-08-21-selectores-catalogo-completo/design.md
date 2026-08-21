## Context

Ver `proposal.md - Why` para la motivación. Puntos de partida verificados en el código:

- Los 6 selectores (`gasto-form-modal.component.ts`, `ingreso-form-modal.component.ts`, `alta-rapida.page.ts`) usan el mismo patrón hoy: `completeMethod` llama a `store.getRecent(5)` si `query.length < 2`, o `store.search(query, 10)` si no, sobre `ConceptoStore`/`CategoriaStore`/`CuentaStore`/`FormaPagoStore`/`ProveedorStore`/`ClienteStore`/`PersonaStore`.
- Cada uno de esos 7 stores expone también un método paginado completo (`getConceptos`/`getCategorias`/`getCuentas`/etc., vía `page/pageSize/searchTerm`), ya usado por las pantallas de listado de cada catálogo (`conceptos-list.page.ts` y equivalentes) — confirmado leyendo `concepto.service.ts`/`categoria.service.ts` y los controllers de `Kash-Backend`.
- La versión instalada de PrimeNG (`21.1.9`, confirmado en `node_modules/primeng/types/primeng-autocomplete.d.ts`) soporta en `p-autoComplete`: `[lazy]`, `[virtualScroll]`, `[virtualScrollItemSize]`, `(onLazyLoad)` con evento `{first, last}` (mismo shape que `ListLazyLoadEvent` de `@sergioizq/ngx-crud-ui`, ya usado en `gastos-list.page.ts`), y `headerTemplate`/`footerTemplate`/`emptyTemplate`/`loaderTemplate`.
- El backend de Concepto ya soporta un filtro `categoriaId` en `search`/`recent` (`SearchConceptosQueryHandler`/`GetRecentConceptosQueryHandler` sobrescriben `GetCustomFilters()`), pero el endpoint paginado (`GetConceptosPagedListQueryHandler`) no tiene ese hook — confirmado que no hay `ApplyFiltersAsync` propio, y que el método del kernel del que depende (`GetPagedReadModelsByUserAsync`) no acepta un diccionario de filtros extra en absoluto (a diferencia de `GetRecentAsync`/`SearchForAutocompleteAsync`, verificado por reflexión sobre el paquete `SergioIzq.Domain.Kernel`).
- Los otros 6 catálogos (Categoria, Cuenta, FormaPago, Proveedor, Persona, Cliente) no tienen ninguna dependencia de un filtro secundario como la de Concepto→Categoría — confirmado que ninguno de sus stores pasa un parámetro extra a `search`.

## Goals / Non-Goals

**Goals:**
- Poder encontrar cualquier elemento de un catálogo del usuario desde el selector, no solo los 5 recientes o los que coincidan con el texto escrito.
- Cargar el catálogo por páginas (scroll perezoso), no de golpe, para no penalizar el rendimiento con catálogos grandes.
- Facilitar el scroll en móvil ocultando el teclado sin perder el desplegable abierto.
- Mismo comportamiento en los 3 formularios que usan estos selectores.

**Non-Goals:**
- No se cambia el comportamiento de búsqueda por texto (`search`) ni el de "recientes" (`getRecent`) ya existentes — siguen siendo lo primero que se ve al abrir el selector o al escribir; el catálogo completo con scroll es lo que aparece al seguir bajando.
- No se añade un filtro nuevo a ningún catálogo salvo Concepto→Categoría (el único que ya lo necesitaba).
- No se toca el paquete compartido `SergioIzq.*.Kernel` (fuera del repo): la limitación de `GetPagedReadModelsByUserAsync` sin filtros extra se resuelve en `Kash-Backend` con un método propio, no ampliando el kernel.

## Decisions

**1. El catálogo completo con scroll se implementa con `[lazy]` + `[virtualScroll]` de `p-autoComplete`, reutilizando los métodos paginados ya existentes de cada store.**
Cuando el desplegable está abierto sin texto de búsqueda, en vez de (o además de) `getRecent(5)`, el `(onLazyLoad)` pide páginas sucesivas al método paginado del store correspondiente (`store.load({page, pageSize, searchTerm: ''})` o equivalente), traduciendo `{first, last}` a `{page, pageSize}` igual que ya hace `loadGastosLazy` en `gastos-list.page.ts`.
*Alternativa descartada*: pedir todo el catálogo de golpe (`pageSize` muy alto, como hace `getAllGastos()`) — más simple de implementar, pero cualquier catálogo con cientos de elementos penalizaría el primer render del desplegable; virtualScroll+lazy ya está disponible en la versión instalada, así que no hay motivo para no usarlo.

**2. El botón "Cerrar teclado" vive en el `headerTemplate` del desplegable y hace `blur()` del input del propio `p-autoComplete`.**
Se necesita una referencia (`@ViewChild`) al input interno del autocomplete (o usar `document.activeElement`) para quitarle el foco sin disparar el cierre del panel. **Confirmado por el usuario probándolo en el navegador: `blur()` sobre el input no cierra el desplegable** — el panel permanece abierto y con la posición de scroll intacta, tal como se esperaba. El botón solo tiene sentido mostrarlo en pantallas táctiles; se plantea mostrarlo siempre (más simple, inofensivo en desktop) en vez de detectar el tipo de dispositivo, salvo que la implementación revele que hace falta lo segundo.
*Alternativa descartada*: ocultar el teclado automáticamente al detectar scroll/touch dentro de la lista — no se ha verificado que `p-autoComplete` exponga un evento de scroll/touch del panel al que engancharse limpiamente; un botón explícito en el header es una superficie ya soportada (`headerTemplate`) y no requiere esa investigación adicional.

**3. Concepto necesita un parámetro `categoriaId` opcional en su método paginado; los otros 6 catálogos no necesitan cambios de backend.**
Confirmado que ni Categoria, Cuenta, FormaPago, Proveedor, Persona ni Cliente dependen de ningún filtro secundario — sus métodos paginados ya sirven "todos los del usuario, paginados" tal cual. Solo `ConceptoService.getConceptos`/`ConceptoStore` necesitan aceptar y reenviar `categoriaId` al backend (ver propuesta equivalente en `Kash-Backend`).

## Risks / Trade-offs

- **[Riesgo] Sin backend listo (`Kash-Backend`, propuesta aparte), el catálogo completo de Concepto no puede filtrarse por categoría.** Mitigación: mientras el backend no exponga el filtro, el selector de Concepto puede seguir funcionando con `getRecent`/`search` como hoy (sin romper nada) y activar el scroll del catálogo completo solo cuando el parámetro esté disponible; los otros 6 selectores no dependen de esta dependencia y pueden implementarse sin esperar al backend.
- **[Riesgo, descartado]** ~~`blur()` podría cerrar el desplegable entero en vez de solo ocultar el teclado~~ — confirmado por el usuario que no ocurre; el panel se queda abierto tras el `blur()`.
- **[Trade-off] Mostrar el botón "Cerrar teclado" también en desktop** (Decisión 2) añade un elemento sin utilidad real ahí, pero evita la complejidad y el riesgo de una detección de dispositivo poco fiable.

## Migration Plan

No aplica migración de datos. El cambio es aditivo sobre componentes ya existentes: los selectores siguen funcionando igual para "recientes" y "búsqueda por texto"; el catálogo completo con scroll es una capacidad añadida al abrir el desplegable. Despliegue incremental posible: los 6 selectores sin dependencia de categoría pueden implementarse y desplegarse sin esperar al cambio de backend de Concepto.
