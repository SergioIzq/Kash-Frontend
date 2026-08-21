## Why

Las pantallas de listado construidas sobre `@sergioizq/ngx-crud-ui` (categorías, proveedores,
clientes, cuentas, formas de pago, personas, conceptos, reglas de categorización...) muestran
hoy textos en inglés que no vienen de `CrudListConfig`: el pie de la tabla ("Showing 1 to X of
Y"), los títulos de los toasts ("Success"/"Error"), y el diálogo de confirmación de borrado
("Confirm deletion" / "Are you sure you want to delete..." / "Yes, delete"), entre otros. La
librería acaba de publicar (`@sergioizq/ngx-crud-ui@0.2.0`, ver
[[publicacion-automatica-npm]] en `ngx-crud-toolkit`) un `InjectionToken` (`NGX_CRUD_UI_TEXT`)
pensado exactamente para que un consumidor como Kash-Frontend fije estos textos una sola vez a
nivel de aplicación, en vez de en cada pantalla.

## What Changes

- Subir el rango de la dependencia `@sergioizq/ngx-crud-ui` en `package.json` de `^0.1.0` a
  `^0.2.0` (necesario porque, al ser una versión `0.x`, el rango `^0.1.0` no resuelve `0.2.0` -
  hay que subirlo explícitamente) y `npm install`.
- Proveer `NGX_CRUD_UI_TEXT` en `src/app.config.ts`, junto al resto de configuración global
  (`LOCALE_ID`, `MessageService`, `ConfirmationService`), con los valores en español para todos
  los campos que hoy quedan en inglés en las pantallas de listado.

## Capabilities

### New Capabilities
- `localizacion-listados-crud`: los textos de UI de las pantallas de listado basadas en
  `@sergioizq/ngx-crud-ui` (paginación, toasts, confirmación de borrado, glosario de ayuda...)
  se muestran en español.

### Modified Capabilities
(ninguna)

## Impact

- `package.json` / `package-lock.json` (bump de `@sergioizq/ngx-crud-ui`).
- `src/app.config.ts` (nuevo provider `NGX_CRUD_UI_TEXT`).
- Ninguna pantalla individual necesita cambios: al no tener overrides por instancia para estos
  campos, todas heredan el valor del token.
- Depende de que `@sergioizq/ngx-crud-ui@0.2.0` esté publicado en npm (ver
  [[publicacion-automatica-npm]] en el repo `ngx-crud-toolkit`) antes de poder hacer el
  `npm install`.
