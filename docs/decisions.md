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
