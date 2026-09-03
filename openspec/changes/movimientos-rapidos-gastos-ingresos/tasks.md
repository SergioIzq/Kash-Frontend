## 1. Utilidad compartida de rangos de fecha

- [x] 1.1 Crear `src/app/shared/utils/rango-fecha.util.ts` con una función que, dado `'hoy' | 'semana' | 'mes'`, devuelva `{ fechaInicio: string; fechaFin: string }` en formato `YYYY-MM-DD` (mismo formato que `formatearFecha()` de los modales de alta/edición). Verificar con casos manuales (o test unitario) que "hoy" devuelve la fecha actual en ambos extremos, "semana" cubre desde el lunes (o inicio de semana que ya use el resto de la app) hasta hoy, y "mes" cubre desde el día 1 del mes actual hasta hoy.

## 2. GastosStore: separar el estado de la consulta por periodo

- [x] 2.1 Añadir `movimientosPeriodo: Gasto[]` y `loadingMovimientosPeriodo: boolean` a `GastosState` en `gastos.store.ts`, con sus valores iniciales (`[]` y `false`). Verificar que el proyecto compila.
- [x] 2.2 Modificar `loadGastosPorPeriodo` para que escriba en `movimientosPeriodo`/`loadingMovimientosPeriodo` en vez de en `gastos`/`loading` (no tiene consumidores actuales, confirmado por búsqueda en el proyecto). Exponer `movimientosPeriodo` como signal de solo lectura del store si hace falta. Verificar que el proyecto compila y que `loadGastosPaginated` no se ha visto afectado (sigue escribiendo solo en `gastos`/`totalRecords`).
- [x] 2.3 Verificar manualmente que llamar a `loadGastosPorPeriodo` con un rango de fechas no altera el contenido de `gastos`/`totalRecords` que usa la tabla de gestión.

## 3. IngresosStore: mismo cambio que GastosStore

- [x] 3.1 Aplicar el mismo cambio que 2.1 en `ingresos.store.ts` (`movimientosPeriodo: Ingreso[]`, `loadingMovimientosPeriodo: boolean`). Verificar que compila.
- [x] 3.2 Aplicar el mismo cambio que 2.2 a `loadIngresosPorPeriodo`. Verificar que compila y que `loadIngresosPaginated` no se ve afectado.

## 4. Tabla de movimientos rápidos en Gastos

- [x] 4.1 Añadir en `gastos-list.page.ts`, justo antes de la tabla `p-table` de "Gestión de Gastos", una nueva sección con los filtros rápidos "Hoy", "Esta semana", "Este mes" y un `p-datePicker` con `selectionMode="range"` (mismo patrón que `exportar-excel-dialog.component.ts:46`), de forma que solo un filtro esté activo a la vez. Verificar visualmente que los cuatro controles se ven y que activar uno desactiva visualmente los demás.
- [x] 4.2 Al cambiar el filtro activo, llamar a `gastosStore.loadGastosPorPeriodo({ fechaInicio, fechaFin })` con las fechas calculadas (usando la utilidad de la tarea 1.1 para Hoy/Semana/Mes, o las fechas del `p-datePicker` para el rango personalizado). Verificar manualmente que seleccionar cada filtro carga los gastos correctos según su `fecha` (no `fechaCreacion`, que no existe en el modelo).
- [x] 4.3 Añadir la tabla de movimientos rápidos (nuevo `p-table`, modo cliente sin `[lazy]`, `[value]="gastosStore.movimientosPeriodo()"`, `[paginator]="true"`) con las mismas columnas que la tabla de gestión (fecha, persona, forma de pago, proveedor, concepto, cuenta, importe, acciones), reutilizando las plantillas de cabecera/cuerpo existentes. Verificar visualmente que las columnas coinciden con las de la tabla de gestión.
- [x] 4.4 Conectar los botones Editar/Borrar de la tabla nueva a los métodos ya existentes `editGasto(gasto)`/`deleteGasto(gasto)`. Verificar manualmente que editar/borrar desde la tabla rápida abre el mismo modal y pide la misma confirmación que desde la tabla de gestión.
- [x] 4.5 Tras un guardado (crear o editar) o un borrado exitoso, volver a llamar a `loadGastosPorPeriodo` con el filtro de periodo actualmente activo, para refrescar la tabla rápida. Verificar manualmente: con el filtro "Hoy" activo, editar la fecha de un gasto del día de hoy a otro día — el gasto debe desaparecer de la tabla rápida sin recargar la página.
- [x] 4.6 Verificar manualmente que cambiar el filtro de la tabla rápida (Hoy/Semana/Mes/rango) no altera la búsqueda, el orden ni la página actual de la tabla de gestión de abajo.

## 5. Tabla de movimientos rápidos en Ingresos

- [x] 5.1 Aplicar el mismo cambio que 4.1-4.6 en `ingresos-list.page.ts`, usando `ingresosStore.loadIngresosPorPeriodo`/`ingresosStore.movimientosPeriodo()` y los métodos existentes `editIngreso`/`deleteIngreso`. Verificar los mismos puntos manuales que en la sección 4, con un ingreso.

## 6. Verificación end-to-end

- [x] 6.1 En Gastos e Ingresos, recorrer los cuatro filtros (Hoy, Esta semana, Este mes, rango personalizado) comprobando que la tabla rápida muestra únicamente movimientos cuya `fecha` cae en el periodo, y que editar/borrar desde ella actualiza tanto la tabla rápida como la tabla de gestión sin recargar la página.
- [x] 6.2 Confirmar que las dos páginas compilan y funcionan (`ng build` sin errores) tras todos los cambios.
