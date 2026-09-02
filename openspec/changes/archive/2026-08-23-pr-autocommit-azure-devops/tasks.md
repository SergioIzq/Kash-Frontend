## 1. Detección de proveedor y contexto del remoto

- [x] 1.1 En `pr.md`, añadir un paso inicial que ejecute `git remote get-url origin` y determine el proveedor (`GitHub` si matchea `github.com`; `AzureDevOps` si matchea `dev.azure.com` o `*.visualstudio.com`, HTTPS o SSH) y verificar manualmente contra los formatos de URL listados en `design.md` - Decisions 1.
- [x] 1.2 Documentar en el mismo paso el parseo de `organization`/`project`/`repository` de la URL cuando el proveedor es Azure DevOps (design.md - Decisions 2), y verificar contra los tres formatos (HTTPS nuevo, SSH, HTTPS legacy `.visualstudio.com`).
- [x] 1.3 Añadir el guardrail de "proveedor no reconocido": si la URL no matchea ninguno de los dos, el comando avisa mostrando la URL detectada y para - verificar que el mensaje no asume ni GitHub ni Azure DevOps por defecto.

## 2. Chequeo de autenticación por proveedor

- [x] 2.1 Reescribir el paso 1 actual ("Check prerequisites") para ramificar por proveedor: `gh auth status` para GitHub (sin cambios), `az account show` + `az repos pr list --organization <org> --project <project> --top 1` para Azure DevOps (design.md - Decisions 3).
- [x] 2.2 Verificar que el mensaje de error de cada rama es específico del proveedor (no reutilizar el texto de "instala/loguea gh" para el caso Azure DevOps) y que ninguna rama intenta login automático.

## 3. Detección de PR existente por proveedor

- [x] 3.1 Reescribir el paso 5 actual ("Verify there's something to merge") para usar `gh pr list --head "<source-branch>" --state open` en GitHub y `az repos pr list --source-branch "<source-branch>" --status active` en Azure DevOps (design.md - Decisions 4), manteniendo el mismo comportamiento de "avisar y preguntar si continuar, default a parar".

## 4. Auto-commit cuando la rama origen queda sucia

- [x] 4.1 En el paso 3 actual ("Check for uncommitted changes on the source branch"), sustituir el "avisar y parar" por el flujo de "Offer to commit" siguiendo el patrón de `/opsx:archive` (design.md - Decisions 6): `git status --porcelain` + `git diff --stat`, redactar título+resumen grounded solo en esos archivos.
- [x] 4.2 Mostrar el mensaje de commit propuesto y esperar confirmación explícita antes de tocar git; en confirmación, `git add <archivos relevantes>` (nunca `git add -A`) + `git commit`, nunca `--no-verify` ni `--amend` - verificar que el guardrail queda explícito en la sección de Guardrails del comando.
- [x] 4.3 Si el usuario no confirma el commit, el comando para con el mismo mensaje de "commitea primero y vuelve a intentarlo" que usa hoy.
- [x] 4.4 Confirmar que el chequeo de worktree sucio del paso 2 (rama de partida, antes del checkout) queda intacto - sin oferta de auto-commit ahí, solo "para y avisa" como hoy.

## 5. Creación de la PR por proveedor

- [x] 5.1 Reescribir el paso 8 actual ("On confirmation, push and create the PR") para ramificar la creación: `gh pr create --base --head --title --body` para GitHub (sin cambios) y `az repos pr create --organization --project --repository --source-branch --target-branch --title --description` para Azure DevOps, usando el mapeo de campos de design.md - Decisions 4.
- [x] 5.2 Verificar cómo se pasa el body de tres secciones a `--description` (design.md - Risks, primer punto) - si `az` real trata cada valor como línea nueva y rompe el markdown de las secciones, ajustar la invocación (comillas / single value) hasta que el resultado preserve el formato.
- [x] 5.3 El paso de push (`git push -u origin <source-branch>` / `git push`) no cambia entre proveedores - verificar que sigue aplicando igual antes de la rama de creación de PR.

## 6. Output unificado

- [x] 6.1 Añadir `**Provider:**` al bloque `**Output**` final y resolver `<url>` por proveedor: directa desde `gh pr create` en GitHub; construida como `<repository.webUrl>/pullrequest/<pullRequestId>` a partir del JSON de `az repos pr create` en Azure DevOps (design.md - Decisions 5).
- [x] 6.2 Verificar que el resto del bloque (`**From:**`/`**Into:**`, `**Title:**`, recuento de commits/archivos) es idéntico entre ambos proveedores - una sola plantilla de salida, no dos bloques distintos.

## 7. Guardrails y verificación final

- [x] 7.1 Actualizar la sección `**Guardrails**` de `pr.md` para cubrir los nuevos casos: proveedor no reconocido detiene el flujo; nunca `--no-verify`/`--amend` en el auto-commit; nunca inventar organization/project/repository si el parseo de la URL falla.
- [x] 7.2 Repasar `pr.md` de principio a fin tras los cambios y confirmar que el camino GitHub existente (branches, auth, PR duplicada, título/body, push, output) sigue funcionando literalmente igual que antes de este cambio - sin regresiones para el caso ya soportado.
- [x] 7.3 Dejar constancia en el propio PR/commit de que el camino Azure DevOps no se ha probado contra un `az` real (design.md - Risks, primer punto) y que debe validarse en un repo de Azure DevOps antes de confiar en él en producción.
