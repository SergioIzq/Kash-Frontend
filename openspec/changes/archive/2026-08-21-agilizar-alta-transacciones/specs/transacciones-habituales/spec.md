## Purpose

Mostrar al usuario, como accesos de un solo toque, las combinaciones completas de gasto/ingreso que registra con más frecuencia, para poder repetir una transacción habitual (p. ej. "Pan · 2€ · Efectivo · Panadería") sin tener que volver a seleccionar cada campo manualmente.

## ADDED Requirements

### Requirement: Listado de combinaciones habituales por tipo
El sistema SHALL calcular y mostrar, para gastos e ingresos por separado, un conjunto de las combinaciones completas (concepto, categoría, cuenta, forma de pago y tercero si aplica) más frecuentemente registradas por el usuario, ordenadas por número de usos y, en caso de empate, por fecha de uso más reciente.

#### Scenario: Usuario con histórico suficiente
- **WHEN** el usuario tiene varias transacciones repetidas con la misma combinación de concepto/categoría/cuenta/forma de pago
- **THEN** el sistema muestra esa combinación como un chip de transacción habitual, junto con las siguientes combinaciones más repetidas

#### Scenario: Usuario sin histórico repetido
- **WHEN** el usuario no tiene ninguna combinación de campos que se repita en su histórico
- **THEN** el sistema no muestra chips de transacciones habituales, sin bloquear el resto de la pantalla

### Requirement: Repetir una transacción habitual con un toque
Al seleccionar un chip de transacción habitual, el sistema SHALL abrir el formulario de alta correspondiente (gasto o ingreso) con todos los campos de esa combinación ya rellenados, dejando el importe y la fecha como los únicos valores que el usuario normalmente necesita confirmar o ajustar antes de guardar.

#### Scenario: Repetir un gasto habitual
- **WHEN** el usuario pulsa un chip de gasto habitual (ej. "Pan · Efectivo · Panadería")
- **THEN** el sistema abre el formulario de alta de gasto con concepto, categoría, cuenta, forma de pago y proveedor ya rellenados con los valores de esa combinación, con el importe pre-rellenado al último valor usado pero editable, y la fecha por defecto en el día actual

### Requirement: Visibilidad de las transacciones habituales
El sistema SHALL mostrar los chips de transacciones habituales tanto en las pantallas de listado de Gastos e Ingresos como en la vista de alta rápida, usando en los tres sitios el mismo conjunto de combinaciones calculado para ese tipo de transacción.

#### Scenario: Coherencia entre pantallas
- **WHEN** una combinación de gasto aparece como habitual en la pantalla de listado de Gastos
- **THEN** esa misma combinación aparece también como opción en la vista de alta rápida cuando el tipo seleccionado es "Gasto"
