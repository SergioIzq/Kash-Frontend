## MODIFIED Requirements

### Requirement: Vista de alta rápida con campos mínimos
El sistema SHALL ofrecer una vista de captura reducida en la que concepto e importe son los únicos campos visibles por defecto, con el resto de campos (cuenta, forma de pago, categoría, proveedor/persona) precargados mediante sugerencia y presentados como un resumen editable en lugar de campos abiertos. El importe SHALL NOT precargarse nunca por sugerencia, aunque exista una transacción anterior para el concepto elegido: el usuario lo introduce siempre a mano.

#### Scenario: Alta rápida de un concepto conocido
- **WHEN** el usuario abre la vista de alta rápida, escribe/selecciona un concepto ya usado anteriormente e introduce el importe
- **THEN** el sistema muestra un resumen con cuenta, forma de pago y categoría ya rellenados a partir del histórico de ese concepto, sin tocar el campo de importe (que permanece vacío hasta que el usuario lo escriba), permite guardar la transacción sin más pasos, y permite pulsar "cambiar" para editar cualquiera de los campos del resumen antes de guardar

#### Scenario: Alta rápida de un concepto nuevo
- **WHEN** el usuario escribe en la vista de alta rápida un concepto que no existe todavía
- **THEN** el sistema solicita los campos obligatorios que no se pueden inferir (categoría, cuenta, forma de pago), igual que en el formulario completo, antes de permitir guardar
