# Changelog

All notable changes to o-bros are listed here. The format follows [Keep a Changelog](https://keepachangelog.com), and versions follow [Semantic Versioning](https://semver.org).

## [Unreleased]

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
