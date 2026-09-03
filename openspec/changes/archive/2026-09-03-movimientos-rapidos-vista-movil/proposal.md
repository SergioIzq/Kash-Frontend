## Why

En móvil, la tabla "Movimientos" (filtros rápidos Hoy/Esta semana/Este mes/Rango) se sigue mostrando como una tabla de escritorio con scroll horizontal (`min-width:75rem`), mientras que justo debajo, la tabla "Gestión de Gastos/Ingresos" ya cambia a un listado de tarjetas legible en móvil. Es una inconsistencia visible en la misma pantalla: dos tablas, dos comportamientos distintos en el mismo dispositivo.

## What Changes

- En móvil (`layout.isMobileView()`), la tabla de "Movimientos" pasa de `p-table` con scroll horizontal a un `p-dataView` en tarjetas (`styleClass="kash-mobile-dataview"`), con la misma estructura visual que ya usa la tarjeta de "Gestión de Gastos/Ingresos": concepto + fecha + importe en la cabecera de la tarjeta, un grid con el resto de campos, y los botones Editar/Eliminar al pie.
- La paginación de las tarjetas es en cliente (sobre `gastosStore.movimientosPeriodo()` / `ingresosStore.movimientosPeriodo()`, ya cargado completo para el periodo), sin `[lazy]`/`onLazyLoad` — a diferencia de la tarjeta de Gestión, que sí pagina en servidor.
- La cabecera de la vista de tarjetas de Movimientos no incluye buscador (la tabla de Movimientos nunca lo ha tenido; el filtrado es por periodo, no por texto).
- El mensaje de "sin resultados" en la vista de tarjetas mantiene el texto y icono actuales de Movimientos ("No hay movimientos en este periodo", `pi-calendar-times`), sin el botón de alta que sí tiene el vacío de Gestión (el alta se hace desde el toolbar general de la página, no desde esta tabla).
- La fila de "Total del periodo" (sumatorio) sigue apareciendo debajo, igual en escritorio y en móvil.
- En escritorio no cambia nada: la tabla de Movimientos sigue siendo un `p-table` como hoy.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `movimientos-rapidos`: se añade el requisito de que, en vista móvil, la tabla de movimientos rápidos se muestre como listado de tarjetas en vez de tabla con scroll horizontal, consistente con la vista móvil de la tabla de gestión.

## Impact

- **Frontend**: `gastos-list.page.ts` e `ingresos-list.page.ts` (solo template; no requiere cambios en `GastosStore`/`IngresosStore` ni en los servicios, los datos ya están disponibles vía `movimientosPeriodo()`).
- No afecta a la tabla de gestión paginada ni a su vista móvil existente, que sirve de referencia pero no se modifica.
- Sin impacto en backend.
