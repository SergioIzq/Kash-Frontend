## Context

Ver `proposal.md` - Why para el mecanismo raíz. Puntos de partida verificados en el código y en el código fuente de `primeng/drawer` (`node_modules/primeng/fesm2022/primeng-drawer.mjs`):

- `GastoFormModalComponent` e `IngresoFormModalComponent` son `ChangeDetectionStrategy.OnPush` y controlan `<p-drawer [(visible)]="isVisible">` con un **campo plano** `isVisible`, sincronizado desde el `input<boolean>()` `visible` mediante `effect(() => { this.isVisible = this.visible(); })` (patrón compartido por ~20 modales de la app, ver investigación previa).
- `onSave()` siempre, y `onCancel()`/`handleDrawerHide()` cuando hay cambios sin guardar, llaman a `this.#confirmationService.confirm({ accept, reject })`. El `<p-confirmDialog>` que realmente renderiza y gestiona el clic vive dentro de `BasePageTemplateComponent` (`@sergioizq/ngx-crud-ui`), que envuelve la página de listado — una rama distinta del árbol de componentes de `GastoFormModalComponent`/`IngresoFormModalComponent`.
- Como el clic en "Sí"/"Cancelar" del diálogo ocurre en esa rama ajena, los callbacks `accept`/`reject` mutan `isVisible` "desde fuera": no es un evento del propio template del modal, no cambia ningún `@Input`, y no se llama a `markForCheck()`. Angular OnPush nunca vuelve a comprobar la vista del modal, así que `p-drawer` nunca recibe el `false`/`true` actualizado.
- `p-drawer` (`primeng-drawer.mjs:414-427`) separa `hide()` (solo `disableModality()`, opcionalmente emite `onHide`) de `close()` (llama a `hide()` con emisión, y ADEMÁS emite `visibleChange`). El contenedor del drawer tiene un `(keydown)="onKeyDown($event)"` **incondicional** en su propio template (línea 574/641) que en Escape llama a `hide(false)` — sin emitir `onHide` ni `visibleChange` — independientemente del input `[closeOnEscape]`. El clic en el mask, en cambio, si `[dismissible]` es `true` (valor por defecto, no se sobreescribe en ninguno de los tres modales), llama a `close(event)` completo.
- `InversionFormModalComponent` evita el problema principal: enlaza `[visible]="visible()"` en modo unidireccional (lee la signal directamente, sin campo intermedio) y gestiona el cierre con `(visibleChange)="handleDrawerHide($event)"` + su propio `<p-confirmDialog>` local. Pero su `onCancel()` no declara `reject:`, y como `p-drawer` llama a `disableModality()` de forma incondicional en cuanto detecta clic en el mask o Escape (antes de que se resuelva cualquier confirmación), el drawer puede empezar a cerrarse visualmente sin que el usuario haya confirmado nada.

## Goals / Non-Goals

**Goals:**
- Que cerrar/reabrir el formulario de gasto, ingreso o inversión sea fiable sin importar qué evento lo disparó (botón propio, diálogo de confirmación ajeno, Escape, clic en el mask).
- Que el usuario nunca necesite recargar la página para seguir usando la app después de crear, cancelar, modificar o descartar un gasto/ingreso/inversión.
- Corrección mínima y focalizada en los tres componentes afectados, sin rediseñar el patrón `effect()+isVisible` compartido por el resto de modales (que no muestran el problema porque cierran en el mismo clic de su propio botón).

**Non-Goals:**
- No se sustituye el patrón `input()+campo plano+effect()` por `model()` en los ~17 modales restantes que no usan `ConfirmationService.confirm()` para cerrarse — no están afectados por este bug y ese cambio sería un refactor más amplio, fuera de alcance.
- No se cambia el comportamiento visual/UX de las confirmaciones (mensajes, textos, botones), solo su fiabilidad técnica.
- No se investigan aquí los modales "create-modal" (persona, proveedor, cuenta, forma de pago, categoría, cliente) que sí declaran su propio `<p-confirmDialog>` pero no fueron señalados por el usuario ni aparecieron en la búsqueda de `confirm()` en modales de alta/edición principales.

## Decisions

### 1. Forzar `markForCheck()` tras mutar el estado de visibilidad desde un callback ajeno
En `GastoFormModalComponent` e `IngresoFormModalComponent`, inyectar `ChangeDetectorRef` y llamar a `this.cdr.markForCheck()` inmediatamente después de cada mutación de `isVisible` que ocurra dentro de un callback `accept`/`reject` de `confirmationService.confirm()` (en `ejecutarGuardado()`/`closeModal()`, y en los `reject` de `onCancel()`/`handleDrawerHide()`). Esto ataca directamente la causa raíz verificada: la mutación es válida, pero Angular no sabe que debe repintar porque el evento que la origina no pertenece a la plantilla del propio componente.

**Alternativa considerada — mover `<p-confirmDialog>` dentro de cada modal** (como ya hace `inversion-form-modal`): resolvería el problema de origen (el clic volvería a ocurrir dentro de la propia plantilla), pero no arregla el caso de Escape (`hide(false)` nunca emite `onHide`, independientemente de dónde viva el diálogo de confirmación) ni el orden de eventos del clic-fuera (`close()` ya emite `visibleChange` antes de que exista ninguna confirmación). Se descarta como única medida porque no cubre todos los caminos de cierre listados en la spec; `markForCheck()` sí, al ser independiente del origen del evento.

**Alternativa considerada — sustituir `isVisible` (campo) + `effect()` por un `model<boolean>()`**: es la solución más idiomática a largo plazo (dos-vías nativo de Angular, sin necesidad de `markForCheck()` manual), pero exige cambiar la API pública del componente (`visible`/`visibleChange` → `model()`) y tocar también las plantillas de `GastosListPage`/`IngresosListPage`/`InversionesListPage` que lo consumen. Se descarta para este fix concreto por ampliar el radio de cambio más allá de lo necesario; queda anotada como mejora futura si se detectan más casos similares.

### 2. Unificar el comportamiento de Escape con el de "Cancelar"
Añadir un manejador de teclado propio (o interceptar el `(keydown)` del contenedor) en los tres modales para que, al pulsar Escape, se ejecute la misma lógica que ya existe en `onCancel()`/`handleDrawerHide()` (confirmar solo si hay cambios sin guardar) en lugar de depender del `hide(false)` interno de `p-drawer`, que no emite `onHide` ni `visibleChange`. Concretamente: dejar que el `(keydown)` incondicional de `p-drawer` visualmente cierre el drawer (comportamiento propio de la librería, no se puede desactivar sin parchear PrimeNG), pero además enganchar nuestra propia lógica de confirmación al mismo evento para que el estado (`isVisible`/señal del padre) quede sincronizado con lo que el usuario ve, aplicando también la Decisión 1 (`markForCheck()`) en las ramas que reabren el formulario tras un "no, seguir editando".

**Alternativa considerada — activar `[closeOnEscape]="true"`**: activaría el listener global de `p-drawer` que sí llama a `close()` completo (con `onHide` y `visibleChange`), pero se ejecutaría ADEMÁS del `(keydown)` incondicional del contenedor (ambos escuchan el mismo evento sin que ninguno detenga la propagación), duplicando la llamada a `hide()`/`disableModality()`. Se prefiere una única lógica propia y explícita en vez de depender de la interacción entre dos listeners internos de la librería.

### 3. Clic fuera (mask): aceptar el cierre visual inmediato, pero garantizar la reapertura fiable si se rechaza salir
`close()` de `p-drawer` emite `visibleChange` antes de que nuestra confirmación de "¿salir sin guardar?" se resuelva — esto no tiene forma de interceptarse (no expone ningún mecanismo para cancelar el cierre desde `onHide`). En vez de intentar evitar el cierre visual instantáneo (requeriría parchear/envolver el comportamiento interno de PrimeNG), se acepta como comportamiento visual transitorio y se garantiza, vía la Decisión 1, que si el usuario responde "no, quiero seguir editando", `isVisible = true` se aplique de forma fiable y el formulario vuelva a mostrarse con los datos intactos.

### 4. `InversionFormModalComponent`: añadir `reject:` y aplicar la misma garantía de repintado
Añadir el callback `reject:` que falta en `onCancel()` (actualmente solo tiene `accept:`), y aplicar la misma llamada a `markForCheck()` (o el patrón que se decida) tras cualquier mutación de estado relacionada con la reapertura del drawer, por si el clic en el mask/Escape llega a desincronizar el `visible()` de la misma forma que en gasto/ingreso — aunque aquí el mecanismo de enlace unidireccional a la signal reduce el riesgo, no lo elimina del todo frente al cierre visual inmediato de `p-drawer` descrito en la Decisión 3.

## Risks / Trade-offs

- **[Riesgo] Doble llamada a `hide()`/`disableModality()` en Escape** si se combinan el `(keydown)` incondicional del contenedor con cualquier lógica adicional propia. → **Mitigación**: no activar `[closeOnEscape]`; implementar la confirmación de Escape como lógica propia sobre el mismo evento, verificando manualmente que no se dispare la animación de cierre dos veces.
- **[Riesgo] Parpadeo visual en clic-fuera con rechazo**: el drawer puede iniciar su animación de cierre y luego "reaparecer" si el usuario rechaza la confirmación de salida, ya que `p-drawer` no permite cancelar un `close()` en curso. → **Mitigación**: aceptar el parpadeo como trade-off conocido (documentado aquí); si resulta molesto en la verificación manual, considerar deshabilitar `[dismissible]` como mejora futura (fuera de alcance de este fix).
- **[Riesgo] `markForCheck()` disperso**: añadir llamadas manuales a `markForCheck()` en varios puntos es un parche, no una solución estructural — si se añade un nuevo camino de cierre en el futuro sin recordar este detalle, el bug podría reaparecer. → **Mitigación**: dejar comentado en el código (WHY, no WHAT) por qué es necesario cada `markForCheck()`, para que futuras modificaciones no lo eliminen por error.

## Migration Plan

No aplica migración de datos. Es una corrección de comportamiento en componentes ya existentes; no cambia contratos públicos (`@Input`/`@Output`) salvo la adición del callback `reject:` en `inversion-form-modal`, que es puramente interno.
