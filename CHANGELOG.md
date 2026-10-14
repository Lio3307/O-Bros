# Changelog

All notable changes to o-bros are listed here. The format follows [Keep a Changelog](https://keepachangelog.com), and versions follow [Semantic Versioning](https://semver.org).

## [Unreleased]

## [0.1.3] - 2026-10-14

### Added
- Keyboard shortcuts to split the focused terminal right (`Ctrl+Shift+D`) and down (`Ctrl+Shift+E`), close the pane (`Ctrl+Shift+W`) and open a new terminal (`Ctrl+Shift+T`). Settings → Shortcuts changes them, and the split buttons show the current keys in their tooltip.
- Dragging the line between split panes is remembered with the session.

### Fixed
- Clicking a button again and again no longer repeats the action. A button is disabled while its action runs (check, download, install, clean up, commit, add account and so on), and a button ignores a second click within a third of a second. Holding down a shortcut such as split no longer opens a stream of terminals.
- Update download and install can only start once, even if triggered twice, and the card shows Downloading at once.
- Reading the process list for the Resource Manager is shared between callers and runs at a lower priority, so it no longer starts several copies of PowerShell or competes with your typing.
- A terminal could run a few columns past the right edge of its pane, over the pane next to it. It now always stays inside its pane.
- Splitting a terminal, or closing one pane of several, restarted the other terminals and lost what you had typed and the shell state (the folder you had changed to, variables). Terminals now stay running when the layout changes.

## [0.1.2] - 2026-10-14

### Added
- Settings → About and updates: after an update is downloaded, **Restart and install** closes o-bros, installs the update and opens it again by itself. If terminals are running something or files are not saved, it tells you first. Your tabs come back as new terminals in the same folders.
- The update section is one card: a green dot and a **Latest** tag when you are up to date, **New** when a version is available, a progress bar while downloading, and **Ready** when it can be installed.
- Stress tests in the end-to-end suite: several terminals at once, closing while terminals print, and a responsive window under heavy output.

### Changed
- Agent buttons in Projects show only the brand icon with a status dot in the corner, so they fit any sidebar width. The name is in the tooltip. Agent names also drop a trailing "Agent" or "CLI" ("Claude Agent" is "Claude").
- The Projects header, agent buttons and the folder row stay in place while you scroll the project list.
- The buttons, dialogs, settings pages and choice rows share one set of components, so they look and behave the same everywhere. The Agents settings page is split into one component per file.

### Fixed
- Terminal output now goes through one listener instead of one per terminal, so many open terminals no longer add work for every chunk of output.
- Opening session replays quickly one after another could show the earlier session's messages. A long session now shows the first 200 messages with a button for more, instead of drawing every message at once.

## [0.1.1] - 2026-10-14

### Fixed
- Agent buttons in Projects no longer lose their icon when the sidebar is narrow, and the terminal button keeps its size.
- Closing the window while a terminal was printing could show a JavaScript error dialog.

### Changed
- Agents found on your computer use the short built-in name ("Claude", "Codex", "Gemini") when we know the command. The registry name is used only for agents we have no name for.

## [0.1.0] - 2026-10-14

First public version.

### Added
- Real terminals with tabs, splits, search, zoom and a finished-command notification.
- Accounts and usage for Claude and Codex, with account switching and Add account.
- Files panel with a right-click menu, name and text search, quick open and recent files.
- CodeMirror editor with 14 languages, snippets, Oxc linting and formatting, and auto save.
- Git changes: stage, unstage, discard, commit, branch switcher and diffs.
- History for Claude and Codex sessions with Resume, day filter and delete.
- Resource Manager with listening ports and Stop.
- Settings → Storage and memory: clear the app cache, leftover temporary files, terminal history, recent files and old saved conversations.
- Settings → About and updates: manual update check and download from GitHub Releases.
- A local log file for crashes and hidden errors, with an Open log folder button.
- Installer packaging for Windows, macOS and Linux through a release workflow.

### Added (agents)
- Settings → Agents: keep a list of agents (Claude, Codex, OpenCode, Gemini, Aider or any command), find them in your PATH using the ACP Registry as the catalog (including a search over every program), give them their own logos, and choose up to two to show as buttons in Projects. No agent button is shown until you choose. Each agent shows whether its command is found (green dot, Connected), and a Custom agent form adds your own command.

### Added (storage)
- Settings → Storage and memory → Where your data lives: every folder o-bros uses, explained, with an Open folder button.

### Added (terminal links)
- Ctrl+click a `file:line:column` reference in a terminal to open that file at that line.

### Changed
- Tabs, Open sessions and Close other tabs now follow the selected project. Terminals of other folders keep running and reappear when their folder is selected.
- The Resource Manager groups terminals by folder and marks the selected project.
- The status bar usage is a short labelled line (`5h 82% 2h33m  wk 37% 4d16h`) instead of a bar and long text, and each provider can be hidden in Settings → Agents.

### Security
- Content-Security-Policy forbids plugins, base URL changes and form posts.
- The window refuses to open new windows or navigate away from the app.
- Usage lookups only accept accounts that were detected on this computer.
