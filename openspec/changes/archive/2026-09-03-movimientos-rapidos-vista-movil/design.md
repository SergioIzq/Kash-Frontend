## Context

Hoy la tabla de "Movimientos" en `gastos-list.page.ts` (y su espejo en `ingresos-list.page.ts`) es un único `p-table` sin condicional de móvil, envuelto en `<div class="overflow-x-auto">` con `[tableStyle]="{'min-width': '75rem'}"` (líneas 111-198 de `gastos-list.page.ts` a fecha de este diseño). Justo debajo, en la sección "Gestión de Gastos", ya existe el patrón a replicar (líneas 206-410): un `@if (!layout.isMobileView()) { <p-table> } @else { <p-dataView styleClass="kash-mobile-dataview"> }`, donde la vista de tarjetas de Gestión usa `[lazy]="true"` + `(onLazyLoad)="loadGastosLazy($event)"` porque pagina en servidor.

`gastosStore.movimientosPeriodo()` ya trae cargado el periodo completo (hasta 1000 registros, ver `GastoService.getGastosPorPeriodo`), y la tabla actual lo pagina en cliente con `[rows]="10"` — no hay backend de por medio en esta vista, a diferencia de Gestión.

Justo debajo de la tabla de Movimientos hay además una fila de "Total del periodo" (sumatorio), añadida en el cambio `sumatorio-movimientos-periodo` (aplicado en el árbol de trabajo, aún no archivado). Ver proposal.md para el motivo del cambio.

## Goals / Non-Goals

**Goals:**
- En móvil, sustituir el `p-table` de Movimientos por un `p-dataView` en tarjetas con la misma estructura visual que ya usa Gestión, reutilizando la clase `kash-mobile-dataview` ya definida en `styles.scss`.
- Mantener un único origen de datos (`movimientosPeriodo()`) y una única fila de "Total del periodo", compartida por la vista de escritorio y la de móvil.

**Non-Goals:**
- No se toca la vista de tarjetas de Gestión (sirve de referencia, no de dependencia).
- No se añade búsqueda ni botón de alta a la tabla de Movimientos en ningún tamaño de pantalla - ninguno de los dos existe hoy en esta tabla y el proposal no los añade.
- No se cambia el origen de los datos ni la paginación en servidor - la paginación de las tarjetas es en cliente, igual que ya lo es la del `p-table` actual.

## Decisions

**1. `p-dataView` sin `[lazy]`, paginando en cliente sobre `movimientosPeriodo()`.**
A diferencia de la tarjeta de Gestión (que pagina en servidor vía `onLazyLoad`), aquí el array ya está completo en el store. Un `p-dataView` con `[value]="gastosStore.movimientosPeriodo()"` y `[paginator]="true"` sin `[lazy]` pagina en cliente por sí solo, sin necesitar ningún método `loadXxxLazy` nuevo. Alternativa descartada: replicar el patrón lazy de Gestión - se descarta porque no hay ninguna petición al servidor que disparar por página; añadiría un método sin propósito real.

**2. La fila de "Total del periodo" queda fuera del `@if/@else`, compartida por ambas vistas.**
El bloque `@if (!layout.isMobileView()) { p-table } @else { p-dataView }` sustituye únicamente al `p-table` actual (lo que hoy está dentro de `<div class="overflow-x-auto">`). La fila de total, que hoy ya vive fuera de ese `div` pero dentro del mismo `<div class="mb-6">`, se deja donde está: así no hay que duplicar su marcado en las dos ramas del condicional, y coincide con el patrón general de la página (los datos de resumen no dependen de qué tabla los muestra).

**3. Cabecera de la tarjeta sin buscador, mensaje vacío sin botón de alta.**
Se sigue el comportamiento actual de Movimientos (sin búsqueda, sin alta desde esta tabla) en vez de copiar literalmente la cabecera/vacío de Gestión, que sí tienen ambas cosas porque esa tabla sí soporta búsqueda y alta. Alternativa descartada: replicar la cabecera de Gestión con buscador - se descarta porque introduciría una funcionalidad (filtrar por texto) que hoy no existe en Movimientos y que el proposal no pide.

## Risks / Trade-offs

- **[Riesgo] El `p-table` actual de Movimientos ya tiene la fila de total insertada por el cambio `sumatorio-movimientos-periodo` (aplicado pero no archivado)** → Mitigación: este cambio se implementa sobre el estado actual del árbol de trabajo (con esa fila ya presente), no sobre la spec archivada; la decisión 2 ya asume su existencia y la deja intacta.
- **[Riesgo] Divergencia futura entre la tarjeta de Movimientos y la de Gestión si una se actualiza y la otra no** → Mitigación: ambas quedan como bloques de plantilla independientes (no se extrae un componente compartido en este cambio); es una duplicación ya aceptada hoy entre Gastos e Ingresos, coherente con el resto de la página.
