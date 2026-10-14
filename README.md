<p align="center">
  <img src="resources/logo.png" alt="O-BROS logo" width="140">
</p>

<h1 align="center">O-BROS</h1>

[![CI](https://github.com/Lio3307/O-Bros/actions/workflows/ci.yml/badge.svg)](https://github.com/Lio3307/O-Bros/actions/workflows/ci.yml)

A terminal-first desktop workspace for the **Claude** and **Codex** command-line tools.

o-bros puts real terminals, a code editor, git changes, session history and your usage limits in one window, and it keeps memory use low by doing most work only when you ask for it.

> **Status:** early version. Built and tested on Windows 11. macOS and Linux code paths exist but have not been tested. Installers are built by a release workflow once a version is published; until then you run it from source.

## What you get

- **Real terminals** with tabs and splits (xterm.js and node-pty). Start `claude`, `codex` or a plain shell in any project folder.
- **Accounts and usage.** Detects your Claude and Codex logins on this computer, lets you switch between them, and shows 5-hour and weekly usage in the status bar.
- **Files and editor.** A file tree with a right-click menu, name and text search, quick open (`Ctrl+P`) and a CodeMirror editor with snippets, linting and formatting for JavaScript and TypeScript, auto save and 14 languages.
- **Git changes.** Stage, unstage, discard and commit, switch branches, fetch, and read diffs.
- **Session history and Resume.** Browse your Claude and Codex conversations by day, resume one in a terminal with a click, and delete old ones.
- **Development helpers.** Run `package.json` scripts, see problems from the linter, see and stop listening ports, and get a notification when a long command finishes.
- **Resource Manager.** See how much memory and CPU each terminal and the app use.
- **Storage and memory.** One settings page that shows what is safe to clear (app cache, leftover temp files, terminal history, recent files) and clears it with a button.

## Download

Installers for Windows, macOS and Linux are attached to each version on the [Releases page](https://github.com/Lio3307/O-Bros/releases). The app is not code-signed yet, so Windows may show a SmartScreen warning and macOS will ask you to confirm opening it. Updates are checked only when you press the button in Settings → About and updates. Uninstalling removes the program but keeps your settings, so a reinstall keeps your setup. Settings → Storage and memory shows every folder o-bros uses.

## Quick start

You need [Node.js](https://nodejs.org) and [git](https://git-scm.com). The Claude and Codex command-line tools are optional but are the point of the app.

```
git clone https://github.com/Lio3307/O-Bros.git
cd O-Bros
npm install
npm run dev
```

Then choose **Open a folder** in the Projects panel and press **Claude**, **Codex** or the terminal button.

If `npm install` leaves Electron without its binary, run `node node_modules/electron/install.js`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app with hot reload |
| `npm run build` | Builds the main, preload and renderer bundles into `out/` |
| `npm run typecheck` | Type-checks the main side and the renderer |
| `npm test` | Runs the unit tests |
| `npm run package` | Builds installers into `release/` |

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `Ctrl+P` | Quick open a file by name (shows recent files when empty) |
| `Ctrl+F` | Search inside the focused terminal |
| `Ctrl` `+` / `-` / `0` | Zoom terminal text in, out, reset |
| `Ctrl+S` | Save the open file (formats first if enabled) |
| `Shift+Alt+F` | Format the open file |
| `F2` / `Del` | Rename / delete the selected item in the file tree |

## Documentation

| Document | For |
|---|---|
| [Getting started](docs/GETTING-STARTED.md) | First run, step by step |
| [Features](docs/FEATURES.md) | Every feature and every setting |
| [Architecture](docs/ARCHITECTURE.md) | How the app is built |
| [Development](docs/DEVELOPMENT.md) | Working on the code |
| [Privacy and security](docs/PRIVACY-AND-SECURITY.md) | What o-bros reads, writes and sends |
| [Decisions](docs/decisions.md) | Why things are the way they are, and known risks |
| [Contributing](CONTRIBUTING.md) | How to propose a change |

## Privacy in one paragraph

o-bros never asks for your password and never stores your tokens. It reads the login files your Claude and Codex tools already saved, uses them only to ask each provider for your own usage numbers, and keeps nothing. Everything else stays on your computer. Details are in [Privacy and security](docs/PRIVACY-AND-SECURITY.md).

## Known limits

- Usage numbers come from endpoints the providers do not document. They may change or stop working.
- Formatting uses `oxfmt`, which is not yet 1.0, and supports JavaScript, TypeScript, JSON, CSS, HTML, Markdown and YAML only.
- Resume starts `claude --resume` or `codex resume` in a terminal and relies on the CLI finding the session; if the project folder was moved or deleted, resume will not work.
- Installers are not code-signed. macOS cannot auto-update an unsigned app (download manually). See [Development](docs/DEVELOPMENT.md).

## License

MIT. See [LICENSE](LICENSE).
