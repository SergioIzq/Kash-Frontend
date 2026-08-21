## Context

Ver `proposal.md` - Why. `NGX_CRUD_UI_TEXT` es un `InjectionToken` de `@sergioizq/ngx-crud-ui`
(`providedIn: 'root'`, con `DEFAULT_NGX_CRUD_UI_TEXT` en inglés como valor por defecto) que
expone una interfaz `NgxCrudUiText` con 21 campos opcionales - paginación
(`currentPageReportTemplate`, `mobilePageReportTemplate`), cabeceras de columna genéricas
(`titleHeader`, `actionsHeader`), tooltips (`editTooltip`, `deleteTooltip`,
`refreshTooltip`, `helpTooltip`, `closeLabel`), resúmenes de toast (`successSummary`,
`errorSummary`, `warningSummary`, `infoSummary`), diálogo de confirmación genérico
(`confirmHeader`, `confirmAcceptLabel`, `confirmRejectLabel`), mensajes de error de fallback
(`unknownErrorMessage`, `unexpectedErrorMessage`) y los del flujo de listado
(`refreshedMessage`, `refreshedSummary`, `saveErrorFallback`, `deleteConfirmMessage` con
placeholder `{label}`, `deleteConfirmHeader`, `deleteConfirmAcceptLabel`). `src/app.config.ts`
ya centraliza la configuración global equivalente (`LOCALE_ID: 'es-ES'`, `MessageService`,
`ConfirmationService`), así que es el sitio natural para añadir este provider.

## Goals / Non-Goals

**Goals:**
- Un único provider en `app.config.ts` que cubra los 21 campos con texto en español,
  consistente con el resto de la app (mismo tono que usan ya los `CrudListConfig` de cada
  pantalla, p. ej. "¿Seguro que quieres eliminar...?").

**Non-Goals:**
- Tocar `titleHeader`/`actionsHeader`/`editTooltip`/`deleteTooltip`/`refreshTooltip` pantalla
  por pantalla: si alguna pantalla concreta ya sobreescribe estos `@Input()`/`input()` con un
  valor propio, ese valor sigue ganando (comportamiento ya garantizado por la librería) y no
  hace falta tocarlo aquí.
- Cambiar el copy de los `CrudListConfig` por pantalla (mensajes de "creado"/"actualizado"/
  "eliminado" con éxito, títulos de columna específicos) - esos ya están en español y son
  independientes de este token.

## Decisions

### Redactar los 21 valores en español directamente en `app.config.ts`, no en un fichero aparte
Se define el objeto de textos inline en el `useValue` del provider, junto a `LOCALE_ID`.

**Por qué:** es un objeto de configuración estática, del mismo tamaño y naturaleza que las
opciones de tema de `providePrimeNG` que ya viven en ese archivo; no hay reutilización posible
fuera de este único punto de arranque de la app.

### Mantener los placeholders `{first}`/`{last}`/`{totalRecords}`/`{label}` tal cual
`currentPageReportTemplate`/`mobilePageReportTemplate` usan placeholders `{first}`, `{last}`,
`{totalRecords}` (los interpola PrimeNG); `deleteConfirmMessage` usa `{label}` (lo interpola la
propia librería vía `.replace('{label}', ...)`). Se traduce solo el texto alrededor de esos
placeholders, no su nombre ni su formato.

## Risks / Trade-offs

- **[Riesgo] Que la librería añada un campo nuevo a `NgxCrudUiText` en una futura versión y
  Kash-Frontend no lo traduzca** → Mitigación: al ser todos los campos opcionales, un campo no
  cubierto cae automáticamente al default en inglés de la librería (no rompe nada), simplemente
  queda pendiente de traducir cuando se detecte.
