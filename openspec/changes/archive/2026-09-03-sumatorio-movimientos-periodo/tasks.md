## 1. Prerrequisito

- [x] 1.1 Confirmar que el endpoint backend `GET /gastos/periodo` (y `GET /ingresos/periodo`) ya devuelve el sumatorio del importe de todo el periodo, y anotar el nombre/forma exacta de los campos de la respuesta antes de empezar el mapeo en el frontend — confirmado en `Kash-Backend`: `Result<PeriodoResult<GastoDto>>` con `value.pagina.items` (listado paginado igual que antes) y `value.sumaImporte` (decimal, suma de todo el periodo, no solo la página)

## 2. Gastos: modelo, servicio y store

- [x] 2.1 Añadir en `gasto.model.ts` un tipo de respuesta propio para el endpoint de periodo (items + sumatorio), sin modificar `PaginatedList<T>`
- [x] 2.2 Actualizar `GastoService.getGastosPorPeriodo()` para mapear la respuesta al nuevo tipo en vez de descartar el sumatorio, y verificar que el valor mapeado coincide con el que devuelve la API
- [x] 2.3 Añadir `sumaImporteMovimientosPeriodo` al estado de `GastosStore` (inicial `0`) y setearlo en `loadGastosPorPeriodo` junto a `movimientosPeriodo`, verificando que cambia al cambiar de filtro de periodo
- [x] 2.4 En `deleteGasto`, restar el importe del gasto borrado a `sumaImporteMovimientosPeriodo` dentro del mismo `patchState` optimista que ya filtra `movimientosPeriodo`, y verificar que el sumatorio baja de inmediato sin esperar respuesta del servidor

## 3. Gastos: interfaz

- [x] 3.1 Pintar en `gastos-list.page.ts`, debajo de la tabla de movimientos rápidos, el sumatorio con `HideAmountPipe`, color rojo y signo "-", y verificar visualmente que aparece bajo la tabla y respeta el toggle de ocultar importes
- [x] 3.2 Verificar manualmente en el navegador: cambiar entre Hoy/Esta semana/Este mes/Rango actualiza el sumatorio; borrar un movimiento lo descuenta al instante; un periodo sin movimientos muestra el sumatorio en cero — verificado manualmente por el usuario

## 4. Ingresos: modelo, servicio y store

- [x] 4.1 Replicar 2.1 en `ingreso.model.ts` (tipo de respuesta propio para el periodo de ingresos)
- [x] 4.2 Replicar 2.2 en `IngresoService.getIngresosPorPeriodo()`
- [x] 4.3 Replicar 2.3 en `IngresosStore` (`sumaImporteMovimientosPeriodo`, seteo en `loadIngresosPorPeriodo`)
- [x] 4.4 Replicar 2.4 en `deleteIngreso` (decremento optimista con el importe del ingreso borrado)

## 5. Ingresos: interfaz

- [x] 5.1 Replicar 3.1 en `ingresos-list.page.ts` con color verde y signo "+"
- [x] 5.2 Replicar 3.2 (verificación manual) en la página de Ingresos — verificado manualmente por el usuario

## 6. Verificación final

- [x] 6.1 Ejecutar el build/lint del frontend y confirmar que no hay errores de tipos derivados del nuevo tipo de respuesta — `ng build --configuration development` completa sin errores
- [x] 6.2 Repasar la spec delta de `movimientos-rapidos` (`specs/movimientos-rapidos/spec.md` de este cambio) y confirmar que cada escenario añadido se cumple manualmente en Gastos e Ingresos — verificado manualmente por el usuario
