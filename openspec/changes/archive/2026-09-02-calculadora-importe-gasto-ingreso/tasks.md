## 1. Motor de cálculo

- [x] 1.1 Crear `src/app/shared/utils/calculadora-importe.util.ts` con una clase de estado plano (display, valor anterior, operador pendiente, flag de sobrescritura) y métodos `introducirDigito`, `introducirOperador`, `calcular`, `limpiar`, siguiendo el mismo estilo que `catalogo-scroll.util.ts`
- [x] 1.2 Implementar evaluación secuencial sin precedencia de operadores (cada operador resuelve la operación pendiente contra el valor anterior) y verificar con un caso manual: `100 + 50 - 20 × 2` produce `260`
- [x] 1.3 Implementar manejo de división por cero como estado de error que bloquea nuevas operaciones hasta `limpiar()`, y verificar con `9 ÷ 0`
- [x] 1.4 Verificar que decimales se manejan igual que en `money-input.component.ts` (coma como separador, redondeo a 2 decimales solo al exponer el resultado final, no durante el cálculo intermedio)

## 2. Componente compartido `app-calculadora-importe`

- [x] 2.1 Crear `src/app/shared/components/calculadora-importe/calculadora-importe.component.ts` (standalone) que renderice el botón (`pi-calculator`) como `p-inputgroup-addon` y un `p-popover` con `[appendTo]="'body'`, usando el motor de cálculo de la tarea 1
- [x] 2.2 Implementar el teclado numérico dentro del popover (0-9, coma decimal, +, −, ×, ÷, `C`, `=`) y la pantalla de resultado, arrancando siempre en cero al abrirse (sin precargar el importe actual del formulario)
- [x] 2.3 Añadir botón "Usar este valor" que emite `(valorConfirmado)` con el resultado actual (redondeado a 2 decimales) y cierra el popover; verificar que cerrar el popover de cualquier otra forma (clic fuera) no emite nada
- [x] 2.4 Ajustar CSS del host (`display: contents` o equivalente) para que el botón se integre correctamente como hijo directo de `.p-inputgroup` sin romper su layout flex
- [x] 2.5 Exportar el componente en `src/app/shared/components/index.ts`

## 3. Integración en el formulario de Gasto

- [x] 3.1 En `src/app/features/gastos/components/gasto-form-modal.component.ts`, envolver `app-money-input` (líneas 109-115) en un `div.p-inputgroup` junto al nuevo `<app-calculadora-importe (valorConfirmado)="onImporteChange($event)" />`
- [x] 3.2 Importar `InputGroupModule`, `InputGroupAddonModule` y el nuevo componente en el array `imports` del componente
- [x] 3.3 Ajustar el CSS del host de `app-money-input` (`money-input.component.ts`) para que ocupe el espacio disponible dentro de `.p-inputgroup` (p. ej. `flex: 1 1 auto`) sin afectar a los otros 7 usos existentes del componente fuera de un `p-inputgroup`
- [x] 3.4 Probar manualmente en el navegador: abrir "Nuevo Gasto", pulsar la calculadora, encadenar una operación, pulsar "Usar este valor" y comprobar que el importe queda reflejado y validado al guardar

## 4. Integración en el formulario de Ingreso

- [x] 4.1 Aplicar el mismo cambio que la tarea 3.1-3.2 en `src/app/features/ingresos/components/ingreso-form-modal.component.ts` (líneas 109-115, estructura idéntica)
- [x] 4.2 Probar manualmente en el navegador: abrir "Nuevo Ingreso", repetir el flujo de la tarea 3.4 y comprobar el mismo comportamiento

## 5. Verificación de integración

- [x] 5.1 Comprobar visualmente que el popover de la calculadora queda por encima del `p-drawer` del formulario (z-index) y no se recorta, tanto en Gasto como en Ingreso
- [x] 5.2 Comprobar que editar un gasto/ingreso existente con importe ya cargado, abrir la calculadora, cancelar sin confirmar y guardar conserva el importe original sin cambios
- [x] 5.3 Ejecutar `ng build` (o el comando de build del proyecto) y confirmar que no introduce errores de compilación
