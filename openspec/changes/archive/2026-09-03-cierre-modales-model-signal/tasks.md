## 1. Gasto: migrar visibilidad a `model()`

- [x] 1.1 En `gasto-form-modal.component.ts`, sustituir `visible = input<boolean>(false)` por `visible = model<boolean>(false)`, eliminar el campo `isVisible`, el `effect()` que lo sincroniza y la inyección de `ChangeDetectorRef`, y verificar con `grep` que no queda ningún uso de `isVisible` ni `cdr` en el archivo
- [x] 1.2 Actualizar el template: `<p-drawer [(visible)]="isVisible" ...>` → `<p-drawer [(visible)]="visible" ...>`
- [x] 1.3 Actualizar `closeModal()`, los `reject:` de `onCancel()`/`handleDrawerHide()`, y el guard de `onEscapePressed()` para leer/escribir `this.visible()`/`this.visible.set(...)` en vez de `this.isVisible`
- [x] 1.4 Ejecutar `ng build` y confirmar que compila sin errores de tipos derivados del cambio

## 2. Gasto: `hasUnsavedChanges()` no cuenta los valores por defecto como cambio

- [x] 2.1 Ajustar `hasUnsavedChanges()` para que `formData.fecha` solo cuente como cambio si ya no es la fecha de hoy con la que `loadFormData()` prerellena el alta, y `formData.descripcion` solo si ya no es `''`
- [x] 2.2 Verificar manualmente: abrir "Nuevo Gasto", pulsar "Cancelar" sin tocar nada → se cierra sin mostrar el diálogo de confirmación; abrir "Nuevo Gasto", rellenar al menos un campo, pulsar "Cancelar" → sigue mostrando el diálogo, como hasta ahora — verificado manualmente por el usuario

## 3. Ingreso: mismo trabajo que Gasto

- [x] 3.1 Replicar 1.1 en `ingreso-form-modal.component.ts`
- [x] 3.2 Replicar 1.2 en `ingreso-form-modal.component.ts`
- [x] 3.3 Replicar 1.3 en `ingreso-form-modal.component.ts`
- [x] 3.4 Replicar 2.1 en `ingreso-form-modal.component.ts`
- [x] 3.5 Replicar 2.2 (verificación manual) en la página de Ingresos — verificado manualmente por el usuario

## 4. Inversión: migrar visibilidad a `model()` sin cambiar el flujo de interceptación

- [x] 4.1 En `inversion-form-modal.component.ts`, sustituir `visible = input.required<boolean>()` + `visibleChange = output<boolean>()` por `visible = model.required<boolean>()`, manteniendo el template como `[visible]="visible()" (visibleChange)="handleDrawerHide($event)"` (sin pasar a `[(visible)]` de dos vías - ver design.md decisión 2)
- [x] 4.2 Actualizar `closeDrawer()` para usar `this.visible.set(false)` en vez de `this.visibleChange.emit(false)`, y eliminar el `markForCheck()` defensivo ya innecesario en el `reject:` de `onCancel()` (y `ChangeDetectorRef` si queda sin otro uso en el archivo)
- [x] 4.3 Ejecutar `ng build` y confirmar que compila sin errores

## 5. Verificación final

- [x] 5.1 Verificar manualmente en Gastos e Ingresos el escenario que reportó el bloqueo: rellenar un par de campos en "Nuevo Gasto"/"Nuevo Ingreso", pulsar "Cancelar", pulsar "Sí" en el diálogo, y confirmar que el formulario se cierra y el resto de la página sigue respondiendo a clics sin necesidad de recargar — verificado manualmente por el usuario
- [x] 5.2 Repasar los escenarios ya existentes de `cierre-fiable-modales-confirmacion` (guardar, cancelar y confirmar salida, rechazar salida desde Cancelar y desde clic fuera, Escape con y sin cambios) en Gasto, Ingreso e Inversión, y confirmar que ninguno ha cambiado de comportamiento salvo el nuevo escenario de esta spec delta — verificado manualmente por el usuario
- [x] 5.3 Repasar el nuevo escenario de la spec delta de este cambio (alta en blanco se cierra sin confirmar) en Gasto e Ingreso — verificado manualmente por el usuario
