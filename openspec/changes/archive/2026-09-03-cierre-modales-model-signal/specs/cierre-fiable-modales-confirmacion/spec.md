## ADDED Requirements

### Requirement: Cierre directo de un formulario de alta sin cambios reales
Al cancelar un formulario de alta de gasto o ingreso en el que el usuario no ha introducido ningún dato distinto de los valores que el formulario prerellena por defecto al abrirse, el sistema SHALL cerrar el formulario directamente, sin mostrar el diálogo de confirmación de "salir sin guardar".

#### Scenario: Cancelar un formulario de alta recién abierto, sin ningún dato introducido
- **WHEN** el usuario abre el formulario de "Nuevo Gasto" o "Nuevo Ingreso" y pulsa "Cancelar" sin haber introducido ningún dato
- **THEN** el formulario se cierra inmediatamente, sin mostrar ningún diálogo de confirmación

#### Scenario: Cancelar un formulario de alta con al menos un dato introducido
- **WHEN** el usuario introduce al menos un dato real (concepto, importe, categoría, proveedor/cliente, persona, cuenta, forma de pago o descripción) y pulsa "Cancelar"
- **THEN** el sistema pide confirmación antes de descartar los cambios, como en el resto de escenarios ya documentados en esta capability
