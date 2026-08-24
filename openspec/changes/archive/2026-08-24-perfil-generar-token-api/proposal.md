## Why

Para poder registrar movimientos en Kash desde el Atajo de iPhone (Shortcuts) hace falta un mecanismo de autenticación que no dependa de la cookie de sesión del navegador. El backend ya expone `POST /api/auth/api-token`, que genera un token personal (`kash_pat_...`) e invalida el anterior si existía, pero el frontend no ofrece ninguna forma de generarlo ni de mostrárselo al usuario.

## What Changes

- Nueva card "Accesos API" en la página "Mi perfil", a ancho completo, debajo de las dos cards existentes (Correo e Información Personal).
- Botón "Crear token para Atajo iPhone" que, antes de generar, muestra una confirmación avisando de que invalidará cualquier token anterior.
- Al confirmar, se llama a `POST /api/auth/api-token` y se abre un diálogo con el valor `kash_pat_...` en un campo de solo lectura, un botón "Copiar" (portapapeles) y un aviso de que no se volverá a mostrar.
- Nuevos métodos `generateApiToken()` en `AuthService` y `AuthStore`, siguiendo el mismo patrón que `updateProfile`/`updateAvatar` (wrapper `Result<T>`, `patchState` de loading/error).

## Capabilities

### New Capabilities
- `token-acceso-api`: generación desde "Mi perfil" de un token de acceso personal (`kash_pat_...`) para autenticar integraciones externas (p. ej. el Atajo de iPhone), mostrado una única vez tras generarlo.

### Modified Capabilities
(ninguna — no se modifica el comportamiento de ninguna capability existente)

## Impact

- `src/app/features/auth/pages/my-profile.page.ts`: nueva card, diálogo de resultado, wiring del botón.
- `src/app/core/services/api/auth.service.ts`: nuevo método `generateApiToken()`.
- `src/app/core/stores/auth.store.ts`: nuevo método `generateApiToken()` (loading/error state).
- Backend: `POST /api/auth/api-token` (ya existente según lo descrito por el usuario; fuera del alcance de este repo frontend).
