## 1. GastoFormModalComponent

- [x] 1.1 Inyectar `ChangeDetectorRef` en `gasto-form-modal.component.ts` y llamar a `markForCheck()` inmediatamente después de `this.isVisible = false` dentro de `closeModal()` (cubre el `accept` de `onSave()` vía `ejecutarGuardado()`, y el `accept` de `onCancel()`/`handleDrawerHide()`). Verificar que el proyecto compila (`ng build`) sin errores.
- [x] 1.2 Llamar también a `markForCheck()` inmediatamente después de `this.isVisible = true` en los callbacks `reject` de `onCancel()` y `handleDrawerHide()`. Verificar manualmente: rellenar el formulario de un gasto nuevo, pulsar "Cancelar", y en el diálogo "¿Está seguro de que desea salir?" pulsar "Cancelar" (rechazar la salida) — el formulario debe seguir visible con los datos intactos, sin necesidad de recargar.
- [x] 1.3 Añadir manejo propio de la tecla Escape que aplique la misma lógica que `onCancel()` (confirmar solo si `hasUnsavedChanges()`), en vez de depender del `hide(false)` interno de `p-drawer` (que no emite `onHide` ni `visibleChange`). Verificar manualmente: abrir "Nuevo Gasto" sin escribir nada y pulsar Escape — el formulario se cierra y el botón "Nuevo Gasto" vuelve a abrirlo correctamente en el siguiente clic (sin recargar).
- [x] 1.4 Verificar manualmente el caso con cambios: abrir "Nuevo Gasto", escribir algo, pulsar Escape, y confirmar que aparece la confirmación de salida y que tanto aceptar como rechazar dejan la aplicación en un estado consistente (cerrado sin overlay residual, o reabierto con los datos intactos) sin necesidad de recargar.
- [x] 1.5 Verificar manualmente el flujo completo de guardado: crear un gasto nuevo y confirmarlo, editar un gasto existente y confirmarlo — en ambos casos el formulario se cierra, el listado se actualiza y el resto de la aplicación permanece interactiva (se puede abrir el menú, hacer scroll, pulsar otros botones) sin recargar.
- [x] 1.6 Verificar manualmente el clic fuera del formulario (en el área oscurecida) con cambios sin guardar: comprobar que se pide confirmación y que tanto aceptar como rechazar salir dejan la aplicación en un estado usable sin recargar.

## 2. IngresoFormModalComponent

- [x] 2.1 Aplicar el mismo cambio que 1.1 en `ingreso-form-modal.component.ts` (inyectar `ChangeDetectorRef`, `markForCheck()` en `closeModal()`). Verificar que el proyecto compila.
- [x] 2.2 Aplicar el mismo cambio que 1.2 (`markForCheck()` en los `reject` de `onCancel()`/`handleDrawerHide()`). Verificar manualmente el mismo escenario de "cancelar y rechazar la salida" descrito en 1.2, mismos pasos con un ingreso.
- [x] 2.3 Aplicar el mismo manejo propio de Escape que 1.3. Verificar manualmente igual que en 1.3/1.4, con un ingreso.
- [x] 2.4 Verificar manualmente el flujo completo de guardado (alta y edición de un ingreso) igual que en 1.5.
- [x] 2.5 Verificar manualmente el clic fuera del formulario igual que en 1.6, con un ingreso.

## 3. InversionFormModalComponent

- [x] 3.1 Añadir el callback `reject:` que falta en la llamada a `confirmationService.confirm(...)` dentro de `onCancel()`. Verificar que el proyecto compila.
- [x] 3.2 Verificar manualmente si el clic en el mask o la tecla Escape, con cambios sin guardar, dejan el drawer en un estado inconsistente (cerrado visualmente sin que el usuario haya confirmado, o sin reabrirse tras rechazar salir). Si se reproduce, aplicar la misma estrategia de `ChangeDetectorRef.markForCheck()` usada en gasto/ingreso en el punto donde se detecte la desincronización.
- [x] 3.3 Verificar manualmente el flujo completo de guardado (alta y edición de una inversión) y de cancelación (con y sin cambios sin guardar), confirmando que la aplicación queda usable sin recargar en todos los casos.

## 4. Verificación end-to-end

- [x] 4.1 Recorrer, en una sola sesión de navegador sin recargar entre pasos, los tres formularios (gasto, ingreso, inversión) probando en cada uno: guardar, cancelar sin cambios, cancelar con cambios (aceptando y rechazando salir), Escape sin cambios, Escape con cambios (aceptando y rechazando salir), y clic fuera con cambios (aceptando y rechazando salir). La aplicación debe permanecer completamente interactiva (scroll, otros botones, navegación) después de cada uno, sin necesitar recargar en ningún momento.
- [x] 4.2 Confirmar que ninguno de los ~17 modales que no usan `ConfirmationService.confirm()` para cerrarse (traspasos, cuentas, categorías, personas, proveedores, formas de pago, clientes, y los "programados") se ha visto afectado por los cambios (compilación limpia y comportamiento visual sin cambios en al menos uno de ellos a modo de muestreo).
