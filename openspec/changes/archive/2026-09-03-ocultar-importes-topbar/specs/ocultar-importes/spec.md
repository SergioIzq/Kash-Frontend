## Purpose

Permite al usuario ocultar temporalmente todos los importes y porcentajes mostrados en la aplicación desde un control en el topbar, para poder consultar la app en presencia de otras personas sin exponer cifras económicas.

## ADDED Requirements

### Requirement: Toggle de visibilidad en el topbar
El sistema SHALL mostrar un botón en el topbar que alterna entre mostrar y ocultar los importes y porcentajes de la aplicación. El icono del botón SHALL reflejar el estado actual (visible u oculto).

#### Scenario: Activar el ocultado de importes
- **WHEN** el usuario pulsa el botón de ojo estando los importes visibles
- **THEN** el sistema oculta todos los importes y porcentajes de la aplicación y el icono del botón cambia para indicar el estado "oculto"

#### Scenario: Desactivar el ocultado de importes
- **WHEN** el usuario pulsa el botón de ojo estando los importes ocultos
- **THEN** el sistema vuelve a mostrar los importes y porcentajes con su valor real y el icono del botón cambia para indicar el estado "visible"

### Requirement: Persistencia de la preferencia de visibilidad
El sistema SHALL recordar la última preferencia de visibilidad de importes del usuario entre sesiones, guardándola en el almacenamiento local del navegador.

#### Scenario: La preferencia se mantiene tras recargar la página
- **WHEN** el usuario activa el ocultado de importes y recarga la página o vuelve a abrir la aplicación en el mismo navegador
- **THEN** los importes se muestran ocultos, sin necesidad de volver a pulsar el botón

#### Scenario: Primer uso sin preferencia guardada
- **WHEN** el usuario abre la aplicación por primera vez en un navegador sin ninguna preferencia guardada
- **THEN** los importes se muestran visibles por defecto

### Requirement: Formato de importes y porcentajes ocultos
Cuando la visibilidad de importes está desactivada, el sistema SHALL sustituir el valor numérico real por una máscara fija (`****`), conservando el símbolo correspondiente al tipo de valor (€ para importes monetarios, % para porcentajes).

#### Scenario: Importe monetario oculto
- **WHEN** los importes están ocultos y la aplicación renderiza un valor monetario
- **THEN** se muestra `**** €` en lugar del valor numérico real

#### Scenario: Porcentaje oculto
- **WHEN** los importes están ocultos y la aplicación renderiza un valor porcentual
- **THEN** se muestra `**** %` en lugar del valor numérico real

### Requirement: Alcance global del ocultado
El sistema SHALL aplicar el ocultado de importes de forma consistente en todas las pantallas de la aplicación que muestran importes o porcentajes en modo lectura, incluyendo los gráficos del dashboard (tooltips, ejes y leyendas).

#### Scenario: Ocultado en listados y dashboard
- **WHEN** los importes están ocultos
- **THEN** los importes se muestran enmascarados tanto en las tablas y resúmenes de las distintas secciones (cuentas, gastos, ingresos, traspasos, programados, inversiones) como en los gráficos del dashboard

#### Scenario: Fuera de alcance - edición de datos
- **WHEN** los importes están ocultos
- **THEN** los campos de entrada donde el usuario introduce o edita un importe (por ejemplo, el formulario de alta de un gasto) no se ven afectados por el ocultado, ya que no son visualización pasiva de datos existentes
