## 1. Dependencia

- [x] 1.1 Confirmar que `@sergioizq/ngx-crud-ui@0.2.0` está publicado en npm
  (`npm view @sergioizq/ngx-crud-ui versions`) antes de tocar `package.json`; si todavía no
  está publicado, esperar a que se complete [[publicacion-automatica-npm]] en
  `ngx-crud-toolkit` — verificado: `["0.1.0", "0.2.0"]`, y el PR #2 en ngx-crud-toolkit
  quedó mergeado con el workflow en success
- [x] 1.2 Subir `"@sergioizq/ngx-crud-ui"` de `^0.1.0` a `^0.2.0` en `package.json`, ejecutar
  `npm install` y verificar que `node_modules/@sergioizq/ngx-crud-ui/package.json` queda en
  `0.2.0` — verificado

## 2. Provider de textos en español

- [x] 2.1 Añadir el provider `{ provide: NGX_CRUD_UI_TEXT, useValue: {...} }` en
  `src/app.config.ts`, junto a `LOCALE_ID`, cubriendo los 21 campos de `NgxCrudUiText` con
  texto en español, y verificar que `ng build` compila sin errores de tipos — verificado:
  `ng build --configuration development` completa sin errores

## 3. Verificación

- [x] 3.1 Levantar la app y comprobar en el navegador, en al menos una pantalla de listado
  (p. ej. categorías), que el pie de página de la tabla, el título de un toast (crear/editar/
  eliminar/refrescar) y el diálogo de confirmación de borrado se muestran en español —
  verificado en `/categorias`: pie "Mostrando 1 a 4 de 4 categorías", diálogo "Confirmar
  eliminación" / "¿Seguro que quieres eliminar la categoría "categoria"?" / "Sí, eliminar" /
  "Cancelar", toast de refrescar "Actualizar" / "Datos actualizados"
- [x] 3.2 Comprobar que una pantalla que ya sobreescribía algún texto por instancia (si existe
  alguna) sigue mostrando su valor propio, no el del token — comprobado que ninguna de las
  pantallas que usan realmente `ngxc-crud-list-view` (categorías, clientes, conceptos, formas
  de pago, personas, proveedores) sobreescribe estos campos por instancia; la única coincidencia
  de grep (`cuentas-list.page.ts`) usa un `p-table` nativo de PrimeNG directamente, no el
  componente de la librería, por lo que no es un caso real de conflicto con el token. No existe
  hoy ninguna pantalla que ejercite este camino.
