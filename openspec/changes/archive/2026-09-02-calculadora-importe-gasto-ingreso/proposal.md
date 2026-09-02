## Why

Al registrar un gasto o un ingreso, el importe a menudo es el resultado de una suma o resta mental (varios tickets, un reparto entre personas, un descuento aplicado) que hoy el usuario tiene que calcular fuera de la app antes de escribir el número final en el campo Importe. Añadir una calculadora accesible desde el propio input evita ese salto de contexto.

## What Changes

- Añadir un botón (icono `pi-calculator`) al final del input de Importe, como `p-inputgroup-addon`, en los formularios de creación/modificación de Gasto (`gasto-form-modal.component.ts`) e Ingreso (`ingreso-form-modal.component.ts`).
- El botón abre un `p-popover` anclado a sí mismo con una calculadora básica: dígitos 0-9, coma decimal, operadores suma/resta/multiplicación/división, y operaciones encadenadas evaluadas secuencialmente (estilo calculadora de bolsillo, sin precedencia de operadores).
- La calculadora arranca siempre en cero al abrirse, independientemente del valor que ya tuviera el input de Importe.
- Un botón "Usar este valor" dentro del popover aplica el resultado calculado al campo Importe (a través del mismo `onImporteChange()` ya existente en cada modal) y cierra el popover. Cerrar el popover sin pulsar ese botón no modifica el importe.

## Capabilities

### New Capabilities
- `calculadora-importe`: calculadora accesible desde el input de Importe en los formularios de Gasto e Ingreso, con operaciones encadenadas y aplicación explícita del resultado al formulario.

### Modified Capabilities
(ninguna: no se modifica el comportamiento de capacidades existentes, solo se añade una nueva vía de entrada de datos al mismo campo)

## Impact

- `src/app/features/gastos/components/gasto-form-modal.component.ts`: envolver `app-money-input` en `p-inputgroup`, añadir el botón/addon y el popover de calculadora.
- `src/app/features/ingresos/components/ingreso-form-modal.component.ts`: mismo cambio, en paralelo.
- Nuevo componente compartido de calculadora en `src/app/shared/components/` (reutilizado por ambos modales).
- Primer uso en el proyecto de `InputGroupModule`/`InputGroupAddonModule` y `PopoverModule` de PrimeNG (ya disponibles en la versión instalada, 21.1.9, sin cambios de dependencias).
- No afecta a `gastos-programados`, `ingresos-programados`, `traspasos`, `traspasos-programados`, `cuentas` ni `alta-rapida`, aunque estos reutilizan el mismo `app-money-input`: quedan fuera del alcance de este cambio.
