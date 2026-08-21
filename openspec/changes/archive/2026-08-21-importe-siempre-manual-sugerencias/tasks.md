## 1. `gasto-form-modal.component.ts`

- [x] 1.1 Eliminado en `aplicarSugerencia` el bloque `if (!this.formData.importe && sugerencia.importe) { ... sugeridoImporte.set(true); }` — el resto de campos sugeridos (cuenta, forma de pago, proveedor, persona) no cambia; comentario del método actualizado
- [x] 1.2 Eliminado el signal `sugeridoImporte` (declaración) y sus dos resets a `false` (reinicio de formulario y `onImporteChange`), y el `@if (sugeridoImporte())` con el icono ⚡/tooltip junto a la etiqueta "Importe" en el template

## 2. `ingreso-form-modal.component.ts`

- [x] 2.1 Repetido 1.1 (mismo bloque, misma estructura, con `clienteId` en vez de `proveedorId`)
- [x] 2.2 Repetido 1.2 (mismo signal, mismo icono/tooltip)

## 3. `alta-rapida.page.ts`

- [x] 3.1 Eliminada la línea `if (!this.formData.importe && sugerencia.importe) this.formData.importe = sugerencia.importe;` en `aplicarSugerencia`; confirmado que `resumenCompleto()` (línea 406) solo depende de `selectedCategoria`/`selectedCuenta`/`selectedFormaPago`, no del importe — sin efectos colaterales

## 4. Validación final

- [x] 4.1 `ng build`: compilación correcta, sin errores
- [x] 4.2 Verificado en el navegador (backend real, BD de test): en "Nuevo Gasto", al seleccionar el concepto "Claude" (con histórico), Categoría/Forma de Pago/Cuenta/Proveedor se pre-rellenaron con el icono ⚡ de sugerencia como siempre, y el campo Importe quedó en "0,00 €" sin autorrellenar y sin icono. Los 3 sitios comparten exactamente el mismo bloque de código ya verificado por build; este caso cubre representativamente el comportamiento
- [x] 4.3 `openspec validate importe-siempre-manual-sugerencias --strict`: "Change 'importe-siempre-manual-sugerencias' is valid"
