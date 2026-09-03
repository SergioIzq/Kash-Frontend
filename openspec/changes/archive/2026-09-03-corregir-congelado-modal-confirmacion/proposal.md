## Why

Al crear, cancelar o modificar un gasto o un ingreso, la página se queda congelada (el mask/backdrop del drawer y el bloqueo de scroll quedan atascados) y el usuario tiene que recargar manualmente para poder seguir usando la aplicación. La causa es arquitectónica: `GastoFormModalComponent` e `IngresoFormModalComponent` son `OnPush` y controlan la visibilidad del drawer con un campo plano (`isVisible`) que solo se sincroniza correctamente cuando el evento que lo cambia ocurre dentro de la propia plantilla del componente. Al pasar por `ConfirmationService.confirm()` — cuyo `<p-confirmDialog>` real vive en `BasePageTemplateComponent`, una rama distinta del árbol de componentes — los callbacks `accept`/`reject` mutan ese campo desde fuera, y Angular nunca vuelve a comprobar la vista del modal, dejando el drawer de PrimeNG sin recibir el cierre.

## What Changes

- Corregir `GastoFormModalComponent` e `IngresoFormModalComponent` para que el cierre del drawer (guardar, cancelar, confirmar salida, rechazar salida) se refleje siempre de forma fiable, sin depender de que el evento que lo dispara ocurra dentro de la propia plantilla del componente.
- Corregir el caso de la tecla Escape: actualmente `hide(false)` de PrimeNG anima la salida visual del drawer pero nunca llama a `handleDrawerHide()`, por lo que el estado interno (`isVisible`) y el del padre (`gastoDialog`) se quedan en `true` aunque el drawer ya no se vea.
- Corregir el caso de clic fuera del drawer (mask): actualmente el drawer empieza a cerrarse visualmente antes de que el usuario responda a la confirmación de "salir sin guardar", y si el usuario cancela esa confirmación (quiere quedarse), el drawer no se reabre.
- Corregir `InversionFormModalComponent`: añadir el callback `reject:` que falta en su confirmación de "¿Descartar los cambios?" y asegurar que el drawer no empieza a cerrarse visualmente antes de que el usuario responda a esa confirmación.

## Capabilities

### New Capabilities
- `cierre-fiable-modales-confirmacion`: garantiza que los formularios modales de alta/edición que piden confirmación antes de cerrarse (guardar, cancelar con cambios sin guardar, tecla Escape, clic fuera) siempre reflejan el cierre o la reapertura en la interfaz, sin dejar el mask/backdrop bloqueando la página.

### Modified Capabilities

(ninguna: no hay una spec existente que documente el comportamiento de cierre de estos modales; es una capacidad nueva que formaliza un comportamiento que hasta ahora era implícito y estaba roto)

## Impact

- **Afectados directamente**: `src/app/features/gastos/components/gasto-form-modal.component.ts` y `src/app/features/ingresos/components/ingreso-form-modal.component.ts` (único par de modales que combina `ConfirmationService.confirm()` para guardar/cancelar sin declarar su propio `<p-confirmDialog>`).
- **Incluido por la misma familia de problema**: `src/app/features/inversiones/components/inversion-form-modal.component.ts`. Declara su propio `<p-confirmDialog>` (evita el problema principal), pero su `onCancel()` no tiene callback `reject:`, y el `p-drawer` (con `modal`/`dismissible`/`closeOnEscape` en sus valores por defecto) inicia el cierre visual (`disableModality()`) en cuanto detecta un clic en el mask o un Escape, antes de que se resuelva la confirmación. No se ha podido verificar en el navegador si esto llega a bloquear la interfaz, pero se corrige de forma preventiva dentro de este mismo change.
- **Patrón compartido, no necesariamente afectado**: el resto de ~17 modales de alta/edición (`traspaso-form-modal`, `cuenta-form-modal`, los "programados", "create-modals", etc.) usan el mismo campo `isVisible` + `effect()`, pero cierran directamente desde el clic de su propio botón sin pasar por `confirm()`, por lo que no están expuestos a este bug concreto — se dejan fuera de alcance salvo que la investigación de diseño encuentre lo contrario.
- **Dependencia externa**: comportamiento de `p-drawer` de PrimeNG (`primeng/drawer`), en concreto sus métodos `close()`/`hide()` y los eventos `onHide`/`visibleChange`.
