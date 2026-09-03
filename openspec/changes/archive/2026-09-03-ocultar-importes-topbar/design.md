## Context

Ver `proposal.md` - Why. Puntos de partida verificados en el código:

- `LayoutService` (`src/app/layout/service/layout.service.ts`) guarda un único objeto `layoutConfig` en `localStorage` bajo la clave `ahorroland_layout_config`, con un `effect()` (líneas 91-97) que persiste automáticamente cualquier cambio de la signal `layoutConfig`. El tema oscuro (`darkTheme`) ya sigue este patrón.
- El topbar (`src/app/layout/component/app.topbar.ts:73-75`) ya tiene un botón toggle equivalente (`toggleDarkMode()`), con icono condicional vía `[ngClass]`.
- No existe ningún pipe custom en el proyecto (`find **/*.pipe.ts` no devuelve resultados) ni ninguna carpeta `shared/pipes`.
- El formateo de importes está disperso: la mayoría usa `{{ valor | number:'1.2-2' }} €` en plantillas, pero tres componentes del dashboard (`ingresos-chart`, `gastos-chart`, `resumen-financiero`) generan el texto de importes/porcentajes dentro de callbacks de Chart.js (`tooltip.callbacks.label`, `scales.y.ticks.callback`), como propiedades de clase planas (no `computed()`), mientras que `chartData` en esos mismos componentes SÍ es un `computed()` ya vinculado en la plantilla como `chartData()`.

## Goals / Non-Goals

**Goals:**
- Un único punto de verdad (`LayoutService`) para el estado "importes ocultos", persistido igual que el resto de `layoutConfig`.
- Un pipe reutilizable que cubra los ~13 archivos con formateo de importes en plantilla sin duplicar lógica de enmascarado.
- Que los 3 gráficos de Chart.js del dashboard reaccionen al toggle sin necesidad de interactuar con el gráfico (hover) para que se refresque.

**Non-Goals:**
- No se rediseña el `LayoutService` ni se introduce un store de ngrx/signals nuevo: el flag es un booleano más en `layoutConfig`.
- No se cubre el PDF de `reportes.page.ts` (formateado en backend) ni los inputs de edición de importe (`money-input.component.ts`, `calculadora-importe`).
- No se cambia el formato de importes visibles (sigue siendo `number:'1.2-2'` + símbolo); solo se añade la rama "oculto".

## Decisions

### 1. El flag vive en `layoutConfig`, no en un servicio nuevo
Se añade `hideAmounts?: boolean` a la interfaz `layoutConfig` (línea 4-10) y a `getDefaultConfig()` (línea 135-143, default `false`). Se expone un `computed()` `isAmountsHidden = computed(() => this.layoutConfig().hideAmounts)` (junto a `isDarkTheme`, línea 65) y un método `toggleAmountsVisibility()` que hace `this.layoutConfig.update(cfg => ({ ...cfg, hideAmounts: !cfg.hideAmounts }))` (mismo estilo que el resto de mutaciones de `layoutConfig`).

**Alternativa descartada**: crear un `AmountVisibilityService` independiente. Se descarta porque el usuario decidió explícitamente reutilizar `LayoutService`, y porque no aporta nada que `layoutConfig` no resuelva ya (persistencia, reactividad) para un único booleano.

### 2. Pipe `HideAmountPipe` con parámetro de tipo y símbolo opcional
Nuevo pipe standalone `src/app/shared/pipes/hide-amount.pipe.ts`, `pure: true` (comportamiento por defecto), que:
- Recibe el valor numérico, un parámetro `'currency' | 'percent'` y un tercer parámetro opcional `symbol` (solo aplica a `'currency'`).
- Inyecta `LayoutService` y lee `isAmountsHidden()`.
- Si `isAmountsHidden()` es `true`, devuelve `'**** ' + symbol` (para `'currency'`, `symbol` por defecto `'€'` si no se indica) o `'**** %'` (para `'percent'`, símbolo fijo), sin formatear el número.
- Si es `false`, delega en `DecimalPipe` (`transform(valor, '1.2-2')`) y añade el símbolo correspondiente (`symbol` o `'€'`/`'%'`), replicando exactamente el formato actual (`{{ valor | number:'1.2-2' }} €`).

El parámetro `symbol` existe porque `inversion-form-modal.component.ts:235` muestra un "Valor total invertido" con moneda dinámica (`formData().moneda`, no siempre €) en vez del € fijo del resto de la app; el usuario decidió explícitamente incluir ese campo en el alcance del toggle pese a ser parte de un formulario activo. Uso: `{{ valor | hideAmount:'currency':formData().moneda }}`.

Un cuarto parámetro opcional `digitsInfo` (por defecto `'1.2-2'`) permite preservar el formato exacto de cada sitio: no todos los importes de la app usan `1.2-2` (por ejemplo, varios valores de `dashboard.page.ts` usan `1.0-0`, sin decimales), y forzar siempre `1.2-2` habría cambiado el formato visible existente en esos casos. Uso: `{{ valor | hideAmount:'currency':undefined:'1.0-0' }}`.

Un pipe `pure` en Angular se re-evalúa cuando cambia cualquiera de sus argumentos de entrada (el `valor` o el parámetro de tipo), pero **no** cuando cambia una signal leída dentro de `transform` que no es un argumento. Para que el pipe reaccione al toggle sin recargar la página, `isAmountsHidden` debe leerse como signal dentro de `transform()` en cada ciclo de detección de cambios: como los componentes que lo usan son `OnPush` y ya se re-renderizan por otras signals del propio componente, y el toggle en el topbar afecta a un servicio `providedIn: 'root'` compartido, se documenta como riesgo (ver más abajo) en vez de asumir que funciona sin probarlo.

**Alternativa descartada**: componente wrapper `<app-amount [value]="x" tipo="currency">`. Se descarta porque exige tocar la plantilla en cada uno de los ~13 sitios de forma más invasiva que cambiar el nombre del pipe, y el usuario ya decidió explícitamente "pipe custom".

### 3. Gráficos Chart.js: convertir `chartOptions` de objeto plano a `computed()`
En `ingresos-chart.component.ts`, `gastos-chart.component.ts` y `resumen-financiero.component.ts`, `chartOptions` es hoy una propiedad de clase con objeto literal fijo, vinculada en la plantilla como `[options]="chartOptions"` (sin paréntesis). Los callbacks (`tooltip.callbacks.label`, `scales.y.ticks.callback`) generan el texto de importe manualmente (`${value.toFixed(2)}€`, `Intl.NumberFormat`), no vía el pipe de Angular.

Decisión: convertir `chartOptions` en `chartOptions = computed(() => ({ ...mismo objeto... }))`, inyectando `LayoutService` y leyendo `isAmountsHidden()` al inicio del `computed`, para que los callbacks devuelvan `'**** €'` / `'**** %'` cuando esté activo. Actualizar la plantilla a `[options]="chartOptions()"`. Esto sigue el mismo patrón que `chartData`, que ya es un `computed()` invocado en plantilla en los tres componentes, y garantiza que Angular emita una nueva referencia de objeto (y por tanto PrimeNG/Chart.js repinte) en cuanto cambie `isAmountsHidden()`, sin depender de un hover del usuario sobre el gráfico.

**Alternativa descartada**: dejar `chartOptions` como objeto plano y solo comprobar la signal dentro de los callbacks. Se descarta porque un callback de Chart.js solo se re-ejecuta cuando Chart.js repinta (por interacción o por `chart.update()`); si ninguna propiedad `[options]`/`[data]` cambia de referencia, PrimeNG no fuerza el repintado, y el toggle no se reflejaría hasta la siguiente interacción con el gráfico.

## Risks / Trade-offs

- **[Riesgo] Reactividad del pipe en componentes `OnPush`**: si un componente que usa `hideAmount` no tiene ninguna otra signal que cambie al hacer toggle, Angular podría no re-ejecutar el pipe puro inmediatamente. → **Mitigación**: verificar en la implementación (tarea de QA manual) que el toggle se refleja sin recargar en al menos un listado simple; si no se refleja, marcar el pipe como `pure: false` o exponer el valor de `isAmountsHidden()` como input adicional que fuerce la re-evaluación.
- **[Riesgo] Callbacks de Chart.js con lógica adicional (porcentajes calculados, totales)**: en `gastos-chart.component.ts` el callback del tooltip calcula un porcentaje a partir de varios valores (líneas 130-143); hay que ocultar tanto el importe como el porcentaje calculado, no solo sustituir un valor. → **Mitigación**: cubrir explícitamente en tasks.md la revisión línea a línea de cada callback, no solo un reemplazo mecánico.
- **[Riesgo] Deriva entre pipe y callbacks**: al no existir un único punto de formateo, el criterio de "qué es importe" y "qué es porcentaje" queda duplicado entre el pipe y los tres componentes de gráficos. → **Mitigación**: mantener el mismo texto de máscara (`**** €` / `**** %`) hardcodeado en ambos sitios y documentarlo en el pipe para que cualquier cambio futuro se replique manualmente en los tres `chartOptions`.

## Migration Plan

No aplica migración de datos. Es una feature aditiva: usuarios sin preferencia guardada ven el comportamiento actual (importes visibles) por defecto, gracias a `hideAmounts: false` en `getDefaultConfig()`.
