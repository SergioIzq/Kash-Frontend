## Context

Ver `proposal.md - Why` para la motivación (depende del backend: `Kash-Backend`, change `exportacion-excel-gastos-ingresos`, que expone `GET /gastos/excel` y `GET /ingresos/excel`). Puntos de partida verificados en este repo:

- El botón "Exportar" hoy llama a un `exportCSV()` propio de cada página (`gastos-list.page.ts`, `ingresos-list.page.ts`) que arma un CSV a mano en el navegador a partir de `store.gastos()`/`store.ingresos()` — el array que ya está en memoria porque la tabla es `[lazy]` con `onLazyLoad`, `pageSize` por defecto 10. El único filtro que existe hoy en pantalla es un `searchTerm` (signal, con debounce de 500ms) que se reenvía al listado paginado.
- Ya existe el patrón completo de "descargar un archivo generado por el backend": `reporte.service.ts` → `descargarPresupuestoExcel(fechaInicio, fechaFin): Observable<Blob>` (`responseType: 'blob'`, `withCredentials: true`), consumido en `reportes.page.ts` con `firstValueFrom(...)` + un helper `descargarBlob(blob, nombre)` que crea un `<a>` temporal con `URL.createObjectURL`. El nombre de archivo lo decide el propio frontend (no se lee `Content-Disposition` de la respuesta); mismo criterio a seguir aquí.
- Ya existe `CargadorCatalogoScroll<T>` (`src/app/shared/utils/catalogo-scroll.util.ts`, de la propuesta archivada `selectores-catalogo-completo`) que pagina un catálogo completo por scroll perezoso llamando directamente al `*.service.ts` de cada catálogo (`getConceptos`, `getCategorias`, `getProveedores`, `getClientes`, `getPersonas`), acumulando páginas por posición exacta. Se construyó para `p-autoComplete` con `[lazy]`/`[virtualScroll]`/`(onLazyLoad)` con evento `{first, last}`.
- Confirmado en `node_modules/primeng/types/primeng-multiselect.d.ts`: `p-multiSelect` (misma versión de PrimeNG, `21.1.9`) soporta exactamente el mismo contrato — `[lazy]`, `[virtualScroll]`, `(onLazyLoad)` con `MultiSelectLazyLoadEvent` de forma `{first, last}` (idéntica a la que ya consume `CargadorCatalogoScroll.cargarPagina`), más `[filter]="true"`/`(onFilter)` para búsqueda de texto. Es reutilizable tal cual para los multi-select de este diálogo, sin cambios en la utilidad.

## Goals / Non-Goals

**Goals:**
- Un único componente compartido de diálogo de exportación, usado desde Gastos e Ingresos, con la etiqueta y catálogo de "tercero" adaptados (Proveedor/Cliente).
- Filtros opcionales y combinables (fecha, concepto, categoría, tercero, persona, búsqueda actual de la tabla), con selección múltiple en los de catálogo.
- Reutilizar la infraestructura ya existente: `CargadorCatalogoScroll` para los catálogos completos de los multi-select, y el patrón de descarga de blob ya usado en Presupuesto.
- El botón "Exportar" abre el diálogo; ya no descarga nada directamente.

**Non-Goals:**
- No se toca el botón "Exportar" de Inversiones (fuera de alcance, ver `proposal.md`).
- No se guarda ningún filtro de exportación entre sesiones ni se ofrece un histórico de exportaciones — cada apertura del diálogo empieza sin filtros.
- No se lee el nombre de archivo desde `Content-Disposition`; lo decide el frontend, igual que en Presupuesto.
- No se sustituye el `exportCSV()` de Inversiones ni se toca su tabla (no paginada en servidor).

## Decisions

**1. Componente único `ExportarExcelDialogComponent` (`shared/components/exportar-excel-dialog/`), parametrizado por `tipo: 'gasto' | 'ingreso'`.**
El propio componente inyecta directamente los servicios de catálogo que necesita (`ConceptoService`, `CategoriaService`, `PersonaService`, y `ProveedorService`/`ClienteService` según `tipo`, todos ya `providedIn: 'root'`), en vez de recibirlos como `@Input()` — evita que cada página consumidora tenga que cablear manualmente qué servicio corresponde a cada filtro. Inputs: `tipo`, `visible` (two-way), `searchTermActual` (el `searchTerm` ya escrito en la tabla, para mostrarlo en la casilla "usar búsqueda actual"). Output: `exportar` con el objeto de filtros ya armado, dejando que cada página consumidora decida cómo llamar a su propio `gasto.service.ts`/`ingreso.service.ts` y gestionar el estado de carga/error — mismo reparto de responsabilidades que ya usa `gasto-form-modal`/`ingreso-form-modal` con sus modales (el modal arma los datos, la página padre hace la llamada HTTP).
*Alternativa descartada*: que el propio diálogo hiciera la llamada HTTP y la descarga — obligaría a que el componente compartido conociera las diferencias de endpoint (`/gastos/excel` vs `/ingresos/excel`) y de mensajes de éxito/error entre pantallas, mezclando UI compartida con lógica específica de cada catálogo.

**2. Multi-select de Concepto/Categoría/Proveedor-Cliente/Persona reutilizan `CargadorCatalogoScroll` + `p-multiSelect` con `[lazy]`/`[virtualScroll]`/`(onLazyLoad)`/`[filter]`.**
Mismo mecanismo ya construido para los `p-autoComplete` de los formularios de alta: al abrir cada multi-select sin filtro de texto, se pagina el catálogo completo por scroll; al escribir en el filtro de texto del propio `p-multiSelect` (`(onFilter)`), se llama a `search(term)` del catálogo correspondiente (mismo endpoint `search` ya usado en los selectores). A diferencia de los selectores de los formularios, aquí no hay prefijo de "recientes" que proteger, así que `CargadorCatalogoScroll.reset()` siempre se llama con offset `0`.
*Alternativa descartada*: cargar cada catálogo completo de una sola vez al abrir el diálogo (sin paginar) — más simple, pero un usuario con cientos de Conceptos o Proveedores penalizaría la apertura del diálogo; ya se descartó ese enfoque por el mismo motivo en `selectores-catalogo-completo`, y aquí aplica igual.

**3. Filtro de Categoría independiente del de Concepto (no hay filtro Concepto→Categoría en cascada aquí).**
A diferencia de los selectores de alta (donde elegir Categoría restringe el desplegable de Concepto), en el diálogo de exportación ambos son filtros independientes que se combinan en AND en el backend: el usuario puede filtrar por una Categoría y, por separado, por Conceptos concretos (de cualquier categoría) — el backend ya trata `CategoriaIds`/`ConceptoIds` como condiciones `IN` independientes (ver `design.md` de `exportacion-excel-gastos-ingresos`). Encadenarlos en cascada en la UI añadiría una complejidad que no se ha pedido y que no refleja cómo los combina el backend.

**4. Nuevo método `descargarExcel(filtros)` en `gasto.service.ts`/`ingreso.service.ts`, mismo patrón que `reporte.service.ts`.**
`Observable<Blob>` con `responseType: 'blob'`, `withCredentials: true`; los filtros multivalor (`conceptoIds`, `categoriaIds`, `proveedorIds`/`clienteIds`, `personaIds`) se añaden como parámetros repetidos (`HttpParams.append(...)` por cada id) para que el binding `[FromQuery] Guid[]?` del backend los reciba tal cual. La página consumidora sigue el mismo patrón que `reportes.page.ts`: `firstValueFrom(...)`, `descargarBlob(blob, nombre)`, toast de error si falla.

## Risks / Trade-offs

- **[Riesgo] Combinar "usar búsqueda actual" con filtros adicionales del diálogo puede dar un resultado vacío sin que sea obvio por qué** (p. ej. la búsqueda actual es "gimnasio" y además se filtra por una Categoría que no incluye ese concepto). Mitigación: los propios campos del diálogo muestran los valores ya seleccionados (chips del `p-multiSelect`, fechas, texto de la búsqueda actual) antes de confirmar, así que los filtros activos quedan visibles; no se añade validación adicional de combinaciones "sin sentido" — eso no fue pedido y limitaría filtros legítimos.
- **[Riesgo] `ExportarExcelDialogComponent` compartido puede acoplar Gastos e Ingresos si sus filtros divergen en el futuro** (p. ej. si Ingresos necesitara un filtro que Gastos no tiene). Aceptado por ahora: hoy comparten exactamente la misma forma de filtros (ver `proposal.md`), y esto fue una decisión explícita (componente único, no dos). Si diverge más adelante, se puede partir en dos componentes en ese momento.
- **[Riesgo] Nombre de archivo generado en el cliente, no leído de `Content-Disposition`.** Mismo trade-off ya aceptado en Presupuesto; no se soluciona aquí para mantener consistencia entre ambas exportaciones.
