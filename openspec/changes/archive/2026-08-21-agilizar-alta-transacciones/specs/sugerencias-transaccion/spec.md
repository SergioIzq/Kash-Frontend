## Purpose

Pre-rellenar automáticamente cuenta, forma de pago, importe y tercero (proveedor/persona) al seleccionar un concepto ya usado anteriormente, a partir de la transacción más reciente registrada para ese concepto, reduciendo el número de campos que el usuario debe completar a mano en un alta de gasto o ingreso.

## ADDED Requirements

### Requirement: Pre-rellenado de campos al seleccionar un concepto con histórico
Al seleccionar un concepto existente en el formulario de alta de un gasto o ingreso, el sistema SHALL consultar la combinación de campos (cuenta, forma de pago, importe, proveedor o persona según el tipo) de la transacción más reciente registrada por el usuario para ese concepto y ese tipo (gasto/ingreso), y SHALL pre-rellenar con esos valores únicamente los campos del formulario que estén vacíos en ese momento.

#### Scenario: Concepto con histórico reciente
- **WHEN** el usuario está creando un gasto nuevo y selecciona un concepto que ya se usó anteriormente en al menos un gasto
- **THEN** el sistema pre-rellena cuenta, forma de pago, importe y (si existía) proveedor o persona con los valores del gasto más reciente registrado para ese concepto, dejando los campos editables

#### Scenario: Concepto sin histórico
- **WHEN** el usuario selecciona un concepto recién creado o que nunca se ha usado en ese tipo de transacción (gasto/ingreso)
- **THEN** el sistema no pre-rellena ningún campo adicional y el formulario se comporta como hoy (campos vacíos, obligatorios)

#### Scenario: El usuario ya había rellenado un campo antes de elegir el concepto
- **WHEN** el usuario ha introducido manualmente un importe o seleccionado una cuenta antes de elegir el concepto
- **THEN** el sistema no sobrescribe esos campos ya rellenados, aunque exista una sugerencia distinta para el concepto elegido

### Requirement: La sugerencia no aplica en modo edición
Al editar una transacción existente, el sistema SHALL NOT aplicar el pre-rellenado por sugerencia de concepto, para no sobrescribir datos ya guardados del registro que se está editando.

#### Scenario: Edición de un gasto existente
- **WHEN** el usuario abre un gasto ya existente para editarlo y cambia el concepto seleccionado
- **THEN** el sistema no pre-rellena cuenta, forma de pago, importe ni tercero a partir del histórico del nuevo concepto; esos campos conservan los valores actuales del gasto en edición hasta que el usuario los cambie explícitamente

### Requirement: Indicación visual de campo pre-rellenado por sugerencia
Cuando un campo se rellena automáticamente por esta funcionalidad, el sistema SHALL mostrar una indicación visual junto al campo que permita al usuario distinguir un valor sugerido de uno introducido manualmente.

#### Scenario: Campo autocompletado visible como sugerencia
- **WHEN** el sistema pre-rellena la cuenta o la forma de pago a partir del histórico del concepto seleccionado
- **THEN** el campo muestra un indicador (icono con tooltip explicativo) señalando que el valor proviene de un uso anterior de ese concepto, y desaparece si el usuario modifica el valor manualmente
