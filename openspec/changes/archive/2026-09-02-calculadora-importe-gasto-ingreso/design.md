## Context

`gasto-form-modal.component.ts` e `ingreso-form-modal.component.ts` tienen hoy un campo Importe idéntico: un `<app-money-input>` suelto (no envuelto en `p-inputgroup`), un `ControlValueAccessor` propio (no PrimeNG) que expone `number | null` vía `[ngModel]`/`(ngModelChange)`, con `onImporteChange(value)` ya escrito en ambos modales para volcar el valor a `formData.importe`. Ver proposal.md - Why / What Changes.

El proyecto no usa hoy `p-inputgroup`, `p-inputgroup-addon` ni `p-popover` (PrimeNG 21.1.9 los incluye, sin cambio de dependencias). Sí existe un patrón establecido de "utilidad de estado en una clase TS plana consumida por el componente" (`catalogo-scroll.util.ts` + `CargadorCatalogoScroll`), usado en ambos modales para el scroll perezoso de catálogos.

## Goals / Non-Goals

**Goals:**
- Un único componente compartido que encapsule botón + popover + calculadora, para que ambos modales lo integren con un solo elemento en el template.
- Motor de cálculo aislado de la UI, testeable de forma independiente.
- Layout del botón coherente con `p-inputgroup` sin romper el `app-money-input` existente.

**Non-Goals:**
- No incluye memoria (M+/M-), porcentaje, ni funciones científicas.
- No incluye historial de cálculos ni entrada por teclado físico (solo botones en pantalla); se puede añadir después sin tocar specs.
- No toca `gastos-programados`, `ingresos-programados`, `traspasos`, `traspasos-programados`, `cuentas` ni `alta-rapida` (ver proposal.md - Impact).

## Decisions

**Un solo componente compartido `app-calculadora-importe`, no una plantilla duplicada por modal.**
El componente encapsula el botón (`pi-calculator`) *y* el `p-popover` *y* la calculadora, y expone un único `(valorConfirmado)="onImporteChange($event)"`. Cada modal solo añade:
```html
<div class="p-inputgroup">
  <app-money-input ... />
  <app-calculadora-importe (valorConfirmado)="onImporteChange($event)" />
</div>
```
Alternativa descartada: dejar el `p-popover` y el botón sueltos en cada modal (como se hace con `app-cerrar-teclado-boton` para el header de un autocomplete). Se descarta porque aquí sí hay estado no trivial (motor de cálculo) que solo tiene sentido si vive dentro de un único componente reutilizado, no repetido en dos sitios.

**El `p-popover` usa `[appendTo]="'body'`.**
Así el overlay se renderiza fuera del flujo del `p-inputgroup` (que es un contenedor flex) y no interfiere en su layout; y fuera también del `p-drawer` que envuelve todo el formulario, evitando problemas de recorte (`overflow`) o de apilamiento con el propio drawer. Riesgo asociado en la sección siguiente.

**El host del nuevo componente usa `display: contents`.**
Para que el `<button>` real quede como hijo directo del flex de `.p-inputgroup` (igual problema que ya tiene `app-money-input`, que necesitará `flex: 1 1 auto` en su host al pasar a vivir dentro de un `p-inputgroup`; ambos ajustes de CSS se hacen en el mismo cambio).

**Motor de cálculo como clase TS plana (`calculadora-importe.util.ts`), no como estado disperso en el componente.**
Sigue el patrón ya usado por `CargadorCatalogoScroll`: una clase con estado interno (`display`, `valorAnterior`, `operadorPendiente`, flag de sobrescritura) y métodos `introducirDigito`, `introducirOperador`, `calcular`, `limpiar`, que el componente de UI simplemente invoca. Permite testear la lógica de encadenamiento sin montar el componente.

**Evaluación secuencial sin precedencia de operadores.**
Confirmado explícitamente por el usuario durante la exploración: cada operador pulsado resuelve inmediatamente la operación pendiente contra el valor anterior (estilo calculadora de bolsillo / calculadora básica de móvil), no una calculadora científica con precedencia `×`/`÷` sobre `+`/`-`.

**Redondeo a 2 decimales solo al confirmar ("Usar este valor"), no durante el cálculo.**
Coherente con el redondeo que ya aplica `app-money-input.onBlur()` (`Math.round(value * 100) / 100`). Durante el cálculo se mantiene la precisión nativa de JS para no acumular error en operaciones encadenadas.

**División por cero → estado de error visible, requiere "C" para continuar.**
No se puede completar `calcular()`; el motor expone un estado `error` que la UI muestra en la pantalla (p.ej. "Error") y bloquea nuevas operaciones hasta pulsar "C".

## Risks / Trade-offs

- [Primer uso de `p-popover` en el proyecto → comportamiento de apilamiento/z-index desconocido dentro de un `p-drawer` modal] → Verificar manualmente en navegador tras implementar (abrir el drawer de Gasto, abrir la calculadora, comprobar que queda por encima y no se recorta); si `appendTo="body"` no basta, ajustar `baseZIndex` del popover.
- [Evaluación sin precedencia puede sorprender a quien espere una calculadora científica] → Ya es una decisión explícita del usuario, coherente con el patrón de calculadora básica más común (calculadora por defecto de móvil); no se mitiga, se documenta en el spec.
- [Redondeo solo al confirmar puede producir un resultado en pantalla con más de 2 decimales durante el cálculo (p. ej. una división)] → Aceptado: la calculadora muestra el valor real del cálculo; el redondeo a céntimos ocurre igual que hoy ocurre en `app-money-input` al perder el foco, sin sorpresas nuevas respecto al campo Importe actual.
