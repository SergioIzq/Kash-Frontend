## Purpose

Permitir recorrer el catálogo completo del usuario (no solo los elementos recientes o los que coinciden con un texto de búsqueda) en los selectores de Concepto, Categoría, Cuenta, Forma de Pago, Proveedor/Cliente y Persona, cargándolo por páginas mediante scroll, y facilitar hacerlo en móvil ocultando el teclado virtual sin cerrar el desplegable.

## ADDED Requirements

### Requirement: Recorrer el catálogo completo mediante scroll
Al abrir cualquiera de los selectores de Concepto, Categoría, Cuenta, Forma de Pago, Proveedor/Cliente o Persona, el sistema SHALL permitir al usuario desplazarse por el catálogo completo de ese tipo perteneciente al usuario autenticado, cargando los resultados por páginas a medida que se hace scroll, sin necesidad de escribir texto de búsqueda.

#### Scenario: Usuario con más elementos de los que caben en "recientes"
- **WHEN** un usuario abre un selector (p. ej. Concepto) sin escribir nada, y tiene más elementos de ese catálogo de los que se mostraban antes como "recientes"
- **THEN** el sistema permite seguir haciendo scroll dentro del propio desplegable para encontrar cualquier elemento del catálogo, no solo los últimos usados

#### Scenario: Carga incremental, no de golpe
- **WHEN** el usuario hace scroll hacia el final de los elementos ya cargados en el desplegable
- **THEN** el sistema carga la siguiente página de resultados del catálogo, sin haber descargado el catálogo completo de una sola vez al abrir el selector

#### Scenario: Catálogo vacío
- **WHEN** el usuario abre un selector de un catálogo en el que todavía no tiene ningún elemento creado
- **THEN** el sistema muestra el desplegable sin elementos y sin error, permitiendo crear uno nuevo escribiendo su nombre (comportamiento ya existente, sin cambios)

### Requirement: El filtrado de Concepto por Categoría se mantiene al recorrer el catálogo completo
Cuando el formulario ya tiene una Categoría seleccionada, el sistema SHALL restringir el catálogo completo de Conceptos mostrado (incluido el recorrido por scroll) a los que pertenecen a esa Categoría, igual que ya ocurre hoy al escribir texto de búsqueda.

#### Scenario: Concepto con categoría ya elegida
- **WHEN** el usuario ha seleccionado una Categoría y a continuación abre el selector de Concepto para recorrerlo con scroll
- **THEN** el sistema solo muestra (y solo sigue cargando al hacer scroll) los Conceptos que pertenecen a esa Categoría

#### Scenario: Concepto sin categoría elegida todavía
- **WHEN** el usuario abre el selector de Concepto sin haber elegido antes una Categoría
- **THEN** el sistema permite recorrer con scroll todos los Conceptos del usuario, sin restringir por categoría

### Requirement: Ocultar el teclado en móvil sin cerrar el desplegable
El sistema SHALL ofrecer, dentro del propio desplegable de cada selector, una acción visible que oculte el teclado virtual del dispositivo sin cerrar el desplegable, para facilitar hacer scroll por la lista de resultados.

#### Scenario: Usuario en móvil quiere scrollear con el teclado abierto
- **WHEN** un usuario en un dispositivo móvil tiene el teclado virtual abierto porque estaba escribiendo en un selector, y quiere recorrer la lista de resultados con el dedo
- **THEN** el sistema le permite pulsar una acción visible en el propio desplegable que oculta el teclado, dejando visible más espacio de la lista, sin cerrar el desplegable ni perder la posición del scroll

### Requirement: Alcance en los tres formularios de alta
El sistema SHALL aplicar el mismo comportamiento de catálogo completo con scroll y ocultar teclado en los selectores de Concepto, Categoría, Cuenta, Forma de Pago, Proveedor/Cliente y Persona del formulario completo de Gasto, del formulario completo de Ingreso, y de la vista de alta rápida.

#### Scenario: Mismo comportamiento en los tres formularios
- **WHEN** un usuario abre el selector de Cuenta (o cualquiera de los otros cinco) en el formulario completo de Gasto, en el de Ingreso, o en la vista de alta rápida
- **THEN** el comportamiento de scroll por el catálogo completo y de ocultar teclado es el mismo en los tres sitios
