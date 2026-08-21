## MODIFIED Requirements

### Requirement: Pre-rellenado de campos al seleccionar un concepto con histórico
Al seleccionar un concepto existente en el formulario de alta de un gasto o ingreso, el sistema SHALL consultar la combinación de campos (cuenta, forma de pago, proveedor o persona según el tipo) de la transacción más reciente registrada por el usuario para ese concepto y ese tipo (gasto/ingreso), y SHALL pre-rellenar con esos valores únicamente los campos del formulario que estén vacíos en ese momento. El importe SHALL NOT pre-rellenarse nunca por esta funcionalidad: el usuario lo introduce siempre a mano, aunque exista un importe registrado en esa transacción histórica.

#### Scenario: Concepto con histórico reciente
- **WHEN** el usuario está creando un gasto nuevo y selecciona un concepto que ya se usó anteriormente en al menos un gasto
- **THEN** el sistema pre-rellena cuenta, forma de pago y (si existía) proveedor o persona con los valores del gasto más reciente registrado para ese concepto, dejando los campos editables; el importe permanece tal cual estuviera (vacío, u con lo que el usuario ya hubiera escrito) para que lo introduzca siempre él mismo

#### Scenario: Concepto sin histórico
- **WHEN** el usuario selecciona un concepto recién creado o que nunca se ha usado en ese tipo de transacción (gasto/ingreso)
- **THEN** el sistema no pre-rellena ningún campo adicional y el formulario se comporta como hoy (campos vacíos, obligatorios)

#### Scenario: El usuario ya había rellenado un campo antes de elegir el concepto
- **WHEN** el usuario ha seleccionado manualmente una cuenta (u otro campo pre-rellenable) antes de elegir el concepto
- **THEN** el sistema no sobrescribe ese campo ya rellenado, aunque exista una sugerencia distinta para el concepto elegido

### Requirement: La sugerencia no aplica en modo edición
Al editar una transacción existente, el sistema SHALL NOT aplicar el pre-rellenado por sugerencia de concepto, para no sobrescribir datos ya guardados del registro que se está editando.

#### Scenario: Edición de un gasto existente
- **WHEN** el usuario abre un gasto ya existente para editarlo y cambia el concepto seleccionado
- **THEN** el sistema no pre-rellena cuenta, forma de pago ni tercero a partir del histórico del nuevo concepto; esos campos conservan los valores actuales del gasto en edición hasta que el usuario los cambie explícitamente (el importe, al no pre-rellenarse nunca por sugerencia, tampoco se ve afectado)
