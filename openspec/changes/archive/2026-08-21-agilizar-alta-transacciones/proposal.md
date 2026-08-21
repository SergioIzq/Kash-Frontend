## Why

Registrar un gasto o ingreso pequeño y cotidiano (p. ej. "comprar el pan") exige rellenar hoy 8 campos en `app-gasto-form-modal` (concepto, importe, fecha, categoría, forma de pago, cuenta, proveedor, persona), navegando primero hasta Gastos/Ingresos desde el sidebar. El concepto ya hereda la categoría al seleccionarlo, pero cuenta y forma de pago se piden siempre desde cero aunque casi nunca cambien para ese concepto. Esta fricción hace que el registro de gastos menores tienda a posponerse o abandonarse, justo el caso de uso más frecuente de una app de finanzas personales.

## What Changes

- **Sugerencias por concepto**: al seleccionar un concepto existente en el formulario de gasto/ingreso, se consulta su combinación más reciente/frecuente (cuenta, forma de pago, importe, proveedor o persona si aplica) y se pre-rellenan esos campos, editables antes de guardar.
- **Alta rápida vía atajo PWA**: nueva ruta ligera (`/gastos/rapido` e `/ingresos/rapido`, o una vista compartida con selector de tipo) con un formulario reducido (concepto + importe como campos principales; el resto ya viene pre-rellenado por la sugerencia anterior) accesible directamente desde un `shortcut` del manifest de la PWA, sin pasar por sidebar → lista → botón "Nuevo".
- **Transacciones habituales**: chips de un toque con las combinaciones completas más usadas (ej. "Pan · 2€ · Efectivo · Panadería"), visibles en las listas de Gastos/Ingresos y en la vista de alta rápida, que abren el formulario pre-rellenado listo para confirmar (solo ajustar importe/fecha si hace falta).
- Alcance: aplica igual a Gastos e Ingresos, reutilizando el mismo patrón de formulario en ambos módulos.

## Capabilities

### New Capabilities
- `sugerencias-transaccion`: cálculo y consumo de la combinación habitual (cuenta/forma de pago/importe/tercero) asociada a un concepto, usada para pre-rellenar formularios de gasto e ingreso.
- `alta-rapida`: ruta y formulario reducido de captura rápida de gasto/ingreso, invocable desde un atajo de la PWA.
- `transacciones-habituales`: superficie de chips de combinaciones frecuentes de gasto/ingreso, con acción de "repetir con un toque".

### Modified Capabilities
(ninguna — no existen specs previas en este repo; `gasto-form-modal` e `ingreso-form-modal` se extienden pero no hay spec existente que capture su comportamiento actual)

## Impact

- **Frontend (`Kash-Frontend`)**: `gasto-form-modal.component.ts`, `ingreso-form-modal.component.ts` (consumo de sugerencias); nuevas rutas/componentes de alta rápida bajo `features/gastos` y `features/ingresos`; `public/manifest.webmanifest` (bloque `shortcuts`); nuevo componente de chips reutilizado en `gastos-list.page.ts` / `ingresos-list.page.ts`.
- **Backend (`Kash-Backend`, repo externo a este openspec)**: requiere un endpoint nuevo que devuelva, para un `conceptoId` (y tipo gasto/ingreso), la combinación más reciente/frecuente de cuenta, forma de pago, importe y tercero — hoy no existe (`GastosController` solo pagina con `searchTerm` de texto; `Concepto` solo guarda `categoriaId`). Este cambio documenta el contrato esperado en `design.md`, pero su implementación queda fuera de este openspec (repo sin OpenSpec configurado); se recomienda una propuesta equivalente en `Kash-Backend` antes o en paralelo a la fase de frontend que la consume.
- Sin cambios de breaking en el modelo `Gasto`/`Ingreso` existentes.
