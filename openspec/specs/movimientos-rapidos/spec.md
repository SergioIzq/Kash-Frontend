# movimientos-rapidos Specification

## Purpose

Permite consultar rápidamente los gastos o ingresos de un periodo reciente (hoy, esta semana, este mes o un rango personalizado) desde una tabla independiente de la tabla de gestión completa, sin perder la búsqueda/paginación de esta última.

## Requirements

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

### Requirement: Sumatorio del importe del periodo filtrado
El sistema SHALL mostrar, debajo de la tabla de movimientos rápidos, la suma del importe de todos los movimientos que cumplen el filtro de periodo activo (no solo los visibles en la página actual de la tabla), usando el mismo formato de importe y el mismo indicador visual (color y signo) que la columna "Importe".

#### Scenario: El sumatorio corresponde a todo el periodo, no a la página visible
- **WHEN** el periodo filtrado tiene más movimientos de los que caben en una página de la tabla
- **THEN** el sumatorio mostrado corresponde a la suma de todos los movimientos del periodo, no solo a los de la página actual

#### Scenario: Cambiar de filtro actualiza el sumatorio
- **WHEN** el usuario cambia el filtro de periodo (Hoy, Esta semana, Este mes o un rango personalizado)
- **THEN** el sumatorio se actualiza para reflejar únicamente los movimientos del nuevo periodo seleccionado

#### Scenario: Periodo sin movimientos
- **WHEN** el periodo filtrado no tiene ningún movimiento
- **THEN** el sumatorio mostrado es cero

### Requirement: Actualización optimista del sumatorio al borrar
Al borrar un movimiento desde la tabla de movimientos rápidos, el sistema SHALL descontar su importe del sumatorio mostrado de forma inmediata, sin esperar a una recarga del periodo desde el servidor.

#### Scenario: Borrar un movimiento descuenta su importe al instante
- **WHEN** el usuario borra un movimiento desde la tabla de movimientos rápidos y confirma
- **THEN** el sumatorio mostrado se reduce en el importe de ese movimiento inmediatamente, a la vez que la fila desaparece de la tabla

### Requirement: Vista de tarjetas en móvil
En vista móvil, el sistema SHALL mostrar la tabla de movimientos rápidos como un listado de tarjetas, en vez de la tabla con columnas y scroll horizontal, con la misma estructura de tarjeta que ya usa la tabla de gestión en su vista móvil (concepto, fecha e importe en la cabecera de la tarjeta; persona, forma de pago, proveedor/cliente y cuenta en un grid; acciones de editar y borrar al pie).

#### Scenario: Entrar en la página en móvil muestra tarjetas
- **WHEN** el usuario entra en la página de Gastos o de Ingresos desde un dispositivo o ventana en vista móvil
- **THEN** la tabla de movimientos rápidos se muestra como listado de tarjetas en vez de como tabla con scroll horizontal

#### Scenario: Cambiar de filtro de periodo actualiza las tarjetas
- **WHEN** el usuario cambia el filtro de periodo (Hoy, Esta semana, Este mes o un rango personalizado) estando en vista móvil
- **THEN** el listado de tarjetas se actualiza para reflejar únicamente los movimientos del nuevo periodo seleccionado

#### Scenario: Editar o borrar desde una tarjeta
- **WHEN** el usuario pulsa "Editar" o "Eliminar" sobre una tarjeta de la tabla de movimientos rápidos en vista móvil
- **THEN** el sistema realiza la misma acción que hoy realiza desde la fila equivalente de la tabla de escritorio, sobre el mismo registro subyacente

#### Scenario: Periodo sin movimientos en vista móvil
- **WHEN** el periodo filtrado no tiene ningún movimiento y el usuario está en vista móvil
- **THEN** el sistema muestra el mismo mensaje de "sin resultados en este periodo" que ya usa en escritorio, sin ningún botón de alta de movimiento

#### Scenario: El sumatorio del periodo sigue visible en vista móvil
- **WHEN** el usuario consulta la tabla de movimientos rápidos en vista móvil
- **THEN** el total del periodo sigue mostrándose debajo del listado de tarjetas, igual que se muestra debajo de la tabla en escritorio

#### Scenario: La vista de escritorio no cambia
- **WHEN** el usuario consulta la tabla de movimientos rápidos fuera de vista móvil
- **THEN** la tabla se sigue mostrando como tabla con columnas, sin cambios respecto al comportamiento actual
