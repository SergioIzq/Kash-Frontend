## Context

Ver `proposal.md - Why` para la motivación. Puntos de partida verificados en el código actual:

- `gasto-form-modal.component.ts` / `ingreso-form-modal.component.ts` ya auto-crean catálogos al vuelo (`onXxxBlur`) y ya heredan `categoriaId` desde el concepto seleccionado (`onConceptoSelect`). El patrón para "pre-rellenar más campos desde el concepto" es una extensión natural de ese mismo método.
- `Concepto` (modelo y backend) solo persiste `categoriaId`; no hay noción de cuenta/forma de pago/importe habitual en ningún sitio.
- `GastosController`/`IngresosController` (Kash-Backend) solo exponen listado paginado con `searchTerm` de texto; no hay filtro por `conceptoId` ni endpoint de agregación.
- Las rutas de features (`gastos.routes.ts`) son planas y sin guard propio (el guard de auth se aplica más arriba en el árbol de rutas); una ruta nueva `rapido` sigue el mismo patrón.
- `nginx.conf` ya sirve cualquier ruta con fallback a `index.html` (`try_files $uri $uri/ /index.html`), así que una URL profunda como `/gastos/rapido` funciona sin cambios de servidor.
- La PWA ya tiene `manifest.webmanifest` y `ngsw-config.json`; falta el bloque `shortcuts`.
- No existe backend con OpenSpec propio, así que el contrato de API se documenta aquí como dependencia externa, no como spec de este repo.

## Goals / Non-Goals

**Goals:**
- Reducir de 8 a 2 campos obligatorios de media (concepto + importe) para una transacción recurrente típica, sin quitar la posibilidad de ajustar el resto.
- Reutilizar el mismo mecanismo de sugerencia tanto en el modal completo como en la vista de alta rápida y en los chips de "habituales" (una sola fuente de verdad de "combinación habitual por concepto").
- Que el atajo PWA funcione tanto con la app instalada (long-press icono) como abriendo la URL directamente en el navegador (fallback).

**Non-Goals:**
- No se implementa en este cambio el endpoint de backend en `Kash-Backend` (repo sin OpenSpec); solo se especifica el contrato que el frontend espera consumir.
- No se cambia el motor de `ReglaCategorizacion` (import bancario) ni se reutiliza aquí — es un mecanismo de texto libre pensado para extractos, no para selección de concepto ya existente.
- No se añade edición/gestión de las combinaciones "habituales" (fijar manualmente favoritos); se derivan solo de histórico real.

## Decisions

**1. Sugerencia = "último uso", no "más frecuente".**
Al seleccionar un concepto, se pre-rellena con la combinación de *la transacción más reciente* de ese concepto, no con la más frecuente estadísticamente. Es más simple de calcular (`ORDER BY fecha DESC LIMIT 1` filtrando por `usuarioId` + `conceptoId` + tipo), y coincide con la expectativa del usuario ("lo que hice la última vez"), que es más predecible que una moda estadística cuando hay pocos registros por concepto.
*Alternativa descartada*: combinación más frecuente (moda) — más costosa de calcular bien (empates, ventana temporal) y menos predecible para el usuario.

**2. "Habituales" (chips) sí usa frecuencia, con desempate por recencia.**
A diferencia de la sugerencia por concepto (1:1, determinista), los chips muestran un conjunto (top N) pensado para *iniciar* una captura sin haber escrito nada, así que interesa lo más repetido, no solo lo último. Se pide al backend un top-N agrupado por combinación completa (concepto+cuenta+formaPago+proveedor/persona), ordenado por nº de usos y, en empate, por fecha más reciente.

**3. Un único endpoint de sugerencia por tipo, parametrizado por `conceptoId`.**
`GET /api/gastos/sugerencia?conceptoId={id}` y `GET /api/ingresos/sugerencia?conceptoId={id}` (simétrico, cada controller ya existe y ya está separado por tipo). Devuelve `null`/404 si el concepto no tiene histórico (concepto nuevo) — el frontend simplemente no pre-rellena nada en ese caso, igual que hoy.
*Alternativa descartada*: endpoint genérico `/api/transacciones/sugerencia?tipo=gasto|ingreso` — obligaría a introducir un controller/tabla unificada que no existe hoy (gastos e ingresos son entidades y controllers separados en el backend actual); más invasivo que necesario para este cambio.

**4. Los campos pre-rellenados siguen siendo editables y claramente marcados como sugerencia, no como valor fijo.**
Igual que ya existe `newConceptoMessage`/`newCategoriaMessage` como texto informativo bajo el campo, se añade un indicador visual sutil (icono + tooltip, mismo patrón que `reglaAplicada`/`pi-bolt` en `importar-movimientos.page.ts`) en los campos autocompletados por sugerencia, para que el usuario sepa que puede cambiarlos y por qué aparecen ya rellenos.

**5. La sugerencia solo se aplica en alta (modo creación), nunca sobrescribe en edición.**
`loadFormData()` ya distingue `isEditMode()`. La llamada a sugerencia se dispara únicamente desde `onConceptoSelect` cuando `!isEditMode()`, y solo rellena un campo si está vacío en ese momento (no pisa un valor que el usuario ya haya tocado a mano tras seleccionar el concepto).

**6. La vista de "alta rápida" es un componente nuevo y ligero, no una reconfiguración del drawer existente.**
Confirmado con el usuario: formulario reducido propio (concepto + importe visibles; cuenta/forma de pago/categoría precargadas por la sugerencia y colapsadas en un resumen editable "cambiar" en vez de 3 autocompletes abiertos). Comparte los stores existentes (`GastosStore`, `ConceptoStore`, etc.) y el servicio de sugerencia; no comparte plantilla con `gasto-form-modal` para no acoplar un componente ligero a uno que ya es complejo y con mucha lógica de edición.

**7. Ruta y shortcut únicos, con toggle de tipo dentro.**
Una sola ruta `/alta-rapida` (no `/gastos/rapido` + `/ingresos/rapido` separadas) con un selector Gasto/Ingreso dentro (similar al `tipo-pill` ya usado en `importar-movimientos.page.ts`), por defecto en "Gasto" (caso de uso predominante). Un solo shortcut en el manifest es más simple que dos, y evita que el usuario tenga que decidir el tipo *antes* de poder buscar el concepto.

**8. Los chips de "habituales" se muestran en tres sitios con el mismo componente**: cabecera de `gastos-list.page.ts`, cabecera de `ingresos-list.page.ts`, y en la propia vista de alta rápida. Un solo componente presentacional (`transacciones-habituales-chips`) parametrizado por `tipo`, para no triplicar la lógica de "tap en chip → abrir formulario pre-rellenado".

## Risks / Trade-offs

- **[Riesgo] El backend no tiene OpenSpec ni está cubierto por este cambio** → el frontend quedará escrito contra un contrato de API que aún no existe. Mitigación: las tareas de frontend que dependen del endpoint se marcan explícitamente como bloqueadas por el trabajo de backend en `tasks.md`; se recomienda proponer el endpoint en `Kash-Backend` (fuera de este repo) antes de implementar los puntos 1 y 4 del alcance aquí.
- **[Riesgo] Concepto sin histórico (recién creado) no tiene sugerencia** → comportamiento ya cubierto: si el endpoint devuelve vacío, el formulario se comporta exactamente como hoy (campos vacíos, obligatorios).
- **[Riesgo] Confusión si la sugerencia pre-rellena una cuenta/forma de pago ya no válida** (p. ej. cuenta cerrada) → los combos de catálogo ya validan contra el listado vigente vía autocomplete; si el valor sugerido no existe ya en catálogo, se trata igual que un valor "no encontrado" (mismo flujo que `onCuentaBlur` con creación automática), evitando estados inconsistentes.
- **[Trade-off] "Último uso" puede no ser representativo** si el usuario cambió puntualmente de cuenta una vez (p. ej. pagó el pan en efectivo por no llevar tarjeta). Aceptado conscientemente (Decisión 1): es el comportamiento más simple y más fácil de entender/corregir con un solo tap, frente a una heurística de frecuencia que sería más "correcta" pero menos predecible.
- **[Riesgo] Atajo PWA no visible en todas las plataformas** (los `shortcuts` de manifest solo se muestran en Android/desktop con soporte; iOS Safari los ignora en gran medida) → se documenta como degradación aceptable: en plataformas sin soporte, el usuario simplemente no ve el atajo y sigue el flujo normal (sidebar → lista → Nuevo), sin romper nada.

## Migration Plan

No aplica migración de datos: no se modifican modelos existentes (`Gasto`, `Ingreso`, `Concepto`), solo se añaden endpoints de lectura (backend, fuera de este repo) y superficies de UI nuevas (frontend). Despliegue incremental por capacidad:
1. `sugerencias-transaccion` (requiere backend) → 2. `alta-rapida` (consume 1) → 3. `transacciones-habituales` (requiere backend, puede ir en paralelo a 1).
Sin rollback especial: cada capacidad es aditiva y puede desactivarse ocultando la UI correspondiente sin afectar al flujo de alta ya existente.
