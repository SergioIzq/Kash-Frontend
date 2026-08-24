## 1. Servicio y store

- [x] 1.1 Añadir `generateApiToken(): Observable<string>` en `AuthService` (`POST ${apiUrl}/auth/api-token`, `pipe(map(res => res.value))`) y verificar que compila junto al resto de métodos del servicio
- [x] 1.2 Añadir `generateApiToken(): Promise<string>` en `AuthStore`, con `patchState` de `loading`/`error` igual que `updateAvatar`, devolviendo el valor del token sin guardarlo en el estado del store

## 2. UI en "Mi perfil"

- [x] 2.1 Añadir card "Accesos API" a ancho completo en `my-profile.page.ts`, debajo del grid de dos columnas existente, con el botón "Crear token para Atajo iPhone"
- [x] 2.2 Conectar el botón a `confirmAction()` con mensaje de aviso de invalidación del token anterior; verificar que cancelar el diálogo no dispara ninguna llamada al store
- [x] 2.3 Al confirmar, llamar a `authStore.generateApiToken()`, guardar el valor devuelto en un signal local de la página y abrir un `p-dialog` que lo muestre en un input de solo lectura junto al aviso "no se volverá a mostrar"
- [x] 2.4 Añadir botón "Copiar" en el diálogo usando `navigator.clipboard.writeText`, con manejo del caso de fallo (mostrar error sin romper el diálogo)
- [x] 2.5 Limpiar el signal del token al cerrar el diálogo, de forma que el valor no quede accesible tras cerrarlo
- [x] 2.6 En caso de error al generar el token, mostrar `showError()` y verificar que el diálogo no se abre

## 3. Verificación manual

- [x] 3.1 Levantar la app (`ng serve`), ir a "Mi perfil", generar un token y comprobar en el navegador (Network tab) que se llama a `POST /api/auth/api-token` y que el valor mostrado empieza por `kash_pat_`
- [x] 3.2 Verificar que "Copiar" deja el valor completo del token en el portapapeles (pegar en otro campo) y que cerrar el diálogo y reabrir la card no vuelve a mostrar el valor anterior
