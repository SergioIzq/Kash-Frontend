## Context

Ver `proposal.md` - Why. Puntos verificados en el código que condicionan el diseño:

- `GastosStore`/`IngresosStore` (`gastos.store.ts`/`ingresos.store.ts`) guardan un único campo de estado `gastos: Gasto[]` (`ingresos: Ingreso[]`) que usan **tanto** `loadGastosPaginated` (la tabla "Gestión de Gastos", paginada en servidor) **como** `loadGastosPorPeriodo` (`patchState(store, { gastos, ... })`, línea ~211 de `gastos.store.ts`). Si la tabla nueva llama a `loadGastosPorPeriodo` tal cual está hoy, **sobrescribiría el array que está usando la tabla de gestión** (`[value]="gastosStore.gastos()"`, `gastos-list.page.ts:90`), rompiendo su contenido sin tocar su `totalRecords` (que `loadGastosPorPeriodo` no actualiza). Esto hay que resolverlo antes de que las dos tablas puedan convivir, tal como pide la spec (Requirement: Independencia de la tabla de gestión existente).
- `loadGastosPorPeriodo`/`getGastosPorPeriodo` no tienen ningún consumidor actual en la UI (verificado con búsqueda en todo `src/`), así que modificar a qué campo de estado escribe no rompe ningún uso existente.
- `createGasto`/`updateGasto`/`deleteGasto` (optimistic updates) solo tocan `store.gastos()`; no hay ningún mecanismo hoy para mantener sincronizados dos arrays distintos del mismo store.
- No existe ninguna utilidad compartida de fechas (`src/app/shared/utils/` solo tiene `calculadora-importe.util.ts` y `catalogo-scroll.util.ts`); el cálculo de "hoy", "esta semana" y "este mes" es lógica nueva.
- El patrón de rango de fechas de PrimeNG (`p-datePicker` con `selectionMode="range"`) ya se usa en `exportar-excel-dialog.component.ts:46`.

## Goals / Non-Goals

**Goals:**
- Que la tabla de movimientos rápidos y la tabla de gestión puedan mostrar datos distintos simultáneamente sin pisarse entre sí.
- Que crear, editar o borrar un gasto/ingreso desde cualquiera de las dos tablas mantenga ambas correctamente sincronizadas, incluyendo el caso de que una edición cambie la `fecha` y el registro deba entrar o salir del periodo actualmente filtrado en la tabla rápida.
- Reutilizar al máximo lo ya existente: mismo modal, mismos métodos de editar/borrar, mismo patrón de rango de fechas de PrimeNG.

**Non-Goals:**
- No se pagina en backend el endpoint `.../periodo` (sigue devolviendo hasta 1000 resultados de una vez); la paginación de esta tabla se resuelve en el cliente, como se decidió.
- No se toca la tabla de gestión existente ni su forma de paginar/buscar en servidor.
- No se crea una vista combinada de gastos+ingresos: cada página (Gastos, Ingresos) tiene su propia tabla de movimientos rápidos sobre su propio tipo de dato.

## Decisions

### 1. Separar el estado de la consulta por periodo del estado de la tabla paginada
Añadir un campo de estado nuevo en `GastosState`/`IngresosState` (p.ej. `movimientosPeriodo: Gasto[]` y `loadingMovimientosPeriodo: boolean`) y modificar `loadGastosPorPeriodo`/`loadIngresosPorPeriodo` para que escriban en ese campo nuevo en vez de en `gastos`. Como no tienen consumidores actuales, este cambio no afecta a nada existente.

**Alternativa considerada — crear un método/estado completamente nuevo y dejar `loadGastosPorPeriodo` intacto**: se descarta porque `loadGastosPorPeriodo` ya hace exactamente la llamada HTTP y el manejo de loading/error que se necesita; dejarlo "intacto pero sin usar" y duplicar su lógica en un método paralelo sería repetir código sin ningún beneficio, dado que no hay ningún consumidor cuyo comportamiento se deba preservar.

### 2. Refrescar la tabla rápida tras crear/editar/borrar, en vez de replicar la actualización optimista en dos arrays
Tras un `createGasto`/`updateGasto`/`deleteGasto` que tenga éxito, la página vuelve a llamar a `loadGastosPorPeriodo` con el filtro de periodo actualmente activo (Hoy/Semana/Mes/rango), en vez de intentar mutar a mano el array `movimientosPeriodo`.

**Alternativa considerada — actualización optimista también sobre `movimientosPeriodo`** (igual que ya hace `gastos` en la tabla de gestión): se descarta como mecanismo principal porque no puede resolver correctamente el caso "el usuario cambia la fecha de un gasto y ahora debería entrar o salir del periodo filtrado" — una actualización optimista solo sabe *modificar en el sitio*, no *decidir si el registro sigue perteneciendo al filtro actual*. Recalcular con una petición real al periodo activo es simple y siempre correcto; el coste es una petición HTTP adicional por guardado/borrado, aceptable dado que la consulta por periodo es ligera.

### 3. Utilidad compartida para calcular los rangos "Hoy" / "Esta semana" / "Este mes"
Nueva función/utilidad (en `src/app/shared/utils/`, ya que la necesitan tanto `gastos-list.page.ts` como `ingresos-list.page.ts`) que, dado un filtro (`hoy` | `semana` | `mes`), devuelve `{ fechaInicio, fechaFin }` en formato `YYYY-MM-DD` (mismo formato que ya usa `formatearFecha()` en los modales de alta/edición). El rango personalizado no pasa por esta utilidad: se toma directamente del `p-datePicker` en modo `range`, igual que en `exportar-excel-dialog.component.ts`.

### 4. Tabla en modo cliente (no lazy) para la paginación en frontend
La tabla de movimientos rápidos usa `p-table` con `[value]="movimientosPeriodo()"` y `[paginator]="true"` **sin** `[lazy]="true"` ni `(onLazyLoad)`, dejando que PrimeNG pagine en cliente el array ya cargado completo (hasta 1000 filas) para el periodo seleccionado. Contrasta con la tabla de gestión, que sigue en modo `lazy` con paginación servidor.

### 5. Reutilización de columnas, modal y acciones
Las columnas (cabecera y cuerpo) se copian de la tabla de gestión existente (mismas 8 columnas: fecha, persona, forma de pago, proveedor/cliente, concepto, cuenta, importe, acciones). Los botones Editar/Borrar de la tabla nueva llaman a los mismos métodos ya existentes en la página (`editGasto`/`deleteGasto`, `editIngreso`/`deleteIngreso`), que ya abren el mismo `<app-gasto-form-modal>`/`<app-ingreso-form-modal>` presente en la página. No se crea ningún modal ni lógica de borrado nuevos.

## Risks / Trade-offs

- **[Riesgo] Petición HTTP adicional en cada guardado/borrado** mientras la tabla rápida está visible (Decisión 2). → **Mitigación**: aceptado como trade-off; la consulta por periodo es ligera (un único `GET`, sin paginación adicional en cliente más que el slice de PrimeNG). Si en el futuro resulta perceptible, se podría optimizar con actualización optimista + revalidación en segundo plano.
- **[Riesgo] Tope de 1000 resultados en el endpoint `.../periodo`**, no paginado en backend. Para "Este mes" o un rango personalizado amplio en una cuenta muy activa, en el límite se podría truncar silenciosamente. → **Mitigación**: fuera de alcance de este change (requeriría cambio de backend); documentado aquí para que quede constancia si en el futuro se convierte en un problema real.
- **[Riesgo] Dos definiciones de "columnas de la tabla" que hay que mantener sincronizadas** (gestión y movimientos rápidos), al copiarse en vez de compartirse. → **Mitigación**: aceptado por simplicidad ahora; si en el futuro se añaden/quitan columnas con frecuencia, valorar extraer una plantilla de fila compartida.

## Migration Plan

No aplica migración de datos. El campo de estado nuevo (`movimientosPeriodo`) nace vacío (`[]`) y no afecta a datos ya persistidos ni al comportamiento de `loadGastosPorPeriodo` para nadie, al no tener consumidores previos.
