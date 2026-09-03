## ADDED Requirements

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
