## Why

`/opsx:pr` hoy para en seco en dos casos evitables: si la rama origen tiene cambios sin commitear, obliga al usuario a salir del flujo y commitear a mano; y solo sabe crear PRs contra GitHub (`gh`), aunque parte del trabajo del equipo vive en repos de Azure DevOps. Ambas limitaciones rompen el flujo de "un solo comando para abrir la PR".

## What Changes

- Cuando la rama origen queda sucia tras el checkout (paso 3 actual de `pr.md`), en vez de parar y pedir al usuario que commitee manualmente, el comando ofrece commitear ahí mismo: redacta título+resumen a partir de `git status --porcelain`/`git diff --stat`, muestra el mensaje propuesto y espera confirmación antes de ejecutar `git add`/`git commit` (mismo patrón que el paso "Offer to commit" de `/opsx:archive`; nunca `--no-verify` ni `--amend`). El chequeo de worktree sucio en la rama de partida (paso 2, antes de cambiar a la rama origen) no cambia - sigue parando como hoy.
- El comando detecta el proveedor del remoto `origin` (GitHub vs Azure DevOps) y usa el flujo correspondiente tanto para comprobar autenticación como para crear la PR:
  - **GitHub** (`github.com`, HTTPS o SSH): sigue usando `gh auth status` y `gh pr create` como hoy.
  - **Azure DevOps** (`dev.azure.com` o `*.visualstudio.com`, HTTPS o SSH): comprueba acceso con `az account show` + una llamada de Azure Repos (p.ej. `az repos pr list` contra el proyecto), parsea `organization`/`project`/`repository` de la URL del remoto, y crea la PR con `az repos pr create --organization --project --repository --source-branch --target-branch --title --description`.
  - Cualquier remoto que no matchee ninguno de los dos (GitHub Enterprise Server, Azure DevOps Server on-prem, otros) hace que el comando avise y pare - sin intentar adivinar un flujo.
- El bloque de `**Output**` final se unifica entre proveedores (mismo formato con `**Provider:**`, `**From:**/**Into:**`, `**Title:**`, `**URL:**`), resolviendo la URL de forma distinta por proveedor: `gh pr create` la devuelve directamente; para Azure DevOps se construye como `<repository.webUrl>/pullrequest/<pullRequestId>` a partir del JSON de `az repos pr create`.

## Capabilities

### New Capabilities
_Ninguna - no se introduce comportamiento de producto nuevo._

### Modified Capabilities
_Ninguna - este cambio modifica el comando `/opsx:pr` (`.claude/commands/opsx/pr.md`), que es tooling de flujo de trabajo del repositorio, no una capacidad de la aplicación con spec propio. `skip_specs: true` está declarado en `.openspec.yaml`._

## Impact

- **Archivo afectado**: `.claude/commands/opsx/pr.md` (único archivo a modificar).
- **Dependencias externas nuevas**: `az` CLI (extensión `azure-devops`) como alternativa a `gh` cuando el remoto es Azure DevOps. No se puede probar en este repo/entorno porque `az` no está instalado aquí y el remoto de este proyecto es GitHub - el camino de Azure DevOps queda fundamentado en la documentación oficial (Microsoft Learn) y deberá validarse en un repo real de Azure DevOps antes de darlo por probado.
- **Sin impacto en la aplicación**: no toca código de `Kash-Frontend`, solo el comando de Claude Code.
