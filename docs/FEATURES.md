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

Press `Ctrl+Shift+P` (changeable in Settings → Shortcuts) and type. Every word you type must appear in the command name, its group or its keywords, so `git push` and `push` both find **Push the current branch**. Use the arrow keys and Enter, or click. Commands that have a shortcut show it on the right, and it follows what you set in Shortcuts. It covers terminals and splits, Git (graph, changes, fetch, pull, push, stash, new branch), going to Projects, History, Changes or any settings page, showing or hiding panels, checking for updates and opening the log folder.

### Splitting

Split the focused terminal right or down from the buttons in the tab bar, or with the keyboard. Splitting never restarts a terminal: the shell you were typing in keeps its folder, its variables and its history, and the new pane opens next to it. Drag the line between two panes to resize them; the sizes are remembered.

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+D` | Split right |
| `Ctrl+Shift+E` | Split down |
| `Ctrl+Shift+W` | Close the focused pane |
| `Ctrl+Shift+T` | New terminal in the selected folder |

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
- Stays current: files and folders that an agent or another program creates, renames or deletes appear within a few seconds while the panel is open, and right away when you come back to the window.
- Right-click menu: New File, New Folder, Copy Path, Copy Relative Path, Open in Terminal, Send Path to Terminal, Collapse Folder, Find in Folder, Reveal in File Explorer, Rename (`F2`), Delete (`Del`).
- Delete moves the item to the Recycle Bin or Trash.
- Search finds files by name first, then by text. Files that only match inside their text are tagged "in text".
- A project folder itself cannot be renamed or deleted from the tree.

## Editor

| Feature | Details |
|---|---|
| Languages | Built in, with their own switch: JavaScript, TypeScript, JSON, CSS, HTML, Markdown, C/C++, Python, Rust, Go, Java, PHP, SQL, YAML, Svelte, Astro, environment and config files, plain text and logs. About 140 more from CodeMirror's language list (Vue, Shell, TOML, Dockerfile, Kotlin, Swift, Ruby, C#, Lua, PowerShell, Sass, Less and others) share one switch, **Every other language**. A file without a known name is recognized by its first line (`#!` names its interpreter; a file that starts with `<` opens as HTML). Parsers load only when a matching file opens. A language that is off opens as plain text. |
| Code intelligence | Language servers give completions from the whole project and its packages, type information on hover, errors as you type, go to definition (`F12`), find references (`Shift+F12`) and parameter hints (`Ctrl+Shift+Space`). O-BROS finds the servers installed in the project (`node_modules/.bin`) or on the computer and starts the right one when you open a file: TypeScript/JavaScript, Python, Rust, Go, C/C++, Java, PHP, CSS, HTML, JSON, YAML, Markdown and SQL. Settings → Language servers shows which were found, how to install the others, lets you turn one off or give your own command, and lists the running ones with Stop. A server stops a minute after its last file closes. Its errors appear next to oxlint's. |
| Linter | `oxlint` for JavaScript and TypeScript. Modes: Off, On save (default), As you type. Uses a `.oxlintrc.json` in your project if there is one. |
| Formatter | `oxfmt` with `Shift+Alt+F` or on save. Supports JavaScript, TypeScript, JSON, CSS, HTML, Markdown and YAML. |
| Auto save | Settings → Editor → Auto save. Saves after you stop typing for 200 ms, 500 ms, 1 s, 2 s, 5 s or any delay from 100 ms to 60 s. It never formats, so the cursor does not jump. Pending changes are saved when you leave the tab. |
| Problems | The status bar shows error and warning counts for open files. Press it for a list; click a row to jump to that line. |
| Quick open | `Ctrl+P`. With an empty box it lists recently opened files. |

Files larger than 2 MB are not opened.

## Git (Changes panel)

- Stays current: while the Git page is open, files an agent changes, commits made in a terminal and branch switches appear within a few seconds, without leaving the page.
- How deep to look for repositories: Settings → Project folders, from 1 to 6 folder levels (default 3). Each search stops after 20 seconds or 100 repositories.
- Repository switcher at the top: every project folder, each followed by the repositories inside it; pick a folder or a repository (a folder such as `E:` lists every repository up to three levels down). Your selected project and terminal tabs stay as they are. **Follow project** goes back to showing the selected project.
- Branch card: current branch, tracking branch, ahead and behind counts, last fetch time and a fetch button.
- Click the branch name to switch to another local branch.
- Stage, unstage or discard a file, or stage and unstage all. Discarding asks first; a new file goes to the Recycle Bin.
- Write a message and commit (`Ctrl+Enter` inside the message box).
- Select a file to read its diff. **Unified** shows the change as one list; **Side by side** shows the file before the change on the left and after it on the right, lined up row by row. Both show the old and new line numbers, and in a changed line the words that changed are highlighted, not just the whole line. Lines that are rewritten completely stay plain red and green. The switch is in the diff header and your choice is remembered.
- **Pull** and **Push** buttons on the branch card show how many commits are behind or ahead. Pull is fast-forward only (it never makes a merge commit on its own); if your branch and the remote both have new commits you are told to merge or rebase in a terminal. Push publishes a branch with no upstream to `origin`. Git never prompts for a password inside the app; sign in once from a terminal if the remote asks.
- **Conflicts.** When a merge, rebase, cherry-pick, revert or stash leaves conflicts (whether you started it in a terminal or an agent did), the Changes panel shows a red box naming what is in progress, for example "Merging feature-x", and lists every conflicted file. For each file press **Use current** (the version that was on your branch) or **Use incoming** (the version being brought in), or click the file to fix it in the editor and press ✓ to mark it resolved; ✓ is refused while `<<<<<<<` and `>>>>>>>` markers are still in the file. When nothing is left, **Commit merge** (or Continue rebase, cherry-pick or revert) finishes it, and **Abort** cancels it and puts the branch back as it was, after asking. During a rebase git calls the branch you are rebasing onto "current" and your own commit "incoming".
- **Branch and commit actions** (the ... button on the branch card): **New branch** (from the current commit, switched to right away), **Rename** the current branch, **Delete** another branch (a branch with commits that are not merged asks a second time), **Change last commit message** (only the message; staged files are not added) and **Undo last commit** (soft reset: the changes go back to staged). Changing or undoing a commit that is already on the remote needs a force push, which o-bros does not do, so you are warned first.
- **Stashes**: **Stash changes** puts the changed and new files aside with a clean working tree. **Apply** restores a stash and removes it from the list, **Delete** removes it after you confirm.
- **History** (below the changes): the latest 50 commits of the current branch, newest first, each with its message, short hash, author, age and the branches or tags that point to it. A merge shows a merge icon. Open a commit to see the files it changed, and select a file to read that commit's diff. **Show more commits** loads 50 more, up to 200.
- **Graph**: press Graph next to History, or use the Changes / Graph switch above the main area. It draws the branches and merges as coloured lanes with the message, branch and tag labels, author, short hash and age of each commit. **All branches** shows every branch, not only the current one. It loads 100 commits at a time, up to 500. Open a commit for its files, and select a file to read that commit's diff.
- Added lines are green and removed lines red in diffs and in the +/− counts; a folder with new files lists each file.

Git must already know your name and email (`git config`). o-bros shows a clear message if it does not.

## Team (wot)

wot (work of teams) lets the agent you talk to summon other agents.

- **Optional:** nothing changes until you install it. Before that, `wot` answers `WOT_NOT_INSTALLED`.
- **Set up once:** Settings → Team (wot) → **Install** (rows show the installed and available version, with **Update** when a newer one ships). There is one row per Claude Code account (`<account folder>/skills/wot/SKILL.md`) and one for the shared skills folder `~/.agents/skills/wot/SKILL.md`, which Codex, Gemini CLI, GitHub Copilot CLI, OpenCode and other agents that follow the Agent Skills standard read. The row lists the agents found on this computer (from the ACP registry and your PATH). Remove takes the file out again. Restart an agent that is already running.
- **Updates:** when O-BROS ships a newer skill than the one installed, a notice at start lists the outdated places with **Update all**, and `wot status` tells the agent to remind you. Older skills keep working; the git rules are enforced by O-BROS itself.
- **Any agent you have:** wot is not tied to Claude and Codex. Settings → Team (wot) → Agents on this computer lists every agent CLI O-BROS found (your agent buttons plus the ACP registry, checked against your PATH); any of them can be summoned, and any agent you install wot for can lead.
- **Use it:** in the terminal of an agent that has wot, ask it in your own words to bring in another agent by name, for example "ask gemini to review src/login.ts". The examples on the settings page use the agents installed on your computer. You do not need to say "wot".
- The agent runs the `wot` command, which every O-BROS terminal has: `wot agents` lists installed agents (your agent buttons plus the ACP registry, checked against your PATH), `wot spawn` starts a member and types its task, `wot wait` and `wot read` follow it, `wot send` answers it, `wot stop` closes it.
- **Members live under their lead in Projects:** in Open sessions, a terminal that summoned members becomes a box with its members nested inside: a spinner while it works, the agent's icon, its name and task, and its age, "asking" in red when it waits for an answer, or "exited". The first three show; "Show N more" reveals the rest (at most six members exist). Members whose lead terminal was closed show under "Lead closed" in their project.
- **How the lead follows its members:** nothing is pushed to the lead; it asks. `wot wait <name>` blocks until that member finishes its turn (no output for 5 seconds), asks a question (the screen shows a prompt such as "(y/n)" or "do you want to proceed") or exits, for up to 100 seconds (`--timeout`, at most 280), and `wot read` shows its screen. `wot wait --any` does the same for whichever of the lead's members has news first, reporting each piece of news once, and answers `NOTHING_NEW` when all are settled and already seen. Errors and warnings are not a separate state: the member finishes and the lead reads them on its screen. You get a notification when a member asks a question, even when the lead is not waiting.
- **Watching a member:** click it and its terminal fills the main area under your tab bar, with one bar: back, the lead (click to go to its terminal), the member's name and agent, its task, its state (starting, working, finished its turn, waiting for an answer, stopped) and Stop. You can type into it. Clicking any tab or Back returns to your terminals. The rail button with the number opens the member that is asking a question, or the newest one.
- When a member asks a question, the rail number turns red and you get a notification; clicking the notification opens that member.
- **Options for the lead:** `wot spawn <agent> ... --cwd <folder>` runs the member in another folder of the project, and everything after `--` goes to the agent program (`wot spawn codex --name docs --task-file f -- --no-daemon`). Unknown options are refused with a list of the valid ones.
- **When a member's agent stops** (it crashed at start, or you pressed Ctrl+C in its terminal), the member shows "exited" with its last screen; `wot spawn` reports the agent's error instead of sending the task, and `wot send` is refused. Esc only interrupts the current turn and the member stays.
- **Drive roots:** when a member would work in the top of a drive such as `E:\`, `wot spawn` warns the lead. Codex's Windows sandbox cannot run commands or write files there; use `--cwd` with a subfolder.
- **Long messages:** wot waits until the agent has taken in the whole text before pressing Enter, and presses it once more if the agent did not start working (Codex needs this after a large paste). It never presses Enter again when the screen shows a question.
- If you ask for an agent that is not installed, the agent tells you which ones are installed instead of installing anything.
- Outside O-BROS (or when O-BROS is closed or uninstalled), `wot` answers that it needs the app, and the skill tells the agent not to start other agents another way.
- **Agents and git** (Settings → Terminal): **Never allow** (default) refuses every agent commit (also through merge, cherry-pick, revert or rebase), push, and branch or worktree change at once, and the agent is told that you do it yourself. **Ask me** pauses the command and asks you; no answer in 100 seconds counts as no. **Allow** lets agents do it, but team members are still asked about. Agents are recognised by the program that runs git, including agents started by typing their name; your own git commands are never stopped. An agent that calls the git program by its full path is not stopped.
- **Commits are yours:** a commit an agent makes is authored and committed with the name and email in Settings → Terminal → Commits made by agents, not your global git config. If they are empty, O-BROS asks the first time. "Co-Authored-By" and "Generated with" lines are removed unless you tick "Let agents add themselves as co-author".
- **No agents in your GitHub history:** every O-BROS terminal has the git guard. When a git command comes from an agent, including one you started by typing its name in a plain terminal (O-BROS checks which program started the command), it gets your identity, `--author` is dropped, and credit lines are removed. Your own git commands are not changed or asked about. Before any push from an O-BROS terminal or the Push button, O-BROS checks the commits being pushed and asks you if one still has an agent as author or committer, or an agent "Co-Authored-By" or "Generated with" line. Branch names that mention an agent are pointed out in the question.
- **You stay in control:** type into a member's terminal (Esc interrupts its turn, Ctrl+C stops its agent), press Stop on its row or in its view, or Stop all in Storage and memory. Every Stop asks first, and says when the member is still working or waiting for an answer. Settings → Team (wot) → Free memory automatically stops members that finished and stayed idle (5, 10 or 30 minutes, or never) and members whose summoning terminal closed. Members asking a question are never stopped automatically.
- **Where team data lives:** each member's conversation is saved by that agent like any conversation (History and Saved conversations, where you can delete it); wot task files sit in the system temp folder `o-bros-wot` and are deleted after use; both appear in Storage and memory → Where your data lives.
- Limits: at most six members at a time; members cannot summon more members; the Codex sandbox may ask permission for the local connection.

## History

- Lists your Claude and Codex conversations, newest first, grouped by Today, Yesterday and Earlier. Each row shows the file size.
- **Team only** (shown when team members had conversations) lists only those, with a Delete button for all of them.
- **Resume** (play button on a row): opens a terminal in the session's project folder, with the right account, and runs `claude --resume <id>` or `codex resume <id>`.
- Delete one session from its row. A confirmation says what you lose and how much space it frees.
- Click a session to read it. It is read-only.
- **Continue with…** (the two-arrows button on a row, or the button above a conversation): pick any agent from your agent buttons and it starts in the conversation's folder with a handoff as its first message, so you do not repeat yourself when an agent hits its limit. Pick the same agent to start a fresh conversation that still knows what happened. O-BROS needs no model for this, so it works after a limit.
- **From a running agent:** right-click a Claude or Codex terminal tab → **Continue in another agent…**. O-BROS finds that tab's conversation (the newest one of that agent in its folder since the tab opened); if the agent has not saved anything yet, it says to send a message first.
- **The handoff** is built from the universal history: a marker line, which agents worked on it, the folder, the paths of the full copies (the new agent can read them for more detail), the conversation (your first request always, the newest messages, then your older requests; your messages up to 3,000 characters, the agent's answers shortened to 800, about 24,000 characters at most), the files changed and not committed yet, and "continue from the latest request". It is typed in like a wot message: O-BROS waits until the agent is ready, then presses Enter again if the agent did not start working.
- **Threads:** conversations continued across agents form a thread, shown as a chip such as "Claude → Codex" on each of its conversations (hover for which part this is). A Claude part is linked exactly (it starts with its own session ID); a Codex part is found by its folder, start time and the handoff's marker line. Other agents appear in the chain but their conversation cannot be read yet. Threads are saved in `threads.json` next to the universal history.

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
- **Custom providers**: add your own model endpoint (name, Anthropic- or OpenAI-compatible, URL, model ID, context window and max output tokens, API key). Pick it for an agent button in Settings → Agents; that agent then starts with ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_MODEL and CLAUDE_CODE_MAX_OUTPUT_TOKENS, or OPENAI_BASE_URL, OPENAI_API_KEY and OPENAI_MODEL. The key is stored encrypted and shown only by its last 4 characters; providers are part of the settings export, keys are not. **Test connection** checks the URL, the key and the model ID against the provider's model list. wot team members started from that agent button use the same provider.
- The status bar shows one compact usage item: the provider closest to a limit, for example `wk 57% 4d23h` (window, percent used, time until it resets), followed by small icons for the other logged-in providers. In a narrow window the reset time is dropped first, then the label. Hover it for every provider's numbers, and press it for a detailed or compact popover.
- Only Claude and Codex report usage. Other agents (Gemini CLI, OpenCode and so on) have no usage endpoint O-BROS can read, and an API key has no 5-hour or weekly limit. Hide either one in Settings → Agents → Usage in the status bar.

## Projects panel

- **Agent buttons** at the top start a command-line agent in the selected folder. At most two are shown, plus the plain terminal button. None are shown at first, because every computer has different agents. Open Settings → Agents (or press the Agents button), add the CLIs you use, and tick **Show** on up to two.
- Open sessions of the selected folder, with how long ago each started.
- Folders in each project with their git branch. Feature branches are shown in white. New folders and branch switches made in a terminal show up within a few seconds.
- **Scripts:** the selected project's `package.json` scripts. Press one to run it in a new terminal. The package manager (npm, pnpm, yarn or bun) is chosen from the lock file.

## Resource Manager

Press the memory figure in the status bar.

The figures are the memory each process uses by itself, like the Memory column in Windows Task Manager. The larger "with shared" total also counts the system libraries every process loads.

- Total CPU and memory for the app and every terminal, grouped by project.
- **Language servers** that are running, with their CPU and memory.
- **Listening ports** opened by programs inside your terminals, with Open (opens `http://localhost:<port>` in your browser) and Stop for each.

## Storage and memory

Settings → Storage and memory shows what O-BROS and your agents keep on your disks and in memory, and lets you free space. Four tiles at the top work like a monitor: the fullest drive (red when almost full), what O-BROS and your agents keep, what is safe to free now (**Free it** runs Clear all safe items) and the memory in use. Every action carries a label, and its button's tooltip says what happens; anything that cannot be undone asks first:

| Label | Meaning |
|---|---|
| **Safe** | Rebuilt automatically when needed. Nothing you made is lost. |
| **Can undo** | You can reverse it later from the same page (Move back, Move again, or restore from the Recycle Bin). |
| **Permanent** | Cannot be undone, and asks first. |

The page goes from overview to actions:

1. **Your disks.** Each drive with its free space and a bar, and what O-BROS and your agents keep there, largest first: each agent's conversations, the universal history, O-BROS's own settings and cache, and downloaded updates (installed app only). A folder moved to another drive is counted on the drive it really lives on. A drive with less than 10 GB or 10% free turns red and says what you can do. Hover a line to see its folder. **Measure again** refreshes everything.
2. **Free space safely** (all Safe). App cache (the next start may take a moment longer), leftover temporary lint folders from a crash (folders younger than a minute are skipped), team task files (normally empty; a task a member has not read yet would be lost), and the recent files list. **Clear all safe items** runs these four; it never touches conversations or memory.
3. **Conversations.**
   - **Universal history.** A conversation that is still growing is saved once it has been quiet for 2 minutes, so a long active session is not re-read every minute; **Save now** and Continue with… save everything at once. O-BROS keeps its own plain-text copy of your Claude and Codex conversations in one folder, `o-bros-history`, with one `<agent>-resume` folder per agent (`claude-resume`, `codex-resume`) and one file per conversation, named by the day it was first saved and its session ID. Only your messages and the agent's answers are kept, not tool output, so it is small (on a test computer, 176 conversations took 9.4 MB against about 3 GB of agent files). It saves every minute while O-BROS runs and only re-reads conversations that changed; **Save now** saves at once. The row shows the folder, the conversation count and size per agent, and how much space its drive has left. **Move…** (Can undo) asks for a folder, creates `o-bros-history` inside it, copies everything, checks the copy, switches to it and removes the old folder; if a step fails, the history stays where it was. **Keep copies of** (Permanent): Everything, or only conversations used in the last 30, 90 or 365 days; choosing a number asks first, then deletes older copies now and from then on. The agents' own conversations are never touched by it. The default folder is inside the O-BROS data folder until you move it.
   - **Move conversations to another drive** (Can undo). Agents save conversations on the drive they are installed on, which can fill it. Press **Choose folder…** (for example `E:\o-bros\chat-history`), then **Move** next to an agent. O-BROS checks the agent is closed and there is room, moves the folder into `<chosen folder>\<agent>` and leaves a link (a junction on Windows) in the old place, so the agent, History and resume keep working and new conversations land in the new folder. Only conversation folders move: Claude's `projects` and Codex's `sessions` for every account, and the folders of Gemini CLI, Qwen Code, Cline, GitHub Copilot CLI, Goose and Cursor Agent. OpenCode and Kilo keep their login in the same folder, so their Move button stays off. **Move back** returns the files. If anything fails part way, the files are put back where they were.
   - **Delete old conversations.** One row for Claude and one for Codex: how many conversations are saved, how much disk they use and how old the oldest is, an age picker (unused 7+, 30+ or 90+ days, or All; 90+ is chosen first) with how many that matches, and **Delete**. Below them, **Team member conversations** (every Claude and Codex conversation a wot team member had; History marks them "Team member · <name>"). The **Delete permanently** switch chooses between the Recycle Bin or Trash (Can undo; space freed when you empty it) and permanent delete (Permanent; space freed at once). Every delete asks first. O-BROS's copy in the universal history stays.
4. **Memory right now.** Terminal history in memory (Safe: frees memory, you can no longer scroll back to those lines) and running team members (**Stop all**, Permanent: unfinished work in a member's turn is lost; files and saved conversations stay), with a shortcut to the team auto-stop settings. Then the graphics card setting.
5. **Where your data lives**, folded until you press **Show … folders**. Every folder O-BROS uses or reads, in plain words, with **Open folder**: the program and downloaded updates (installed app only), its settings and cache, its log file, the conversation folders History reads, the universal history folder, other agents' conversation folders (Gemini CLI, Qwen Code, OpenCode, Kilo Code, Cline, GitHub Copilot CLI, Goose, Cursor Agent) when they exist, the wot task folder and every installed wot skill. O-BROS only opens other agents' folders; delete old sessions from inside the agent, because OpenCode and Kilo keep your login in the same folder. The list lives in `resources/agents/history-folders.json`.

The page never touches your project files, git history, agent logins, project folders list, or editor and terminal settings.

## Backup and restore

- **Export** (Settings → Backup and restore, or "Export settings to a JSON file" in the command palette) saves a JSON file with `format: "o-bros-settings"` and `formatVersion: 1`. It holds your color theme, editor settings, shortcuts, agent buttons, terminal options, agent and git options, the name and email for commits made by agents, and, if you tick the box, the list of project folders.
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
