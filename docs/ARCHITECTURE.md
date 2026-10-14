# Architecture

o-bros is an Electron app written in TypeScript. This page explains how the pieces fit together so you can find your way around the code.

## The three processes

```
+---------------------------+        IPC (typed)        +---------------------------+
|  Renderer (React UI)      |  <--------------------->  |  Main (Node.js)           |
|  src/renderer             |      via window.api       |  src/main                 |
|  no Node access           |                           |  files, git, terminals,   |
+---------------------------+                           |  processes, accounts      |
              ^                                         +---------------------------+
              |  exposes window.api
+---------------------------+
|  Preload                  |
|  src/preload              |
+---------------------------+
```

| Process | Folder | Responsibility |
|---|---|---|
| Main | `src/main` | Everything that touches the operating system: terminals, files, git, process tables, accounts, usage requests. |
| Preload | `src/preload` | A thin bridge. It turns each IPC channel into a function on `window.api`. It holds no logic. |
| Renderer | `src/renderer` | The React interface. It never imports Node. It can only ask the main process for things through `window.api`. |
| Shared | `src/shared` | Types, IPC channel names and pure helper functions used by both sides. |

The window is created with `contextIsolation` on, `nodeIntegration` off and the sandbox on.

## The IPC contract

All communication is declared once, in `src/shared/ipc.ts`:

- `IpcChannel` lists every channel name.
- `DesktopApi` describes `window.api`: one group per area (`pty`, `files`, `git`, `history`, `accounts`, `usage`, `projects`, `resources`, `tools`, `shell`, `ports`, `app`).

Adding a capability always touches the same four places: the contract, the preload bridge, an `ipc` handler in `src/main/ipc`, and a service in `src/main/services`. See [Development](DEVELOPMENT.md).

## Main process layout

| Folder | What lives there |
|---|---|
| `src/main/ipc` | One small file per area. Each only registers handlers and calls a service. |
| `src/main/services` | The real work: `ptyManager`, `fileService`, `entryService`, `gitService`, `gitActions`, `sessionHistory`, `accountScanner`, `scriptService`, and so on. |
| `src/main/services/usage` | Reading each provider's saved login and asking for usage numbers. |
| `src/main/services/resources` | Process table, resource snapshot, listening ports, background process detection. |
| `src/main/services/tools` | Running the bundled `oxlint` and `oxfmt` command-line tools. |
| `src/main/pathGuard.ts` | Refuses any file path outside the folders you added. |
| `src/main/closeGuard.ts` | Holds a window close until the renderer confirms. |

## Renderer layout

| Folder | What lives there |
|---|---|
| `src/renderer/shell` | The frame: title bar, rail, side panel, main area, status bar. |
| `src/renderer/features` | One folder per feature: `terminal`, `files`, `editor`, `changes`, `history`, `projects`, `settings`, `resources`, `problems`, `shutdown`. |
| `src/renderer/state` | Zustand stores. A store holds data and actions; it has no markup. |
| `src/renderer/ui` | Small shared components: popup menu, toasts, confirm dialog, buttons. |
| `src/renderer/styles` | Design tokens and base styles (black and white, no gradients). |

### Shared components (`src/renderer/ui`)

Use these before writing new markup, so every screen looks and behaves the same.

| Component | Use it for |
|---|---|
| `Button` | Every button. Variants: `outline`, `primary`, `icon`, `link`, `remove`. Defaults to `type="button"`. |
| `Modal` | Every dialog: backdrop, title, content, action buttons and the Escape key. Pass `onSubmit` for a form. |
| `SettingsPageLayout` | The title, description and header buttons of a settings page. |
| `SettingsSection` | A titled block inside a settings page, with an optional description and action. |
| `SegmentedControl` | A row of choices where one is selected (lint mode, history lines, usage view). |
| `PanelHeader`, `PopupMenu`, `RefreshButton`, `EditableTitle` | Side panel header, right-click and popup menus, refresh buttons, rename in place. |
| `AgentIcon`, `AgentStatusBadge`, `ProviderMark` | Brand marks and the Connected / Signed in status. |

A page with more than about 150 lines is split into one component per file in a folder next to it, as `features/settings/agents/` does for the Agents page.

### State

Each store is a small Zustand store with one job (`workspaceStore` for tabs, `projectsStore` for folders, `changesStore` for git, `toastStore` for messages, and so on). Components read from stores with selectors; stores call `window.api`.

### What is saved, and where

| Data | Where |
|---|---|
| Project folders | `settings.json` in the Electron user-data folder (main process) |
| Editor settings, terminal settings, session, recent files | Browser `localStorage` of the renderer, under keys that start with `o-bros.` |
| Terminal output, file contents, git data | Not stored. Read on demand. |

## How a terminal works

1. `TerminalView` creates an xterm.js `Terminal` and asks the main process for a PTY with the same id.
2. `ptyManager` spawns the shell with node-pty, batches output every 8 ms and sends it back.
3. Keystrokes go to the PTY; resize events follow the pane size.
4. A non-default account is selected only by setting `CLAUDE_CONFIG_DIR` or `CODEX_HOME` on the spawned process.

## How memory stays low

- A terminal is created when its tab is first shown, not when it is restored.
- The WebGL renderer is released while a terminal is hidden.
- Scrollback is limited (default 2,000 lines) and configurable.
- The editor and every language pack are loaded on demand.
- No file watcher, language server or search index runs in the background.
- Linting and formatting run as short-lived processes.
- Search and process lists are computed when asked for.

## Design rules

The code follows the rules in `AGENTS.md`: no comments, no regular expressions in logic, one responsibility per file, shared helpers instead of duplicates, and clear names. The reasons behind larger choices are recorded in [decisions](decisions.md).
