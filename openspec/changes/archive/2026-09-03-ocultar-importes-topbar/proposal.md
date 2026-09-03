## Why

En espacios compartidos o en pantalla compartida, el usuario no puede consultar la aplicación sin exponer sus importes reales (saldos, gastos, ingresos, inversiones). Hoy no existe ninguna forma de ocultar temporalmente esa información sin cerrar sesión o salir de la app.

## What Changes

- Nuevo botón toggle de "ojo" (`pi-eye` / `pi-eye-slash`) en el topbar, junto al selector de tema, que activa/desactiva la visibilidad de importes y porcentajes en toda la aplicación.
- Nuevo flag `hideAmounts` en `LayoutService` (junto al resto de `layoutConfig`), persistido automáticamente en `localStorage` bajo la misma clave `ahorroland_layout_config` ya usada por el tema y el modo de menú.
- Nuevo pipe Angular `hideAmount` (con parámetro de tipo `'currency' | 'percent'`) que sustituye el formateo actual (`| number:'1.2-2'` + símbolo literal) en las páginas y componentes que muestran importes/porcentajes. Cuando el flag está activo, muestra `**** €` o `**** %` en lugar del valor real.
- Actualización de los callbacks de Chart.js (tooltips, ejes, leyendas HTML) en los gráficos del dashboard para que también respeten el flag `hideAmounts`, ya que no pueden resolverse con el pipe de plantilla.

## Capabilities

### New Capabilities
- `ocultar-importes`: toggle en el topbar que oculta/muestra importes y porcentajes en toda la aplicación, con la preferencia persistida en localStorage.

### Modified Capabilities

(ninguna: las páginas de listados, dashboard, etc. no cambian sus requisitos funcionales, solo el formato visual de un valor existente cuando el usuario activa la nueva preferencia)

## Impact

- **Topbar**: `src/app/layout/component/app.topbar.ts` (+ estilos en `src/assets/layout/_topbar.scss`).
- **Estado/persistencia**: `src/app/layout/service/layout.service.ts` (interfaz `layoutConfig`, `getDefaultConfig()`, nuevo computed y método toggle).
- **Nuevo pipe**: `src/app/shared/pipes/hide-amount.pipe.ts` (carpeta nueva, no existía ninguna en el proyecto).
- **Plantillas a actualizar** (sustituir `| number:'1.2-2'` + símbolo por el nuevo pipe): dashboard (`dashboard.page.ts`, `resumen-financiero.component.ts`), cuentas, gastos, ingresos, traspasos, gastos-programados, ingresos-programados, traspasos-programados, inversiones (list y form modal).
- **Gráficos Chart.js**: `ingresos-chart.component.ts`, `gastos-chart.component.ts`, `resumen-financiero.component.ts` (callbacks de tooltip/eje/leyenda).
- **Fuera de alcance**: el PDF de `reportes.page.ts` (formateado en backend) y los inputs de edición de importe (`money-input.component.ts`, `calculadora-importe`), al ser de introducción de datos y no de visualización pasiva.
