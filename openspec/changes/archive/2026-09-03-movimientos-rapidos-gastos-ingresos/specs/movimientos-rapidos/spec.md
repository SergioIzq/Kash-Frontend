## Purpose

Permite consultar rápidamente los gastos o ingresos de un periodo reciente (hoy, esta semana, este mes o un rango personalizado) desde una tabla independiente de la tabla de gestión completa, sin perder la búsqueda/paginación de esta última.

## ADDED Requirements

### Requirement: Tabla de consulta rápida por periodo
En las páginas de Gastos e Ingresos, el sistema SHALL mostrar una tabla de movimientos independiente de la tabla de gestión existente, situada antes de esta, que liste los gastos o ingresos del periodo seleccionado.

#### Scenario: La tabla aparece antes de la tabla de gestión
- **WHEN** el usuario entra en la página de Gastos o de Ingresos
- **THEN** ve la tabla de movimientos rápidos por encima de la tabla de gestión existente, ambas visibles en la misma página

### Requirement: Filtros rápidos de periodo
El sistema SHALL ofrecer tres accesos directos de periodo (Hoy, Esta semana, Este mes) y un selector de rango de fechas personalizado, de forma que solo uno de estos filtros esté activo a la vez.

#### Scenario: Seleccionar "Hoy"
- **WHEN** el usuario selecciona el filtro "Hoy"
- **THEN** la tabla muestra únicamente los movimientos cuya fecha es la fecha actual

#### Scenario: Seleccionar "Esta semana"
- **WHEN** el usuario selecciona el filtro "Esta semana"
- **THEN** la tabla muestra los movimientos cuya fecha cae dentro de la semana en curso

#### Scenario: Seleccionar "Este mes"
- **WHEN** el usuario selecciona el filtro "Este mes"
- **THEN** la tabla muestra los movimientos cuya fecha cae dentro del mes en curso

#### Scenario: Seleccionar un rango de fechas personalizado
- **WHEN** el usuario elige una fecha de inicio y una fecha de fin en el selector de rango
- **THEN** la tabla muestra los movimientos cuya fecha está comprendida entre esas dos fechas, ambas inclusive

### Requirement: Filtrado por fecha de la transacción
El sistema SHALL filtrar los movimientos por la fecha de la transacción (el campo `fecha` del gasto/ingreso, asignado por el usuario), nunca por una fecha de creación o auditoría del registro.

#### Scenario: Un movimiento editado mantiene su fecha de filtrado
- **WHEN** un gasto o ingreso se edita y solo cambia algún dato distinto de la fecha
- **THEN** sigue apareciendo en el mismo filtro de periodo que antes de la edición, según su fecha de transacción

### Requirement: Acciones de edición y borrado
Cada fila de la tabla de movimientos rápidos SHALL ofrecer las mismas acciones de editar y borrar que la tabla de gestión, operando sobre el mismo registro subyacente.

#### Scenario: Editar un movimiento desde la tabla rápida
- **WHEN** el usuario pulsa "Editar" sobre una fila de la tabla de movimientos rápidos
- **THEN** se abre el mismo formulario de edición que usa la tabla de gestión, precargado con los datos de ese gasto/ingreso

#### Scenario: Borrar un movimiento desde la tabla rápida
- **WHEN** el usuario pulsa "Borrar" sobre una fila de la tabla de movimientos rápidos y confirma
- **THEN** el gasto/ingreso se elimina y desaparece tanto de la tabla de movimientos rápidos como de la tabla de gestión, sin necesidad de recargar la página

### Requirement: Independencia de la tabla de gestión existente
El sistema SHALL mantener la tabla de gestión existente (su búsqueda, orden y paginación) sin ningún cambio de comportamiento al añadir la tabla de movimientos rápidos.

#### Scenario: Filtrar movimientos rápidos no afecta a la tabla de gestión
- **WHEN** el usuario cambia el filtro de periodo en la tabla de movimientos rápidos
- **THEN** la búsqueda, el orden y la página actual de la tabla de gestión existente permanecen sin cambios

### Requirement: Mismas columnas que la tabla de gestión
La tabla de movimientos rápidos SHALL mostrar las mismas columnas que la tabla de gestión existente para el mismo tipo de movimiento (gasto o ingreso).

#### Scenario: Columnas coherentes entre ambas tablas
- **WHEN** el usuario compara una fila de la tabla de movimientos rápidos con una fila de la tabla de gestión
- **THEN** ambas muestran los mismos campos (fecha, persona, forma de pago, proveedor/cliente, concepto, cuenta, importe y acciones)
