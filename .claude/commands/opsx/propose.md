---
name: "OPSX: Propose"
description: "Propose a new change - create it and generate all artifacts in one step"
allowed-tools: Bash(openspec:*)
category: "Workflow"
tags: ["workflow", "artifacts", "experimental"]
---

Propose a new change - create the change and generate all artifacts in one step.

**Planning boundary**: This workflow creates planning artifacts only. The user request that selected or triggered this workflow authorizes planning only, even if it asks to build or fix something. Do not edit project code. After the planning artifacts are complete, stop. Do not start implementation in the same response, even if the initial request asks for it. Wait for a new user request after the artifacts are presented; then start the apply workflow.

I'll create a change with the artifacts your schema defines. With the default spec-driven schema that is:
- proposal.md (what & why)
- `specs/<capability-path>/spec.md` (what the system must do - a delta, not the main spec)
- design.md (how)
- tasks.md (implementation steps)

`<capability-path>` is the spec directory relative to `specs/` (for example, `user-auth` or `identity/user-auth`). Preserve an existing capability's full path and follow the project's established organization for new capabilities.

When the user is ready to implement, they must start the apply workflow explicitly.

---

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `schemas`, `view`). Once selected, treat `--store <id>` as sticky for the rest of the workflow. Every unscoped example of those commands below is shorthand: before running it, append the flag. For example, run `openspec status --change "<name>" --json --store "<id>"`, not the unscoped form shown below. Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: The argument after `/opsx:propose` is the change name (kebab-case), OR a description of what the user wants to build.

**Steps**

1. **Understand the request and clarify material ambiguity**

   If no input is provided, ask the user (open-ended, no preset options):
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

   If the request contains ambiguity that would materially affect scope, externally observable behavior, compatibility, or acceptance criteria, ask the user before creating the change. For minor details, make a reasonable assumption and record it in the planning artifacts.

2. **Determine the workflow schema**

   Use the configured default schema unless the user explicitly requests a different workflow.

   **Use a different schema only if the user:**
   - Explicitly requests a specific schema by name → use `--schema <schema-name>`
   - Asks to "show workflows" or asks "what workflows" exist → resolve the authoritative root by running `openspec context --json` from the current working directory. If the user explicitly selected a registered store, use `openspec context --json --store "<store-id>"`. Then run `openspec schemas --json` with its working directory set to the returned `root.path` and let them choose. This preserves roots selected by a local `store:` pointer or the global `defaultStore`; when a registered store was explicitly selected, append `--store "<store-id>"` to `openspec schemas --json` as well. If context reports only `no_openspec_root`, run `openspec schemas --json` from the current working directory instead. Do not use this fallback for invalid or unavailable stores.

   Otherwise, omit `--schema` to preserve the configured default.

3. **Create the change directory**

   Choose one schema form below. If a registered store is selected, append `--store "<store-id>"` to that command and each later OpenSpec command shown below that accepts `--store`.

   Using the configured default:
   ```bash
   openspec new change "<name>"
   ```

   Using an explicitly requested schema:
   ```bash
   openspec new change "<name>" --schema "<schema-name>"
   ```
   This creates a scaffolded change in the planning home resolved by the CLI with `.openspec.yaml`.

4. **Get the artifact build order**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to get:
   - `applyRequires`: array of artifact IDs needed before implementation (e.g., `["tasks"]`)
   - `artifacts`: list of all artifacts, each with its `status` and its `requires` edges (the artifact IDs it directly depends on)
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context. Use these instead of assuming repo-local paths.

5. **Create every artifact in the required set**

   Use a todo list to track progress through the artifacts.

   Loop through artifacts in dependency order (artifacts with no pending dependencies first):

   a. **For each artifact that is `ready` (dependencies satisfied)**:
      - Get instructions:
        ```bash
        openspec instructions <artifact-id> --change "<name>" --json
        ```
      - The instructions JSON includes:
        - `context`: Project background (constraints for you - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
        - `template`: The structure to use for your output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `skipped`/`warning`: present when the change declares skip_specs and this artifact must NOT be created - stop and pick another artifact
        - `resolvedOutputPath`: Resolved path or pattern to write the artifact
        - `dependencies`: Completed artifacts to read for context
      - Read any completed dependency files for context - always re-read them from disk, even if you saw them earlier in the conversation (the user may have edited them)
      - If the `instruction` field delegates creation to a specific skill or command, invoke it to produce the artifact instead of writing the file yourself, then verify the artifact file exists at `resolvedOutputPath`
      - Otherwise create the artifact file using `template` as the structure and write it to `resolvedOutputPath`. If `resolvedOutputPath` is a glob, follow `instruction` to choose the concrete file path
      - Apply `context` and `rules` as constraints - but do NOT copy them into the file
      - Show brief progress: "Created <artifact-id>"

   b. **Continue until every artifact in the required set exists (not just `apply.requires`)**
      - After creating each artifact, re-run `openspec status --change "<name>" --json`
      - The required set is `applyRequires` plus every artifact reachable from those by following the `requires` edges in `status --json` - walk them transitively (spec-driven closes over proposal, specs, design, tasks). Leave artifacts outside that set alone
      - `status` is file-existence only, so an `applyRequires` artifact reading `done` does NOT mean its dependencies exist - writing `tasks.md` early marks `tasks` done while `specs` was never written. Use each artifact's `requires` edges, not its `status`, to build the required set: a `done` artifact still lists what it depends on
      - An artifact already reading `status: "skipped"` is satisfied: the change declares `skip_specs` in `.openspec.yaml`, so its files must NOT exist. Never try to create one
      - Create every artifact in the required set that is missing, then re-check - creating one can unblock others
      - Skip one only when `status` already reports it `skipped`, or when its own `instruction` says it is conditional: run `openspec instructions <artifact-id> --change "<name>" --json` and skip only if its `instruction` field marks it optional (e.g. "create only if..."). Spec-driven's `design.md` qualifies; `specs` qualifies only via the `skipped` status above, never by your own judgment. Tell the user, and do not reconsider it
      - Dependencies are enablers, not gates: if a required artifact is still `blocked` only because you skipped a conditional dependency, write it anyway
      - Stop when every artifact in the required set is `done`, `skipped`, or was deliberately skipped

   c. **If an artifact requires user input** (unclear context):
      - Ask the user to clarify
      - Then continue with creation

6. **Check for a cross-repo (backend) dependency, and offer a sibling change**

   This only runs when the frontend change actually needs backend behavior that doesn't exist yet - it is never automatic, and it is never assumed by default.

   a. **Ground the check first.** Look only at what you actually wrote in this change's `proposal.md` and `design.md`: did you state a need for a new/changed API endpoint, a field the backend doesn't currently return, or a business rule the backend must enforce? If neither artifact says so, there is no cross-repo dependency - skip the rest of this step silently, do not ask the user about it. Also check the frontend's existing API client/service layer (read it, don't assume) - if what's needed is already covered there, skip too.

   b. **If a dependency is grounded**, summarize the concrete backend contract that's missing (the specific endpoint, payload shape, field, or rule you found while writing the artifacts) and ask exactly:

      > "Este change necesita cambios en el backend: <resumen concreto>. ¿Quieres que cree un change hermano en el repo del backend para pedirlo? (Sí/No)"

   c. **If "No"**, add a brief "Backend dependency" note to the frontend `proposal.md` describing what's needed (so it isn't lost), and move on to step 7. Do not create anything in another repo.

   d. **If "Sí"**, resolve which backend store to use - never guess:
      - Run `openspec store list --json`.
      - If none are registered, tell the user no backend store is registered yet, show them `openspec store register <path-to-backend-repo> --id <id>`, and stop here without creating anything.
      - If exactly one store other than the current root is registered, propose it by name and id and ask the user to confirm - do not assume a single registered store is "the backend" without asking, since a project can register more than one for other reasons.
      - If multiple are registered, list them (id and path) and ask the user to pick.

   e. **Create the sibling change** once a store id is confirmed:
      - Reuse `<name>` unless `openspec list --json --store "<backend-id>"` shows a collision - if it does, ask the user for a distinct name instead of silently renaming.
      - Run `openspec new change "<name>" --store "<backend-id>"`.
      - Fetch `openspec instructions proposal --change "<name>" --json --store "<backend-id>"` and write only that store's `proposal.md`, describing the contract being requested (what & why) strictly from what the frontend artifacts actually state. Do not invent backend implementation details - routes, data models, internal architecture, or how the backend should build it. That is a decision for whoever plans the backend side, not something to fabricate from the frontend.
      - Do not create the sibling's other artifacts (specs/design/tasks) - those require understanding the backend codebase in a way this workflow hasn't verified. Leave them for a follow-up `/opsx:propose "<name>" --store "<backend-id>"` run with backend context, or for the backend team to continue.

   f. **Cross-link both changes** so the dependency is traceable from either side:
      - In the frontend `proposal.md`, note: "Backend dependency: change `<name>` in store `<backend-id>`."
      - In the backend sibling's `proposal.md`, note: "Requested by: change `<name>` in <this repo's name>."

   g. **Carry the result into step 7's summary** - report the sibling change's name, store id, and path, and remind the user its planning isn't complete (only `proposal.md` exists) until the backend side fills in the rest.

7. **Show final status**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

After completing all artifacts, summarize:
- Change name and location
- List of artifacts created with brief descriptions, plus any conditional artifact you skipped and why
- What's ready: "All artifacts needed for implementation are ready."
- If a sibling backend change was created: its name, store id, and path, plus a note that only `proposal.md` exists there so far
- Prompt: "The artifacts are ready for review. When you are ready, run `/opsx:apply`."

**Artifact Creation Guidelines**

- Follow the `instruction` field from `openspec instructions` for each artifact type - it is the authoritative guidance, even for familiar artifact names
- If the `instruction` field directs you to use a specific skill or command to create the artifact, invoke it instead of writing the artifact directly
- The schema defines what each artifact should contain - follow it
- Read dependency artifacts for context before creating new ones
- Use `template` as the structure for your output file - fill in its sections
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
  - Do NOT copy `<context>`, `<rules>`, `<project_context>` blocks into the artifact
  - These guide what you write, but should never appear in the output
- Ground technical details in what you've actually verified - file paths, existing modules, function/component names, current patterns - by reading or searching the codebase before citing them. Don't invent plausible-sounding architecture, dependencies, or file locations
- When an artifact describes something new you're proposing (not something that already exists), say so explicitly - don't blur a proposed addition with a verified fact

**Guardrails**
- The request that invoked this workflow authorizes planning only. Any implementation or apply instruction in that request does not carry forward. Do NOT implement the change, start the apply workflow, or edit project code during this workflow. After presenting the artifacts, stop and wait for a new user request to start the apply workflow
- Create every artifact the apply phase transitively depends on, not just the ids listed in `apply.requires`
- Always read dependency artifacts before creating a new one - re-read from disk, not from conversation memory (files may have changed since you last saw them)
- Ask about ambiguities that would materially change scope, externally observable behavior, compatibility, or acceptance criteria; for minor details, make reasonable assumptions and record them
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next
- Don't invent - every concrete technical claim in an artifact (a file already exists, a pattern is already used, a library is already a dependency) must come from something you actually read or searched this session
- Record "reasonable assumptions" for minor ambiguities as visibly assumptions in the artifact, not disguised as verified fact
- Only offer a sibling backend change when the dependency is grounded in what you actually wrote in this change's own artifacts - never propose one on a hunch, and never skip asking before creating it
- Never assume which registered store is "the backend" - list and confirm, even when only one other store is registered
- In a sibling change, write only `proposal.md`, and only the contract being requested - never invent the backend's implementation, data model, or design on its behalf
- Always cross-link a sibling change from both sides (frontend proposal references it, its proposal references the frontend change) so the dependency stays traceable
