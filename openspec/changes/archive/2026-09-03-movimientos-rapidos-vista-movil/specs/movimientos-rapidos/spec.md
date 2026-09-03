## ADDED Requirements

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
