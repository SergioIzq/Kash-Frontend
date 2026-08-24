## Context

`AuthService` (`src/app/core/services/api/auth.service.ts`) ya centraliza las llamadas a `${environment.apiUrl}/auth/...` envueltas en `Result<T>` (`res.value`), y `AuthStore` (`src/app/core/stores/auth.store.ts`) envuelve esas llamadas con `patchState` de `loading`/`error`, siguiendo el mismo patrón que `updateProfile`/`updateAvatar`. `MyProfilePage` (`src/app/features/auth/pages/my-profile.page.ts`) extiende `BasePageComponent` de `@sergioizq/ngx-crud-ui`, que ya da `confirmAction()` (ConfirmDialog) y `showSuccess`/`showError` (toasts).

No existe hoy en el repo ningún componente que copie al portapapeles ni ningún flujo de "mostrar un secreto una vez". Ver proposal.md para la motivación completa.

## Goals / Non-Goals

**Goals:**
- Generar el token reutilizando el patrón `AuthService → AuthStore → página` ya establecido, sin introducir un store o servicio nuevo.
- Mostrar el token una sola vez, sin persistirlo en el estado de la app (ni en `AuthStore`, ni en `localStorage`) más allá de lo necesario para pintarlo en el diálogo abierto.

**Non-Goals:**
- No se implementa un listado de tokens existentes ni su revocación individual (el backend solo expone generar, que invalida el anterior).
- No se modifica el modelo `Usuario` ni se añade ningún indicador de "tiene token" — el frontend no puede saberlo hoy y no es necesario para el flujo (el botón siempre está disponible).
- No se toca el interceptor HTTP ni el mecanismo de autenticación por cookie existente; el uso del token en el propio Atajo de iPhone (cabecera `Authorization`) es responsabilidad del backend/Atajo, fuera de este repo.

## Decisions

**Ubicación en la UI**: nueva card "Accesos API" a ancho completo, debajo del grid de dos columnas existente en `my-profile.page.ts`. Se descarta integrarla dentro de la card de "Correo Electrónico" para no mezclar datos de cuenta con gestión de credenciales de integración.

**Confirmación previa**: se usa `confirmAction()` de `BasePageComponent` (ya usado en otros flujos destructivos/irreversibles de la app) con un mensaje explícito de que se invalidará cualquier token anterior, en vez de generar directamente y avisar solo después. Motivo: invalidar un token en uso (p. ej. el Atajo de iPhone configurado) es una acción con efecto real fuera de la app; conviene que el usuario lo confirme antes, no después.

**Servicio/Store**: `AuthService.generateApiToken(): Observable<string>` hace `POST ${apiUrl}/auth/api-token` sin body, sigue el mismo `pipe(map(res => res.value))` que `uploadAvatar`. `AuthStore.generateApiToken(): Promise<string>` envuelve la llamada con `patchState(loading/error)` igual que `updateAvatar`, y devuelve el valor del token a la página en vez de guardarlo en el estado del store (a diferencia de `user`, el token no es un dato de sesión que otras partes de la app necesiten leer).

**Diálogo de resultado**: componente `p-dialog` inline en `my-profile.page.ts` (no un componente standalone aparte, dado que no se reutiliza en ningún otro sitio), con:
- input `readonly` mostrando el valor completo del token
- botón "Copiar" usando `navigator.clipboard.writeText`
- texto de aviso: "Este token no se volverá a mostrar. Guárdalo en un lugar seguro."
- el valor del token vive en un signal local de la página (no en `AuthStore`), y se limpia al cerrar el diálogo.

**Manejo de errores**: reutiliza `showError()` de `BasePageComponent`, igual que `onUploadAvatar`. Si `navigator.clipboard` no está disponible (contexto no seguro / navegador antiguo), el botón "Copiar" queda pero se captura el rechazo de la promesa y se muestra un error en vez de fallar silenciosamente; el usuario siempre puede seleccionar y copiar el texto manualmente del input.

## Risks / Trade-offs

- [El botón de generar siempre está disponible, sin indicar si ya existe un token activo] → Aceptado: el backend no expone esa información hoy; añadirla requeriría un cambio de API fuera de alcance de este change.
- [Cerrar el diálogo sin haber copiado el token obliga a regenerarlo (e invalidar el anterior) para recuperarlo] → Mitigado con el aviso explícito "no se volverá a mostrar" y el botón de copiar siempre visible mientras el diálogo está abierto.
- [`navigator.clipboard.writeText` requiere contexto seguro (HTTPS o localhost)] → La app ya se sirve así en producción; se cubre el caso de fallo con el input de solo lectura como respaldo manual.
