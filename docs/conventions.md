# Conventions

## Layout rules

- Every runnable project lives in `apps/<name>/`: apps and prototypes alike. Names are lowercase-kebab.
- Shared code or data goes in `packages/<name>/`, created only once a second project actually needs it (see [architecture](architecture.md#source-of-truth)).
- Repo-wide docs go in `docs/`. Project-specific docs go in that project's README.
- Each project is self-contained: its own dependency manifest, lockfile, build output and tooling config. Nothing project-specific at the root.

## Every project README must have

1. One line on what it is.
2. **Requirements**: tools and versions needed.
3. **Run**: the exact command(s).
4. **Test**: the exact command(s).
5. **Build / release**, if applicable.
6. **Layout**: the key files and folders.

If a command changes, the README changes in the same commit.

## Adding a project

1. Create `apps/<name>/` with its README (sections above).
2. Add it to the layout table in the root `README.md` and in [architecture](architecture.md).
3. If it introduces a language or framework, write an ADR in `docs/decisions/` first.
4. Add its build output and dependency folders to `.gitignore` if the generic entries don't cover them.

## Decisions (ADRs)

One file per decision: `docs/decisions/NNNN-short-title.md`, numbered in order, never renumbered. Use this template:

```
# NNNN. Title
Date: YYYY-MM-DD
Status: proposed | accepted | superseded by NNNN

## Context
## Decision
## Consequences
```

## Commits

Prefix commit messages with the project they touch, e.g. `mobile: ...`, `web-prototype: ...`, `docs: ...`. Commits that touch several projects use `repo:`.
