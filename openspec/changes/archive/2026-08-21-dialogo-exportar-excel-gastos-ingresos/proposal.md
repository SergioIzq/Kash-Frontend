## Why

El botón "Exportar" de Gastos e Ingresos descarga hoy un CSV generado en el propio navegador a partir de los datos ya cargados en la tabla (paginada en servidor, 10-30 filas) — en la práctica solo exporta la página visible, nunca el histórico completo, y no ofrece ningún filtro (fecha, concepto, categoría, proveedor/cliente, persona) antes de descargar. Se quiere sustituirlo por un diálogo de exportación con filtros combinables que descargue un Excel real generado en el backend (`Kash-Backend`, propuesta equivalente en ese repo) con el conjunto completo de resultados que cumpla esos filtros.

## What Changes

- **Diálogo de exportación compartido** entre Gastos e Ingresos: al pulsar "Exportar" ya no se descarga un CSV directo, se abre un diálogo con filtros opcionales y combinables (en AND entre sí; cada filtro de selección múltiple, en OR entre sus valores):
  - Casilla "Usar la búsqueda actual de la tabla" (reenvía el `searchTerm` ya escrito en el buscador de la pantalla)
  - Rango de fechas (desde/hasta)
  - Categoría(s) — selección múltiple
  - Concepto(s) — selección múltiple
  - Proveedor(es) en Gastos / Cliente(s) en Ingresos — selección múltiple, etiqueta adaptada según la pantalla
  - Persona(s) — selección múltiple
  - Sin ningún filtro marcado, exporta todo el histórico del usuario
- El componente es un único componente compartido, parametrizado por tipo (`gasto` | `ingreso`) para adaptar la etiqueta Proveedor/Cliente y qué catálogo consulta ese selector.
- Descarga el `.xlsx` devuelto por el backend (`GET /gastos/excel` o `/ingresos/excel` con los filtros como query params), mismo patrón de descarga de blob ya usado para el Excel de Presupuesto.
- Fuera de alcance: el botón "Exportar" de Inversiones no cambia (sigue exportando CSV como hoy) — esa tabla no está paginada en servidor ni comparte la forma de datos (concepto/categoría/proveedor/persona/fecha) de Gastos e Ingresos.

## Capabilities

### New Capabilities
- `exportar-excel-gastos-ingresos`: diálogo de exportación a Excel con filtros combinables (fecha, concepto, categoría, proveedor/cliente, persona, búsqueda actual) para los listados de Gastos e Ingresos.

### Modified Capabilities
(ninguna — no hay spec previa que capture el comportamiento actual del botón Exportar)

## Impact

- **Frontend (`Kash-Frontend`)**: `gastos-list.page.ts`/`ingresos-list.page.ts` (el botón "Exportar" abre el diálogo en vez de llamar a `exportCSV()` directamente); nuevo componente compartido en `src/app/shared/components/` para el diálogo; `gasto.service.ts`/`ingreso.service.ts` ganan un método `descargarExcel(filtros)` (`Observable<Blob>`, mismo patrón que `reporte.service.ts`); los multi-select de Concepto/Categoría/Proveedor/Cliente/Persona reutilizan los servicios de catálogo ya existentes (incluido el filtro Concepto→Categoría de la propuesta `selectores-catalogo-completo`, ya archivada).
- **Backend (`Kash-Backend`, repo externo a este openspec)**: `GET /api/gastos/excel` y `GET /api/ingresos/excel` no existen hoy; se documenta el contrato esperado (filtros como query params, respuesta `.xlsx`), pero la implementación queda en la propuesta equivalente `exportacion-excel-gastos-ingresos` en ese repo.
- Sin cambios breaking: el botón "Exportar" sigue en el mismo sitio con el mismo icono; solo cambia que ahora abre un diálogo de filtros antes de descargar, en vez de descargar un CSV de la página actual directamente.
