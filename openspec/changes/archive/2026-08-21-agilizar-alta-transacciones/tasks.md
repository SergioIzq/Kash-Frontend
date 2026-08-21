## 1. Dependencia externa (bloqueante, fuera de este repo)

- [x] 1.1 **[Hecho en `Kash-Backend`, change `sugerencias-y-habituales-transacciones`]** `GET /api/gastos/sugerencia?conceptoId={id}` devuelve **200 con una lista de 0 o 1 elemento** (reutiliza `GetRecentQueryHandler`, igual que el resto de endpoints "recientes" del backend — nunca 404), donde el elemento es un `GastoDto` completo (incluye `cuentaId/Nombre`, `formaPagoId/Nombre`, `importe`, `proveedorId/Nombre`, `personaId/Nombre`, además de `id`, `fecha`, `descripcion`, `conceptoId/Nombre`, `categoriaId/Nombre`). El frontend debe tratar el array vacío como "sin sugerencia", no un 404
- [x] 1.2 **[Hecho en `Kash-Backend`]** `GET /api/ingresos/sugerencia?conceptoId={id}` — mismo comportamiento que 1.1, elemento = `IngresoDto` completo (usa `clienteId/Nombre`, no `proveedorId/Nombre` — los ingresos no tienen proveedor)
- [x] 1.3 **[Hecho en `Kash-Backend`]** `GET /api/gastos/habituales?limit=6` (200, lista, nunca 404) devuelve el top-N de combinaciones completas (`conceptoId/Nombre`, `categoriaId/Nombre`, `cuentaId/Nombre`, `formaPagoId/Nombre`, `proveedorId/Nombre`, `personaId/Nombre`, más `veces: number` y `ultimoUso: string` ISO) más repetidas del usuario (mínimo 2 veces — una combinación que solo ocurrió una vez no se considera "habitual"), ordenadas por nº de usos desc. y desempate por fecha reciente desc.
- [x] 1.4 **[Hecho en `Kash-Backend`]** `GET /api/ingresos/habituales?limit=6` — mismo comportamiento que 1.3, con `clienteId/Nombre` en vez de `proveedorId/Nombre`

## 2. Servicios y tipados de frontend

- [x] 2.1 **[Simplificado]** No se creó `SugerenciaTransaccion`: el backend devuelve el `GastoDto`/`IngresoDto` completo en `sugerencia`, que ya coincide exactamente con las interfaces `Gasto`/`Ingreso` existentes — reutilizarlas evita un tipo duplicado. Sí se añadieron `GastoHabitual` (en `gasto.model.ts`) e `IngresoHabitual` (en `ingreso.model.ts`) para `habituales`, con los campos devueltos por 1.3/1.4 (`veces`, `ultimoUso`, y `proveedorId/Nombre` vs `clienteId/Nombre` respectivamente)
- [x] 2.2 Añadido `getSugerencia(conceptoId: string): Observable<Gasto | null>` / `Observable<Ingreso | null>` a `gasto.service.ts` e `ingreso.service.ts`, mapeando `response.value?.[0] ?? null` (200 con array, nunca 404, como quedó corregido en 1.1)
- [x] 2.3 Añadido `getHabituales(limit = 6): Observable<GastoHabitual[]>` / `Observable<IngresoHabitual[]>` a ambos servicios

## 3. Sugerencias en el formulario existente (capability: sugerencias-transaccion)

- [x] 3.1 En `gasto-form-modal.component.ts`, `onConceptoSelect` llama a `aplicarSugerencia()` cuando `!isEditMode()`, que a su vez llama a `gastoService.getSugerencia` y rellena `selectedCuenta`/`selectedFormaPago`/`formData.importe`/`selectedProveedor`/`selectedPersona` solo si cada campo está vacío en ese momento. `tsc --noEmit` limpio; verificación visual en navegador pendiente (ver informe de aplicación)
- [x] 3.2 Repetido en `ingreso-form-modal.component.ts` con `ingresoService.getSugerencia` (cliente en vez de proveedor)
- [x] 3.3 Añadido indicador `pi-bolt` + `pTooltip` junto a las etiquetas de Importe/Forma de Pago/Cuenta/Proveedor(o Cliente)/Persona en ambos formularios, controlado por señales `sugerido*` que se ponen a `false` en cada `onXxxSelect`/`onXxxClear`/creación-de-valor-nuevo-en-blur y en `loadFormData()` — desaparece en cuanto el usuario toca el campo
- [x] 3.4 Por construcción: `aplicarSugerencia` retorna sin tocar el formulario si `getSugerencia` resuelve `null` (`if (!sugerencia) return;`); no hay ninguna otra rama que dependa de la sugerencia, así que el resto del flujo (validación, auto-creación de catálogos, guardado) queda inalterado

## 4. Vista de alta rápida (capability: alta-rapida)

- [x] 4.1 Creado `features/alta-rapida/pages/alta-rapida.page.ts` con `p-selectbutton` Gasto/Ingreso (por defecto Gasto), concepto e importe visibles, y resumen colapsado (categoría/cuenta/forma de pago/tercero/persona) con botón "Cambiar" que expande los campos; `tsc --noEmit` limpio
- [x] 4.2 `aplicarSugerencia()` llama a `gastoService`/`ingresoService.getSugerencia` según `tipo()` y precarga el resumen; si el concepto es nuevo (`!value.id`, sin sugerencia posible) o la sugerencia no cubre categoría/cuenta/forma de pago, se fuerza `expandido.set(true)` para pedirlos a mano
- [x] 4.3 Ruta `/alta-rapida` registrada en `src/app.routes.ts` dentro del mismo bloque `canActivate: [authGuard]` que `gastos`/`ingresos`/etc. — mismo guard, sin lógica nueva; la redirección de no-autenticados es la misma del resto de la app por construcción
- [x] 4.4 `guardar()` construye `GastoCreate`/`IngresoCreate` (mismos campos que `ejecutarGuardado()` del modal completo) y llama a `gastosStore.createGasto` / `ingresosStore.createIngreso` — mismo camino de persistencia, sin duplicar lógica de creación ni de auto-creación de catálogos (el backend la sigue resolviendo por nombre)
- [x] 4.5 Verificado por el usuario en dispositivo/emulador real: la ruta `/alta-rapida` carga correctamente accedida como URL profunda (recarga directa)

## 5. Atajo de instalación PWA (capability: alta-rapida)

- [x] 5.1 Añadido bloque `shortcuts` a `public/manifest.webmanifest` (nombre "Nuevo gasto", `url: "/alta-rapida"`, icono `icon-192x192.png` ya existente); validado con `JSON.parse` — manifest válido. `manifest.webmanifest` ya estaba en el grupo `prefetch` de `ngsw-config.json`, así que el service worker recoge el cambio sin tocar esa config
- [x] 5.2 Verificado por el usuario en Chrome/Edge Android: tras instalar la PWA, el atajo aparece al mantener pulsado el icono y abre la app directamente en `/alta-rapida`
- [x] 5.3 Por diseño de la Web App Manifest spec: `shortcuts` es un campo opcional que las plataformas sin soporte simplemente ignoran; la app y la ruta `/alta-rapida` siguen accesibles con normalidad navegando dentro de la app (no depende del atajo para funcionar)

## 6. Transacciones habituales (capability: transacciones-habituales)

- [x] 6.1 Creado `shared/components/transacciones-habituales-chips/transacciones-habituales-chips.component.ts` (input `tipo`, output `seleccionar`), consume `getHabituales(6)` del servicio correspondiente y emite `TransaccionHabitualSeleccionada` al pulsar un chip. **Corrección de alcance frente al enunciado:** `GastoHabitualDto`/`IngresoHabitualDto` (backend) no incluyen el importe del último uso de la combinación — solo concepto/categoría/cuenta/formaPago/tercero/persona + veces/últimoUso — así que el chip **no** pre-rellena importe; ver aviso al usuario más abajo
- [x] 6.2 Integrado en la cabecera de `gastos-list.page.ts`. Al pulsar un chip, `onHabitualSeleccionado` abre `app-gasto-form-modal` en modo creación con concepto/categoría/cuenta/forma de pago/proveedor/persona pre-rellenados; fecha se inicializa a hoy e importe queda vacío para que el usuario lo introduzca (ver corrección en 6.1). Esto requirió corregir `gasto-form-modal.component.ts::loadFormData()`, que en modo creación **ignoraba por completo** cualquier dato recibido por el input `gasto` y siempre reseteaba el formulario en blanco — ahora usa esos datos si vienen informados, sin cambiar el comportamiento de "Nuevo Gasto" (que sigue pasando `{}`)
- [x] 6.3 Igual que 6.2 en `ingresos-list.page.ts` / `ingreso-form-modal.component.ts` (mismo fix de `loadFormData()` aplicado ahí también)
- [x] 6.4 Integrado en `/alta-rapida`: seleccionar un chip rellena directamente el resumen (categoría/cuenta/forma de pago/tercero/persona) sin pasar por el modal completo, vía `onHabitualSeleccionado` en `alta-rapida.page.ts`
- [x] 6.5 Por construcción: el componente renderiza `@if (habituales().length > 0)` — con lista vacía no se muestra nada en ninguna de las tres pantallas

## 7. Validación final

- [x] 7.1 `ng build --configuration development` (más estricto que `tsc --noEmit`: incluye chequeo de tipos en plantillas) → compilación correcta, sin errores; se generan los chunks `gastos-list-page`, `ingresos-list-page` y la ruta `alta-rapida`
- [x] 7.2 Verificado por el usuario: caso de uso original recorrido en vivo (registrar un gasto repetido, segunda vez vía chip/alta rápida solo requiere confirmar importe y fecha)
- [x] 7.3 `openspec validate agilizar-alta-transacciones --strict` → válido (ejecutado a continuación)

### Aviso importante para el usuario (no resuelto en esta sesión)

`transacciones-habituales/spec.md` (Requirement "Repetir una transacción habitual con un toque") especifica que el importe debe pre-rellenarse "al último valor usado pero editable". El backend (`GastoHabitualDto`/`IngresoHabitualDto`, change `sugerencias-y-habituales-transacciones` en `Kash-Backend`) no devuelve ese importe — el `GROUP BY` de `habituales` no lo incluye. Corregirlo requeriría añadir una subconsulta correlacionada (`MAX(importe)` no sirve; hace falta el importe de la fila con `fecha`/`id` más reciente de cada combinación) al SQL de `GetHabitualesAsync` en ambos repositorios de `Kash-Backend`, fuera del `allowedEditRoots` de esta sesión (`Kash-Frontend`). No se ha hecho ese cambio para no cruzar de repo sin confirmación. El resto del flujo de "habituales" funciona (concepto/categoría/cuenta/forma de pago/tercero/persona sí se pre-rellenan); solo el importe queda pendiente de escribir a mano.
