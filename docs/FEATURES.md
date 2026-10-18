# Features

A reference for everything o-bros does and where its settings live.

## Terminals

| Feature | Details |
|---|---|
| Tabs and splits | Open as many terminals as you like. Split any terminal right or down. |
| Rename | Double-click a terminal tab or pane title. |
| Zoom | `Ctrl` `+`, `-`, `0` change the terminal text size. It is remembered. |
| Search | `Ctrl+F` opens a find bar inside the focused terminal. `Enter` goes to the next match, `Shift+Enter` to the previous one. |
| Drop a path | Drag a file or folder from the Files panel, or a file from your file manager, onto a terminal to paste its quoted path. |
| Send path | Right-click an item in the file tree and choose **Send Path to Terminal**. |
| Open file at line | `Ctrl+click` (`Cmd+click` on macOS) a reference such as `src/App.tsx:12:5`, `E:\repo\a.ts:7` or `src/a.ts(12,5)` to open that file at that line in the editor. Relative paths are resolved from the folder the terminal started in. A file that does not exist, or is outside your opened folders, shows a message instead. |
| Finished notification | If a terminal prints for 8 seconds or more and then stays quiet for 4 seconds while you are in another tab or app, you get a notification and a dot on its tab. Turn it off in Settings → Terminal. |
| History size | How many lines each terminal keeps (1,000 to 10,000). A smaller number uses less memory. Settings → Terminal. |

Terminals only start when their tab is first shown, and the GPU renderer is released for hidden terminals, so many open tabs stay cheap.

### Command palette

Press `Ctrl+Shift+P` (changeable in Settings → Shortcuts) and type. Every word you type must appear in the command name, its group or its keywords, so `git push` and `push` both find **Push the current branch**. Use the arrow keys and Enter, or click. Commands that have a shortcut show it on the right, and it follows what you set in Shortcuts. It covers terminals and splits, prompts, Git (graph, changes, fetch, pull, push, stash, new branch), going to Projects, History, Changes or any settings page, showing or hiding panels, checking for updates and opening the log folder.

### Prompts

Settings → Prompts keeps texts you send often (a few examples are included). Press the **Prompts** button at the right of the tab bar, or `Ctrl+Shift+L`, type to filter, then press **Enter** to insert the prompt into the focused terminal, or **Ctrl+Enter** to insert it and press Enter. It is pasted the way a paste is, so a prompt with several lines is not run line by line. Prompts are stored on this computer.

### Splitting

Split the focused terminal right or down from the buttons in the tab bar, or with the keyboard. Splitting never restarts a terminal: the shell you were typing in keeps its folder, its variables and its history, and the new pane opens next to it. Drag the line between two panes to resize them; the sizes are remembered.

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+D` | Split right |
| `Ctrl+Shift+E` | Split down |
| `Ctrl+Shift+W` | Close the focused pane |
| `Ctrl+Shift+T` | New terminal in the selected folder |
| `Ctrl+Shift+L` | Open the prompt list |

On a Mac, `Cmd` is used instead of `Ctrl`. Change any of them in **Settings → Shortcuts**: click a shortcut, then press the keys. A shortcut must include Ctrl, Cmd or Alt, so typing in a terminal is never taken over, and a shortcut already used for copy, paste, save, search or quick open is refused.

### Starting without a project folder

- With no folders added, the main area shows **Open a project folder to start**, with a smaller **Open a terminal in your home folder**.
- Agent buttons never start an agent in your home folder. With no folder selected they open a folder picker, add the folder to Projects and start the agent there. Cancel starts nothing.
- A plain terminal opens right away, in your home folder when no folder is selected. Its tab is called **Home**.

## Tabs

- Close with the X, the middle mouse button, or right-click → Close.
- Right-click also offers **Close other tabs**, **Copy path** and **Reveal in folder**.
- Drag tabs to reorder them.
- The arrow next to the split buttons lists every tab.
- Closing a file with unsaved changes asks first.
- **Tabs follow the selected project.** The tab bar and Open sessions show only the terminals and files inside the selected folder. Terminals of other folders keep running in the background and come back when you select that folder again. A terminal without a folder shows everywhere.
- A dot next to a folder in the Projects panel means a terminal there finished while you were in another folder.
- **Close other tabs** only closes the tabs of the selected project.
- Your tabs, splits and active tab come back when you reopen the app. Restored terminals are plain shells in the same folder; they do not re-run `claude` or `codex`.

## Files panel

- Tree with lazy loading: a folder is only read when you expand it.
- Right-click menu: New File, New Folder, Copy Path, Copy Relative Path, Open in Terminal, Send Path to Terminal, Collapse Folder, Find in Folder, Reveal in File Explorer, Rename (`F2`), Delete (`Del`).
- Delete moves the item to the Recycle Bin or Trash.
- Search finds files by name first, then by text. Files that only match inside their text are tagged "in text".
- A project folder itself cannot be renamed or deleted from the tree.

## Editor

| Feature | Details |
|---|---|
| Languages | JavaScript, TypeScript, JSON, CSS, HTML, Markdown, C/C++, Python, Rust, Go, Java, PHP, SQL, YAML. Each can be turned off in Settings → Editor (the file then opens as plain text). |
| Code intelligence | Language servers give completions from the whole project and its packages, type information on hover, errors as you type, go to definition (`F12`), find references (`Shift+F12`) and parameter hints (`Ctrl+Shift+Space`). O-BROS finds the servers installed in the project (`node_modules/.bin`) or on the computer and starts the right one when you open a file: TypeScript/JavaScript, Python, Rust, Go, C/C++, Java, PHP, CSS, HTML, JSON, YAML, Markdown and SQL. Settings → Language servers shows which were found, how to install the others, lets you turn one off or give your own command, and lists the running ones with Stop. A server stops a minute after its last file closes. Its errors appear next to oxlint's. |
| Linter | `oxlint` for JavaScript and TypeScript. Modes: Off, On save (default), As you type. Uses a `.oxlintrc.json` in your project if there is one. |
| Formatter | `oxfmt` with `Shift+Alt+F` or on save. Supports JavaScript, TypeScript, JSON, CSS, HTML, Markdown and YAML. |
| Auto save | Settings → Editor → Auto save. Saves after you stop typing for 200 ms, 500 ms, 1 s, 2 s, 5 s or any delay from 100 ms to 60 s. It never formats, so the cursor does not jump. Pending changes are saved when you leave the tab. |
| Problems | The status bar shows error and warning counts for open files. Press it for a list; click a row to jump to that line. |
| Quick open | `Ctrl+P`. With an empty box it lists recently opened files. |
| Send to terminal | Select code and press `Ctrl+Shift+Enter`, or right-click and choose **Send selection to terminal**. With nothing selected it sends the whole file. The text arrives with the file path and line range in a fenced block, after an optional question you type first, and is inserted as one block so you press Enter yourself. Limited to 20,000 characters. The diff view has the same as a **Send to terminal** button. Use it with an agent such as Claude or Codex: a plain shell has no way to receive a block and runs each line. |

Files larger than 2 MB are not opened.

## Git (Changes panel)

- Branch card: current branch, tracking branch, ahead and behind counts, last fetch time and a fetch button.
- Click the branch name to switch to another local branch.
- Stage, unstage or discard a file, or stage and unstage all. Discarding asks first; a new file goes to the Recycle Bin.
- Write a message and commit (`Ctrl+Enter` inside the message box).
- Select a file to read its diff. **Unified** shows the change as one list; **Side by side** shows the file before the change on the left and after it on the right, lined up row by row. Both show the old and new line numbers. The switch is in the diff header and your choice is remembered.
- **Pull** and **Push** buttons on the branch card show how many commits are behind or ahead. Pull is fast-forward only (it never makes a merge commit on its own); if your branch and the remote both have new commits you are told to merge or rebase in a terminal. Push publishes a branch with no upstream to `origin`. Git never prompts for a password inside the app; sign in once from a terminal if the remote asks.
- **Branch and commit actions** (the ... button on the branch card): **New branch** (from the current commit, switched to right away), **Rename** the current branch, **Delete** another branch (a branch with commits that are not merged asks a second time), **Change last commit message** (only the message; staged files are not added) and **Undo last commit** (soft reset: the changes go back to staged). Changing or undoing a commit that is already on the remote needs a force push, which o-bros does not do, so you are warned first.
- **Stashes**: **Stash changes** puts the changed and new files aside with a clean working tree. **Apply** restores a stash and removes it from the list, **Delete** removes it after you confirm.
- **History** (below the changes): the latest 50 commits of the current branch, newest first, each with its message, short hash, author, age and the branches or tags that point to it. A merge shows a merge icon. Open a commit to see the files it changed, and select a file to read that commit's diff. **Show more commits** loads 50 more, up to 200.
- **Graph**: press Graph next to History, or use the Changes / Graph switch above the main area. It draws the branches and merges as coloured lanes with the message, branch and tag labels, author, short hash and age of each commit. **All branches** shows every branch, not only the current one. It loads 100 commits at a time, up to 500. Open a commit for its files, and select a file to read that commit's diff.
- Added lines are green and removed lines red in diffs and in the +/− counts; a folder with new files lists each file.

Git must already know your name and email (`git config`). o-bros shows a clear message if it does not.

## Team (wot)

wot (work of teams) lets the agent you talk to summon other agents.

- **Optional:** nothing changes until you install it. Before that, `wot` answers `WOT_NOT_INSTALLED` and the Team button is hidden.
- **Set up once:** Settings → Team (wot) → **Install** (rows show the installed and available version, with **Update** when a newer one ships). There is one row per Claude Code account (`<account folder>/skills/wot/SKILL.md`) and one for the shared skills folder `~/.agents/skills/wot/SKILL.md`, which Codex, Gemini CLI, GitHub Copilot CLI, OpenCode and other agents that follow the Agent Skills standard read. The row lists the agents found on this computer (from the ACP registry and your PATH). Remove takes the file out again. Restart an agent that is already running.
- **Updates:** when O-BROS ships a newer skill than the one installed, a notice at start lists the outdated places with **Update all**, and `wot status` tells the agent to remind you. Older skills keep working; the git rules are enforced by O-BROS itself.
- **Any agent you have:** wot is not tied to Claude and Codex. Settings → Team (wot) → Agents on this computer lists every agent CLI O-BROS found (your agent buttons plus the ACP registry, checked against your PATH); any of them can be summoned, and any agent you install wot for can lead.
- **Use it:** in the terminal of an agent that has wot, ask it in your own words to bring in another agent by name, for example "ask gemini to review src/login.ts". The examples on the settings page use the agents installed on your computer. You do not need to say "wot".
- The agent runs the `wot` command, which every O-BROS terminal has: `wot agents` lists installed agents (your agent buttons plus the ACP registry, checked against your PATH), `wot spawn` starts a member and types its task, `wot wait` and `wot read` follow it, `wot send` answers it, `wot stop` closes it.
- **Team view** (rail button with a number): the side panel groups members under the lead that summoned them (the arrow opens the lead's terminal). The main area shows the selected member as a flow, Lead → Team member, with its agent, state pill (starting, working, finished its turn, waiting for an answer, stopped), task and live terminal. You can type into it or stop it.
- When a member asks a question, the Team button turns red and you get a notification.
- If you ask for an agent that is not installed, the agent tells you which ones are installed instead of installing anything.
- Outside O-BROS (or when O-BROS is closed or uninstalled), `wot` answers that it needs the app, and the skill tells the agent not to start other agents another way.
- **Agents and git** (Settings → Terminal): **Never allow** (default) refuses every agent commit (also through merge, cherry-pick, revert or rebase), push, and branch or worktree change at once, and the agent is told that you do it yourself. **Ask me** pauses the command and asks you; no answer in 100 seconds counts as no. **Allow** lets agents do it, but team members are still asked about. Agents are recognised by the program that runs git, including agents started by typing their name; your own git commands are never stopped. An agent that calls the git program by its full path is not stopped.
- **Commits are yours:** a commit an agent makes is authored and committed with the name and email in Settings → Terminal → Commits made by agents, not your global git config. If they are empty, O-BROS asks the first time. "Co-Authored-By" and "Generated with" lines are removed unless you tick "Let agents add themselves as co-author".
- **No agents in your GitHub history:** every O-BROS terminal has the git guard. When a git command comes from an agent, including one you started by typing its name in a plain terminal (O-BROS checks which program started the command), it gets your identity, `--author` is dropped, and credit lines are removed. Your own git commands are not changed or asked about. Before any push from an O-BROS terminal or the Push button, O-BROS checks the commits being pushed and asks you if one still has an agent as author or committer, or an agent "Co-Authored-By" or "Generated with" line. Branch names that mention an agent are pointed out in the question.
- **You stay in control:** type into a member's terminal in the Team view (Esc or Ctrl+C interrupts it), press Stop on one member, or Stop all in Storage and memory. Settings → Team (wot) → Free memory automatically stops members that finished and stayed idle (5, 10 or 30 minutes, or never) and members whose summoning terminal closed. Members asking a question are never stopped automatically.
- **Where team data lives:** each member's conversation is saved by that agent like any conversation (History and Saved conversations, where you can delete it); wot task files sit in the system temp folder `o-bros-wot` and are deleted after use; both appear in Storage and memory → Where your data lives.
- Limits: at most six members at a time; members cannot summon more members; the Codex sandbox may ask permission for the local connection.

## History

- Lists your Claude and Codex conversations, newest first, grouped by Today, Yesterday and Earlier. Each row shows the file size.
- **Team only** (shown when team members had conversations) lists only those, with a Delete button for all of them.
- **Resume** (play button on a row): opens a terminal in the session's project folder, with the right account, and runs `claude --resume <id>` or `codex resume <id>`.
- Delete one session from its row. A confirmation says what you lose and how much space it frees.
- Click a session to read it. It is read-only.

## Activity

Press the Activity button on the left (pulse icon).

The Activity page is one full-width monitor (no side list):
- **Running now:** a card for every agent running in O-BROS, including team members, with its state (working pulses blue, idle green, waiting for you red), where it runs, who summoned it, how long it has run, and its CPU and memory. Click a card to open its terminal.
- **Today:** agent time, sessions started, git actions asked (allowed and denied) and team members summoned.
- **Activity by hour** (hover a bar for its count) and **Time per agent today**.
- **Agents you start by typing their name** (for example `claude` in a plain terminal) are recognised by the program running in the terminal, checked a few seconds after you press Enter in a plain terminal and every 20 seconds while such an agent runs, so they appear on the monitor and in the log too.
- **Team members** count with the time they ran.
- **Log:** a timeline of what agents did, newest first, grouped by Today, Yesterday and older days.
- **Sessions:** when an agent started in O-BROS and how long it ran before it closed.
- **Git:** every commit, push and branch change an agent asked for, with the command and your answer (Allowed or Denied).
- **Team:** wot members joining and leaving, and why O-BROS stopped one.
- Hover a row for the full command and folder. The bin button on the Log clears it. The newest 500 entries are kept.

## Accounts and usage

- Detects every `~/.claude*` and `~/.codex*` folder that looks like a login.
- Shows the 5-hour and weekly usage of each, with when it resets.
- **Use** switches which account new terminals run with.
- **Add account** creates a named login (see [Getting started](GETTING-STARTED.md)).
- Claude and Codex are shown only when installed or signed in. **Other agents** lists every other agent CLI installed that needs an account sign-in, an API key or either (Gemini CLI, Qwen Code, OpenCode, Kilo Code, Cline, GitHub Copilot CLI, Cursor Agent, Amp, Factory Droid, Kimi, Goose, Aider, Crush): what it needs, whether it is set up (Signed in, API key, Not signed in in red, or Not checked when O-BROS cannot read its login), the providers it has connected and the command to sign in. An API key in an environment variable is detected by its name only; restart O-BROS after setting one. Only names and login types are read, never keys or tokens; these agents keep one login each, so they cannot be switched here.
- **Custom providers**: add your own model endpoint (name, Anthropic- or OpenAI-compatible, URL, model ID, context window and max output tokens, API key). Pick it for an agent button in Settings → Agents; that agent then starts with ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_MODEL and CLAUDE_CODE_MAX_OUTPUT_TOKENS, or OPENAI_BASE_URL, OPENAI_API_KEY and OPENAI_MODEL. The key is stored encrypted and shown only by its last 4 characters; providers are part of the settings export, keys are not.
- The status bar shows one compact usage item: the provider closest to a limit, for example `wk 57% 4d23h` (window, percent used, time until it resets), followed by small icons for the other logged-in providers. In a narrow window the reset time is dropped first, then the label. Hover it for every provider's numbers, and press it for a detailed or compact popover.
- Only Claude and Codex report usage. Other agents (Gemini CLI, OpenCode and so on) have no usage endpoint O-BROS can read, and an API key has no 5-hour or weekly limit. Hide either one in Settings → Agents → Usage in the status bar.

## Projects panel

- **Agent buttons** at the top start a command-line agent in the selected folder. At most two are shown, plus the plain terminal button. None are shown at first, because every computer has different agents. Open Settings → Agents (or press the Agents button), add the CLIs you use, and tick **Show** on up to two.
- Open sessions of the selected folder, with how long ago each started.
- Folders in each project with their git branch. Feature branches are shown in white.
- **Scripts:** the selected project's `package.json` scripts. Press one to run it in a new terminal. The package manager (npm, pnpm, yarn or bun) is chosen from the lock file.

## Resource Manager

Press the memory figure in the status bar.

The figures are the memory each process uses by itself, like the Memory column in Windows Task Manager. The larger "with shared" total also counts the system libraries every process loads.

- Total CPU and memory for the app and every terminal, grouped by project.
- **Language servers** that are running, with their CPU and memory.
- **Listening ports** opened by programs inside your terminals, with Open (opens `http://localhost:<port>` in your browser) and Stop for each.

## Storage and memory

**Where your data lives** (at the bottom of the page) lists every folder o-bros uses, in plain words, with an **Open folder** button: the program folder and the downloaded updates folder (installed app only), its own settings and cache folder, its log file, and the Claude and Codex conversation folders that History reads. o-bros keeps very little of its own; your conversations stay where the providers wrote them, and your projects are never copied.

Settings → Storage and memory lists everything o-bros can clear for you, how big it is, and a button for each. Everything on the page is safe: it is rebuilt when needed.

| Item | What it is | What clearing does |
|---|---|---|
| App cache | Files the app window keeps so it starts faster (web cache and compiled code cache) | Frees disk space. The next start may be a little slower once. |
| Leftover temporary files | `o-bros-lint-*` folders in the system temp folder that a crash left behind. Folders younger than a minute are skipped because a lint may still be using them. | Removes them. |
| Terminal history in memory | The scrolled-off lines every open terminal keeps | Frees memory. Visible text and running programs are not touched. |
| Recent files list | The names Quick open shows when its box is empty | Empties the list. |

**Saved conversations.** The same page lists, for Claude and for Codex, how many sessions are saved, how much disk they use and how old the oldest is. Each provider has one Delete button per age (not used for 7, 30 or 90 days or more, or all sessions) showing exactly how many sessions and bytes it would remove. A checkbox switches between the Recycle Bin or Trash (recoverable, space freed when emptied) and permanent delete (space freed at once, cannot be undone). Every delete asks for confirmation first.

| Keep sessions | Delete sessions |
|---|---|
| Costs disk space only, not memory | Frees disk space |
| You can resume with full context and read them in History | You can no longer resume or read them |
| Resuming a long session reloads its whole conversation, which can use more of your usage limit and be slower | Starting fresh is cheaper but starts without that context |

**Team (wot).** Running team members (Stop all), **Team member conversations** (every Claude and Codex conversation a team member had, with a Delete button) and wot task files. History marks those conversations "Team member · <name>" and has a "Team only" filter. In Settings → Team (wot) you can have a member's conversation moved to the Recycle Bin or Trash as soon as it stops. A Claude member gets its own session ID when it starts, so the match is exact; a Codex member is matched by its folder, start time and the task it was given, so a Codex member summoned without a task is not marked.

**Other agents.** Where your data lives also lists the conversation folders of Gemini CLI, Qwen Code, OpenCode, Kilo Code, Cline, GitHub Copilot CLI, Goose and Cursor Agent when they exist, with what each holds and what deleting it does. O-BROS only opens these; delete old sessions from inside the agent, because OpenCode and Kilo keep your login in the same folder. The list lives in `resources/agents/history-folders.json`.

**Clear everything below** runs the four cleanups above. It does not delete conversations. The page never touches your project files, git history, Claude or Codex logins and conversations, project folders list, or editor and terminal settings. Old conversations are removed from the History panel.

## Backup and restore

- **Export** (Settings → Backup and restore, or "Export settings to a JSON file" in the command palette) saves a JSON file with `format: "o-bros-settings"` and `formatVersion: 1`. It holds your color theme, editor settings, shortcuts, prompts, agent buttons, terminal options, agent and git options, the name and email for commits made by agents, and, if you tick the box, the list of project folders.
- Not included: open tabs, recent files, accounts, logins and tokens.
- **Import** checks the file first. A file that is not an O-BROS export, or that was made by a newer O-BROS, is refused. Otherwise it shows where the file came from and how many settings it has, and asks before applying. Settings in the file replace yours, settings not in the file stay, and project folders are added only if they exist on this computer. The window reloads to apply them, so open terminals restart.

## About and updates

Settings → About and updates shows the version and updates the installed app. O-BROS checks for a new version by itself 30 seconds after it starts and every 6 hours (turn it off with "Check for new versions automatically"). When one exists, a notice says so with a **Download** button; when the download is done, a second notice offers **Restart to update**. Each version is announced once. Failed checks, for example without internet, stay quiet. One card shows the state: a green dot and a **Latest** tag when you are up to date, a **New** tag when a version is available, a progress bar while it downloads, and **Ready** when it can be installed.

| Action | What happens |
|---|---|
| Check for updates | Asks GitHub whether a newer release exists. Nothing is sent but the request itself. |
| Download | Fetches the new version. The running app is not changed. |
| Restart and install | Closes o-bros, installs the update and opens it again by itself. If terminals are running something or files are unsaved, it tells you first. |
| Releases page | Opens the releases on GitHub in your browser, for a manual download. |
| Open log folder | Opens the folder holding `o-bros.log`, to attach to a bug report. |

Updates never run by themselves, and are unavailable when you run from source.

**What happens to running terminals:** they stop, because a terminal belongs to the app and the installer replaces the app. Your tabs come back as new terminals in the same folders, and Claude and Codex keep their conversations, so you can resume them from History. Save your files first.

## Notifications and messages

Short messages (toasts) appear bottom right, with an icon for success, warning or error. Errors are shown in bold. System error text is translated into plain sentences; o-bros does not show raw error codes.

## Settings reference

| Page | Setting |
|---|---|
| Provider accounts | Rescan, Use, Add account |
| Agents | Your list of agent CLIs (add, rename, change the command, remove), well-known agents found in your PATH, a search over every program in PATH, and up to two shown as buttons. Known agents get their own logo. Each agent shows a status: a green dot and **Connected** when its command is found in your PATH (for Claude and Codex, **Signed in** when a login is detected, or a hollow dot and **Not signed in** when it is not), and a hollow dot and **Not found** when the command is missing. **Custom agent** adds your own command. o-bros looks at your PATH again when the window gets focus (at most every 30 seconds) and when you press a button of an agent that is **Not found**, so a tool you just installed is picked up. If it is still missing, Settings → Agents opens with a message instead of running a command that would fail. The list of well-known agents comes from the [ACP Registry](https://agentclientprotocol.com/get-started/registry), fetched when the page opens, with a built-in list as a fallback |
| Project folders | Add and remove folders |
| Editor | Auto save and delay, linter mode, format on save, enabled languages |
| Language servers | Which language server each language uses, turn one off, or your own command (not included in backups, because a command runs when you open a file) |
| Terminal | History size, finished notification |
| Storage and memory | Clear app cache, leftover temporary files, terminal history, recent files, saved conversations |
| Shortcuts | Change the keys that split, close and open terminals |
| About and updates | Version, check for updates, download, releases page |
