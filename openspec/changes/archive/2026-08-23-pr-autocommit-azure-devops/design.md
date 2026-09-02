## Context

`/opsx:pr` (`.claude/commands/opsx/pr.md`) es un comando de Claude Code que hoy asume GitHub en todo el flujo (`gh auth status`, `gh pr list`, `gh pr create`) y para el flujo entero si la rama origen tiene cambios sin commitear. Ver `proposal.md` - Why.

Verificado en este repo: el remoto `origin` es `https://github.com/SergioIzq/Kash-Frontend.git` y `gh` v2.98.0 está instalado; `az` no está instalado en este entorno, así que el camino de Azure DevOps se apoya en documentación oficial (Microsoft Learn, `az repos pr` reference) consultada durante la exploración, no en ejecución real.

## Goals / Non-Goals

**Goals:**
- Que una rama origen sucia (tras el checkout) ofrezca commitear en el propio flujo en vez de parar, reutilizando el patrón "Offer to commit" ya usado en `/opsx:archive`.
- Que `/opsx:pr` funcione igual de bien contra un remoto de GitHub o de Azure DevOps Services (cloud), detectando el proveedor automáticamente a partir del remoto `origin`.
- Un bloque de output final con la misma forma para ambos proveedores.

**Non-Goals:**
- GitHub Enterprise Server (dominio propio) y Azure DevOps Server on-prem (TFS) quedan fuera de alcance - remotos que no matcheen `github.com` ni `dev.azure.com`/`*.visualstudio.com` hacen que el comando avise y pare.
- El chequeo de worktree sucio en la rama de partida (paso 2 actual, antes de hacer checkout a la rama origen) no cambia - sigue parando, no se ofrece commit ahí.
- No se automatiza la resolución de reviewers, work items, políticas de rama, ni ningún campo de `az repos pr create` más allá de los que ya usa `gh pr create` (source, target, título, descripción).

## Decisions

### 1. Detección del proveedor: regex sobre `git remote get-url origin`

En vez de depender de configuración o de que el usuario declare el proveedor, se parsea la URL del remoto (soporta HTTPS y SSH):

```
GitHub:        github\.com
Azure DevOps:  dev\.azure\.com  |  \.visualstudio\.com
```

Formatos concretos confirmados:
- GitHub HTTPS: `https://github.com/<owner>/<repo>.git`
- GitHub SSH: `git@github.com:<owner>/<repo>.git`
- Azure DevOps HTTPS (nuevo): `https://dev.azure.com/<org>/<project>/_git/<repo>`
- Azure DevOps SSH: `git@ssh.dev.azure.com:v3/<org>/<project>/<repo>`
- Azure DevOps HTTPS (legacy): `https://<org>.visualstudio.com/<project>/_git/<repo>`

Si no matchea ninguno, el comando avisa (indicando la URL detectada) y para - mismo tratamiento que el guardrail actual de "`gh` no instalado".

**Alternativas consideradas:** preguntar al usuario el proveedor explícitamente - descartado porque el remoto ya lo determina de forma inequívoca y añadiría una pregunta redundante en el camino feliz.

### 2. Azure DevOps necesita org/project/repo explícitos; GitHub no

`gh pr create` no requiere owner/repo porque los infiere del remoto del directorio actual (comportamiento ya en uso, confirmado por el `pr.md` actual). `az repos pr create`, según la referencia oficial, requiere `--organization`, `--project` y `--repository` salvo que estén configurados por defecto (`az devops configure -d ...`) o "recogidos vía git config" - esto último no se pudo verificar sin `az` instalado.

**Decisión:** no confiar en autodetección de `az`; parsear siempre `organization`/`project`/`repository` de la URL del remoto (mismo regex del punto 1) y pasarlos explícitos en cada llamada de `az`. Consistente con cómo el resto de `pr.md` ya evita asumir (ramas, PRs existentes, etc. siempre se verifican, nunca se infieren).

### 3. Comprobación de autenticación por proveedor

- **GitHub**: `gh auth status` (sin cambios respecto al comando actual).
- **Azure DevOps**: `az account show` (confirma sesión de Azure) seguido de una llamada específica de Azure Repos contra el `organization`/`project` detectados (p.ej. `az repos pr list --organization <org> --project <project> --top 1`) para confirmar que además hay acceso al repo, no solo una sesión de Azure genérica. Si cualquiera de los dos falla, mismo tratamiento que hoy con `gh` no autenticado: avisar y parar, sin intentar login automático.

### 4. Mapeo de campos para crear la PR

| Campo | GitHub (`gh pr create`) | Azure DevOps (`az repos pr create`) |
|---|---|---|
| origen | `--head <source-branch>` | `--source-branch <source-branch>` |
| destino | `--base <base-branch>` | `--target-branch <base-branch>` |
| título | `--title <title>` | `--title <title>` |
| descripción | `--body <body>` | `--description <body>` |
| contexto del repo | implícito | `--organization <org> --project <project> --repository <repo>` |
| PR existente en la rama | `gh pr list --head <branch> --state open` | `az repos pr list --source-branch <branch> --status active` |

El contenido de título y descripción (las tres secciones "Motivo de los cambios" / "Descripción de la solución" / "Archivos modificados", la redacción grounded en `git log`/`git diff`/OpenSpec) no cambia entre proveedores - solo cambia qué flag de CLI transporta cada valor.

### 5. Output unificado, URL resuelta por proveedor

`gh pr create` devuelve la URL de la PR directamente. `az repos pr create --output json` no da una URL web; da `pullRequestId` y `repository.webUrl`. La URL se construye como:

```
<repository.webUrl>/pullrequest/<pullRequestId>
```

(patrón confirmado por documentación y ejemplos de terceros durante la exploración). Con esto, el bloque `**Output**` final de `pr.md` puede tener una única forma para ambos proveedores, añadiendo `**Provider:**` a las líneas ya existentes (`**From:**`/`**Into:**`, `**Title:**`, `**URL:**`, recuento de commits/archivos). Solo la resolución de `<url>` se ramifica internamente por proveedor antes de imprimir el bloque común.

### 6. Auto-commit: solo en el paso 3 (rama origen sucia tras checkout)

Reutiliza el patrón de `/opsx:archive` paso "Offer to commit" (7a-f):
1. `git status --porcelain` + `git diff --stat` sobre la rama origen - solo referenciar archivos que aparecen ahí.
2. Redactar título (imperativo) + resumen, sin inventar motivo/descripción no verificable.
3. Mostrar el mensaje propuesto y esperar confirmación explícita antes de tocar git.
4. En confirmación: `git add <archivos relevantes>` (nunca `git add -A`) + `git commit` - nunca `--no-verify` ni `--amend`.
5. Si el usuario no confirma, el comando para igual que hoy (mensaje de "commitea primero y vuelve a intentarlo").

El chequeo de worktree sucio del paso 2 (rama de partida, antes del checkout a la rama origen) queda sin cambios - solo protege trabajo ajeno a esta PR, no se ofrece commit ahí.

## Risks / Trade-offs

- **[Riesgo] El camino de Azure DevOps no se puede probar en este repo/entorno** (remoto es GitHub, `az` no instalado) → Mitigación: documentarlo explícitamente en el proposal/impacto: validar en un repo real de Azure DevOps antes de dar el flujo por bueno en producción; no bloquea escribir el comando, pero sí bloquea confiar en él sin probarlo.
- **[Riesgo] `--description` de `az repos pr create` trata cada valor pasado como una línea nueva**, distinto de `--body` de `gh` (string markdown de un tirón) → Mitigación: al implementar, probar el body de tres secciones (con `##` y saltos de línea) contra `az` real antes de darlo por equivalente; si no preserva el markdown igual, ajustar cómo se pasa el string (comillas, `--description "$body"` como un único valor vs. varios).
- **[Riesgo] Falsos negativos en la detección de proveedor** si algún remoto usa un dominio no contemplado (proxy corporativo, mirror interno) → Mitigación: el comando avisa y para en vez de asumir un proveedor por defecto; el usuario puede ver el error explícito en vez de un fallo silencioso a mitad de flujo.

## Open Questions

- **Comportamiento real de `--description` con markdown multilínea en `az repos pr create`** - no cambia el enfoque (seguimos pasando el mismo body de tres secciones), pero sí puede cambiar el detalle de cómo se invoca el flag; a resolver probando contra un `az` real durante la implementación.
- **Si `az` recoge `organization`/`project` de `git config` automáticamente** - no afecta al diseño (de todas formas se pasan explícitos por el punto 2), es solo curiosidad a confirmar si se quisiera simplificar más adelante.
