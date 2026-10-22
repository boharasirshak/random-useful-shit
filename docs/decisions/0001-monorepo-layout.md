# 0001. Monorepo layout
Date: 2026-10-22
Status: accepted (server dropped by 0002)

## Context

The calorie tracker started as a static web prototype. Next up are a cross-platform offline app and a lightweight server. They share product logic (menu data, the weight model), and the languages for each aren't chosen yet.

## Decision

- One repo. Every runnable project goes in `apps/<name>/`: `web-prototype`, `mobile`, `server`.
- The prototype is kept unchanged as the reference implementation and backup.
- No monorepo build tool or workspace manager yet. Those are language-specific, and we'll pick one when the stacks are chosen.
- `packages/` is created only once a second project needs shared code or data.

## Consequences

- Each project is run from its own folder with its own tooling. Root commands come later, if they're ever worth it.
- Picking the app or server stack means a new ADR, and possibly adopting a workspace tool at that point.
- The prototype's `model.js` and `check.js` act as the behavior spec for the weight model in every port.
