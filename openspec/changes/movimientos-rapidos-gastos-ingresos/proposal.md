## Why

En las pantallas de Gastos e Ingresos, comprobar rápidamente "qué he gastado/ingresado hoy, esta semana o este mes" hoy requiere abrir la tabla de gestión completa y usar su buscador/paginación general. El backend y el store ya exponen una consulta por periodo (`loadGastosPorPeriodo`/`loadIngresosPorPeriodo`, endpoint `GET .../periodo?fechaInicio&fechaFin`) que actualmente no se usa desde ninguna pantalla — es una capacidad ya construida y sin explotar.

## What Changes

- Nueva tabla "Movimientos" en las páginas de Gastos e Ingresos, situada justo antes de la tabla existente "Gestión de Gastos"/"Gestión de Ingresos" (que se mantiene sin cambios, como tabla independiente debajo).
- Filtro rápido por periodo con tres accesos directos (Hoy, Esta semana, Este mes) más un selector de rango de fechas personalizado con PrimeNG (`p-datePicker` con `selectionMode="range"`, mismo patrón ya usado en `exportar-excel-dialog.component.ts`).
- La tabla nueva reutiliza `loadGastosPorPeriodo`/`loadIngresosPorPeriodo` (que a su vez llaman al endpoint `.../periodo`, no paginado en backend, capado a 1000 resultados) y pagina los resultados en el frontend.
- Mismas columnas que la tabla de gestión existente (fecha, persona, forma de pago, proveedor/cliente, concepto, cuenta, importe, acciones).
- Botones Editar/Borrar en cada fila, reutilizando los métodos ya existentes en cada página (`editGasto`/`deleteGasto` y `editIngreso`/`deleteIngreso`) y el modal de alta/edición ya presente en la página — sin duplicar diálogo ni lógica de borrado.
- Todo el filtrado se hace por el campo `fecha` del gasto/ingreso (la fecha de la transacción), nunca por un campo de fecha de creación/auditoría (que, de hecho, ni siquiera existe en los modelos `Gasto`/`Ingreso`).

## Capabilities

### New Capabilities
- `movimientos-rapidos`: tabla de consulta rápida de gastos/ingresos filtrable por Hoy/Esta semana/Este mes/rango personalizado, con edición y borrado, independiente de la tabla de gestión existente.

### Modified Capabilities

(ninguna: la tabla de gestión existente y sus requisitos no cambian; esta es una capacidad de consulta adicional que convive con ella)

## Impact

- **Páginas afectadas**: `src/app/features/gastos/pages/gastos-list.page.ts` e `src/app/features/ingresos/pages/ingresos-list.page.ts`.
- **Store**: reutiliza `loadGastosPorPeriodo`/`loadIngresosPorPeriodo`, ya existentes en `gastos.store.ts`/`ingresos.store.ts`, actualmente sin ningún consumidor en la UI.
- **Servicio/API**: reutiliza `getGastosPorPeriodo`/`getIngresosPorPeriodo` (`GET .../periodo?fechaInicio&fechaFin&pageSize=1000`), ya existente; no requiere cambios de backend.
- **Sin nuevo componente de modal**: se reutiliza `<app-gasto-form-modal>`/`<app-ingreso-form-modal>` ya presente en cada página.
- **Sin cambios en la tabla de gestión existente**: mantiene su propia búsqueda y paginación server-side tal cual está.
