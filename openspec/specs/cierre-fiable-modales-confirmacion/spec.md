# cierre-fiable-modales-confirmacion Specification

## Purpose

Garantiza que los formularios modales de alta/edición que piden confirmación antes de cerrarse siempre reflejan correctamente el cierre o la reapertura en la interfaz, sin dejar la aplicación bloqueada ni requerir una recarga manual.

## Requirements

### Requirement: Cierre fiable tras guardar
Al confirmar el guardado de un gasto, un ingreso o una inversión (alta o edición), el sistema SHALL cerrar el formulario modal y dejar la aplicación completamente interactiva (sin overlay ni bloqueo de scroll residual), sin necesidad de recargar la página.

#### Scenario: Guardar un gasto, ingreso o inversión nuevo
- **WHEN** el usuario rellena el formulario de alta de un gasto, ingreso o inversión, pulsa "Guardar" y confirma el diálogo de confirmación
- **THEN** el formulario modal se cierra, el registro aparece en el listado y el resto de la aplicación permanece usable sin recargar

#### Scenario: Guardar la edición de un gasto, ingreso o inversión existente
- **WHEN** el usuario modifica un gasto, ingreso o inversión existente, pulsa "Guardar" y confirma el diálogo de confirmación
- **THEN** el formulario modal se cierra, los cambios se reflejan en el listado y el resto de la aplicación permanece usable sin recargar

### Requirement: Cierre fiable tras cancelar con cambios sin guardar
Al cancelar un formulario de alta/edición de gasto, ingreso o inversión con cambios sin guardar y confirmar que se desea salir, el sistema SHALL cerrar el formulario y dejar la aplicación completamente interactiva, sin necesidad de recargar la página.

#### Scenario: Cancelar y confirmar la salida
- **WHEN** el usuario ha introducido datos en el formulario, pulsa "Cancelar" y confirma que desea salir sin guardar
- **THEN** el formulario modal se cierra y el resto de la aplicación permanece usable sin recargar

### Requirement: El formulario permanece abierto si el usuario rechaza salir
Si el usuario decide no salir del formulario (rechaza la confirmación de "salir sin guardar", ya sea desde el botón Cancelar, la tecla Escape o un clic fuera del formulario), el sistema SHALL mantener el formulario visible y totalmente operativo, conservando los datos ya introducidos.

#### Scenario: Rechazar la salida tras pulsar Cancelar
- **WHEN** el usuario pulsa "Cancelar" con cambios sin guardar y luego rechaza la confirmación de salida
- **THEN** el formulario modal sigue visible, con los datos introducidos intactos, y permite seguir editando o guardando

#### Scenario: Rechazar la salida tras un clic fuera del formulario
- **WHEN** el usuario hace clic fuera del formulario (con cambios sin guardar) y luego rechaza la confirmación de salida
- **THEN** el formulario modal permanece visible (no se cierra a medias ni queda oculto), con los datos introducidos intactos

### Requirement: Cierre consistente mediante la tecla Escape
Al pulsar Escape con el formulario de alta/edición de gasto, ingreso o inversión abierto, el sistema SHALL aplicar la misma lógica de confirmación que el botón "Cancelar" (pedir confirmación solo si hay cambios sin guardar) y, en cualquier caso, dejar sincronizado el estado de apertura/cierre del formulario con lo que se muestra en pantalla.

#### Scenario: Escape sin cambios sin guardar
- **WHEN** el usuario pulsa Escape en un formulario recién abierto, sin haber introducido ningún dato
- **THEN** el formulario se cierra inmediatamente y el botón para abrir un nuevo formulario vuelve a funcionar en el siguiente clic

#### Scenario: Escape con cambios sin guardar
- **WHEN** el usuario pulsa Escape tras haber introducido datos en el formulario
- **THEN** el sistema pide confirmación antes de descartar los cambios, igual que al pulsar "Cancelar"

### Requirement: Ausencia de bloqueo residual de la interfaz
Tras cualquier cierre del formulario modal (guardar, cancelar, Escape o clic fuera), el sistema SHALL eliminar por completo cualquier fondo/overlay de bloqueo y restaurar el desplazamiento (scroll) normal de la página.

#### Scenario: La interfaz queda usable tras cualquier vía de cierre
- **WHEN** el formulario modal se cierra por cualquiera de sus vías (guardar, cancelar, Escape, clic fuera)
- **THEN** no queda ningún overlay invisible bloqueando clics ni el scroll de la página deshabilitado
