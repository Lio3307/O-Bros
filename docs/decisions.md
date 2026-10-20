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

### Storage and memory cleanup page
- Scope and goal: Give the user one place in Settings to see and clear what is safe to delete, without leaving the app.
- Choice and authority: User-requested. Four items only: the Electron web and code cache (session.clearCache and clearCodeCaches), old o-bros-lint-* folders in the system temp folder, the terminal scrollback held in memory (written as the erase-scrollback escape, so running programs are untouched), and the recent files list. Each has its own button plus one that runs all four. No confirmation dialog, because every item is rebuilt on demand.
- Evidence: Directory size helper covered by unit tests (125 total). The page, the cache sizes and the freed amounts were not run in the app.
- Alternatives and sacrifice: Not offered: deleting Claude or Codex data (conversations, snapshots, logs), because o-bros treats provider folders as read-only and those hold user data; deleting localStorage wholesale, because that holds settings and open tabs. Session history stays in the History panel, which already moves items to the Recycle Bin.
- Residual risk/debt: getCacheSize reports only the web cache, so the app cache number can be small while the user-data folder holds more (GPU and shader caches). Temp folders newer than a minute are skipped so a running lint is not broken.
- Mitigation and revisit trigger: Add the user-data folder size if users report the number does not match what Windows shows.
- Recovery and ownership: src/main/services/storage, src/renderer/features/settings/StoragePage.tsx; owner not assigned.
- Implementation / validation / outcome: Written / typecheck, 125 tests and build pass / not observed by the user.
- Result acceptance: Pending user feedback.
- Learning: Only offer a delete button for data o-bros itself created; link to the owning panel for anything else.

### Resume and saved conversation control (Claude and Codex)
- Scope and goal: Let the user resume a Claude or Codex conversation from inside o-bros and see and control what saved conversations cost, because Codex alone held 3.2 GB (451 files, the largest 344 MB) on the development machine.
- Choice and authority: User-requested. History now reads both providers through one TranscriptFormat per provider (where the files live, how deep, how to read the header and messages). Resume opens a terminal in the session folder with the session account and runs claude --resume or codex resume with the id taken from the file name (Claude) or session_meta (Codex). Storage and memory lists count, size and age per provider with a Delete button per age bucket, each showing what it removes, and a confirmation that states the trade-off. The Recycle Bin is the default; permanent delete is an explicit checkbox because trash does not free disk until emptied.
- Evidence: Parsers run against fixtures in unit tests, and the Codex reader was run against the real 344 MB file (streamed, 162 messages in about 2 s). Age buckets and messages covered by unit tests (139 total). The buttons, confirmations and resume were not run in the app.
- Alternatives and sacrifice: Not offered: deleting the per-project memory notes Claude keeps (user-curated, not a cache) or Codex memories and logs. Messages are now streamed instead of loaded whole, which keeps memory flat but the replay still renders every message.
- Residual risk/debt: Resume depends on the CLI finding the session; a moved project folder breaks it and the terminal then fails to start in a missing folder. The Codex file layout is not documented by OpenAI and may change. Deleting thousands of sessions to the Recycle Bin runs one operating-system call per file.
- Mitigation and revisit trigger: Reopen if Codex changes its session_meta or message shape, or if trash deletes feel slow.
- Recovery and ownership: src/main/services/sessions, src/shared/sessionStorage.ts, src/renderer/features/settings/SavedSessionsSection.tsx; owner not assigned.
- Implementation / validation / outcome: Written / typecheck, 139 tests and build pass / not observed by the user.
- Result acceptance: Pending user feedback.
- Learning: Say what a delete costs in the user's terms (what you lose, what is freed, when) before the confirm button.

### Packaging and updater
- Scope and goal: Let people download installers from GitHub and let the app update itself, with a manual build step the user will run later.
- Choice and authority: User-requested. electron-builder for installers and electron-updater for updates, both reading GitHub Releases, because that needs no server. Updates are never automatic: check, download and install are each a button, and a downloaded update installs on close through the existing close confirmation. asar is off so oxlint, oxfmt and node-pty stay real files at the paths the app already uses. Renderer-only packages moved to devDependencies so the installer carries only four runtime packages.
- Evidence: electron-builder --dir --win built an unpacked app that contains only the Windows node-pty, oxlint and oxfmt bindings. The packaged app was not launched, the updater was not exercised, and the macOS and Linux targets were not built.
- Alternatives and sacrifice: Squirrel, a custom update server and silent background updates were not chosen. No code signing: Windows shows SmartScreen and macOS cannot auto-update. Automatic update checks were left out to match the privacy statement that nothing is contacted without a button.
- Residual risk/debt: The release workflow has never run. npm audit reports 8 moderate findings inside electron-builder (sprintf-js through global-agent), build-time only. The logo is a white-background square used as the icon on every platform.
- Mitigation and revisit trigger: Run the workflow on a test tag before announcing. Add signing when the app is shared widely, and a transparent icon.
- Recovery and ownership: electron-builder.yml, .github/workflows/release.yml, src/main/services/updater; owner not assigned.
- Implementation / validation / outcome: Written / typecheck, 139 tests, build and a Windows unpacked package pass / not observed by the user.
- Result acceptance: Pending user feedback.
- Learning: Keep every network call behind a visible button and say so in the privacy document in the same change.

### Production hardening pass
- Scope and goal: Close the cheap gaps from the production-readiness review: hidden errors, window navigation, IPC trust, CI coverage, dependency updates and a changelog.
- Choice and authority: User-approved list. A local log file records crashes, helper-process exits and every error that friendlyErrorMessage replaces with a fallback, which resolves the earlier risk that the real cause is invisible. The window now denies new windows and any navigation away from the app, so a file dropped outside a terminal cannot replace the interface. The CSP adds object-src, base-uri and form-action as none. The usage lookup only accepts accounts the scanner detected. Dependabot, macOS in CI and a changelog were added.
- Evidence: Audit of every IPC handler found the project path guard on files, git, scripts, tools and reveal, ports limited to terminal-owned pids and history paths limited to known session folders. Unit tests cover the log line format (142 total). Navigation blocking, the log file and the CSP change were not observed in the running app.
- Alternatives and sacrifice: Not done: validating the sender frame on every handler (one window, no remote content), a permission request handler (could break notifications or clipboard and cannot be checked without running the app), and any telemetry. The terminal can still be started in any folder by design.
- Residual risk/debt: style-src keeps unsafe-inline because xterm and CodeMirror set inline styles. The hidden-error reporter is module state in the shared friendlyError file. The log may contain file paths.
- Mitigation and revisit trigger: Reopen the permission handler when someone can run the app and test notifications and paste. Reopen the sender check if the app ever loads remote content.
- Recovery and ownership: src/main/services/logging, src/main/window.ts, src/renderer/diagnostics.ts; owner not assigned.
- Implementation / validation / outcome: Written / typecheck, 142 tests and build pass / not observed by the user.
- Result acceptance: Pending user feedback.
- Learning: When a friendly message replaces a real error, record the real one somewhere the user can find.

### End-to-end smoke tests
- Scope and goal: Cover the interface, which unit tests do not, with the smallest set that proves the app starts and the main paths work.
- Choice and authority: User-approved. Playwright with its Electron support, four tests, a temporary user-data folder seeded with settings.json so the native folder dialog is never needed, and a file written by the shell as proof that the terminal works.
- Evidence: The tests list correctly and typecheck. They have not been run, because running them opens a window and the app has never been launched in this session.
- Alternatives and sacrifice: Reading terminal text was rejected because the WebGL renderer draws to a canvas. Testing the real folder dialog and Claude or Codex sessions was left out. Tests use Control or Meta plus P and S and were only written with Windows in mind.
- Residual risk/debt: Selectors rely on button titles and the CodeMirror class names, so a UI rename breaks them. The CI job is allowed to fail until it has passed a few times.
- Mitigation and revisit trigger: Run npm run test:e2e once locally, fix the first failures, then remove continue-on-error.
- Recovery and ownership: e2e/, playwright.config.ts; owner not assigned.
- Implementation / validation / outcome: Written / typecheck and test listing pass / not run.
- Result acceptance: Pending user feedback.
- Learning: Prove terminal behaviour through a side effect on disk, not through pixels.

### Tabs follow the selected project
- Scope and goal: Switching from folder A to folder B must not show A's terminals, in the tab bar or in Open sessions.
- Choice and authority: User-requested. A tab belongs to the selected project when its folder (terminal) or path (file) is inside it. Hidden terminals stay mounted and running, only hidden from lists. Selecting a project restores the tab last used in it. Opening, resuming or activating a tab outside the selected project selects its closest project first, so a tab is never opened invisibly.
- Evidence: projectTabs.test.ts, closestProject.test.ts and groupTerminals.test.ts pass; typecheck passes. The interface was not launched.
- Alternatives and sacrifice: Closing A's terminals on switch was rejected because it kills running work. One tab list per project in the store was rejected because it changes persistence and every consumer. The Resource Manager still lists every terminal, since hidden ones use memory.
- Residual risk/debt: A terminal with no folder shows in every project. Project matching compares path text, so a different drive-letter case would count as another project.
- Mitigation and revisit trigger: Revisit if users want terminals pinned to all projects, or if path case causes surprises on Windows.
- Recovery and ownership: src/renderer/features/terminal/projectTabs.ts, src/renderer/state/projectTabSync.ts, src/renderer/state/activeProjectTabs.ts.
- Implementation / validation / outcome: Written / unit tests and typecheck / not yet seen running.
- Result acceptance: Pending user feedback.
- Learning: Filter at the view and keep the data global, so switching projects never destroys state.

### Clickable file:line references in terminals
- Scope and goal: Open a file at a line straight from compiler errors, stack traces and agent output.
- Choice and authority: User-requested. A pure parser (src/shared/fileReference.ts) splits each terminal line into words and reads path:line:column or path(line,column), without regular expressions. A link provider registers it with xterm. Ctrl or Cmd plus click opens it through the existing editor navigation.
- Evidence: fileReference.test.ts and the new paths tests pass; typecheck passes. The terminal was not launched.
- Alternatives and sacrifice: Plain click was rejected because it fights text selection. A new "file exists" IPC call was rejected; the existing directory listing proves existence and keeps the project-folder guard. Links that wrap across two screen lines and paths with spaces are not detected.
- Residual risk/debt: Relative paths resolve from the folder the terminal started in, not from where the shell has since moved. Words that look like a file with a number, such as notes.txt:5 in prose, become links.
- Mitigation and revisit trigger: Revisit if users report wrong files opening; the fix would be reading the shell working directory.
- Recovery and ownership: src/shared/fileReference.ts, src/renderer/features/terminal/fileLinkProvider.ts and openFileReference.ts.
- Implementation / validation / outcome: Written / unit tests and typecheck / not yet seen running.
- Result acceptance: Pending user feedback.
- Learning: A parser with no UI dependency can carry all the edge cases and be tested without a terminal.

### Configurable agent buttons
- Scope and goal: The Projects panel had Claude and Codex hard-coded, but people use other agents (OpenCode and more) and different ones per machine.
- Choice and authority: User-requested. A list of launchers (name and command) saved in local storage, defaulting to Claude and Codex. Each button runs its command in a new terminal in the selected folder. A command that starts with claude or codex still picks the active account. Settings, Agents lets the user add, rename, edit, remove and reset, and lists known agents found in PATH.
- Evidence: agentLaunchers.test.ts and agentDetector.test.ts pass; typecheck passes. The interface was not launched.
- Alternatives and sacrifice: Detecting and showing only installed agents automatically was rejected because it hides a button when PATH differs inside the app. Accounts and usage stay limited to Claude and Codex because only those two have account folders and usage data.
- Residual risk/debt: PATH is read from the app process, so an agent installed after launch, or a shell-only alias, is not found until restart or added by hand. The detection list of known agents is hard-coded.
- Mitigation and revisit trigger: Add agents by hand in Settings. Revisit the known list when a new agent CLI becomes common.
- Recovery and ownership: src/shared/agentLaunchers.ts, src/main/services/agents/agentDetector.ts, src/renderer/state/agentLaunchersStore.ts, AgentsPage.tsx.
- Implementation / validation / outcome: Written / unit tests and typecheck / not yet seen running.
- Result acceptance: Pending user feedback.
- Learning: A launcher is just a name and a command; only the two providers with accounts need special handling.

### Agents: two buttons, none by default, any CLI from PATH
- Scope and goal: The Projects row broke the layout with four buttons, and the machine-specific agents should not be assumed.
- Choice and authority: User-requested. At most two agent buttons, chosen with a Show checkbox; none until the user picks. The main process lists every runnable program in PATH, so o-bros can suggest well-known agents and search for any other command. Known agents show their logo (paths copied from the lobehub icons package, saved in src/renderer/ui/agentMarks.ts); others show a generic icon.
- Evidence: agentLaunchers.test.ts and agentDetector.test.ts pass; typecheck passes. The interface was not launched.
- Alternatives and sacrifice: Guessing which programs are agents by name was rejected as unreliable, so the user confirms by adding. Adding the icon package as a dependency was rejected; only 19 icons are embedded.
- Residual risk/debt: Some names collide with other tools (goose is also a database migration tool, vibe and amp are generic). PATH comes from the app process, so a new install needs a restart. Logos are trademarks of their owners.
- Mitigation and revisit trigger: Suggestions are only added when the user clicks Add. Revisit the logo set when new agents become common.
- Recovery and ownership: src/main/services/agents/agentDetector.ts, src/shared/agentLaunchers.ts, src/renderer/ui/AgentIcon.tsx and agentMarks.ts, AgentsPage.tsx.
- Implementation / validation / outcome: Written / unit tests and typecheck / not yet seen running.
- Result acceptance: Pending user feedback.
- Learning: Let the user confirm what is an agent; the app only needs to make every installed command findable.

### ACP Registry as the default agent catalog
- Scope and goal: Suggest the agent CLIs a user has without hand-maintaining the list of agents.
- Choice and authority: User-directed: use the Agent Client Protocol registry by default, not as an option. The main process fetches the public registry JSON when Settings, Agents opens (cached for an hour, 8 second timeout) and the page suggests every registry agent whose command is found in PATH. Registry entries describe how to launch the ACP server, not the terminal command, so a small id-to-command table plus names taken from the launch method turn them into command candidates.
- Evidence: acpRegistry.test.ts passes. The real registry (42 agents) was parsed with no malformed or generic command names. The page was not launched.
- Alternatives and sacrifice: Spawning every program in PATH to ask whether it speaks ACP was rejected as slow and unsafe. Using ACP itself to run agents in a chat view was not done because the app is terminal-first. Registry icons are not shown, because loading them from the network would need a looser content security policy.
- Residual risk/debt: One new outbound request to cdn.agentclientprotocol.com. The registry lists ACP adapters, so an agent whose terminal command differs from its ACP name is missed until added to the alias table or by hand. The registry has only agents with ACP support, so the built-in list stays as a fallback.
- Mitigation and revisit trigger: Offline or blocked networks fall back to the built-in list, and the search covers any command. Revisit if the registry schema changes or a chat view over ACP is wanted.
- Recovery and ownership: src/shared/acpRegistry.ts, src/main/services/agents/acpRegistryClient.ts.
- Implementation / validation / outcome: Written / unit tests, typecheck and a parse of the live registry / not yet seen running.
- Result acceptance: Pending user feedback.
- Learning: A registry says what exists, the PATH says what is installed; the useful answer needs both.

### Product name O-BROS, data folder stays o-bros
- Scope and goal: Show the app as O-BROS in the header bar, installer, Start menu and file names.
- Choice and authority: User-requested. productName is O-BROS; the installer file name is fixed by artifactName so GitHub does not rewrite it. The data folder is pinned to %APPDATA%\o-bros in code, unless a user-data-dir switch is given, so a name change can never move the settings.
- Evidence: Typecheck and tests pass. The packaged app was not rebuilt or launched.
- Alternatives and sacrifice: Renaming the data folder too was rejected because users would lose settings and tabs. appId stays com.lio3307.obros so upgrades keep working.
- Residual risk/debt: The program folder and shortcut will be named O-BROS, so anyone who installed an earlier test build may get a second entry until the old one is removed.
- Mitigation and revisit trigger: Not released yet, so no real installs exist.
- Recovery and ownership: electron-builder.yml and src/main/index.ts.
- Implementation / validation / outcome: Written / typecheck and tests / not packaged.
- Result acceptance: Pending user feedback.
- Learning: Pin where data lives separately from what the app is called.

### Team of agents (wot)
- Scope and goal: Let the agent the user talks to summon other installed agent CLIs, watch them in the app, and refuse to work outside O-BROS.
- Choice and authority: User-requested feature and name. Agent-selected design: the main process runs an HTTP server on 127.0.0.1 with a random port and a random token; every O-BROS terminal gets O_BROS_WOT_URL, O_BROS_WOT_TOKEN, O_BROS_WOT_PANE and a PATH entry for resources/wot/bin. The `wot` command runs resources/wot/wot-cli.cjs with Electron's own Node (ELECTRON_RUN_AS_NODE), so users do not need Node. Members are hidden terminals rendered by the Team view with the normal TerminalView; the main process asks the window for agent launchers and for a member's screen text. Tasks are typed with bracketed paste when the agent enabled it, then Enter.
- Evidence: e2e/team.e2e.ts drives a fake agent through spawn, task delivery, read and stop, and checks the unknown-agent answer; unit tests cover agent matching, member names and member states. Checked by hand that wot without O-BROS (no variables, or a closed app) exits with code 2 and a WOT_UNAVAILABLE message, and that Git Bash, PowerShell and cmd each pick the right wrapper.
- Alternatives and sacrifice: A named pipe or file queue was rejected as harder to use from every shell. @xterm/headless in the main process was not added (new dependency); the window's xterm is used instead, so reading a member's screen needs the window open. Writing the skill into the provider folder bends the read-only rule, so it happens only on an explicit Install press and Remove only deletes a skill O-BROS wrote.
- Residual risk/debt: "Finished its turn" means the member printed nothing for 5 seconds, and "waiting" is found by phrases, so both are heuristics. A task is typed once the agent has been quiet for 2.5 seconds after a 5 second start, which can be too early for a very slow agent. The Codex sandbox may block 127.0.0.1 until the user allows it. Member terminals do not survive a reload of the window.
- Mitigation and revisit trigger: The skill tells agents to always read the screen and to retry wait. Revisit if real agents miss tasks or if a provider offers a proper agent-to-agent API.
- Recovery and ownership: src/main/services/wot/*, src/renderer/features/team/*, resources/wot/*.
- Implementation / validation / outcome: Written / unit tests, e2e with a fake agent / not yet tried with real Claude and Codex by the user.
- Result acceptance: Pending user feedback.
- Learning: Electron can run plain Node scripts for helper commands, so no runtime has to be installed.

### Agents need the user's yes for commits, pushes and branches
- Scope and goal: User-requested. Agents must not commit, push or create a branch on their own.
- Choice and authority: Agent-selected mechanism. Terminals that run an agent (an agent button, a resume, or a wot member) get a `git` wrapper first on PATH (resources/wot/guard). On macOS and Linux a shell script passes read-only git commands straight to the real git; otherwise resources/wot/git-guard.cjs asks the main process (/git-check). src/shared/gitGuard.ts decides which commands need a yes; the window shows a confirmation with the command and folder; no answer in 100 seconds is a no. Members are always guarded; the user can turn the guard off for their own agent terminals.
- Evidence: gitGuard.test.ts; e2e/gitGuard.e2e.ts allows one commit and refuses another in an agent terminal and checks the log; the Git Bash wrapper was checked by hand.
- Alternatives and sacrifice: A git hook (pre-commit, pre-push) was rejected: it does not cover branch creation and can be skipped with --no-verify. Guarding every terminal was rejected because the user would be asked about their own commands. On Windows every git call from an agent's shell starts Electron as Node, which adds a short delay.
- Residual risk/debt: Not a sandbox. An agent can call git by its full path or unset PATH. Agents started by typing their name in a plain terminal are not guarded.
- Mitigation and revisit trigger: The skill forbids getting around GIT_BLOCKED. Revisit if an agent is seen bypassing it.
- Recovery and ownership: src/shared/gitGuard.ts, src/main/services/wot/realGit.ts, wotRoutes.ts, resources/wot/guard/*, resources/wot/git-guard.cjs.
- Implementation / validation / outcome: Written / unit and e2e tests / not yet tried with real agents.
- Result acceptance: Pending user feedback.
- Learning: Put the guard in front of the command the agent actually runs, not in the repository.

### Commits by agents use the user's chosen identity
- Scope and goal: User-requested. Commits that agents make must show as the user's GitHub account, not the global git config, and agents must not become co-authors unless the user allows it.
- Choice and authority: Agent-selected mechanism. The name and email live in O-BROS (localStorage); agent terminals get GIT_AUTHOR_* and GIT_COMMITTER_* in their environment, and the git guard sets them again for each allowed commit. If none is saved, O-BROS asks the first time. After an allowed commit, the main process removes "Co-Authored-By" and "Generated with" lines by amending the message (no hooks rerun) unless the user allows co-authors.
- Evidence: commitIdentity.test.ts; e2e/gitGuard.e2e.ts checks author and committer against a different -c user.name, the removed co-author line, and the first-time prompt.
- Alternatives and sacrifice: Changing the repository's git config was rejected because it would also change the user's own commits. A commit-msg hook was rejected because core.hooksPath would replace the project's hooks.
- Residual risk/debt: Only commits made with `git commit` through the guard are cleaned. An agent passing --author overrides the author (not the committer). Commits created by merge, rebase or cherry-pick get the identity from the environment but are not cleaned.
- Recovery and ownership: src/shared/commitIdentity.ts, src/main/services/wot/commitCredits.ts, resources/wot/git-guard.cjs, src/renderer/features/team/commitIdentityPrompt.ts.
- Implementation / validation / outcome: Written / unit and e2e tests / not yet tried with real agents.
- Result acceptance: Pending user feedback.
- Learning: Environment variables beat git config, so identity can be set per terminal without touching any config file.

### Keep agents out of the GitHub history
- Scope and goal: User-requested. No agent may appear as author, committer, co-author or branch name in what reaches GitHub.
- Choice and authority: Agent-selected mechanism. The git guard is now on PATH in every O-BROS terminal. The wrappers only hand commit-related commands to the guard (commit, push, branch, checkout, switch, worktree, merge, cherry-pick, revert, rebase, am, pull); everything else goes straight to git. For those, the main process walks the parent processes of the guard and treats the command as an agent's if one of them is a known agent program (agent buttons, the built-in list and the ACP registry; runtimes such as node are ignored, and only the program and script path are looked at, never later arguments). Agent commands get the user's identity and lose --author; single-commit commands lose agent credit lines. Before any push, the commits that would be pushed are scanned (src/shared/agentTraces.ts) and the user is asked if one mentions an agent; the Push button does the same.
- Evidence: agentTraces.test.ts, agentCaller.test.ts, gitGuard.test.ts; e2e/agentHistory.e2e.ts starts a fake claude-code script by hand in a plain terminal, checks its commit is asked about and rewritten, checks the user's own commit is untouched, and checks that a push with an agent co-author is stopped.
- Alternatives and sacrifice: A pre-push hook was rejected because it changes repository configuration and only works for pushes. Reading the process table costs about a second on Windows, so it happens only for the commands above.
- Residual risk/debt: Still not a sandbox (git by full path). Pushes made outside O-BROS are not checked. Rebased or cherry-picked commits keep their old messages, but the push check catches leftover credits. Detecting an agent depends on its program or script path containing the agent's name.
- Recovery and ownership: src/main/services/wot/{agentCaller,agentCatalog,gitDecision,pushTraces}.ts, src/shared/agentTraces.ts, resources/wot/guard/*.
- Implementation / validation / outcome: Written / unit and e2e tests / not yet tried with real agents.
- Result acceptance: Pending user feedback.
- Learning: Ask "which program started this command?" instead of "which terminal is it in?".

### Agents come from data, not code
- Scope and goal: User-requested. No hardcoded agent list; production-ready behaviour offline and online.
- Choice and authority: Agent-selected. The ACP registry is the source of agents (names, descriptions, launch commands, icons). It is fetched at most once an hour, saved to the user-data folder, and a snapshot ships in resources/agents for a first start without network. resources/agents/cli-commands.json maps registry ids to terminal commands where the registry only describes an ACP adapter, and resources/agents/skill-folders.json says where agents read skills. Icons are fetched only from cdn.agentclientprotocol.com over HTTPS, limited to 64 KB, cached on disk and shown as a CSS mask, so they follow the theme and no SVG code runs.
- Evidence: acpRegistry.test.ts, skillFolders.test.ts, teamAgents.test.ts; the Settings pages were checked against the live registry.
- Alternatives and sacrifice: Inline SVG would allow coloured icons but needs a sanitizer; a mask keeps them single-colour, which matches the design.
- Residual risk/debt: The two data files still need an edit when an agent changes its command name or skill folder. Agent names that are also people's names are only treated as an agent when the whole author name matches.
- Recovery and ownership: src/main/services/agents/*, resources/agents/*, src/shared/acpRegistry.ts, src/shared/skillFolders.ts.
- Implementation / validation / outcome: Written / unit tests and screenshots / not yet released.
- Result acceptance: Pending user feedback.
- Learning: Keep facts about other products in data files that can change without a code change.

### Memory: terminals drawn without the GPU by default
- Scope and goal: User-requested. Lower memory use.
- Choice and authority: Agent-selected after measuring with app.getAppMetrics(): idle 378 MB; four terminals 546 MB with WebGL (GPU process 105 → 197 MB) and 432 MB without it. WebGL is now a setting, off by default. electron-updater loads on first use, the process table is polled every 60 seconds and not while hidden, and spell checking is off.
- Evidence: Measurements above, taken with the e2e harness on this machine.
- Alternatives and sacrifice: Running the network service in the main process was not done (unsupported flag). The DOM renderer is slower for very heavy output, which is why the setting exists.
- Residual risk/debt: The main process (about 120 MB) is mostly Electron's own baseline.
- Recovery and ownership: src/renderer/features/terminal/TerminalView.tsx, src/main/services/updater/appUpdater.ts.
- Implementation / validation / outcome: Written / measured / pending user feedback.
- Result acceptance: Pending user feedback.
- Learning: Measure per process before optimising; the GPU process was the one that grew.

### Agent logos ship as a data pack
- Scope and goal: User-requested. Show each detected agent with its original logo and colours.
- Choice and authority: Agent-selected. Colored SVG logos from @lobehub/icons-static-svg 1.95.1 (MIT) are stored in resources/agents/logos with an index.json that maps the typed command to a file and a style (color or mono). Colour logos render as images; single-colour logos render as a CSS mask in the interface colour so they stay visible on the dark background. Agents missing from the pack fall back to the ACP registry icon, then a generic icon.
- Evidence: agentLogos.test.ts; every agent installed on this machine resolved to a logo (claude, codex, gemini, opencode, cline, kilo, cursor-agent, and droid through the registry); screenshots of Projects and Settings.
- Alternatives and sacrifice: Fetching favicons from agent websites was rejected after testing: openai.com and chatgpt.com answer 403, others have no favicon at the usual path, and it would add requests to many websites. The ACP registry icons are single-colour by design.
- Residual risk/debt: The logos are trademarks of their owners, used only to identify each tool. New agents need a file and an index line to get a colour logo.
- Recovery and ownership: resources/agents/logos/*, src/main/services/agents/agentLogos.ts, src/renderer/ui/AgentIcon.tsx.
- Implementation / validation / outcome: Written / unit test, probe and screenshots / pending user feedback.
- Result acceptance: Pending user feedback.
- Learning: Do not reuse a class name for two different elements; the wrapper picked up the mask styles.

### Team member conversations are tracked by session ID
- Scope and goal: User-requested. Let the user find and delete the conversations wot team members had, and explain other agents' history folders.
- Choice and authority: Agent-selected. A Claude member is started with `claude --session-id <uuid>`, so its conversation is known exactly. Codex has no such flag, so a Codex member is matched by folder, a start time after the summon, and the first 30 characters of the task wot typed in; a matched session is claimed so it is never counted twice. Records live in team-sessions.json. Other agents' history folders come from resources/agents/history-folders.json and are only opened, never deleted.
- Evidence: teamSessions.test.ts, historyFolders.test.ts, teamChats.e2e.ts with a fake codex that writes a real rollout file; `claude --help` lists --session-id; the folders were checked on this machine (OpenCode 1.3 GB, auth.json next to its database).
- Alternatives and sacrifice: Deleting other agents' history was rejected: OpenCode and Kilo keep logins next to their databases and the formats are not documented. A Codex member summoned without a task is not marked.
- Residual risk/debt: A Codex session the user starts in the same folder, after the summon, with the same first 30 characters would be claimed by the member. Records older than a day stop being matched.
- Recovery and ownership: src/main/services/wot/teamSessions.ts, src/shared/teamSessions.ts, src/main/services/storage/dataLocations.ts.
- Implementation / validation / outcome: Written / unit and e2e / pending user feedback.
- Result acceptance: Pending user feedback.
- Learning: A CLI flag that fixes the ID beats any matching rule; check --help first.

### Memory: measured, no leak, most of it is Electron itself
- Scope and goal: User-requested. Find leaks and lower memory.
- Choice and authority: Agent-selected. A soak test (e2e/memory.e2e.ts) opens and closes six terminals four times with garbage collection forced and fails if the renderer or main heap keeps growing. Settings, Changes, History, the Activity monitor and the WebGL addon load on demand.
- Evidence: Ten cycles: app RAM steady at about 410 MB, renderer heap flat at 9.0 MB, main heap at 7.6 MB. Startup bundle 1,649 KB to 1,260 KB. Idle by process: main 125 MB (88 private), GPU 104 (60), window 98 (43), network 46 (12); total working set about 370 MB, private about 203 MB. Lazy loading lowered the renderer heap at start from 6.4 to 5.9 MB and did not change RAM measurably.
- Alternatives and sacrifice: Turning off hardware acceleration would shrink the GPU process but make scrolling and animation slower; not done without the user deciding.
- Residual risk/debt: The status bar shows working set, which counts shared Chromium libraries once per process and so overstates real use.
- Recovery and ownership: e2e/memory.e2e.ts, src/renderer/shell/MainArea.tsx, src/renderer/shell/SidePanel.tsx, src/renderer/features/terminal/TerminalView.tsx.
- Implementation / validation / outcome: Written / soak test and bundle map / pending user feedback.
- Result acceptance: Pending user feedback.
- Learning: Measure per process before optimising code; in Electron most memory belongs to the runtime.

### Memory shown as private bytes, graphics card optional
- Scope and goal: User-requested follow-up to the memory measurement.
- Choice and authority: User-approved. Every memory figure shows private bytes, the memory a process uses by itself, instead of the working set, which counts shared Chromium libraries once per process. Hardware acceleration can be turned off in Settings → Storage and memory; it is read from settings.json before the app starts and needs a restart.
- Evidence: hardwareAcceleration.e2e.ts: private memory at rest 202 MB with the graphics card (GPU process 60 MB) and 167 MB without it (GPU process 23 MB).
- Alternatives and sacrifice: Hardware acceleration stays on by default because scrolling and animations are smoother.
- Residual risk/debt: Private bytes on macOS and Linux come from the resident size, which still includes some shared pages.
- Recovery and ownership: src/main/settings.ts, src/main/index.ts, src/renderer/features/settings/HardwareAccelerationSetting.tsx.
- Implementation / validation / outcome: Written / e2e with measurement / pending user feedback.
- Result acceptance: Pending user feedback.
- Learning: Quote a saving only after measuring it; the guess of 40 to 60 MB was 37 MB in practice.

### Code intelligence through language servers the user already has
- Scope and goal: User-requested. Real IntelliSense, detected automatically, with the option to give an own command; snippets removed.
- Choice and authority: User-directed approach, agent-selected design. @codemirror/lsp-client in the editor; servers run in the main process (one per server and workspace folder, found in node_modules/.bin or on the PATH, from resources/agents/language-servers.json) and talk to the editor over IPC with LSP framing. The workspace folder is the nearest folder with a project marker, never above the opened project folder. Server diagnostics and oxlint share one diagnostics board so neither overwrites the other. Hover HTML from servers goes through an allowlist sanitizer. F2 stays "select all occurrences", so rename is not bound. Custom commands are not part of settings backups.
- Evidence: languageServer.e2e.ts with the real typescript-language-server: type error after about 3 s, hover signature, member completion (toUpperCase), running list; unit tests for framing, file URIs, server choice and the HTML rules.
- Alternatives and sacrifice: Bundling servers was rejected (size, and the user's own versions match their projects). Rename symbol is left unbound until a free shortcut is chosen.
- Residual risk/debt: If O-BROS is killed without quitting, a server may outlive it until its input pipe closes. Server memory is not yet counted in the Resource Manager.
- Recovery and ownership: src/main/services/languageServers/*, src/renderer/features/editor/languageServer/*, src/renderer/features/settings/LanguageServersPage.tsx.
- Implementation / validation / outcome: Written / unit and e2e / pending user feedback.
- Result acceptance: Pending user feedback.
- Learning: Two features that both call setDiagnostics replace each other's results; keep one owner.

### Custom providers with an encrypted key
- Scope and goal: User-requested. Save own model endpoints (name, protocol, URL, model ID, context and output tokens, API key), export them with the settings, and start agents with them.
- Choice and authority: User-directed (asked: start agents with it; key encrypted, never exported). Provider details live in localStorage (`o-bros.customProviders`, part of the backup); keys live in `provider-keys.json`, encrypted with Electron safeStorage, readable only by the main process. An agent button carries a providerId; when its terminal starts, the main process adds the environment variables for the provider's protocol.
- Evidence: customProviders.e2e.ts starts a shell agent with a provider and checks the variables it receives, that the key file and localStorage hold no plain key, and that the window never shows it; unit tests for parsing, validation and the variables.
- Alternatives and sacrifice: Writing each agent's own config file was rejected (it edits files that belong to the agents). Only environment variables are used, so agents that read neither the Anthropic nor the OpenAI variables are not affected. The context window has no standard variable and is kept for reference.
- Residual risk/debt: The key is visible to any program the agent itself starts, as any environment variable is.
- Recovery and ownership: src/shared/customProviders.ts, src/main/services/customProviders/providerKeys.ts, src/renderer/state/customProvidersStore.ts, src/renderer/features/settings/providers/*.
- Implementation / validation / outcome: Written / unit and e2e / pending user feedback.
- Result acceptance: Pending user feedback.
- Learning: Keep secrets on the side that uses them; the window only needs to know that a key exists.

### The Git page keeps its own repository
- Scope and goal: Let the user look at any repository from the Changes panel. Before, it only showed the selected project, which follows the active terminal, and opening a repository from its list moved the Projects selection and hid that project's terminal tabs.
- Choice and authority: User-requested ("it only open the directory/folder that user currently work on terminal"). The design was delegated to the agent. `gitRepositoryStore.ts` holds a pinned repository; when nothing is pinned, the page follows the selected project as before. A switcher at the top of the side panel lists the repositories of every project folder plus **Follow project**. The Changes views and the command palette's git commands read the same path. The old `repositoryOriginStore.ts` was merged into it.
- Evidence: e2e/git.e2e.ts "switches the Git page to any repository without changing the selected project" checks the title bar keeps the project while the page shows another repository, and that Follow project returns. All git, conflict and palette e2e tests and `npm run check` pass. Screenshots were reviewed.
- Alternatives and sacrifice: Only filling the empty side panel was rejected because picking a repository would still move the Projects selection and hide tabs. Once a repository is picked, the page stays on it when you switch terminals; Follow project undoes that.
- Residual risk/debt: The switcher lists only repositories inside project folders, up to three levels deep and 100 per folder (`repositoryFinder.ts`), and scans each project folder in the background each time the Changes page opens (a whole drive such as C: took about 5 seconds for 25,000 folders); the menu waits only if that scan has not finished. The pin is not saved across restarts.
- Mitigation and revisit trigger: Revisit if users expect the pin to survive a restart, if opening the switcher feels slow on a large drive, or if users expect the page to jump back to the project when they switch terminals.
- Recovery and ownership: src/renderer/state/gitRepositoryStore.ts, src/renderer/features/changes/RepositorySwitcher.tsx.
- Implementation / validation / outcome: Written / e2e and unit tests pass / not yet used by the user.
- Result acceptance: Pending user feedback.
- Learning: A page that browses things should own its selection instead of borrowing a global one.

### Users choose where agent conversations are saved
- Scope and goal: Agent conversations filled the user's system drive (C: had 6 GB free; Codex sessions alone were 2.75 GB). The user asked for a built-in way to control where conversations are saved.
- Choice and authority: User-selected from three options (move to a folder, copy into an O-BROS archive, not now). Settings → Storage and memory → Where conversations are saved keeps a chosen folder in `settings.json`. Move puts a conversation-only folder into `<chosen>/<agent>` and leaves a junction (Windows) or symlink, so agents, History and resume keep their paths. This adds an exception to the read-only rule in AGENTS.md.
- Evidence: folderMove.test.ts covers move, writing through the link, move back, and refusals that leave files untouched (target with files, target inside the source, already moved, never moved). e2e/conversationFolder.e2e.ts moves a Cline folder through the real UI and back and checks OpenCode stays unmovable. A manual junction test across C: and E: worked. `npm run check` passes.
- Alternatives and sacrifice: An O-BROS archive was rejected because agents would still write to the full drive, so it doubles space instead of freeing it. Setting CLAUDE_CONFIG_DIR or CODEX_HOME was rejected because it moves logins and is how O-BROS switches accounts. OpenCode and Kilo cannot be moved because their login shares the folder.
- Residual risk/debt: The "agent is running" check matches process names, so an agent started under another name is missed; the rename step only catches files held open at that moment. A network drive cannot hold a junction, which makes the move fail and roll back. Codex sessions are moved per account folder, not Orca's private Codex home.
- Mitigation and revisit trigger: Revisit if a user reports an agent losing a conversation during a move, if an agent changes where it saves conversations, or if users want a whole agent folder moved.
- Recovery and ownership: src/main/services/storage/folderMove.ts, src/main/services/storage/conversationFolders.ts, src/renderer/features/settings/ConversationFolderSection.tsx. Move back undoes a move.
- Implementation / validation / outcome: Written / unit and e2e tests pass / not yet used on the user's real folders.
- Result acceptance: Pending user feedback.
- Learning: Freeing a drive means moving the data the tools write, not copying it; a link keeps every tool's path working.
