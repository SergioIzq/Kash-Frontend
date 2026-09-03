## 1. Gastos: vista móvil de tarjetas

- [x] 1.1 Envolver el `p-table` actual de la tabla de Movimientos en `gastos-list.page.ts` en `@if (!layout.isMobileView()) { ... }`, y verificar que en escritorio la tabla se sigue viendo exactamente igual que hoy
- [x] 1.2 Añadir la rama `@else` con un `p-dataView` (`styleClass="kash-mobile-dataview"`, `[value]="gastosStore.movimientosPeriodo()"`, `[paginator]="true"`, sin `[lazy]`), con tarjeta (concepto/fecha/importe en la cabecera, grid con persona/forma de pago/proveedor/cuenta, acciones de editar y borrar), y el mismo mensaje vacío actual ("No hay movimientos en este periodo", sin botón de alta); verificar que la fila de "Total del periodo" queda fuera de este condicional y se sigue mostrando una sola vez, tanto en escritorio como en móvil
- [x] 1.3 Verificar manualmente en el navegador (vista móvil): las tarjetas muestran los datos correctos, cambiar de filtro de periodo actualiza las tarjetas, editar/borrar desde una tarjeta funciona igual que desde la fila de escritorio, y un periodo sin movimientos muestra el mensaje vacío sin botón de alta — verificado manualmente por el usuario

## 2. Ingresos: vista móvil de tarjetas

- [x] 2.1 Replicar 1.1 en `ingresos-list.page.ts`
- [x] 2.2 Replicar 1.2 en `ingresos-list.page.ts` (con `ingresosStore.movimientosPeriodo()`, y los campos/color propios de Ingresos)
- [x] 2.3 Replicar 1.3 (verificación manual) en la página de Ingresos — verificado manualmente por el usuario

## 3. Verificación final

- [x] 3.1 Ejecutar el build del frontend (`ng build`) y confirmar que no hay errores — `ng build --configuration development` completa sin errores
- [x] 3.2 Repasar la spec delta de `movimientos-rapidos` de este cambio y confirmar que cada escenario añadido se cumple manualmente en Gastos e Ingresos, en escritorio y en móvil — verificado manualmente por el usuario
