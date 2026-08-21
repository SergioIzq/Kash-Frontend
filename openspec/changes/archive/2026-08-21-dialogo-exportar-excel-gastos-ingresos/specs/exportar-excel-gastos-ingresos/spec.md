## Purpose

Ofrecer, desde los listados de Gastos e Ingresos, un diálogo de exportación a Excel con filtros opcionales y combinables (fecha, concepto, categoría, proveedor/cliente, persona, búsqueda actual de la tabla), que descargue el libro Excel generado por el backend con el conjunto completo de resultados.

## ADDED Requirements

### Requirement: Diálogo de exportación al pulsar "Exportar"
Al pulsar el botón "Exportar" en el listado de Gastos o de Ingresos, el sistema SHALL mostrar un diálogo con los filtros disponibles antes de iniciar cualquier descarga, en vez de descargar un archivo directamente.

#### Scenario: Abrir el diálogo de exportación
- **WHEN** el usuario pulsa "Exportar" en el listado de Gastos (o de Ingresos)
- **THEN** el sistema muestra un diálogo con los filtros disponibles, sin haber descargado nada todavía

#### Scenario: Exportar sin marcar ningún filtro
- **WHEN** el usuario abre el diálogo de exportación y confirma la exportación sin marcar ni rellenar ningún filtro
- **THEN** el sistema solicita al backend y descarga el Excel con la totalidad del histórico del usuario para esa pantalla

### Requirement: Filtros combinables en el diálogo de exportación
El diálogo de exportación SHALL ofrecer, todos ellos opcionales, un filtro de rango de fechas, un filtro de Categoría, un filtro de Concepto, un filtro de Proveedor (en Gastos) o Cliente (en Ingresos), un filtro de Persona, y una casilla para reutilizar la búsqueda de texto ya aplicada en la tabla. El usuario SHALL poder activar varios de estos filtros a la vez, y el sistema SHALL enviarlos combinados a la exportación.

#### Scenario: Combinar varios filtros a la vez
- **WHEN** el usuario indica en el diálogo, por ejemplo, un rango de fechas y una Categoría, y confirma la exportación
- **THEN** el sistema solicita al backend la exportación con ambos filtros aplicados a la vez

#### Scenario: Selección múltiple en un filtro de catálogo
- **WHEN** el usuario selecciona más de un valor en el filtro de Concepto (o Categoría, Proveedor/Cliente, o Persona)
- **THEN** el sistema envía todos los valores seleccionados como parte de ese filtro en la solicitud de exportación

### Requirement: Reutilizar la búsqueda actual de la tabla como filtro
El diálogo de exportación SHALL ofrecer una opción para incluir, como filtro adicional de la exportación, el mismo texto de búsqueda que el usuario tiene ya escrito en el buscador del listado en ese momento.

#### Scenario: Marcar "usar la búsqueda actual"
- **WHEN** el usuario tiene un texto escrito en el buscador del listado, abre el diálogo de exportación y marca la opción de usar la búsqueda actual
- **THEN** el sistema incluye ese mismo texto como filtro de búsqueda en la solicitud de exportación, combinable con el resto de filtros del diálogo

### Requirement: Mismo componente adaptado a Gastos e Ingresos
El sistema SHALL usar el mismo diálogo de exportación en el listado de Gastos y en el de Ingresos, adaptando la etiqueta y el catálogo del filtro de tercero: "Proveedor" en Gastos, "Cliente" en Ingresos.

#### Scenario: Etiqueta del filtro de tercero según la pantalla
- **WHEN** el usuario abre el diálogo de exportación desde el listado de Gastos
- **THEN** el filtro de tercero se muestra como "Proveedor(es)" y busca sobre el catálogo de Proveedores

#### Scenario: Etiqueta del filtro de tercero en Ingresos
- **WHEN** el usuario abre el diálogo de exportación desde el listado de Ingresos
- **THEN** el filtro de tercero se muestra como "Cliente(s)" y busca sobre el catálogo de Clientes

### Requirement: Descarga del Excel generado
Al confirmar la exportación, el sistema SHALL descargar el archivo Excel devuelto por el backend sin bloquear el resto de la pantalla, y SHALL informar al usuario si la exportación falla, sin dejar la pantalla en un estado inconsistente.

#### Scenario: Descarga correcta
- **WHEN** el backend devuelve el archivo Excel para los filtros solicitados
- **THEN** el sistema descarga el archivo en el navegador y cierra el diálogo

#### Scenario: Error al exportar
- **WHEN** la solicitud de exportación falla (p. ej. error de red o del servidor)
- **THEN** el sistema muestra un mensaje de error al usuario, mantiene el diálogo abierto con los filtros ya introducidos, y no descarga ningún archivo
