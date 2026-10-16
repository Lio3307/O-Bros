# Changelog

All notable changes to o-bros are listed here. The format follows [Keep a Changelog](https://keepachangelog.com), and versions follow [Semantic Versioning](https://semver.org).

## [Unreleased]

### Added
- **New versions are announced.** O-BROS checks GitHub 30 seconds after it starts and every 6 hours, and shows a notice with Download when a new version exists, then Restart to update once it is downloaded. Each version is announced once, failed checks stay quiet, and nothing is downloaded until you press the button. Turn it off in Settings → About and updates.
- **Code intelligence from language servers.** The editor finds the language servers installed in your project or on your computer and starts the right one for the file you open: completions from the whole project and its packages, type information on hover, errors as you type (shown next to oxlint's), go to definition (F12), find references (Shift+F12) and parameter hints (Ctrl+Shift+Space). Supported: TypeScript/JavaScript, Python, Rust, Go, C/C++, Java, PHP, CSS, HTML, JSON, YAML, Markdown and SQL. Settings → Language servers lists what was found and how to install the rest, lets you turn one off or give your own command, and shows the running servers with Stop. A server stops a minute after its last file closes.
- **Graphics card setting** (Settings → Storage and memory). Turn off hardware acceleration to save about 35 MB (measured: 202 MB to 167 MB at rest); the window can feel less smooth. It applies after a restart, and a Restart now button appears when it changed.
- **Team member conversations you can find and delete.** Conversations that wot team members had are marked "Team member · <name>" in History, with a "Team only" filter and a Delete button for what is shown. Settings → Storage and memory → Team (wot) has a "Team member conversations" row that deletes all of them. Claude members are started with their own session ID, so the match is exact; a Codex member is matched by its folder, start time and the task it was given. Works for Claude and Codex members.
- **Delete a member's conversation when it stops** (Settings → Team (wot), off by default). The conversation goes to the Recycle Bin or Trash; your files are not touched.
- **Other agents' conversation folders** in Settings → Storage and memory → Where your data lives: Gemini CLI, Qwen Code, OpenCode, Kilo Code, Cline, GitHub Copilot CLI, Goose and Cursor Agent, each only when it exists on the computer, with what the folder holds and what deleting it does (OpenCode and Kilo keep your login in the same folder). O-BROS only opens these folders and never deletes them.
- **Agent monitor.** The Activity page is a full-width live monitor with the log at the bottom: a card for every running agent and team member (state, folder, who summoned it, running time, CPU and memory; click to open it), today's agent time, sessions, git actions allowed and denied and team members, activity by hour, and time per agent.
- **Activity log** (new Activity button on the left, or "Show agent Activity" in the command palette). A timeline, grouped by day, of what agents did: when an agent session started and how long it ran, every commit, push or branch change an agent asked for with your answer (Allowed or Denied) and the command, and team members joining and leaving. The newest 500 entries are kept in `activity.json` in the app data folder; the bin button clears them.
- **Open a dev server in the browser.** Listening ports in the Resource Manager have an Open button next to Stop.
- **Usage note for every agent** (Settings → Agents). Under each agent's status: "Usage shown" with the plan (for example Claude Pro or ChatGPT Pro), "Sign in to show usage", "Needs a Claude subscription" or "Needs a ChatGPT plan" when an API key is used, "Pay-per-use key · no limit to show", or "Usage not available" when the provider has no usage service. Hover for the explanation. Plans are read from the saved login files; tokens are never sent anywhere for this.
- **OpenRouter usage.** When an OpenRouter key is saved in OpenCode (or set in OPENROUTER_API_KEY), the usage popover and the status bar show money spent and credit left, read from OpenRouter's documented key endpoint.
- **Team members free their memory.** Settings → Team (wot) → Free memory automatically: stop a member after it finished and stayed idle for 5, 10 (default) or 30 minutes, or never, and stop members when the agent that summoned them closes. A member that is asking a question is never stopped this way. You get a notice when it happens.
- **Team data in Storage and memory.** A Team (wot) section shows running members and how much memory they use (Stop all), and the wot task files (Delete). "Where your data lives" now lists the task-file folder and every installed wot skill. Members' conversations are saved by each agent and can be deleted with the other saved conversations.
- **Agent logos.** Every detected agent CLI shows its own logo, in its original colours where the brand has them (Claude, Codex, Gemini CLI, Qwen, Kimi, Amp, Junie, Devin, Mistral Vibe, CodeBuddy, Qoder, Kiro) and in the interface colour for single-colour brands (OpenCode, Cline, Kilo Code, Cursor, GitHub Copilot, Goose, Grok). Agents without a logo in the pack use their ACP registry icon. Logos appear on agent buttons, terminal tabs and open sessions that run an agent, Team members, and the settings pages.
- **Backup and restore settings** (Settings → Backup and restore, or the command palette). Export saves your settings to a versioned JSON file (theme, editor and snippets, shortcuts, prompts, agent buttons, terminal, agent and git options, commit name and email, and optionally your project folders). Import checks the file, shows what it contains and asks before applying it. Accounts, logins and tokens are never included.
- **No agents in your GitHub history.** The git guard is in every O-BROS terminal and recognises an agent by the program that started the command, so an agent you start by typing its name is covered too. Agent merges, cherry-picks, reverts and rebases also use your identity, and `--author` is dropped from agent commits. Before a push (from any O-BROS terminal or the Push button), O-BROS asks you if a commit still shows an agent as author, committer or co-author, and it points out branch names that mention an agent. Your own git commands are not changed.
- **Commits by agents are yours.** Commits that agents make in O-BROS use the name and email you set in Settings → Terminal → Commits made by agents (O-BROS asks the first time), not your global git config. "Co-Authored-By" and "Generated with" lines are removed unless you allow agents to add themselves as co-author.
- **Agents ask before git changes.** When an agent started from O-BROS (or a wot team member) runs `git commit`, `git push`, or creates, deletes or renames a branch, O-BROS pauses it and asks you to allow it. No answer in 100 seconds means no. Settings → Terminal → Agents and git.
- **wot works with more agents.** The skill can be installed in the shared Agent Skills folder (`~/.agents/skills`) that Codex, Gemini CLI, GitHub Copilot CLI, OpenCode and others read, and the list of agents to summon comes from the ACP registry instead of a fixed list. The settings rows show the agent name instead of the account email.
- **Team of agents (wot).** Ask Claude or Codex to bring in another agent ("ask codex to review this"). Install the wot skill once in Settings → Team (wot); the agent then uses the `wot` command to summon any installed agent CLI into a hidden terminal, send it a task, wait for it, read its answer and stop it. A new Team view shows every member, its state and its live terminal, and turns red when a member asks a question. Agents that are not installed are reported instead of installed, and outside O-BROS the agent is told it needs the app.
- **Agent waiting for you.** When a terminal asks a question (for example "Do you want to proceed?" or a yes/no prompt) and goes quiet, you get a notification and a dot on its tab, right away, even if it did not run for long.
- **Review what the agent changed.** The Changes panel has a "Since this terminal started" list for the selected terminal: files changed, added, deleted, with line counts and a diff against the moment the terminal started (your earlier uncommitted edits are not counted). Each file has a button to put it back.
- **Search inside conversations.** History has a search box that looks inside the text of your Claude and Codex sessions and shows the matching sentence. Press Enter to search.
- **Color themes** (Settings → Editor or Terminal). Six themes (O-BROS, One Dark, Dracula, GitHub Dark, Monokai, Solarized Dark) color the code in the editor and the terminal together, and apply to open files and terminals right away.
- **Environment and text files** are colored: `.env` and `.env.*`, `.properties`, `.ini`, `.conf`, `.cfg` (keys, values, `${VARIABLES}`, comments) and `.txt`, `.log` (strings, numbers, links).

### Removed
- **Snippets.** Settings → Snippets and the snippet suggestions are gone; language servers provide completions instead.

### Changed
- **Written for every agent, not only Claude and Codex.** Texts across the app, the README and the getting-started guide now speak of the agent CLIs you have installed. Where a feature really is limited to Claude and Codex (History and saved sessions, plan usage limits, switching accounts), the text says so and explains what other agents do instead.
- **Language servers count in the memory figures.** The Resource Manager lists each running language server with its CPU and memory, and the status bar total includes them.
- **Less background work.** Agents typed into a plain terminal are looked for a few seconds after you press Enter instead of every 20 seconds, so an idle terminal no longer starts a process scan; agents the git guard sees are noted at once.
- **Outdated wot skills are noticed.** When an installed wot skill is older than the one O-BROS ships, a notice at start says which ones and offers Update all; nothing is written until you press it. wot status also tells the agent that its skill is outdated, so it reminds you. Older skills keep working: the git rules are enforced by O-BROS, not by the skill.
- **Every agent shows what it needs to work.** Provider accounts → Other agents lists each installed agent CLI that needs an account sign-in, an API key or either (Gemini CLI, Qwen Code, OpenCode, Kilo Code, Cline, GitHub Copilot CLI, Cursor Agent, Amp, Factory Droid, Kimi, Goose, Aider, Crush), whether it is set up, and the command to sign in. An API key set in an environment variable (for example GEMINI_API_KEY or AMP_API_KEY) is detected by its name only; its value is never read into the app. Agents whose login O-BROS cannot read show Not checked with the sign-in steps; not signed in shows in red. The list is resources/agents/agent-auth.json.
- **Agents may not commit, push or change branches by default.** Settings → Terminal → Agents and git now has three choices: Never allow (the default), Ask me, and Allow. With Never allow, an agent that tries to commit (also through merge, cherry-pick, revert or rebase), push, or create, delete or rename a branch or worktree is refused at once and told that you do it yourself; no question is shown. Your own git commands are never stopped. The wot skill (1.3.0) tells agents to hand the commit to you with a suggested message.
- **The memory figure matches Task Manager.** The status bar, the Resource Manager, team memory and the monitor show the memory each process uses by itself (about 200 MB at rest) instead of the working set (about 370 MB), which counts the shared system libraries once per process. The Resource Manager still shows the larger number as "with shared".
- **Faster start, less to load.** Settings, Changes, History and the Activity monitor load the first time you open them, and the WebGL terminal drawing code loads only when you turn it on. The code loaded at start is 24% smaller (1.65 MB to 1.26 MB).
- **Memory leak test.** A new end-to-end test opens and closes terminals in cycles and fails if memory keeps growing; ten cycles showed no leak (about 410 MB with the app steady, heaps flat).
- **Provider accounts shows every agent you have.** Claude and Codex appear only when installed or signed in, and a new Other agents section lists each other agent CLI on the computer with how it signs in: Gemini CLI (Google account or API key), OpenCode and Kilo Code (connected providers), Cline (the provider it uses) and GitHub Copilot CLI (GitHub account), with the command to change it. o-bros reads only names and login types, never a key or token.
- **Boxy JetBrains-style look.** Every corner is square: cards, popups, menus, tooltips (including the problem tooltip in the editor, which also lost its thick coloured bar), toasts, dialogs, buttons and inputs. One --radius token controls it.
- **Loading spinners.** Everything that loads or measures (agents, folders, ports, history, storage sizes, the commit graph, review changes, agent status) shows a spinning icon with what it is doing, instead of plain "Looking…" text.
- **History has no date picker any more.** It lists your newest conversations grouped by Today, Yesterday and Earlier; search finds older ones.
- **The memory figure in the status bar stays current.** O-BROS's own memory is read every 5 seconds while the window is visible; the memory of the programs inside your terminals is still measured once a minute (every 3 seconds while the Resource Manager is open), because reading the process list costs more.
- **Dependencies updated** (instead of merging the Dependabot pull requests, which were made from an old commit): React 19, Vite 8 with electron-vite 6 and @vitejs/plugin-react 6 (the renderer builds in about 1 second instead of 6), xterm 6 with its addons, TypeScript 6.0, @types/node 24 to match the Node 24 inside Electron 44, and actions/checkout and actions/setup-node 7 in CI. TypeScript 7 is skipped for now because editors that use the project TypeScript cannot read it yet. Dependabot now groups React, the build tools, xterm and the GitHub Actions so their updates arrive together.
- **Agents you start by typing their name count too.** An agent started in a plain terminal (for example by typing `claude`) is recognised by the program it runs, so it shows on the monitor, its sessions are logged, and its git requests carry its name. Team members now count with the time they ran, so agent time and time per agent are right.
- Buttons that start something (Resume, Open, go to the lead) turn green on hover, and buttons that delete or stop something (Delete, Remove, Stop, Clear) turn red.
- **Team view is clearer.** Members are grouped under the lead agent that summoned them, with a button to open the lead's terminal, and the selected member shows Lead → Team member, its state, its task and a hint when it waits for an answer.
- **wot is for every agent you have.** Settings → Team (wot) lists the agent CLIs found on this computer and builds its examples from them; texts no longer suggest wot is only for Claude and Codex. The wot skill (1.2.0) tells agents to pick only from `wot agents` instead of assuming Claude or Codex.
- Buttons in settings no longer wrap their text onto two lines when the window is narrow, and "Auto-stop" in Storage and memory is a regular "Auto-stop settings" button like the others.
- Codex is shown with the ChatGPT/OpenAI logo.
- **Agents need a project folder.** With no folder selected, an agent button opens a folder picker ("Choose a project folder for Claude"), adds the folder to Projects and starts the agent there; cancelling starts nothing. A plain terminal still opens at once, in your home folder, in a tab called "Home". With no folders yet, the main area shows "Open a project folder to start". wot never summons a team member into the home folder.
- The usage refresh button only shows next to usage, not when no provider is logged in.
- **Less memory.** Terminals are drawn without the graphics card by default, which saves about 25 MB of GPU memory per open terminal (4 terminals: 424 MB instead of 546 MB in a test). Turn it back on in Settings → Terminal → Drawing. The updater is loaded only when you check for updates, the process list is read once a minute instead of every 15 seconds and not while the window is hidden, and spell checking is off.
- **Agents come from the ACP registry.** The list of agents, their commands and their icons come from the ACP registry, your agent buttons and your PATH. The registry is saved on disk so it also works offline, and a copy ships with the app for the very first start. The built-in agent list and icon set were removed.
- **wot is optional and versioned.** Team features stay off, and the Team button stays hidden, until you install the wot skill for at least one agent in Settings → Team (wot). Each row shows the installed and available version and offers an update.
- Toasts have an even border and a soft shadow instead of a coloured bar on the side; the icon colour shows the kind.
- The usage in the bottom-left corner is one compact item: the provider closest to a limit, with its number and reset time, and small icons for the other logged-in providers. Hover for every number; click for the full details.
- Open sessions are listed under the folder they run in, instead of all at the top of the project. Sessions that run in the project folder itself stay under "Open sessions".

### Fixed
- **O-BROS could hang while closing.** Closing reads the list of running programs to warn about busy terminals; that read had no time limit and no error handling, so a stalled Windows process query could keep the window from closing. It now gives up after 20 seconds and closes anyway, stopping the terminals as usual.
- **Git checks, the Resource Manager and agent detection could fail at random on Windows.** When any program on the computer ran with a control character in its command line, the process list O-BROS reads could not be parsed, so an agent's git command ended with "Bad control character in string literal" instead of the guard's answer. Control characters are now removed before reading the list.
- A drive root such as `E:` added as a project showed an empty name in the sidebar; it is now called `E:`. The Windows system folders `$RECYCLE.BIN` and `System Volume Information` are no longer listed as project folders.
- Claude or Codex usage disappeared ("unavailable") for up to 5 minutes whenever one usage request failed, for example a rate limit, a network blip or a login that was about to be refreshed. The last good numbers now stay, marked as last known with their time, until a window resets or a request works again.
- Codex showed two different logos (the blue Codex icon on buttons, the OpenAI mark in the status bar, usage settings and History). Every place now uses the same logo pack, preloaded at start so it does not flicker.
- Rows in settings tables had no space between their items, so "Connected" touched the "+ Add" button.
- Deleting sessions (Storage and memory, or History) stopped at the first file it could not delete, for example one the Codex app had open, so the rest stayed and seemed to come back. It now deletes every other file, checks each file is really gone, and says how many were deleted and why any were not.


## [0.1.4] - 2026-10-14

### Added

Git
- **History** list in the Changes panel with the latest commits of the current branch: message, short hash, author, age, branches and tags. Open a commit to see its files, and select a file to read the diff of that commit.
- **Graph** view in the main area (press Graph under History, or use the Changes / Graph tabs). It draws branches and merges as colored lanes, with the message, branch and tag labels, author, hash and age. A **Branch** dropdown picks All branches or one branch, and the list is read from the repository.
- **Repository picker.** When the selected folder is a folder of repositories, the Changes panel lists the repositories inside it, up to three folders deep, and a back button returns to the list.
- **Pull, Push and Stash.** Pull only fast-forwards, so it never creates a merge by itself, and tells you when your branch and the remote have both moved. Push publishes a branch that has no upstream yet. Stash puts changed and new files aside; Apply brings them back and removes the stash, and Delete asks first. Git never asks for a password in the app: if it needs one, you are told to sign in once from a terminal.
- **Branch and commit actions** (the ... button on the branch card): create a branch from the current commit, rename the current branch, delete another branch (with a second confirmation if it has commits that are not merged), change the message of the last commit, and undo the last commit (its changes go back to staged). o-bros never force pushes, and it tells you when a change would need one.

Working with agents
- **Prompt library.** Save the prompts you send often to Claude, Codex or any agent (Settings → Prompts). Press the Prompts button in the tab bar or `Ctrl+Shift+L`, search, and press Enter to insert it into the focused terminal, or Ctrl+Enter to insert it and press Enter. A few examples are included.
- **Send to terminal.** Select code in the editor and press `Ctrl+Shift+Enter` (or right-click) to insert it, with its file path and line range, into the focused terminal. The diff view has a **Send to terminal** button for a diff. You can add a question first. It is inserted as one block for you to read before pressing Enter, and it is limited to 20,000 characters.

Everywhere
- **Command palette** (`Ctrl+Shift+P`, changeable in Settings → Shortcuts). One search box for every action: terminals, splits, prompts, Git, going to a section or a settings page, and updates. Each command shows its shortcut.

### Changed
- Diffs are colored: added lines green, removed lines red, and hunk headers blue. The +/− counts and the file marks use the same colors.
- A new folder with files is listed as its files in Changes, instead of as one folder row.
- The settings pages are grouped under labels (AI tools, Workspace, App).
- Pane buttons are hidden on a pane that is not focused, and the split buttons in the tab bar only show while a tab has a single pane.
- The Changes and Graph switch looks like the terminal tabs.

### Fixed
- Selecting an untracked folder in Changes raised an error in the log.

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
