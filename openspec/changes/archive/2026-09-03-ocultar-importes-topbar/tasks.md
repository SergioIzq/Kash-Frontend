## 1. Estado y persistencia (LayoutService)

- [x] 1.1 Añadir `hideAmounts?: boolean` a la interfaz `layoutConfig` en `src/app/layout/service/layout.service.ts` y a `getDefaultConfig()` con valor `false`, y verificar que el proyecto compila (`ng build` o `tsc`) sin errores de tipos.
- [x] 1.2 Añadir `isAmountsHidden = computed(() => this.layoutConfig().hideAmounts)` (junto a `isDarkTheme`) y un método `toggleAmountsVisibility()` que actualice `layoutConfig` con `layoutConfig.update(cfg => ({ ...cfg, hideAmounts: !cfg.hideAmounts }))`, y verificar manualmente en consola del navegador (`localStorage.getItem('ahorroland_layout_config')`) que el valor `hideAmounts` se persiste al cambiarlo.

## 2. Botón toggle en el topbar

- [x] 2.1 Añadir un botón en `src/app/layout/component/app.topbar.ts` dentro de `.layout-config-menu` (junto al botón de `toggleDarkMode()`, líneas 73-75), con icono `pi-eye` / `pi-eye-slash` vía `[ngClass]` según `layoutService.isAmountsHidden()`, y verificar visualmente que el icono cambia al pulsar el botón.
- [x] 2.2 Enlazar el `(click)` del botón a `layoutService.toggleAmountsVisibility()` y verificar que el estado persiste al recargar la página (F5) tras activarlo.

## 3. Pipe `HideAmountPipe`

- [x] 3.1 Crear `src/app/shared/pipes/hide-amount.pipe.ts` (pipe standalone `pure: true`), con `transform(value: number, tipo: 'currency' | 'percent', symbol?: string)`: inyecta `LayoutService`, delega en `DecimalPipe` (`'1.2-2'`) cuando `isAmountsHidden()` es `false`, y devuelve `'**** ' + (symbol ?? '€')` o `'**** %'` cuando es `true`. Verificar con un test unitario o comprobación manual en un componente que ambas ramas (visible/oculto) devuelven el string esperado.

## 4. Aplicar el pipe en plantillas de solo lectura

- [x] 4.1 Sustituir `{{ valor | number:'1.2-2' }} €` por `{{ valor | hideAmount:'currency' }}` (y el equivalente `:'percent'` donde el valor sea un porcentaje) en `dashboard.page.ts` y `resumen-financiero.component.ts` (importes de resumen: ingresos/gastos/balance, no los callbacks de Chart.js, que se cubren en la sección 5). Verificar visualmente que los importes se ocultan/muestran al pulsar el toggle.
- [x] 4.2 Aplicar el mismo cambio en `cuentas-list.page.ts` (saldo de cuentas) y verificar visualmente.
- [x] 4.3 Aplicar el mismo cambio en `gastos-list.page.ts` e `ingresos-list.page.ts` y verificar visualmente.
- [x] 4.4 Aplicar el mismo cambio en `traspasos-list.page.ts` y verificar visualmente.
- [x] 4.5 Aplicar el mismo cambio en `gastos-programados-list.page.ts`, `ingresos-programados-list.page.ts` y `traspasos-programados-list.page.ts` y verificar visualmente.
- [x] 4.6 Aplicar el mismo cambio en `inversiones-list.page.ts` (todas las ocurrencias: valores de inversión, rentabilidad, etc.) y verificar visualmente.
- [x] 4.7 Aplicar `{{ (formData().cantidad! * formData().precioCompra!) | hideAmount:'currency':formData().moneda }}` en `inversion-form-modal.component.ts:235` (símbolo de moneda dinámico, no €) y verificar visualmente que se oculta/muestra igual que el resto mientras se rellena el formulario.

## 5. Gráficos Chart.js del dashboard

- [x] 5.1 Convertir `chartOptions` de `ingresos-chart.component.ts` de objeto plano a `computed()` (inyectando `LayoutService`), actualizar el callback `tooltip.callbacks.label` para devolver `'**** €'` en vez de `${value.toFixed(2)}€` cuando `isAmountsHidden()` sea `true`, actualizar la plantilla a `[options]="chartOptions()"`, y verificar visualmente que el tooltip oculta el importe al activar el toggle sin necesidad de recargar la página.
- [x] 5.2 Aplicar el mismo cambio en `gastos-chart.component.ts`: convertir `chartOptions` a `computed()`, y en el callback del tooltip (líneas 130-143) ocultar tanto el importe (`Importe: ...€`) como el porcentaje calculado (`Porcentaje: ...%`) cuando el toggle esté activo. Verificar visualmente.
- [x] 5.3 Aplicar el mismo cambio en `resumen-financiero.component.ts`: convertir `chartOptions` a `computed()`, y en el callback del tooltip sustituir el resultado de `Intl.NumberFormat(...).format(...)` por `'**** €'` cuando el toggle esté activo. Verificar visualmente.
- [x] 5.4 Verificar que el eje Y de los tres gráficos (`scales.y.ticks.callback`, que actualmente abrevia valores como `1.2k`) también oculta las cifras (por ejemplo, devolviendo `'****'` en cada tick) cuando el toggle está activo, ya que estos valores son igual de sensibles que el tooltip.

## 6. Verificación end-to-end

- [x] 6.1 Con la app en marcha, activar el toggle desde el topbar y recorrer manualmente dashboard, cuentas, gastos, ingresos, traspasos, programados e inversiones (list y form modal) comprobando que todos los importes y porcentajes muestran `****` con su símbolo correspondiente, sin excepciones no documentadas.
- [x] 6.2 Recargar la página con el toggle activado y confirmar que el estado oculto persiste (lee `localStorage['ahorroland_layout_config']`), y luego desactivarlo y confirmar que todos los importes vuelven a mostrar su valor real sin recargar.
