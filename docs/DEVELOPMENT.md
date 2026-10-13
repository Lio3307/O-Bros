# Development

How to build, test and change o-bros.

## Requirements

- Node.js and npm (the project was developed on Node 24).
- git.
- No Python or build tools are needed. Native parts ship as prebuilt binaries (`@lydell/node-pty`).

## Everyday commands

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Run the app with hot reload |
| `npm run build` | Production build into `out/` |
| `npm run typecheck` | Type-check both the main side and the renderer |
| `npm test` | Run the unit tests (Vitest) |
| `npm audit` | Check dependencies for known problems |

Run `typecheck`, `test` and `build` before you share a change.

## Troubleshooting

| Problem | Fix |
|---|---|
| Electron fails to start after install | `node node_modules/electron/install.js` |
| Terminal does not open | Check that the shell exists (`powershell.exe` on Windows, `$SHELL` elsewhere) |
| Git actions fail | Run `git config user.name` and `git config user.email` once |

## Project conventions

These come from `AGENTS.md` and apply to every change:

1. **No comments in code.** Express intent with names and small functions.
2. **No regular expressions in logic.** Use `startsWith`, `includes`, `split`, `indexOf` and named helpers.
3. **One responsibility per file.** Reuse helpers in `src/shared` instead of copying.
4. **Provider accounts are read-only.** o-bros never signs in, stores tokens or edits CLI settings. The only write is creating an empty account folder.
5. **Prefer packages with prebuilt binaries.** Nothing that needs node-gyp or Python.
6. **No raw system messages on screen.** Errors go through `friendlyErrorMessage`.
7. **Black and white UI, no gradients.**

## Adding a capability

Say you want a new action that needs the operating system, for example "count lines in a file".

1. **Types.** Add request and result types to `src/shared/types.ts`.
2. **Contract.** Add a channel name to `IpcChannel` and a method to `DesktopApi` in `src/shared/ipc.ts`.
3. **Service.** Write the logic in `src/main/services`. Check paths with `assertInsideProjectRoots`.
4. **Handler.** Register it in a file under `src/main/ipc` and make sure `src/main/index.ts` calls the registration.
5. **Bridge.** Add the method in `src/preload/index.ts`.
6. **UI.** Call `window.api` from a store or component under `src/renderer`.
7. **Tests.** Put pure logic in a small function and test it next to the file.
8. **Record.** If the change has a trade-off, add an entry to `docs/decisions.md`.

## Tests

Tests sit next to the code (`*.test.ts`). They cover parsers, small decision functions and stores' pure parts: git status parsing, process trees, port parsing, session snapshots, error translation, name validation and settings normalisation.

The interface itself is not covered by automated tests yet.

## Packaging

There is no installer yet. When you add one, note:

- `oxlint` and `oxfmt` are started from `node_modules` by file path, so they must be unpacked from any asar archive (for example with `asarUnpack` for `node_modules/oxlint` and `node_modules/oxfmt`).
- `@lydell/node-pty` also needs its native files unpacked.
- Code signing and auto-update are not set up.

## Repository map

| Path | Purpose |
|---|---|
| `src/shared` | Contract and pure helpers |
| `src/main` | Operating-system side |
| `src/preload` | The `window.api` bridge |
| `src/renderer` | The interface |
| `docs` | Guides and the decision journal |
| `AGENTS.md` | Learned conventions for contributors and assistants |
