---
name: merge-and-push
description: Merge the current feature branch into master (this repo's main branch) and push master and the branch to origin. Checks first, asks for explicit confirmation, never force-pushes, and never touches another checkout's working tree.
disable-model-invocation: true
argument-hint: "[branch]  (defaults to the current branch)"
---

# Merge to master and push

This repo's main branch is **`master`** (there is no `main`). Remote: `origin`.
AGENTS.md forbids pushing to `master` without explicit confirmation, so step 3 is mandatory
even though the user started this skill.

Work from the repository root of the current checkout. If `$ARGUMENTS` names a branch, use it as
`<branch>`; otherwise use the current branch (`git branch --show-current`).

## 1. Preflight (stop and report if any check fails)

- `<branch>` is not `master` and not empty (detached HEAD is not allowed).
- Working tree is clean: `git status --porcelain` prints nothing. If not, list the files and stop;
  do not commit or stash on the user's behalf.
- `git fetch origin` succeeds.
- `<branch>` has commits not on master: `git log --oneline origin/master..<branch>` is not empty.
- Note whether master has moved since the branch was cut: `git log --oneline <branch>..origin/master`.

## 2. Checks

- Typecheck: `npx tsc --noEmit -p .`. Must pass.
- Production build: `npx next build --webpack`. Run it when `node_modules` is present in this
  checkout; in a worktree without `node_modules`, say the build was skipped and why.
- Do not "fix" failures inside this skill. Report them and stop.

## 3. Confirm (required)

Ask with AskUserQuestion, standalone, showing:
- the commits that will land (`git log --oneline origin/master..<branch>`) and `git diff --stat origin/master...<branch>`,
- that a `--no-ff` merge commit will be pushed to `origin/master`, and `<branch>` will be pushed too,
- check results (and anything skipped).

Options: "Merge and push" / "Cancel". Anything other than a clear yes means stop.

## 4. Merge in a temporary worktree

`master` is usually checked out in another worktree, so never `git checkout master` here and never
edit another checkout. Use a throwaway worktree in the scratchpad (or the OS temp dir):

```bash
TMP="<scratchpad>/merge-master-$(date +%s)"
git worktree add --detach "$TMP" origin/master
git -C "$TMP" merge --no-ff <branch> -m "Merge branch '<branch>' into master" -m "Co-Authored-By: <attribution line from the system reminder, if any>"
```

On conflicts: `git -C "$TMP" merge --abort`, remove the worktree, list the conflicting files, and
stop. Suggest merging master into `<branch>` first and resolving there.

## 5. Push (never with --force)

```bash
git push origin <branch>
git -C "$TMP" push origin HEAD:master
```

If the master push is rejected because origin moved: `git fetch origin`, recreate the temporary
worktree from the new `origin/master`, merge again, and retry **once**. If it fails again, stop and
report. Never use `--force` or `--force-with-lease` on master.

## 6. Update local master and clean up

- `git fetch origin`.
- Find a checkout of master with `git worktree list --porcelain`:
  - if one exists and its `git status --porcelain` is empty: `git -C <that path> merge --ff-only origin/master`;
  - if it has local changes, leave it alone and say so;
  - if no checkout has master: `git branch -f master origin/master`.
- `git worktree remove --force "$TMP"` and `git worktree prune`.

## 7. Report

- The merge commit (`git rev-parse --short origin/master`) and the commits it brought in.
- Link: `https://github.com/TanvirHasanHridoy/Job-Master/commits/master`.
- Anything skipped (build, local master not updated) and why.
- Do not delete `<branch>` locally or on the remote unless the user asks.
