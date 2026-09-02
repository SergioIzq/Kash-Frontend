# calculadora-importe Specification

## Purpose

Permitir calcular el importe de un gasto o un ingreso sin salir del formulario, mediante una calculadora accesible desde el propio campo Importe, cuyo resultado se puede volcar al formulario de forma explícita.

## Requirements

### Requirement: Acceso a la calculadora desde el campo Importe
En los formularios de creación/modificación de Gasto y de Ingreso, el sistema SHALL mostrar un botón junto al campo Importe que, al pulsarse, SHALL abrir una calculadora superpuesta anclada a ese botón.

#### Scenario: Abrir la calculadora
- **WHEN** el usuario pulsa el botón de calculadora junto al campo Importe (en el alta o edición de un gasto o de un ingreso)
- **THEN** el sistema muestra la calculadora anclada al botón, con la pantalla de cálculo a cero, sin alterar el valor que ya hubiera en el campo Importe

### Requirement: Operaciones aritméticas encadenadas
La calculadora SHALL soportar suma, resta, multiplicación y división sobre números con decimales, y SHALL permitir encadenar varias operaciones evaluando cada una según se introduce el siguiente operador (evaluación secuencial de izquierda a derecha, sin precedencia entre operadores), igual que una calculadora de bolsillo convencional.

#### Scenario: Operación simple
- **WHEN** el usuario introduce `12`, pulsa `+`, introduce `8` y pulsa `=`
- **THEN** la calculadora muestra `20` como resultado

#### Scenario: Operaciones encadenadas sin precedencia
- **WHEN** el usuario introduce `100`, pulsa `+`, introduce `50`, pulsa `-`, introduce `20`, pulsa `×`, introduce `2` y pulsa `=`
- **THEN** la calculadora evalúa secuencialmente de izquierda a derecha (`(((100 + 50) - 20) × 2)`) y muestra `260` como resultado, sin aplicar la precedencia matemática habitual de la multiplicación sobre la suma/resta

#### Scenario: División
- **WHEN** el usuario introduce `9`, pulsa `÷`, introduce `2` y pulsa `=`
- **THEN** la calculadora muestra `4,5` como resultado

#### Scenario: Confirmación visual del operador pulsado
- **WHEN** el usuario pulsa un operador (`+`, `-`, `×` o `÷`)
- **THEN** la calculadora muestra de forma visible qué operador ha quedado pendiente (junto a la pantalla y resaltando la tecla correspondiente), para que el usuario no tenga que asumir que la pulsación se ha registrado antes de introducir el siguiente número

### Requirement: Aplicación explícita del resultado al importe
El resultado calculado SHALL NOT modificar el campo Importe del formulario hasta que el usuario lo confirme explícitamente. Al confirmarlo, el sistema SHALL copiar el resultado actual de la calculadora al campo Importe y SHALL cerrar la calculadora. Si el usuario cierra la calculadora sin confirmar, el campo Importe SHALL permanecer sin cambios.

#### Scenario: Confirmar el resultado
- **WHEN** el usuario ha calculado un resultado en la calculadora y pulsa el botón de confirmación ("Usar este valor")
- **THEN** el campo Importe del formulario pasa a tener ese resultado y la calculadora se cierra

#### Scenario: Cerrar sin confirmar
- **WHEN** el usuario abre la calculadora, realiza algún cálculo y cierra la calculadora (p. ej. haciendo clic fuera) sin pulsar "Usar este valor"
- **THEN** el campo Importe conserva el valor que tenía antes de abrir la calculadora
