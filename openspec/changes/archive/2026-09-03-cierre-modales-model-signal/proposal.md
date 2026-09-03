## Why

A pesar del fix ya archivado (`corregir-congelado-modal-confirmacion`, basado en llamar a `markForCheck()` manualmente en cada punto de cierre), el usuario sigue reportando que la página se congela al cancelar un gasto/ingreso tras rellenar campos y confirmar la salida ("Cancelar" → "Sí"). El propio diseño de aquel fix ya advertía el riesgo: repartir `markForCheck()` a mano es un parche, no una solución estructural, y es fácil que un camino de cierre quede sin cubrir. La solución de fondo que aquel cambio dejó pendiente por ampliar demasiado el radio de cambio - sustituir el campo plano `isVisible` + `effect()` por un `model<boolean>()` nativo de Angular - elimina la clase de bug por construcción, sin depender de que nadie recuerde añadir `markForCheck()` en un futuro nuevo camino de cierre.

De paso, se corrige un bug relacionado encontrado en la misma investigación: `hasUnsavedChanges()` en Gasto e Ingreso devuelve `true` desde el instante en que se abre un formulario de alta en blanco (porque `formData.fecha` y `formData.descripcion` se prerellenan con valores no-`null`), así que todo cancelar de un alta nueva pasa por el diálogo de confirmación aunque el usuario no haya escrito nada.

## What Changes

- `GastoFormModalComponent`, `IngresoFormModalComponent` e `InversionFormModalComponent` sustituyen su campo de visibilidad por un `visible = model<boolean>(false)`:
  - Se elimina el campo plano `isVisible`, el `effect()` que lo sincronizaba desde el `input()`, y la inyección de `ChangeDetectorRef` (en Gasto/Ingreso, su único uso en estos componentes es para los `markForCheck()` que este cambio hace innecesarios).
  - `<p-drawer [(visible)]="isVisible" ...>` pasa a `<p-drawer [(visible)]="visible" ...>`, enlazando directamente contra la signal.
  - Todas las mutaciones de visibilidad (`closeModal()`, los `reject:` de `onCancel()`/`handleDrawerHide()`) pasan de `this.isVisible = ...` a `this.visible.set(...)`.
  - Los consumidores (`gastos-list.page.ts`, `ingresos-list.page.ts`, `inversiones-list.page.ts`) no necesitan cambios: `[visible]="...()" (visibleChange)="....set($event)"` sigue funcionando igual contra un `model()`.
  - No se tocan las decisiones ya aceptadas del cambio anterior sobre Escape (listener propio) ni sobre el parpadeo visual del clic-fuera (`close()` de `p-drawer` emite `visibleChange` antes de resolver la confirmación) - son limitaciones de `p-drawer`, no del patrón `isVisible`+`effect()`, y siguen aplicando igual.
- `hasUnsavedChanges()` en `GastoFormModalComponent` e `IngresoFormModalComponent` deja de considerar "cambio sin guardar" los valores que el formulario prerellena siempre al abrirse en modo alta (`fecha` con la fecha actual, `descripcion` con cadena vacía), para que cancelar un formulario de alta realmente en blanco cierre directamente, sin pedir confirmación.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `cierre-fiable-modales-confirmacion`: se añade el requisito de que el formulario de alta en blanco (sin ningún dato introducido por el usuario) se cierre directamente al cancelar, sin mostrar el diálogo de "¿desea salir?" - hoy lo muestra siempre, incluso sin cambios reales.

## Impact

- **Frontend**: `gasto-form-modal.component.ts`, `ingreso-form-modal.component.ts`, `inversion-form-modal.component.ts`. Ningún cambio necesario en `gastos-list.page.ts`, `ingresos-list.page.ts` ni `inversiones-list.page.ts` (los bindings `[visible]`/`(visibleChange)` existentes siguen siendo válidos contra un `model()`).
- Es la primera vez que se usa `model()` en este código base (verificado: no aparece en ningún otro componente hoy), aunque es una función estable de Angular (disponible en la versión instalada, 21.2.17).
- Sin impacto en backend.
