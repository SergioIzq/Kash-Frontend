---
name: "OPSX: PR"
description: "Create a pull request from a chosen branch against a chosen base branch"
allowed-tools: Bash(git:*), Bash(gh:*), Bash(az:*)
category: "Workflow"
tags: ["workflow", "pr", "git", "github", "azure-devops", "experimental"]
---

Create a pull request (on GitHub or Azure DevOps, whichever the `origin` remote points to) from a branch the user picks, against a base branch the user picks, with a title and description grounded in what actually changed.

**Input**: Optionally specify the source branch name after `/opsx:pr` (e.g., `/opsx:pr add-dark-mode`). If omitted, ask as described in step 3.

**Steps**

1. **Detect the provider from the `origin` remote**

   Run `git remote get-url origin` and match the URL against these patterns (HTTPS and SSH both count) to determine `<provider>` - either `GitHub` or `AzureDevOps` - and, for Azure DevOps, to extract `<organization>`, `<project>`, and `<repository>`:

   - **GitHub** - URL contains `github.com`:
     - HTTPS: `https://github.com/<owner>/<repo>.git`
     - SSH: `git@github.com:<owner>/<repo>.git`
     - No further parsing needed - `gh` infers owner/repo from the local remote itself, same as today.
   - **AzureDevOps** - URL contains `dev.azure.com` or `.visualstudio.com`:
     - HTTPS (current): `https://dev.azure.com/<organization>/<project>/_git/<repository>`
     - SSH: `git@ssh.dev.azure.com:v3/<organization>/<project>/<repository>`
     - HTTPS (legacy): `https://<organization>.visualstudio.com/<project>/_git/<repository>`
     - Extract `<organization>`, `<project>`, and `<repository>` from whichever pattern matches. These three values feed every `az repos pr` command below - never invent them and never rely on `az`'s own auto-detection of org/project from git config.
   - **Anything else** (GitHub Enterprise Server, an on-prem Azure DevOps Server, or any other host) - stop here. Tell the user the detected remote URL and that this command only supports `github.com` and `dev.azure.com`/`*.visualstudio.com` remotes. Do not guess a provider and do not attempt either flow.

2. **Check prerequisites**

   Branch by `<provider>`:

   - **GitHub**: Run `gh auth status` to confirm the GitHub CLI is installed and authenticated. If it fails, tell the user to run `gh auth login` (or install `gh`) and stop here - do not attempt to create the PR any other way.
   - **AzureDevOps**: Run `az account show` to confirm there's an active Azure session. Then run `az repos pr list --organization "https://dev.azure.com/<organization>/" --project "<project>" --top 1 --output json` to confirm there's actual access to this Azure Repos project (not just a generic Azure login) - the `azure-devops` extension installs automatically on first use of an `az repos` command. If either call fails, tell the user to run `az login` (or `az extension add --name azure-devops` if the extension itself is the problem) and stop here - do not attempt to create the PR any other way, and don't reuse GitHub's error wording for this case.

   Run `git fetch origin --prune` so the branch list and diffs reflect the remote, not stale local state.

3. **List branches and ask for the source (head) branch**

   Run `git branch --all --sort=-committerdate` (local and remote-tracking, deduplicated, most recently active first) and show it to the user.

   - If an argument was given and it matches a real branch, use it directly and skip the question.
   - Otherwise ask exactly:

     *"¿Desde qué rama quieres crear la PR?"*

   Before switching, run `git status --porcelain` on the current branch. If it's dirty, stop and tell the user to commit or stash first - never switch branches over uncommitted work. If clean and the resolved source isn't the current branch, run `git checkout <source-branch>`.

4. **Check for uncommitted changes on the source branch - offer to commit**

   Run `git status --porcelain` again now that you're on `<source-branch>`.

   - **If clean**: continue to the next step.
   - **If dirty**: don't just stop - offer to commit right here, reusing the same "Offer to commit" pattern as `/opsx:archive`:

     a. Ask the user exactly: *"La rama `<source-branch>` tiene cambios sin commitear. ¿Quieres commitearlos ahora? (Sí/No)"*

     - If "No" (or no answer): stop here, same as before - tell the user to commit or stash first (e.g. via `/opsx:archive`'s commit step) and re-run `/opsx:pr`.
     - If "Sí", continue:

     b. **Check the working tree** - run `git status --porcelain` and `git diff --stat` to see what actually changed. Only ever reference files that appear in this output - never invent or assume a file was touched.

     c. **Draft the commit message** - a concise, descriptive title (imperative mood) plus a short summary, grounded only in the output from (b) - never invent a rationale that isn't visible in the diff.

     d. **Show the drafted message to the user and wait for confirmation** (or edits) before touching git. Do not commit on the same turn you propose the message.

     e. **On confirmation, stage only what's relevant to this change** - never a blanket `git add -A`; after staging, run `git status` again and check for anything unrelated or sensitive (`.env`, credentials, keys) before committing:
        ```bash
        git add <relevant files>
        git commit -m "<title>" -m "<summary>"
        ```
        Never pass `--no-verify`, `--no-gpg-sign`, or `--amend`.

     f. After the commit succeeds, continue to the next step. Don't ask about push here - the push in the final PR-creation step already covers it.

5. **List branches again and ask for the target (base) branch**

   Show the branch list from step 3 again, excluding `<source-branch>`. Ask exactly:

   *"¿Contra qué rama quieres fusionar (base)?"*

   You may point out `develop` as the common default if it's in the list, but let the user choose any branch - never assume it.

6. **Verify there's something to merge**

   - Run `git rev-list --count <base>..<source-branch>`. If it's `0`, tell the user there are no commits ahead of `<base>` and stop - there's nothing to open a PR for.
   - Check for an existing open PR on `<source-branch>`, branching by `<provider>`:
     - **GitHub**: `gh pr list --head "<source-branch>" --state open --json number,url,title`.
     - **AzureDevOps**: `az repos pr list --organization "https://dev.azure.com/<organization>/" --project "<project>" --repository "<repository>" --source-branch "<source-branch>" --status active --output json`. Read `pullRequestId` and `title` from each result; build the PR URL the same way as in step 9 (`<repository.webUrl>/pullrequest/<pullRequestId>`, using the `repository.webUrl` field from that same JSON entry). If a given `az` version's list output doesn't include a `repository` object, fall back to `az repos show --repository "<repository>" --organization "https://dev.azure.com/<organization>/" --project "<project>" --output json` and read `webUrl` from there.
   - If an open PR already exists for this branch, show its id/number, title, and URL, and ask whether to stop or continue anyway. Default to stopping - a second PR for the same branch is rarely what's wanted.

7. **Gather real context - never invent it**

   - **Commits**: `git log <base>..<source-branch> --pretty=format:"%h %s"` - the actual commit history being merged.
   - **Archivos modificados**: `git diff <base>...<source-branch> --stat` (three-dot diff, merge-base relative) - only list files that appear in this output.
   - **Motivo de los cambios / Descripción de la solución**: look for an OpenSpec change tied to this branch - an archived or active change whose name matches the branch name or is referenced in the commit messages. If found, read its `proposal.md` (rationale → Motivo) and `design.md`/`tasks.md` (approach taken → Descripción). If no matching change exists, derive both directly from the commit messages and diff instead, and say plainly that they're inferred from commits rather than sourced from planning artifacts - don't dress up an inference as verified rationale.

8. **Draft the PR title and description**

   - **Title**: concise, descriptive, imperative mood (e.g. `Add dark mode toggle to settings`), reflecting what the branch actually does - not a generic label like "changes" or "updates".
   - **Body**, with exactly these three sections:

     ```markdown
     ## Motivo de los cambios
     <why this change was made>

     ## Descripción de la solución
     <what was actually implemented>

     ## Archivos modificados
     - <file 1>
     - <file 2>
     ```

   Show the drafted title and body to the user and wait for confirmation or requested edits before touching git, GitHub, or Azure DevOps.

9. **On confirmation, push and create the PR**

   - If `<source-branch>` has no upstream tracking branch, or is behind its remote, push it: `git push -u origin <source-branch>` (plain `git push` if it already tracks and is just ahead). Never use `--force` or `--force-with-lease`. If the push is rejected, report it and let the user decide - don't force past it. This step is identical for both providers.
   - Create the pull request, branching by `<provider>`:
     - **GitHub**:
       ```bash
       gh pr create --base "<base-branch>" --head "<source-branch>" --title "<title>" --body "<body>"
       ```
       Report the PR URL `gh` returns directly.
     - **AzureDevOps**:
       ```bash
       az repos pr create --organization "https://dev.azure.com/<organization>/" --project "<project>" --repository "<repository>" --source-branch "<source-branch>" --target-branch "<base-branch>" --title "<title>" --description "<body>" --output json
       ```
       Pass `<body>` as a single `--description` value (not multiple space-separated values - the CLI reference states each *separate* value becomes its own line, which is not what we want for a single markdown block with its own line breaks). Read `pullRequestId` and `repository.webUrl` from the returned JSON and build the PR URL as `<repository.webUrl>/pullrequest/<pullRequestId>`.

       This path hasn't been exercised against a real Azure DevOps org yet (no `az` CLI was available while writing this command) - the first time it's used for real, verify that the three-section body actually renders as markdown in the PR description rather than as a flattened single line, and adjust how `--description` is invoked if it doesn't.

**Output**

```markdown
## Pull Request Created

**Provider:** <GitHub | Azure DevOps>
**From:** <source-branch> → **Into:** <base-branch>
**Title:** <title>
**URL:** <pr-url>

<N> commits, <M> files changed.
```

**Output When Nothing To Merge**

```markdown
## Nothing To Merge

`<source-branch>` has no commits ahead of `<base-branch>`. No PR was created.
```

**Guardrails**
- Detect the provider from the `origin` remote before anything else; if the URL doesn't match `github.com` or `dev.azure.com`/`*.visualstudio.com`, stop and tell the user instead of guessing a provider
- For Azure DevOps, always parse `organization`/`project`/`repository` from the remote URL yourself - never invent them and never rely on `az`'s own auto-detection
- Never invent Motivo, Descripción, or Archivos modificados - ground them in `git log`/`git diff` output and, when available, in the actual `proposal.md`/`design.md`/`tasks.md` of a matching OpenSpec change; say plainly when content was inferred from commits rather than sourced from planning artifacts
- Always show the branch list and ask for both source and target - never assume either, even when only one candidate looks obvious
- Never switch branches or push while the working tree has uncommitted changes on the branch you're switching away from (step 3's dirty check)
- If the source branch is dirty after checkout (step 4), offer to commit instead of just stopping - but always show the drafted commit message and wait for explicit confirmation first; never `git add -A`, never `--no-verify`, never `--amend`
- Never force-push
- Show the drafted title/body and wait for explicit confirmation before pushing or creating anything
- Check for an existing open PR on the branch before creating a new one; default to stopping if one exists
- If the provider's CLI (`gh` or `az`) isn't installed or authenticated, stop and tell the user - don't attempt a workaround
- Report the real PR URL returned by `gh` or built from `az`'s JSON output, never a guessed one
