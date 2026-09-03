## Why

La tabla de "Movimientos" (filtros rápidos Hoy/Esta semana/Este mes/Rango) en Gastos e Ingresos permite ver el detalle del periodo filtrado, pero no da ninguna cifra agregada: para saber cuánto se ha gastado o ingresado en ese periodo hay que sumar las filas a mano. Añadir un sumatorio visible debajo de la tabla resuelve esto sin necesidad de salir de la pantalla ni cruzar con el dashboard.

## What Changes

- Se añade una fila de total bajo la tabla de "Movimientos" rápidos, tanto en Gastos como en Ingresos, mostrando la suma del importe de **todos** los registros que cumplen el filtro de periodo activo (no solo los de la página visible en la tabla).
- El frontend consume un nuevo campo de sumatorio que debe devolver el backend en la respuesta de `GET /gastos/periodo` y `GET /ingresos/periodo` (endpoints ya existentes). Ese cambio de contrato es responsabilidad de un cambio en `Kash-Backend`, fuera del alcance de esta propuesta — este cambio depende de él para poder implementarse.
- Los servicios `GastoService.getGastosPorPeriodo()` / `IngresoService.getIngresosPorPeriodo()` dejan de descartar el resto de la respuesta (hoy solo se queda con `.items`) y devuelven también el sumatorio.
- Los stores (`GastosStore` / `IngresosStore`) guardan el sumatorio del periodo en su propio estado, independiente de la tabla de gestión paginada (igual que ya hace `movimientosPeriodo` hoy).
- Al borrar un movimiento desde la tabla rápida, el sumatorio se decrementa de forma optimista en el mismo `patchState` que ya quita la fila de la lista (mismo patrón que usa hoy `totalRecords` en la tabla de gestión), para que la cifra no quede desincronizada con las filas visibles mientras no haya un nuevo fetch.
- El importe se pinta con el mismo `HideAmountPipe` que ya usa la columna "Importe" (respeta el toggle de ocultar importes) y el mismo color/signo por tipo (rojo `-` en gastos, verde `+` en ingresos).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `movimientos-rapidos`: se añade el requisito de mostrar un sumatorio del importe total del periodo filtrado, y su comportamiento de actualización optimista al borrar un movimiento.

## Impact

- **Frontend**: `gasto.model.ts`, `ingreso.model.ts` (nuevo tipo de respuesta para el endpoint de periodo, sin tocar el genérico `PaginatedList<T>`), `gasto.service.ts`, `ingreso.service.ts`, `gastos.store.ts`, `ingresos.store.ts`, `gastos-list.page.ts`, `ingresos-list.page.ts`.
- **Backend (bloqueante, fuera de este repo)**: `GET /gastos/periodo` y `GET /ingresos/periodo` deben empezar a devolver el sumatorio del importe de todos los registros del periodo (no solo de la página solicitada). Sin ese cambio, este cambio no se puede implementar.
- No afecta a la tabla de gestión paginada ("Gestión de Gastos"/"Gestión de Ingresos"), que sigue igual.
