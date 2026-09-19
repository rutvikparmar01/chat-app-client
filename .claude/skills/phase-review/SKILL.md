---
name: phase-review
description: Perform a senior-software-engineer-level review of the changes made in a completed implementation phase — covering code quality, deployment readiness, and whether previously working features have regressed. Use this whenever the user asks to review a phase, review recent changes, do a code review, check something before moving to the next phase, or check something before deploying. Works in both Node/Express/TypeScript backend repos and React/Vite/TypeScript frontend repos — detect which one you're in from package.json before applying the relevant checklist.
---

# Phase Review

A structured, senior-engineer-style review to run after finishing a phase and before moving to the next one (or before deploying). It checks three things: code quality, deployment readiness, and regressions to already-completed features.

Do not just skim files and give a vibe-based thumbs up. Actually read the diff, actually trace the logic, actually check the things listed below. Flag real problems — do not soften or hide issues to make the phase look more finished than it is.

## Step 1 — Establish the review scope

Determine what changed in this phase:

1. Run `git log --oneline -20` and `git status` to orient.
2. If the user has been committing per-phase, find the last "phase complete" commit/tag and run `git diff <last-phase-commit>..HEAD`. If unclear, ask the user which commit/tag marks the start of this phase — do not guess a range.
3. If there's a `CLAUDE.md` in the repo root, read it — it has the project's task/phase list and (for this project specifically) the REST/Socket.IO API contract both repos are built against. Use it to know what this phase was supposed to deliver and what must not break.

## Step 2 — Detect repo type

Check `package.json`:
- Has `express`, `mongoose`, `socket.io` (server-side) → **backend review checklist**
- Has `vite`, `react`, `@mui/material` → **frontend review checklist**

Apply the matching checklist below. If both indicators are absent, ask the user what kind of project this is rather than guessing.

## Step 3 — Code Quality Review

Applies to both repos:
- **Type safety**: no unnecessary `any`, function signatures and return types are explicit where it aids clarity, shared types aren't duplicated inconsistently between files
- **Error handling**: every async operation (DB call, API call, socket handler) has error handling — not just a bare `try {}` with nothing in `catch`; errors surface a sensible message, not a raw stack trace, to the client
- **Naming & structure**: files live where the project's folder convention says they should (routes/controllers/models on backend; components/pages/context on frontend); names are descriptive, not `data`, `temp`, `handleStuff`
- **No dead code**: no commented-out blocks, unused imports, unused variables, leftover `console.log` debugging statements
- **No duplication**: repeated logic (e.g. the same validation or the same fetch pattern) should be extracted, not copy-pasted across files
- **Secrets**: no hardcoded API keys, JWT secrets, DB URIs, or credentials anywhere in source — must come from `process.env` / `import.meta.env`

### Backend-specific
- Input validation on every route that accepts a body (reject malformed/missing fields with a 400, don't let bad data hit Mongoose)
- Every protected route actually applies the auth middleware — check the route file, don't assume from the folder name
- Every conversation/group/message route independently verifies the requester is a participant/member before returning or mutating data (this must be enforced server-side per the project's API contract, never trust the frontend)
- Socket handlers verify the JWT on connection and use the authenticated `userId` from the socket, not a `userId` trusted from the client payload
- Mongoose schemas have appropriate types, required fields, and indexes on fields that get queried often (e.g. `email`, `username`)

### Frontend-specific
- No API URLs or secrets hardcoded — everything routes through `VITE_API_URL` / `VITE_SOCKET_URL`
- Every API call has a loading state and an error state actually rendered to the user, not just swallowed in a `.catch(console.error)`
- Auth token is attached consistently (axios instance + socket `auth`), and there's no path where a protected page renders before the auth check resolves
- No prop-drilling nightmares or duplicated fetch logic that should live in `api/` or context

## Step 4 — Deployment Readiness

### Backend (targets Render)
- `npm run build` (TypeScript compile) succeeds with zero errors — actually run it, don't assume
- `npm start` runs the compiled `dist/` output, not `ts-node-dev` (that's dev-only)
- `PORT` is read from `process.env.PORT`, never hardcoded — Render assigns this dynamically
- CORS is scoped to `process.env.CLIENT_URL`, not `*`, given JWT/credentials are in play
- `.env` is in `.gitignore` and was not accidentally committed (`git log --all --full-history -- .env` should be empty)
- All dependencies the code actually imports are in `package.json` `dependencies` (not just installed locally and missing from the manifest — this is a classic "works on my machine, breaks on Render" bug)
- No file system writes to paths that won't exist/persist on Render's ephemeral filesystem

### Frontend (targets Vercel)
- `npm run build` succeeds with zero errors
- No `VITE_*` env var is missing a fallback that would silently break in production if unset
- Routing works with client-side routing on a static host (check `vercel.json` rewrite/rest fallback exists if using React Router, so deep links don't 404 on refresh)
- No dev-only code (e.g. `localhost` URLs) left as a fallback that could leak into production

## Step 5 — Regression Check

The goal here: confirm this phase didn't quietly break something from an earlier phase.

1. From `CLAUDE.md`'s task list, list every feature marked complete in *previous* phases.
2. Check the diff for files touched that are shared with those earlier features (e.g. shared middleware, shared types, the Message model, the socket connection setup, AuthContext).
3. For each shared file touched, trace through: does the earlier feature's code path still work with this change? Look for signature changes, renamed fields, altered response shapes — anything that would break a consumer that wasn't updated in this diff.
4. If the API contract (REST routes or Socket.IO event names/payloads) changed in one repo, confirm the other repo was updated to match — these two repos depend on each other and this is the most common place regressions hide.
5. If there are no automated tests, say so explicitly in the report rather than silently skipping this check — recommend which flows most need a manual smoke test before moving on.

## Step 6 — Produce the Report

Output a structured report, in this shape:

```
# Phase Review — <phase name/number>

## Verdict: ✅ Ready to proceed | ⚠️ Proceed with caution | ❌ Blocking issues found

## Code Quality
- ✅/⚠️/❌ <finding> — <file:line if applicable>
...

## Deployment Readiness
- ✅/⚠️/❌ <finding>
...

## Regression Check
- ✅/⚠️/❌ <finding — which earlier feature, what changed, why it's safe or at risk>
...

## Blocking Issues (must fix before next phase/deploy)
1. ...

## Recommendations (non-blocking, worth doing)
1. ...
```

Be direct about severity — don't bury a blocking auth bypass under a pile of minor style notes. Lead the report with the verdict and the blocking issues, details after.
