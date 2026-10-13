# Decisions

### Application shell and terminal stack
- Scope and goal: Desktop app that runs the Claude and Codex CLIs in real terminals, with low memory use and code the owner can read quickly.
- Choice and authority: Electron, React, TypeScript, `@xterm/xterm` with `@lydell/node-pty`, CodeMirror 6, Zustand; user-selected (Electron, xterm, no vim-style editor, memory friendly) with the remaining libraries agent-selected within that direction.
- Evidence: Conversation requirements. Dependencies resolved and installed. `npm audit` reported 13 findings on the first versions (electron 33, vite 5, vitest 2, electron-vite 2); every automatic fix required a major bump (`--force`), so the direct dependencies were raised by hand to a compatible set: electron 44, electron-vite 5, vite 7, @vitejs/plugin-react 5, vitest 5. vite 8 and plugin-react 6 were not used because electron-vite 5 supports vite up to 7. `npm audit` now reports 0 vulnerabilities.
- Alternatives and sacrifice: Tauri (smaller, but different webviews and a Rust PTY layer) and Monaco (richer, but heavier). Accepted a larger baseline memory for one Chromium and a simpler editor without IntelliSense.
- Residual risk/debt: `@lydell/node-pty` prebuilt compatibility with the chosen Electron version is unverified. Packaging (`electron-builder`, native module unpacking) is not set up.
- Mitigation and revisit trigger: Run `npm install` and a first launch before building more. Reopen if the prebuilt binary fails for the installed Electron.
- Recovery and ownership: Swap the PTY package behind `src/main/services/ptyManager.ts`; owner not assigned.
- Implementation / validation / outcome: Written / after the upgrade: `npm run typecheck` clean, `npm test` 26 passed, `npm run build` succeeded, `npm audit` 0 vulnerabilities. The app has not been launched and the PTY prebuilt has not been exercised at runtime / not observed.
- Result acceptance: Pending user feedback.
- Learning: Native modules must ship prebuilds because the user has no Python.

### Provider accounts are read-only
- Scope and goal: Show accounts and usage for Claude and Codex without handling credentials.
- Choice and authority: Detect config folders in the home directory (`~/.claude*`, `~/.codex*`); select an account with `CLAUDE_CONFIG_DIR` or `CODEX_HOME`; the system default account gets no override. User-selected.
- Evidence: `src/main/services/accountScanner.ts`, `accountEnvironment.ts`. The location of the email in `~/.claude.json` (`oauthAccount.emailAddress`) is an assumption and falls back to the folder name.
- Alternatives and sacrifice: A sign-in flow inside o-bros was rejected. Accounts that live outside the home directory are not detected.
- Residual risk/debt: Codex accounts show the folder name only. A folder named `.claude-*` that is not an account would be listed.
- Mitigation and revisit trigger: Reopen when a real account layout contradicts the scanner.
- Recovery and ownership: Scanner is isolated in one file; owner not assigned.
- Implementation / validation / outcome: Written / not run / not observed.
- Result acceptance: Pending user feedback.
- Learning: Never set a config-dir variable for the system default account, or the CLI looks for its settings in the wrong file.

### Usage windows (5 hours and weekly)
- Scope and goal: Show percent used and time until reset for both windows.
- Choice and authority: Read the access token each CLI already saved (`<config folder>/.credentials.json` for Claude, `<config folder>/auth.json` for Codex) and query the provider's own usage endpoint (`api.anthropic.com/api/oauth/usage`, `chatgpt.com/backend-api/wham/usage`). User-selected after asking for the same behaviour as Orca; implementation approach taken from Orca's open source (MIT) `src/main/rate-limits`.
- Evidence: Real calls from this machine returned Claude 5h 49% / weekly 7% and Codex weekly 16% (Codex has no 5 hour window on this plan). The endpoints answered with the honest `o-bros/0.1.0` User-Agent; Orca's `claude-code` / `Codex Desktop` impersonation was not needed.
- Alternatives and sacrifice: Parsing local session files gives token counts, not plan limits. Spawning the CLIs gives no usage numbers. Chosen path depends on undocumented endpoints.
- Residual risk/debt: Both endpoints are undocumented and may change or be restricted by the providers' terms. Tokens are read-only, used only against the provider's own host, never sent to the renderer, never refreshed. macOS keychain logins are not read. Not verified for managed `.claude-*` accounts.
- Mitigation and revisit trigger: Failures surface as a visible message, not a number. Reopen if a provider changes the response or blocks non-official clients.
- Recovery and ownership: Isolated in `src/main/services/usage/`; owner not assigned.
- Implementation / validation / outcome: Written and checked with real calls / parsers covered by 7 tests / usage displayed in the app not yet observed by the user.
- Result acceptance: Pending user feedback.
- Learning: Never send a stored token anywhere except the provider that issued it, and never log it.

### Scope kept out of the first version
- Scope and goal: Keep the first implementation small and readable.
- Choice and authority: Agent-selected within the user's request to implement the Framer design.
- Evidence: Not built: runtime schema validation of IPC input (`zod`), file watching, MessagePort transport for PTY output, Codex history, persistence of the selected account, back/forward navigation arrows, extra settings pages (Agents, Usage, General, Keybindings).
- Alternatives and sacrifice: Fewer dependencies and less code against missing live updates and weaker input validation.
- Residual risk/debt: IPC handlers trust the typed contract; path checks exist only for file and git access. The file tree and Changes panel refresh on demand only.
- Mitigation and revisit trigger: Add `zod` when an IPC input becomes complex; add a watcher when stale file lists become a complaint; move PTY output to MessagePort if large output freezes the UI.
- Recovery and ownership: Each item is independent; owner not assigned.
- Implementation / validation / outcome: Not started / not applicable / not observed.
- Result acceptance: Pending user feedback.
- Learning: User prefers fewer moving parts over speculative infrastructure.

### Editor languages, snippets, Oxc linter and formatter
- Scope and goal: Choose editor languages, add snippets, and lint and format JavaScript and TypeScript with Oxc.
- Choice and authority: User-requested. `oxlint` and `oxfmt` run as bundled CLIs from the main process through `ELECTRON_RUN_AS_NODE`; the renderer calls them over `tools:lint` and `tools:format`. Snippets are a CodeMirror completion source fed from a renderer settings store.
- Evidence: Run on this machine through electron-as-node: oxlint 1.87.0 returned JSON diagnostics with line and column; oxfmt 0.72.0 formatted from stdin. oxlint has no stdin mode, so unsaved text is linted from a temporary copy that is always deleted. oxfmt cannot format C++ or Python, so those languages show no formatter.
- Alternatives and sacrifice: The Oxc npm bindings or a WASM build were not used because they are less documented than the CLIs. A process per lint costs start-up time (about a second) and CPU in exchange for no resident memory.
- Residual risk/debt: oxfmt is pre-1.0 and its output may change. Packaging needs `asarUnpack` for `node_modules/oxlint` and `node_modules/oxfmt`; it is not set up. Language, linter, formatter and snippet settings are read when a file opens, except lint mode and format-on-save, which are read at action time.
- Mitigation and revisit trigger: Reopen when oxfmt reaches 1.0 or when packaging is added.
- Recovery and ownership: Isolated in `src/main/services/tools/` and `src/renderer/features/editor/`; owner not assigned.
- Implementation / validation / outcome: Written / typecheck, 74 tests, build, audit clean; both tools exercised through electron-as-node / editor behaviour not yet observed by the user.
- Result acceptance: Pending user feedback.
- Learning: A tool without stdin support needs a temporary file; always clean it in `finally`.

### Memory behaviour
- Scope and goal: Keep o-bros light while many terminals are open.
- Choice and authority: User-requested. Terminals mount only after their tab is first shown; the WebGL renderer is released while a terminal is hidden; scrollback defaults to 2000 lines and is a setting; the code editor and each language pack load on demand; no file index is kept (quick open searches on demand).
- Evidence: Reasoned from the code paths. Not measured: no before and after numbers exist.
- Alternatives and sacrifice: Smaller scrollback loses old output. Releasing WebGL costs a short redraw when returning to a terminal. Terminals restored from a saved session start only when opened.
- Residual risk/debt: Every started terminal still holds an xterm instance and a shell process. Hidden terminals keep their text buffers.
- Mitigation and revisit trigger: Compare the Resource Manager before and after on a real workload; reopen if a started terminal costs more than expected.
- Recovery and ownership: Each change is local to `TerminalView.tsx`, `TerminalWorkspace.tsx` and `terminalSettingsStore.ts`; owner not assigned.
- Implementation / validation / outcome: Written / typecheck and build clean / memory effect not measured.
- Result acceptance: Pending user feedback.
- Learning: Report memory gains as unmeasured until the Resource Manager shows numbers.

### Tabs, session restore, quick open, terminal search, finished notifications
- Scope and goal: Close tabs safely, reorder and find tabs, restore the last session, jump to files, search a terminal, and learn when a long command stops.
- Choice and authority: User-requested ("all" of the suggested list). `@xterm/addon-search` and `@codemirror/autocomplete` were added with that request.
- Evidence: Session snapshot, tab order, activity classification, editor settings and lint position mapping are covered by unit tests (74 total). The interface itself has not been run.
- Alternatives and sacrifice: Unsaved-changes prompt uses `window.confirm` (plain, blocking) instead of a styled dialog. Closing the whole window does not prompt. Restored terminals open as plain shells in the same folder; they never re-run `claude` or `codex`. Finished-command detection is a heuristic (8 s of output then 4 s of silence), not knowledge of the process. Ctrl+P and Ctrl+F are captured by o-bros and no longer reach the shell.
- Residual risk/debt: Session is stored in localStorage and saved 0.5 s after the last change. Notifications depend on the operating system allowing them.
- Mitigation and revisit trigger: Replace the heuristic with a shell integration marker if false alarms appear; replace `confirm` with a dialog when the look matters.
- Recovery and ownership: Files under `src/renderer/features/terminal/` and `src/renderer/state/`; owner not assigned.
- Implementation / validation / outcome: Written / unit tests and build pass / not observed by the user.
- Result acceptance: Pending user feedback.
- Learning: Features that capture a shortcut must say which shell shortcut they take over.

### Duplicate project folders and Add account
- Scope and goal: Adding a folder that is already in the sidebar must not duplicate it, and the accounts page gets an Add account button.
- Choice and authority: User-requested. The main process compares the chosen folder with saved roots (case-insensitive on Windows and macOS, trailing separators ignored). The same folder selects the existing entry and shows a notice; a folder inside an existing root shows a notice and is not added; a parent of an existing root is added. Add account creates the next free `~/.claude-N` or `~/.codex-N` folder and opens a terminal with `CLAUDE_CONFIG_DIR` or `CODEX_HOME` set, running the CLI's own sign-in command.
- Evidence: Folder comparison covered by 5 unit tests. The sign-in terminal flow was not run; `claude auth login` and `codex login` behaviour inside a fresh folder is assumed.
- Alternatives and sacrifice: A sign-in form inside o-bros was rejected to keep credentials with the official CLIs. The empty folder is created before sign-in succeeds, so an abandoned attempt leaves an empty folder that shows as an account.
- Residual risk/debt: Empty folders are never cleaned up. The files panel button now shows only on the Projects page.
- Mitigation and revisit trigger: Add removal of empty account folders if abandoned attempts become common.
- Recovery and ownership: `src/main/services/accountScanner.ts`, `src/main/ipc/projectsIpc.ts`; owner not assigned.
- Implementation / validation / outcome: Written / typecheck, 79 tests and build pass / not observed by the user.
- Result acceptance: Pending user feedback.
- Learning: Say what an action writes to disk before the user clicks it.

### History date filter and delete
- Scope and goal: Pick a day in History and delete sessions.
- Choice and authority: User-requested. A native date input filters by local calendar day in the main process, before titles are read, so older days are reachable despite the 50-session limit. Delete moves the transcript file to the Recycle Bin or Trash (shell.trashItem), so it can be restored.
- Evidence: Day range logic covered by unit tests; the main process only trashes .jsonl files inside a known Claude projects folder, and checks every path before trashing any.
- Alternatives and sacrifice: Permanent delete was rejected as unrecoverable. Only Claude sessions are listed, so Codex history cannot be browsed or deleted here.
- Residual risk/debt: Deleting a session that is still running in a terminal is not blocked.
- Mitigation and revisit trigger: Add Codex history when its transcript layout is verified.
- Recovery and ownership: Restore from the Recycle Bin or Trash; code in src/main/services/sessionHistory.ts; owner not assigned.
- Implementation / validation / outcome: Written / typecheck, 85 tests and build pass / not observed by the user.
- Result acceptance: Pending user feedback.
- Learning: Destructive actions go to the system trash and need a confirmation that says where the item goes.

### Close confirmation and one search box
- Scope and goal: Warn before closing while terminals still run work; simplify the files search.
- Choice and authority: User-requested. Closing the window is held in the main process; the renderer shows a modal listing each terminal and its running commands (read from the OS process table, ignoring the shell and console helpers) plus unsaved files. Confirm stops those processes and every terminal, then closes; Cancel keeps the app open. The Names/Contents toggle is replaced by one search that shows name matches first, then content-only matches tagged in text.
- Evidence: Background-process filtering and hit merging covered by unit tests (92 total). The modal and the real process kill were not run.
- Alternatives and sacrifice: Listing every open terminal was rejected because an idle shell is not running work. Content search now runs with every query, which costs more disk reads than names alone.
- Residual risk/debt: Closing waits about a second on Windows while the process table is read. Killing uses a plain process kill; a program that ignores it may linger. Unix process listing is untested.
- Mitigation and revisit trigger: Reopen if a stopped task keeps running or the content search feels slow on large folders.
- Recovery and ownership: src/main/closeGuard.ts, src/main/services/resources/runningTasks.ts; owner not assigned.
- Implementation / validation / outcome: Written / typecheck, 92 tests and build pass / not observed by the user.
- Result acceptance: Pending user feedback.
- Learning: Say exactly what will be stopped before asking the user to confirm.

### Toasts, friendly errors and file tree actions
- Scope and goal: Tell the user what happened (success, warning, error) without raw system text, and add a right-click menu to the files panel.
- Choice and authority: User-requested. One toast store with three kinds; messages pass through a lookup of known system codes and otherwise show a written fallback, never the raw text. Right-click on a file or folder offers New File, New Folder, Copy Path, Copy Relative Path, Open in Terminal, Collapse Folder, Find in Folder, Reveal in File Explorer, Rename (F2) and Delete (Del). Blank space offers the folder-level actions.
- Evidence: Error translation, name validation and path helpers covered by unit tests (103 total). The menu and dialogs were not run.
- Alternatives and sacrifice: The file-clipboard Copy item from the reference image was left out because Electron has no portable way to put a file on the clipboard. Rename and delete refuse while an affected file has unsaved changes, and close the open tab afterwards instead of following the new path.
- Residual risk/debt: The fallback hides the real cause from the screen; it is not logged anywhere. Delete goes to the Recycle Bin or Trash, so it is recoverable. Project roots cannot be renamed or deleted from the tree.
- Mitigation and revisit trigger: Add a log file when a fallback message makes a problem hard to diagnose.
- Recovery and ownership: src/main/services/entryService.ts, src/shared/friendlyError.ts; owner not assigned.
- Implementation / validation / outcome: Written / typecheck, 103 tests, build and audit pass / not observed by the user.
- Result acceptance: Pending user feedback.
- Learning: Never put a raw system message on screen; translate it or replace it.

### Development helpers: git actions, branches, scripts, problems, ports, recent files, terminal paths
- Scope and goal: Seven low-memory helpers requested together, all on demand with no background index.
- Choice and authority: User-requested. Stage, unstage, discard and commit run the git CLI from the main process on click. Discarding a new file moves it to the Recycle Bin or Trash instead of git clean. The branch switcher only offers branches that git lists. Scripts come from the active project package.json and run in a new terminal, with the package manager picked by lock file. The Problems list keeps only line, column and message per open file, filled by the existing lint run. Ports come from netstat on Windows and lsof elsewhere and only show processes started inside o-bros terminals; Stop kills one process. Recent files are the last 12 opened, stored in localStorage. A file or folder can be dropped on a terminal, or sent from the tree menu, to paste its quoted path.
- Evidence: Parsers and helpers covered by unit tests (121 total). Git actions, the port list and drag and drop were not run against real data.
- Alternatives and sacrifice: No language server and no file watcher, which keeps memory flat but means Problems only covers open files and refreshes on the lint schedule. Committing needs a configured git name and email; the error is translated rather than solved. Dropping files from outside the app depends on Electron webUtils.
- Residual risk/debt: lsof output was never exercised on this machine. A script name with unusual characters is shown disabled rather than run. Quoting assumes PowerShell or a POSIX shell.
- Mitigation and revisit trigger: Reopen if a git action behaves differently from the git CLI or the ports list is empty for a running server.
- Recovery and ownership: src/main/services/gitActions.ts, scriptService.ts, resources/listeningPorts.ts; owner not assigned.
- Implementation / validation / outcome: Written / typecheck, 121 tests, build and audit pass / not observed by the user.
- Result acceptance: Pending user feedback.
- Learning: Prefer reading a small file or running a CLI on click over keeping an index in memory.

### Auto save and project documentation
- Scope and goal: Let the user save files automatically after a chosen delay, and explain the project to people who visit the repository.
- Choice and authority: User-requested. Auto save is off by default, with a delay from 100 ms to 60 s (presets 200 ms, 500 ms, 1 s, 2 s, 5 s, or a typed value). It writes without formatting, because reformatting while typing moves the cursor. A pending save is flushed when the editor is left. Documentation is split into a README plus guides for getting started, features, architecture, development, privacy and security, and contributing.
- Evidence: Setting normalisation and delay clamping covered by unit tests (123 total). The save timing was not observed in the running app. Documentation statements were checked against the code and earlier decision entries.
- Alternatives and sacrifice: Saving on every keystroke or on focus loss were not offered. A very short delay writes the file often, which can trigger tools that watch the folder.
- Residual risk/debt: Documentation will drift unless it is updated with features. No license is chosen, which the README states.
- Mitigation and revisit trigger: Update docs/FEATURES.md in the same change as any new feature.
- Recovery and ownership: src/renderer/features/editor/autoSaveExtension.ts and docs/; owner not assigned.
- Implementation / validation / outcome: Written / typecheck and 123 tests pass / not observed by the user.
- Result acceptance: Pending user feedback.
- Learning: Say what a setting deliberately does not do (auto save does not format) in the setting itself.
