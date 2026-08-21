# localizacion-listados-crud Specification

## Purpose

Garantizar que todo texto de UI generado internamente por las pantallas de listado
compartidas (paginación, toasts, confirmación de borrado, glosario de ayuda) se muestre en
español, sin depender de que cada pantalla individual lo sobreescriba.

## Requirements

### Requirement: Textos de las pantallas de listado en español
El sistema SHALL mostrar en español, en todas las pantallas de listado construidas sobre la
librería compartida de CRUD, los textos que dicha librería genera internamente y que no
provienen de la configuración específica de cada pantalla: el resumen de paginación del pie de
tabla, los títulos de los toasts de éxito/error/aviso/información, y el mensaje, cabecera y
etiqueta de aceptar del diálogo de confirmación de borrado.

#### Scenario: Pie de página de una tabla de listado
- **WHEN** un usuario visualiza una pantalla de listado (por ejemplo, categorías o
  proveedores) con resultados paginados
- **THEN** el resumen de paginación se muestra en español (p. ej. "Mostrando 1 a 10 de 42"),
  no en inglés

#### Scenario: Confirmación al eliminar un registro
- **WHEN** un usuario pulsa eliminar sobre un registro de una pantalla de listado
- **THEN** el diálogo de confirmación (mensaje, cabecera y botón de aceptar) se muestra en
  español

#### Scenario: Notificación tras una operación
- **WHEN** una pantalla de listado muestra una notificación (toast) tras crear, editar,
  eliminar o refrescar
- **THEN** el título del toast se muestra en español (p. ej. "Éxito", "Error"), no en inglés
