## 1. Base compartida (evitar duplicar el mismo cableado 6 selectores × 3 formularios)

- [x] 1.1 Confirmado en `node_modules/@sergioizq/ngrx-crud-store/types/sergioizq-ngrx-crud-store.d.ts`: los 7 stores exponen `loadPaginated: RxMethod<PaginatedQuery>`, pero es un método "fire and forget" que muta el estado **compartido** del store (`items`/`totalRecords`, singleton `providedIn: 'root'`) — no vale para un desplegable de autocomplete sin arriesgar pisar el estado de una pantalla de listado que use el mismo store a la vez. Se usa en su lugar el `*.service.ts` de cada catálogo directamente (`getConceptos`, `getCategorias`, etc.), que ya devuelven `Observable<PaginatedList<T>>` aislado por llamada, sin tocar el store
- [x] 1.2 Creada `CargadorCatalogoScroll<T>` en `src/app/shared/utils/catalogo-scroll.util.ts`: acumula páginas por posición exacta (relleno disperso, no solo `concat`, porque el `Scroller` de PrimeNG no garantiza que las páginas lleguen en orden — confirmado leyendo `primeng-scroller.mjs`), deduplica peticiones repetidas para la misma página. Llama directamente al `*.service.ts` de cada catálogo (no al store, ver 1.1)
- [x] 1.3 Creado `CerrarTecladoBotonComponent` en `src/app/shared/components/cerrar-teclado-boton/`, exportado desde el barrel `shared/components`; el propio componente solo emite `(cerrar)`, el consumidor hace el `blur()` sobre su `p-autoComplete` concreto
- [x] 1.4 Verificado por el usuario en el navegador: `blur()` sobre el input del `p-autoComplete` no cierra el propio desplegable — el panel permanece abierto

## 2. Concepto con filtro de categoría (depende del backend, capability compartida con Kash-Backend)

- [x] 2.1 Añadido parámetro `categoriaId?: string` a `ConceptoService.getConceptos`, reenviado como query param `categoriaId` (mismo nombre que ya usan `search`/`getRecent`)
- [x] 2.2 **[Simplificada por el hallazgo de 1.1]** No hace falta tocar `ConceptoStore`: la utilidad de scroll (1.2) llama directamente a `ConceptoService.getConceptos(...)` inyectado en cada componente, no pasa por el store — así que `categoriaId` se pasa directamente en esa llamada, sin ningún cambio en `ConceptoStore`
- [x] 2.3 Verificado contra el backend local (`Kash-Backend`, change `conceptos-paginados-por-categoria` ya implementado) con el usuario de prueba real: en el formulario de Gasto, al seleccionar la Categoría "IA" el placeholder del selector de Concepto cambia a "Buscar concepto en IA..." y la llamada `GET /api/conceptos/recent?categoriaId=...` devuelve solo "Claude" (el único Concepto de esa Categoría). Adicionalmente, se verificó `GET /api/conceptos` (paginado, mismo endpoint que usa el scroll) directamente contra las 4 Categorías reales del usuario: cada `categoriaId` devuelve únicamente sus propios Conceptos (`allMatchCategoria: true` en los 4 casos), la paginación (`page`/`pageSize`/`hasNextPage`) es correcta, y una Categoría sin Conceptos devuelve página vacía sin error. No se pudo forzar una segunda página real por scroll en el navegador porque el usuario de prueba solo tiene 1 Concepto por Categoría (dataset insuficiente para desbordar el viewport), pero el contrato HTTP que consume el scroll (`CargadorCatalogoScroll`) queda verificado end-to-end contra el backend real

## 3. Integración en `gasto-form-modal.component.ts`

- [x] 3.1 Selector de Concepto: `[lazy]`/`[virtualScroll]`/`(onLazyLoad)` usando la utilidad de 1.2, pasando `categoriaId` de `selectedCategoria` si existe; `headerTemplate` de 1.3
- [x] 3.2 Selector de Categoría: mismo cableado, sin filtro adicional
- [x] 3.3 Selectores de Cuenta y Forma de Pago: mismo cableado
- [x] 3.4 Selector de Proveedor: mismo cableado
- [x] 3.5 Selector de Persona: mismo cableado. **Refinada la utilidad de 1.2 durante esta integración**: `CargadorCatalogoScroll.reset(offset)` ahora recibe cuántos elementos de "recientes"/búsqueda hay ya en el array antes de empezar a paginar el catálogo completo, para que las páginas se escriban a partir de esa posición y no sobrescriban ese prefijo (bug detectado al cablear el primer selector: con el diseño original de 1.2, la página 1 se escribía siempre desde la posición 0, machacando los "recientes")
- [ ] 3.6 Verificar manualmente que "recientes" (al abrir sin escribir) y "búsqueda por texto" (al escribir) siguen funcionando exactamente igual que antes; el catálogo completo con scroll es lo que aparece al seguir bajando, no un reemplazo

## 4. Integración en `ingreso-form-modal.component.ts`

- [x] 4.1 Repetir 3.1-3.5 en el formulario de Ingreso, con Cliente en vez de Proveedor
- [ ] 4.2 Repetir la verificación de 3.6 para Ingreso

## 5. Integración en `alta-rapida.page.ts`

- [x] 5.1 Repetir el mismo cableado (Concepto con filtro de categoría, Categoría, Cuenta, Forma de Pago, Tercero según `tipo()`, Persona) en la vista de alta rápida. El selector de Tercero necesita su propio `CargadorCatalogoScroll` con `fetchPage` dinámico (`proveedorService`/`clienteService` según `tipo()`), reiniciado en `onTipoChange` porque cambia de catálogo por completo
- [ ] 5.2 Verificar que el comportamiento es el mismo que en los formularios completos (`design.md`, Requirement "Alcance en los tres formularios de alta")

## 6. Validación final

- [x] 6.1 Ejecutar `ng build` y confirmar que compila sin errores
- [ ] 6.2 Recorrer manualmente en un dispositivo/emulador móvil: abrir un selector con muchos elementos, comprobar que se puede hacer scroll cargando por páginas, y que el botón "Cerrar teclado" oculta el teclado sin cerrar el desplegable
- [x] 6.3 Ejecutar `openspec validate selectores-catalogo-completo --strict` y corregir cualquier aviso antes de considerar el cambio listo para archivar
