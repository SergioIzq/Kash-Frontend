---
name: "OPSX: PR"
description: "Create a pull request from a chosen branch against a chosen base branch"
allowed-tools: Bash(git:*), Bash(gh:*)
category: "Workflow"
tags: ["workflow", "pr", "git", "experimental"]
---

Create a GitHub pull request from a branch the user picks, against a base branch the user picks, with a title and description grounded in what actually changed.

**Input**: Optionally specify the source branch name after `/opsx:pr` (e.g., `/opsx:pr add-dark-mode`). If omitted, ask as described in step 2.

**Steps**

1. **Check prerequisites**

   Run `gh auth status` to confirm the GitHub CLI is installed and authenticated. If it fails, tell the user to run `gh auth login` (or install `gh`) and stop here - do not attempt to create the PR any other way.

   Run `git fetch origin --prune` so the branch list and diffs reflect the remote, not stale local state.

2. **List branches and ask for the source (head) branch**

   Run `git branch --all --sort=-committerdate` (local and remote-tracking, deduplicated, most recently active first) and show it to the user.

   - If an argument was given and it matches a real branch, use it directly and skip the question.
   - Otherwise ask exactly:

     *"¿Desde qué rama quieres crear la PR?"*

   Before switching, run `git status --porcelain` on the current branch. If it's dirty, stop and tell the user to commit or stash first - never switch branches over uncommitted work. If clean and the resolved source isn't the current branch, run `git checkout <source-branch>`.

3. **Check for uncommitted changes on the source branch**

   Run `git status --porcelain` again now that you're on `<source-branch>`. If it isn't clean, warn the user and stop - a PR should reflect committed work only. Suggest committing first (e.g. via `/opsx:archive`'s commit step) and re-running `/opsx:pr`.

4. **List branches again and ask for the target (base) branch**

   Show the branch list from step 2 again, excluding `<source-branch>`. Ask exactly:

   *"¿Contra qué rama quieres fusionar (base)?"*

   You may point out `develop` as the common default if it's in the list, but let the user choose any branch - never assume it.

5. **Verify there's something to merge**

   - Run `git rev-list --count <base>..<source-branch>`. If it's `0`, tell the user there are no commits ahead of `<base>` and stop - there's nothing to open a PR for.
   - Run `gh pr list --head "<source-branch>" --state open --json number,url,title`. If an open PR already exists for this branch, show its number, title, and URL, and ask whether to stop or continue anyway. Default to stopping - a second PR for the same branch is rarely what's wanted.

6. **Gather real context - never invent it**

   - **Commits**: `git log <base>..<source-branch> --pretty=format:"%h %s"` - the actual commit history being merged.
   - **Archivos modificados**: `git diff <base>...<source-branch> --stat` (three-dot diff, merge-base relative) - only list files that appear in this output.
   - **Motivo de los cambios / Descripción de la solución**: look for an OpenSpec change tied to this branch - an archived or active change whose name matches the branch name or is referenced in the commit messages. If found, read its `proposal.md` (rationale → Motivo) and `design.md`/`tasks.md` (approach taken → Descripción). If no matching change exists, derive both directly from the commit messages and diff instead, and say plainly that they're inferred from commits rather than sourced from planning artifacts - don't dress up an inference as verified rationale.

7. **Draft the PR title and description**

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

   Show the drafted title and body to the user and wait for confirmation or requested edits before touching git or GitHub.

8. **On confirmation, push and create the PR**

   - If `<source-branch>` has no upstream tracking branch, or is behind its remote, push it: `git push -u origin <source-branch>` (plain `git push` if it already tracks and is just ahead). Never use `--force` or `--force-with-lease`. If the push is rejected, report it and let the user decide - don't force past it.
   - Create the pull request:
     ```bash
     gh pr create --base "<base-branch>" --head "<source-branch>" --title "<title>" --body "<body>"
     ```
   - Report the PR URL `gh` returns.

**Output**

```markdown
## Pull Request Created

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
- Never invent Motivo, Descripción, or Archivos modificados - ground them in `git log`/`git diff` output and, when available, in the actual `proposal.md`/`design.md`/`tasks.md` of a matching OpenSpec change; say plainly when content was inferred from commits rather than sourced from planning artifacts
- Always show the branch list and ask for both source and target - never assume either, even when only one candidate looks obvious
- Never switch branches, push, or create a PR while the working tree has uncommitted changes
- Never force-push
- Show the drafted title/body and wait for explicit confirmation before pushing or creating anything
- Check for an existing open PR on the branch before creating a new one; default to stopping if one exists
- If `gh` isn't installed or authenticated, stop and tell the user - don't attempt a workaround
- Report the real PR URL returned by `gh`, never a guessed one
