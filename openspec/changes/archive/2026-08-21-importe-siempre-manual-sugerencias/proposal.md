## Why

Al seleccionar un concepto ya usado, el sistema pre-rellena hoy el Importe con el de la última transacción registrada para ese concepto (además de cuenta, forma de pago y proveedor/persona). A diferencia de esos otros campos —que suelen ser estables entre transacciones del mismo concepto—, el importe varía de una vez a otra en la mayoría de casos reales (compra de supermercado, gasolina, etc.), así que copiarlo invita a que el usuario guarde sin darse cuenta el importe de la vez anterior en lugar del real. Se quiere que el importe sea el único campo que el usuario deba rellenar siempre a mano, manteniendo la sugerencia automática para el resto.

## What Changes

- En los 3 sitios donde se aplica la sugerencia de concepto (`gasto-form-modal.component.ts`, `ingreso-form-modal.component.ts`, `alta-rapida.page.ts`), se deja de copiar `sugerencia.importe` a `formData.importe`. El resto de campos sugeridos (cuenta, forma de pago, proveedor/cliente, persona) se sigue pre-rellenando exactamente igual que hoy.
- En los dos formularios completos (Gasto, Ingreso), se elimina el indicador visual de "importe sugerido" (icono ⚡ + tooltip) y el signal `sugeridoImporte` que lo controla, ya que tras este cambio nunca volverá a activarse.
- En `alta-rapida.page.ts` se alinea el código con lo que ya indicaban tanto el comentario del propio método (`aplicarSugerencia`, que nunca mencionó "importe" entre los campos pre-rellenados) como el `Purpose` de la spec `alta-rapida` ("concepto e importe son los únicos campos visibles por defecto"): el importe pasa a depender siempre de que el usuario lo escriba.
- La llamada a `getSugerencia()` se mantiene sin cambios en los 3 sitios (sigue haciendo falta para el resto de campos); solo deja de leerse su campo `importe`.

## Capabilities

### New Capabilities
(ninguna)

### Modified Capabilities
- `sugerencias-transaccion`: el Requirement "Pre-rellenado de campos al seleccionar un concepto con histórico" deja de incluir el importe entre los campos que se pre-rellenan automáticamente.
- `alta-rapida`: se aclara que el importe nunca se pre-rellena por sugerencia, alineando la spec con el comportamiento correcto ya implícito en su `Purpose`.

## Impact

- **Frontend (`Kash-Frontend`)**: `gasto-form-modal.component.ts` y `ingreso-form-modal.component.ts` — se elimina el bloque `if (!importe && sugerencia.importe) {...}`, el signal `sugeridoImporte` y el icono/tooltip asociado en el template. `alta-rapida.page.ts` — se elimina la línea equivalente (no tiene indicador visual que quitar, ni afecta a `resumenCompleto()`, que no depende del importe).
- Sin cambios de backend: `getSugerencia()` (Gastos e Ingresos) sigue devolviendo el importe de la última transacción en su respuesta; el frontend simplemente deja de aplicarlo al formulario.
- Sin cambios breaking en la API ni en el contrato HTTP.
