## Context

Ver `proposal.md - Why` para la motivación. Puntos de partida verificados en este repo:

- Los 3 sitios que aplican la sugerencia de concepto (`gasto-form-modal.component.ts:548-551`, `ingreso-form-modal.component.ts:548-551`, `alta-rapida.page.ts:619`) tienen la misma forma: `if (!formData.importe && sugerencia.importe) { formData.importe = sugerencia.importe; ... }`.
- En los dos formularios completos (Gasto, Ingreso), ese bloque además activa un signal `sugeridoImporte` (declarado en la línea 427 de cada componente) que controla un icono ⚡ + tooltip "Importe sugerido a partir del último uso de este concepto" junto a la etiqueta del campo (línea 110). Ese signal se resetea a `false` en dos sitios más (al reiniciar el formulario y en `onImporteChange`) — 5 usos en total por componente, todos parte del mismo ciclo de vida de "importe sugerido".
- En `alta-rapida.page.ts` no existe un signal ni icono equivalente para el importe — el propio comentario del método `aplicarSugerencia` (línea 606) nunca mencionó el importe entre los campos pre-rellenados, aunque el código sí lo hacía (inconsistencia ya señalada en `proposal.md`).
- `resumenCompleto()` en `alta-rapida.page.ts` (línea 406) solo depende de `selectedCategoria`/`selectedCuenta`/`selectedFormaPago` — no del importe, que ya es un campo siempre visible fuera del resumen colapsable. Quitar su pre-relleno no interactúa con esa lógica.

## Goals / Non-Goals

**Goals:**
- El importe deja de pre-rellenarse por sugerencia en los 3 sitios; el resto de campos sugeridos no cambia.
- Eliminar el código que queda muerto tras el cambio (signal `sugeridoImporte` + icono/tooltip en los 2 formularios completos), en vez de dejarlo sin uso.

**Non-Goals:**
- No se cambia la llamada a `getSugerencia()` ni su contrato con el backend — sigue devolviendo `importe`, el frontend simplemente deja de leerlo.
- No se añade ningún indicador nuevo (p. ej. "el importe la última vez fue X€") como sustituto informativo — fuera de alcance de esta propuesta; el campo simplemente queda vacío como cualquier campo obligatorio sin sugerencia.
- No se toca `resumenCompleto()` ni la lógica de expansión del resumen en `alta-rapida` — no dependen del importe.
- No se toca el comportamiento en modo edición (ya no se aplica ninguna sugerencia ahí, ver spec `sugerencias-transaccion`).

## Decisions

**1. Se elimina únicamente la asignación de `importe`, no la llamada a `getSugerencia()`.**
Los 3 sitios siguen pidiendo la sugerencia completa (sigue haciendo falta para cuenta/forma de pago/tercero/persona); solo se deja de leer su campo `importe` de la respuesta.
*Alternativa descartada*: que el backend dejara de incluir `importe` en la respuesta de `GetSugerencia` — innecesario y potencialmente rompería otros consumidores futuros de ese endpoint; el campo no hace daño si el frontend simplemente no lo usa.

**2. En los formularios completos, se elimina el signal `sugeridoImporte` y su icono/tooltip por completo, no se dejan "por si acaso".**
Tras quitar la única línea que lo pone a `true`, el signal nunca volvería a activarse — dejarlo sería código muerto. Se eliminan sus 5 usos (declaración, la asignación a `true` que desaparece, y los 2 resets a `false` que ya no tienen nada que resetear) y el `@if` del icono en el template.
*Alternativa descartada*: dejar el signal y el icono por si se reintroduce la funcionalidad más adelante — no se sigue ese criterio en el resto del código de Kash (se elimina lo que queda sin uso; reintroducirlo sería trivial si hiciera falta).

**3. En `alta-rapida.page.ts`, cambio de una sola línea, sin tocar `resumenCompleto()`/`expandido`.**
Ya confirmado que ninguno de los dos depende del importe.

## Risks / Trade-offs

- **[Riesgo] Ninguno significativo.** Es una eliminación de comportamiento acotada a 3 sitios ya identificados, sin cambios de contrato HTTP ni de otros campos sugeridos. El único efecto visible es que el usuario deja de ver un importe pre-rellenado (y su icono ⚡) al elegir un concepto con histórico, y debe escribirlo siempre — que es exactamente el comportamiento pedido.
