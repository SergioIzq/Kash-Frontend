# alta-rapida Specification

## Purpose

Ofrecer una vía de captura de gasto/ingreso reducida a los campos esenciales (concepto e importe), accesible en un solo paso desde un atajo de la aplicación instalada como PWA, para transacciones cotidianas de bajo valor que hoy requieren navegar hasta la lista completa de Gastos o Ingresos y rellenar un formulario extenso.

## Requirements

### Requirement: Vista de alta rápida con campos mínimos
El sistema SHALL ofrecer una vista de captura reducida en la que concepto e importe son los únicos campos visibles por defecto, con el resto de campos (cuenta, forma de pago, categoría, proveedor/persona) precargados mediante sugerencia y presentados como un resumen editable en lugar de campos abiertos. El importe SHALL NOT precargarse nunca por sugerencia, aunque exista una transacción anterior para el concepto elegido: el usuario lo introduce siempre a mano.

#### Scenario: Alta rápida de un concepto conocido
- **WHEN** el usuario abre la vista de alta rápida, escribe/selecciona un concepto ya usado anteriormente e introduce el importe
- **THEN** el sistema muestra un resumen con cuenta, forma de pago y categoría ya rellenados a partir del histórico de ese concepto, sin tocar el campo de importe (que permanece vacío hasta que el usuario lo escriba), permite guardar la transacción sin más pasos, y permite pulsar "cambiar" para editar cualquiera de los campos del resumen antes de guardar

#### Scenario: Alta rápida de un concepto nuevo
- **WHEN** el usuario escribe en la vista de alta rápida un concepto que no existe todavía
- **THEN** el sistema solicita los campos obligatorios que no se pueden inferir (categoría, cuenta, forma de pago), igual que en el formulario completo, antes de permitir guardar

### Requirement: Selector de tipo de transacción en la vista de alta rápida
La vista de alta rápida SHALL permitir elegir entre gasto e ingreso, con gasto como selección por defecto al abrir la vista.

#### Scenario: Registrar un ingreso desde alta rápida
- **WHEN** el usuario abre la vista de alta rápida y cambia el tipo de transacción a "Ingreso"
- **THEN** el formulario reducido pasa a operar sobre ingresos (concepto, importe y sugerencias correspondientes a ingresos) sin necesidad de salir de la vista

### Requirement: Acceso directo desde la aplicación instalada
El sistema SHALL exponer la vista de alta rápida como un atajo de la aplicación (application shortcut) en las plataformas que lo soporten, de modo que se pueda abrir directamente sin pasar por la navegación estándar del menú lateral.

#### Scenario: Acceso desde el icono de la app instalada
- **WHEN** el usuario mantiene pulsado (o hace clic secundario en) el icono de la aplicación instalada en una plataforma con soporte de atajos
- **THEN** el sistema ofrece un atajo "Nuevo gasto" (u equivalente) que abre la aplicación directamente en la vista de alta rápida

#### Scenario: Acceso en plataforma sin soporte de atajos
- **WHEN** el usuario está en una plataforma que no soporta atajos de aplicación
- **THEN** la vista de alta rápida sigue siendo accesible navegando a su ruta dentro de la aplicación, sin que la ausencia del atajo bloquee su uso
