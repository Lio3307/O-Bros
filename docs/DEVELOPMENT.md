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
| `npm run test:e2e` | Build, then start the real app with Playwright and run the smoke tests |

Run `typecheck`, `test` and `build` before you share a change.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and on every pull request. On Windows, Ubuntu and macOS it installs with `npm ci`, then runs `npm run typecheck`, `npm test` and `npm run build`. It does not launch the app, because the runners have no display.

Dependabot (`.github/dependabot.yml`) opens weekly pull requests for npm packages and monthly ones for GitHub Actions. CodeMirror and xterm packages are grouped so they upgrade together. `CHANGELOG.md` lists user-visible changes under Unreleased; move them under a version heading when you tag a release.

The macOS job and the Ubuntu job cover code paths that have not been run by hand (for example the `lsof` port listing), so a failure there is information, not necessarily a mistake in your change.

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

## Smoke tests (end to end)

`e2e/smoke.e2e.ts` starts the built app with Playwright and a throwaway user-data folder, so it never touches your real settings. It checks four things:

1. The project from `settings.json` appears.
2. A plain terminal runs a command (the test checks for a file the command wrote, because the terminal is drawn on a canvas).
3. Quick open finds a file, an edit is typed, and `Ctrl+S` writes it to disk.
4. The Storage and memory page and the About and updates page open.

Run them with `npm run test:e2e`. They open a real window for a few seconds. In CI they run as the `smoke` job on Windows with `continue-on-error`, so a failure shows up but does not block a merge until the job has proved stable.

The file names end in `.e2e.ts` so that `npm test` (Vitest) does not pick them up.

## Tests

Tests sit next to the code (`*.test.ts`). They cover parsers, small decision functions and stores' pure parts: git status parsing, process trees, port parsing, session snapshots, error translation, name validation and settings normalisation.

The interface itself is not covered by automated tests yet.

## Packaging and releases

`electron-builder` reads `electron-builder.yml`. `electron-updater` is the only runtime addition for updates.

| Command | Result |
|---|---|
| `npm run package:dir` | An unpacked app in `release/` for the current system. Quick check that packaging works. |
| `npm run package` | Installers in `release/` (NSIS on Windows, dmg and zip on macOS, AppImage on Linux). |

### Publishing a version

1. Change `version` in `package.json` (for example `0.2.0`) and commit.
2. Tag and push: `git tag v0.2.0` then `git push origin v0.2.0`.
3. `.github/workflows/release.yml` runs on Windows, macOS and Ubuntu. Each job type-checks, tests, builds, packages and uploads its files to a **draft** release on GitHub.
4. Open the draft on GitHub, check the files, and press **Publish release**. The updater only sees published releases.

### How the app updates

Settings → About and updates has **Check for updates**, then **Download**. A downloaded update installs when the app closes, and **Close and install** uses the normal close confirmation. Nothing is checked or downloaded without a button press, and updates are disabled when you run from source.

### Things to know

- **No asar.** `asar: false` keeps `oxlint`, `oxfmt` and `node-pty` as real files so they can be started by path. The cost is a larger folder with many small files.
- **Not signed.** Windows shows a SmartScreen warning for an unsigned installer, and macOS refuses to auto-update an unsigned app and shows a Gatekeeper warning. Signing needs a certificate (Windows) or an Apple Developer account (macOS). Until then macOS users can still download the dmg manually.
- **Icon.** All platforms use `resources/logo.png`. A transparent version would look better in the taskbar and dock.
- **Dependencies.** Only `@lydell/node-pty`, `oxlint`, `oxfmt` and `electron-updater` are runtime dependencies. Everything the interface uses is bundled by Vite, so it sits in `devDependencies` and does not enlarge the installer.
- **Audit.** `npm audit` reports moderate findings inside the `electron-builder` tool chain (`sprintf-js` through `global-agent`). They are build-time only and are not shipped in the app.

## Repository map

| Path | Purpose |
|---|---|
| `src/shared` | Contract and pure helpers |
| `src/main` | Operating-system side |
| `src/preload` | The `window.api` bridge |
| `src/renderer` | The interface |
| `docs` | Guides and the decision journal |
| `AGENTS.md` | Learned conventions for contributors and assistants |
