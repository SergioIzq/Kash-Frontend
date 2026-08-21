## 1. Componente compartido `ExportarExcelDialogComponent`

- [x] 1.1 Creado `ExportarExcelDialogComponent` en `src/app/shared/components/exportar-excel-dialog/`: `p-dialog`, inputs `tipo: 'gasto' | 'ingreso'` (required), `visible`/`visibleChange` (two-way), `searchTermActual: string`, `exportando: boolean` (para reflejar el estado de carga del consumidor en el botón Exportar); output `exportar` con el objeto de filtros armado
- [x] 1.2 Multi-select de Categoría, Concepto y Persona: `p-multiSelect` con `[lazy]`/`[virtualScroll]`/`(onLazyLoad)` usando `CargadorCatalogoScroll` (offset siempre 0, sin prefijo de "recientes") y `(onFilter)` llamando a `search(term)` del catálogo correspondiente (umbral de 2 caracteres, mismo criterio que `completeMethod` en `selectores-catalogo-completo`)
- [x] 1.3 Multi-select de tercero: "Proveedor(es)" con `ProveedorService` si `tipo() === 'gasto'`, "Cliente(s)" con `ClienteService` si `tipo() === 'ingreso'` (mismo patrón de closure reactivo sobre `tipo()` ya usado en `alta-rapida.page.ts` para su `terceroScroll`, en vez de recrear la instancia); mismo cableado que 1.2
- [x] 1.4 Rango de fechas (desde/hasta) con `p-datePicker selectionMode="range"`, ambos opcionales — mismo patrón que `reportes.page.ts`
- [x] 1.5 Casilla "Usar la búsqueda actual de la tabla" (solo visible si `searchTermActual()` no está vacío), mostrando el texto junto a la casilla
- [x] 1.6 Botones Cancelar/Exportar: al confirmar, emite `exportar` con `{ fechaInicio?, fechaFin?, searchTerm?, conceptoIds?, categoriaIds?, proveedorIds?/clienteIds?, personaIds? }` (solo los filtros realmente activos) y no cierra el diálogo — el cierre lo controla el consumidor vía `visible` (ver 3.2/4.1); el botón Exportar refleja `[loading]="exportando()"`
- [x] 1.7 Exportado `ExportarExcelDialogComponent` desde el barrel `shared/components/index.ts`

## 2. Servicios de descarga

- [x] 2.1 `gasto.service.ts`: nuevo método `descargarExcel(filtros): Observable<Blob>` (`responseType: 'blob'`, `withCredentials: true`, filtros multivalor como parámetros repetidos vía `HttpParams.append`), mismo patrón que `reporte.service.ts`. Tipo `ExportarExcelFiltros` extraído a `core/models/exportar-excel-filtros.model.ts` (compartido por el diálogo y ambos servicios, evita que un servicio de `core` dependa de un componente de `shared`)
- [x] 2.2 `ingreso.service.ts`: `descargarExcel(filtros)` equivalente, con `clienteIds` en vez de `proveedorIds`

## 3. Integración en `gastos-list.page.ts`

- [x] 3.1 El botón "Exportar" abre `ExportarExcelDialogComponent` (`tipo="gasto"`, `searchTermActual` = `searchTerm()` actual) en vez de llamar a `exportCSV()` directamente (eliminado, ya no tenía consumidor: dejaba de exportar solo la página cargada, sin filtros)
- [x] 3.2 Al recibir `(exportar)`, llama a `gastoService.descargarExcel(filtros)`, descarga el blob (mismo helper `descargarBlob` que `reportes.page.ts`), muestra confirmación (`showSuccess(..., 'Exportación completada')`) y cierra el diálogo; en caso de error, muestra un toast descriptivo (`showError(..., 'Error al exportar')`) y mantiene el diálogo abierto con los filtros ya introducidos (el componente no se resetea al fallar, solo al reabrir)
- [x] 3.3 Verificado en el navegador contra el backend real (localhost, BD de test): el multi-select de Categoría carga vía scroll (`onLazyLoad`) las 4 categorías reales del usuario; al seleccionar "IA" y exportar, la petición fue `GET /gastos/excel?categoriaIds=bf2209f2-...` (200) y el `.xlsx` descargado (verificado abriéndolo con ClosedXML) contiene solo las 3 filas de categoría "IA" (Concepto "Claude"), con las 9 columnas esperadas

## 4. Integración en `ingresos-list.page.ts`

- [x] 4.1 Repetido 3.1-3.2 en Ingresos, con `tipo="ingreso"` (filtro de tercero como "Cliente(s)"); `exportCSV()` eliminado igual que en Gastos
- [x] 4.2 Verificado en Ingresos: el diálogo muestra "Cliente(s)" (no "Proveedor(es)") y, al escribir "Claude" en el buscador de la tabla y marcar "Usar la búsqueda actual de la tabla: 'Claude'", la petición fue `GET /ingresos/excel?searchTerm=Claude` (200) y el `.xlsx` descargado contiene solo las 3 filas cuyo Concepto es "Claude" (búsqueda de texto funcionando igual que en el listado)

## 5. Validación final

- [x] 5.1 `ng build`: compilación correcta, sin errores (gastos-list-page 52.94 kB, ingresos-list-page 52.84 kB)
- [x] 5.2 Verificado: ambos `.xlsx` descargados (Gastos filtrado por categoría, Ingresos filtrado por búsqueda de texto) abren correctamente con ClosedXML, con la cabecera de 9 columnas esperada y solo las filas que cumplen el filtro aplicado
- [x] 5.3 `openspec validate dialogo-exportar-excel-gastos-ingresos --strict`: "Change 'dialogo-exportar-excel-gastos-ingresos' is valid"
