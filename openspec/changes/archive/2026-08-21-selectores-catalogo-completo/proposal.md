## Why

Los selectores de Concepto, Categoría, Cuenta, Forma de Pago, Proveedor/Cliente y Persona (en `gasto-form-modal`, `ingreso-form-modal` y `alta-rapida`) solo muestran hoy los 5 elementos más recientes (sin escribir) o hasta 10 resultados de texto (escribiendo ≥2 caracteres) — nunca el catálogo completo del usuario. Cuando un usuario tiene más entradas de las que caben en esos límites, no hay forma de encontrar una que no sea reciente ni coincide con lo que recuerda escribir. Además, en móvil, el teclado virtual ocupa buena parte de la pantalla mientras el desplegable está abierto, dificultando hacer scroll por la lista con el dedo.

## What Changes

- **Catálogo completo con scroll**: al abrir cualquiera de los 6 selectores (sin necesidad de escribir), se puede recorrer todo el catálogo del usuario mediante scroll dentro del propio desplegable, cargando por páginas a medida que se baja (no todo de golpe). Reutiliza los endpoints paginados ya existentes de cada catálogo.
- **Botón "Cerrar teclado" en el desplegable**: cabecera fija dentro del panel de sugerencias con una acción que oculta el teclado virtual (quita el foco del campo de texto) sin cerrar el propio desplegable, para poder scrollear la lista con comodidad en móvil.
- Alcance: los 6 selectores del mismo patrón, en los 3 formularios que los usan (`gasto-form-modal`, `ingreso-form-modal`, `alta-rapida`).
- El selector de Concepto necesita un cambio en el backend (`Kash-Backend`, propuesta equivalente en ese repo) para poder filtrar el catálogo completo por la categoría ya seleccionada, algo que hoy solo soporta la búsqueda por texto, no el listado paginado completo.

## Capabilities

### New Capabilities
- `catalogos-completos-en-selectores`: carga del catálogo completo (no solo recientes/búsqueda) con scroll paginado dentro de los selectores de Concepto/Categoría/Cuenta/Forma de Pago/Proveedor/Cliente/Persona, y acción para ocultar el teclado en móvil sin cerrar el desplegable.

### Modified Capabilities
(ninguna — no hay spec previa que capture el comportamiento actual de estos selectores)

## Impact

- **Frontend (`Kash-Frontend`)**: `gasto-form-modal.component.ts`, `ingreso-form-modal.component.ts`, `alta-rapida.page.ts` (los 3 usan el mismo patrón de autocomplete por catálogo); servicios `*.service.ts` de Concepto/Categoria/Cuenta/FormaPago/Proveedor/Cliente/Persona (ya exponen `getXxx(page, pageSize, searchTerm)` paginado, reutilizable); `ConceptoService`/`ConceptoStore` necesitan además un parámetro `categoriaId` opcional en la llamada paginada.
- **Backend (`Kash-Backend`, repo externo a este openspec)**: `GetConceptosPagedListQuery`/`GetConceptosPagedListQueryHandler` no soportan hoy un filtro por `categoriaId` (a diferencia de `search`/`recent`, que sí lo hacen vía `GetCustomFilters()`); se documenta el contrato esperado, pero la implementación queda en una propuesta equivalente en ese repo.
- Sin cambios de breaking: los 6 endpoints paginados usados ya existen y ya se usan en las pantallas de listado de cada catálogo.
