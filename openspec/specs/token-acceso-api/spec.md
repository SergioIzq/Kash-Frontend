# token-acceso-api Specification

## Purpose

Permite a un usuario autenticado generar, desde su página de perfil, un token de acceso personal (`kash_pat_...`) para autenticar integraciones externas como el Atajo de iPhone, mostrado una única vez tras generarlo.

## Requirements

### Requirement: Generar token de acceso desde el perfil
El sistema SHALL ofrecer, en la página "Mi perfil" de un usuario autenticado, una acción para generar un nuevo token de acceso personal.

#### Scenario: Botón visible en el perfil
- **WHEN** el usuario autenticado abre "Mi perfil"
- **THEN** ve una sección "Accesos API" con un botón para crear un token de acceso

### Requirement: Confirmación antes de generar
Dado que generar un nuevo token invalida cualquier token anterior del usuario, el sistema SHALL pedir confirmación antes de generarlo, advirtiendo de que cualquier token previo dejará de funcionar.

#### Scenario: El usuario cancela la confirmación
- **WHEN** el usuario pulsa "Crear token" y luego cancela el diálogo de confirmación
- **THEN** no se realiza ninguna llamada al backend y no se genera ningún token

#### Scenario: El usuario confirma la generación
- **WHEN** el usuario pulsa "Crear token" y acepta el diálogo de confirmación
- **THEN** el sistema solicita al backend la generación de un nuevo token de acceso

### Requirement: Mostrar el token una única vez
El sistema SHALL mostrar el valor del token generado (con prefijo `kash_pat_`) inmediatamente después de crearlo, y SHALL indicar al usuario que no volverá a mostrarse.

#### Scenario: Token generado correctamente
- **WHEN** el backend devuelve un nuevo token de acceso
- **THEN** el sistema muestra el valor completo del token en un diálogo, junto con un aviso de que no se volverá a mostrar

#### Scenario: Cierre del diálogo
- **WHEN** el usuario cierra el diálogo con el token
- **THEN** el sistema no conserva ni vuelve a mostrar el valor del token en ninguna otra pantalla

### Requirement: Copiar el token al portapapeles
El sistema SHALL ofrecer una acción para copiar el token generado al portapapeles del dispositivo mientras el diálogo con el token está abierto.

#### Scenario: Copia exitosa
- **WHEN** el usuario pulsa "Copiar" en el diálogo del token
- **THEN** el valor completo del token queda disponible en el portapapeles del dispositivo

### Requirement: Manejo de errores al generar el token
Si la generación del token falla, el sistema SHALL informar al usuario del error y SHALL dejar la acción de generar disponible para reintentar, sin mostrar ningún valor de token parcial o inválido.

#### Scenario: Fallo en la llamada al backend
- **WHEN** la solicitud de generación de token falla (por ejemplo, error de red o del servidor)
- **THEN** el sistema muestra un aviso de error y no abre el diálogo de token
