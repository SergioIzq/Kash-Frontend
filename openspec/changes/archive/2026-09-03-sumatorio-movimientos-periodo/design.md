## Context

La tabla "Movimientos" (filtros rápidos) vive de forma casi idéntica en `gastos-list.page.ts` e `ingresos-list.page.ts`, con estado independiente en `GastosStore`/`IngresosStore` (`movimientosPeriodo`, distinto de `gastos`/`ingresos` que usa la tabla de gestión paginada). Hoy `GastoService.getGastosPorPeriodo()` / `IngresoService.getIngresosPorPeriodo()` llaman a `GET /gastos|ingresos/periodo` con `pageSize=1000` y descartan todo lo que no sea `response.value.items`:

```ts
getGastosPorPeriodo(fechaInicio: string, fechaFin: string): Observable<Gasto[]> {
    ...
    return this.http.get<Result<PaginatedList<Gasto>>>(`${this.apiUrl}/periodo`, { params }).pipe(
        map((response) => response.value.items),
        ...
    );
}
```

`PaginatedList<T>` (en `common.model.ts`) es un tipo genérico reutilizado por todos los listados paginados de la app (conceptos, categorías, proveedores, cuentas, la propia tabla de gestión, etc.), igual que su equivalente `PagedList<T>` en el backend. Ver `proposal.md` para la motivación del cambio y por qué el sumatorio debe venir del backend en vez de calcularse en el cliente (el cliente nunca ve más de 1000 filas por periodo, y ese límite no debe condicionar la cifra mostrada).

## Goals / Non-Goals

**Goals:**
- Consumir un sumatorio que devuelve el backend en la respuesta de `/gastos/periodo` y `/ingresos/periodo`, y pintarlo bajo la tabla de movimientos rápidos.
- Mantener el sumatorio coherente con las filas visibles tras un borrado optimista, sin esperar a un refetch.
- No introducir ningún cambio de comportamiento en la tabla de gestión paginada ni en el tipo genérico `PaginatedList<T>`.

**Non-Goals:**
- No se define aquí el contrato exacto del backend (nombre de campos JSON, forma del wrapper) - eso lo decide el cambio correspondiente en `Kash-Backend`. Este diseño solo fija cómo se consume, adaptándose a lo que llegue.
- No se calcula el sumatorio en el cliente como alternativa o fallback: si el backend no lo devuelve, no hay sumatorio que mostrar.
- No se toca el comportamiento de creación/edición existente (ya recargan `movimientosPeriodo` completo tras guardar, lo que de forma natural refresca también el sumatorio al venir en la misma respuesta).

## Decisions

**1. Tipo de respuesta propio para el endpoint de periodo, no extender `PaginatedList<T>`.**
Igual que el backend no debe modificar `PagedList<T>` (compartido en 60+ usos) solo para este caso, el frontend no debe extender `PaginatedList<T>` (reutilizado por todos los demás listados paginados). En su lugar, `getGastosPorPeriodo()`/`getIngresosPorPeriodo()` mapean la respuesta a un tipo propio de este caso de uso, p. ej. `{ items: Gasto[]; sumaImporte: number }`, definido junto a `Gasto`/`Ingreso` en `gasto.model.ts`/`ingreso.model.ts`. Alternativa descartada: añadir un campo opcional de suma directamente a `PaginatedList<T>` - se descarta porque ensuciaría el contrato de todos los listados que no lo necesitan y acoplaría un tipo genérico a un caso de uso concreto.

**2. El estado del sumatorio vive en el store, junto a `movimientosPeriodo`.**
Nuevo campo `sumaImporteMovimientosPeriodo: number` (inicial `0`) en `GastosState`/`IngresosState`, seteado en el mismo `tapResponse.next` de `loadGastosPorPeriodo`/`loadIngresosPorPeriodo` que ya setea `movimientosPeriodo`. Se mantiene independiente del estado de la tabla de gestión (`gastos`/`totalRecords`), siguiendo el mismo principio que ya documenta el store para `movimientosPeriodo`.

**3. Decremento optimista en el borrado, en vez de esperar un refetch.**
En el `patchState` que ya filtra `movimientosPeriodo` de forma optimista dentro de `deleteGasto`/`deleteIngreso`, se resta también `importe` del movimiento borrado a `sumaImporteMovimientosPeriodo`. Alternativa descartada: dejar el sumatorio desactualizado hasta el próximo cambio de filtro o recarga manual - se descarta porque dejaría una inconsistencia visible (la fila desaparece pero el total no baja) sin necesidad, cuando el propio store ya sigue este patrón optimista para `totalRecords` en la tabla de gestión.

**4. El sumatorio se pinta con `HideAmountPipe`, igual que la columna "Importe".**
Mismo pipe, mismo formato de moneda y mismo color/signo por tipo (rojo `-` en gastos, verde `+` en ingresos), para que respete el toggle de "ocultar importes" ya existente y sea visualmente coherente con el resto de la tabla.

## Risks / Trade-offs

- **[Riesgo] El contrato del backend aún no existe** → Mitigación: este cambio no se puede implementar (más allá del andamiaje de tipos) hasta que el cambio correspondiente en `Kash-Backend` esté disponible; el mapeo en el servicio queda aislado a un único punto (`getGastosPorPeriodo`/`getIngresosPorPeriodo`) para minimizar el ajuste cuando se conozca la forma real de la respuesta.
- **[Riesgo] Doble contabilización si se crea/edita y se borra en rápida sucesión antes de que responda el servidor** → Mitigación: es el mismo riesgo que ya asume hoy el store para `totalRecords` con actualizaciones optimistas; no se introduce un caso nuevo de inconsistencia distinto al ya aceptado en el patrón existente.
- **[Riesgo] Editar un movimiento cambiándole la fecha fuera del periodo actual no ajusta el sumatorio de forma optimista (solo el array, vía recarga completa)** → Mitigación: ya es el comportamiento actual para `movimientosPeriodo` en ese escenario (ver comentario en `onSaveGasto`: "solo el servidor sabe la verdad"); el sumatorio se recalcula correctamente porque `cargarMovimientosPeriodo()` ya se invoca tras editar, aunque haya un instante de desfase hasta que responda.

## Open Questions

- Nombre exacto y forma de los campos que devuelva el backend (p. ej. `sumaImporte` vs `totalImporte`, envuelto o no junto al `PagedList`) - se resuelve al mapear la respuesta en el servicio cuando el cambio de backend esté implementado; no cambia el enfoque ni el desglose de tareas de este cambio.
