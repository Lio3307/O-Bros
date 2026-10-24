# Changelog

All notable changes to o-bros are listed here. The format follows [Keep a Changelog](https://keepachangelog.com), and versions follow [Semantic Versioning](https://semver.org).

## [Unreleased]

### Added
- **Colors for about 140 more languages**, such as Vue, Shell, TOML, Dockerfile, Kotlin, Swift, Ruby, C#, Lua, PowerShell, Sass and Less, from CodeMirror's official language list. Each one loads only when you open a matching file. A file without a known name is recognized by its first line: `#!/usr/bin/env python3` opens as Python, `#!/bin/bash` as Shell, and a file that starts with `<` as HTML. Settings > Editor > Languages has one switch for all of them, **Every other language**.
- **Every terminal shows the agent running in it.** Tabs and the sessions in Projects show that agent's own logo, whichever agent it is: one started from an agent button, or one you typed into a plain terminal (picked up a few seconds after Enter). A new agent tab is named after the agent instead of the folder; a name you gave a tab is kept. When the agent stops, or after you close and reopen O-BROS, the logo stays but turns grey, and its tooltip says the agent is not running there any more.
- **Project folders that are moved, deleted or on a disconnected drive.** Projects marks such a folder **Folder not found** with **Locate…** (point it at where the folder is now; the sidebar keeps its place) and **Remove**. When the folder or drive comes back, it shows up again by itself. A terminal opened there says the folder is not available instead of staying blank, and Changes says the same instead of "not a git repository". One missing folder no longer hides the others.
- **Paste a screenshot into a terminal.** With an image on the clipboard (for example from Win+Shift+S), Ctrl+Shift+V or Paste in the terminal menu saves it as a PNG in O-BROS's own data folder and pastes its path, so any agent can read the picture. Pasted images stay on this computer and are removed after 7 days. Ctrl+V still goes to the program in the terminal, so agents that read the clipboard themselves keep working.
- **Image preview.** Opening a PNG, JPG, GIF, WebP, AVIF, BMP, ICO or SVG file in a project shows the picture instead of its bytes, with its size in pixels and on disk, and a switch between fit to window and actual size. Transparent parts show as a checkerboard, and the preview follows changes on disk.
- **Open files follow changes on disk.** When an agent (or anything else) changes a file you have open, the editor shows the new text right away and keeps your cursor and scroll. If you have unsaved edits in that file, nothing is replaced: a bar says the file changed on disk, with **Reload** and **Keep mine**.
- **Hide a folder's terminals in Projects.** A folder with open terminals has an arrow in front of it. Collapsed, it shows how many terminals it hides, and O-BROS remembers the choice.
- **Svelte and Astro files have colors.** Their markup, their `<script>` (also `lang="ts"`) and their `<style>` (also `lang="scss"`, `"less"` and `"postcss"`) are colored with the HTML, TypeScript and CSS support O-BROS already has. Template expressions such as `{#if}` stay plain.

### Fixed
- **Team members were cancelled while they were still loading.** `wot spawn` waited until the new agent had opened, which can take up to a minute, but many agents stop a shell command much sooner (Codex after about 10 seconds). The leader then saw a failure, stopped the member and tried again. Now `wot spawn` returns within seconds, O-BROS types the task in by itself as soon as the agent is ready, and `wot wait` reports the member as starting until then. When O-BROS has to remove a member, wot now tells the leader why. **wot skill 1.6.0** explains this to agents; O-BROS offers the update at start.
- **Right-click in a terminal opens a menu** with Copy, Paste, Select all, Continue in another agent, Split right, Split down and Clear screen, instead of reaching the program in the terminal (some agents pasted the clipboard on right-click).
- **Selected text in the editor is visible again.** The editor's own dark teal won over the color theme's selection color, and the current line's background covered the selection on that line completely. The selection now uses the theme's color, and the current line is drawn see-through.
- **"Finished" notifications while the agent was still working.** When you switched to another app or page, the terminal told the agent it lost focus, the agent stopped redrawing its spinner, and the silence looked like the end of its turn. O-BROS now also checks the terminal screen: while it still shows "esc to interrupt", it keeps waiting.
- **Less work in the background, so the app responds faster.** Searching a whole drive such as `C:\` for repositories took 8 seconds every time you came back to the window on the Git page; it now skips Windows system folders (`Windows`, `Program Files`, `ProgramData`, `AppData` and others) and takes about 0.1 seconds. The universal history no longer re-reads a conversation that is still growing every minute (a 300 MB conversation cost 3 seconds each time); it saves it once it has been quiet for 2 minutes. **Save now** and **Continue with…** still save everything at once.
- **The arrows that show or hide project folders react to every click.** A second click within a third of a second used to be ignored.

### Changed
- **Every on/off setting is a switch** instead of a checkbox, in all of Settings and the History filter.
- **Storage and memory is easier to read.** Four tiles at the top show the fullest drive, what O-BROS and your agents keep, what is safe to free (with **Free it**) and the memory in use. Deleting old conversations is one row per agent with an age picker instead of four rows each. What a button does is now in its tooltip instead of a line under every row; anything that cannot be undone still asks first. "Where your data lives" is folded away until you open it.

## [0.1.7] - 2026-10-22

### Fixed
- **Check for updates always failed** with "Could not check for updates" in 0.1.5 and 0.1.6. The updater was loaded in a way that left it empty, so no check ever reached GitHub. If you have 0.1.5 or 0.1.6, download 0.1.7 once from the Releases page; updates work from the app again after that.

## [0.1.6] - 2026-10-21

### Added
- **Continue a conversation in another agent.** When an agent hits its limit, press **Continue with…** on a conversation in History (or right-click its terminal tab → **Continue in another agent…**) and pick any of your agents. It starts in the same folder and gets a handoff as its first message: what you asked (your first request always, then the newest messages and your older requests), what the agent answered, the files changed in git, and the paths of the full copies so it can read more. No model is needed, so it works after a limit. Conversations continued this way form a thread, shown as a chip such as "Claude → Codex" in History, and the continued conversation is titled "Continued: …". Measured on a real 1,500-line conversation: a 17,700-character handoff with 35 of the user's requests.
- **Universal history.** O-BROS keeps its own plain-text copy of your Claude and Codex conversations in one folder you control, `o-bros-history`, with one `<agent>-resume` folder per agent and one file per conversation. Only your messages and the agent's answers are kept, so it stays small (176 real conversations: 9.4 MB). It saves every minute while O-BROS runs, only re-reading what changed. Settings → Storage and memory → Universal history shows its folder, size per agent and the free space of its drive, with **Move…** (copies, checks, then removes the old folder) and **Keep copies of** Everything, 30, 90 or 365 days. It is the base for continuing a conversation with another agent later.
- **Your disks** at the top of Storage and memory: every drive's free space and what O-BROS and your agents keep on it, largest first, counted on the drive a moved folder really lives on. A drive with less than 10 GB or 10% free turns red and says what to do.
- **Choose where conversations are saved.** Settings → Storage and memory → Where each agent saves its conversations: choose a folder, for example `E:\o-bros\chat-history`, and press **Move** next to an agent to move its conversations there and free space on the drive they were on. O-BROS leaves a link in the old place, so the agent, History and resume keep working and new conversations are saved in the new folder too. It checks the agent is closed and the folder has room, moves only conversation folders (never logins or settings), compares the copy before deleting the original, and puts everything back if a step fails. Works for Claude and Codex (every account), Gemini CLI, Qwen Code, Cline, GitHub Copilot CLI, Goose and Cursor Agent; OpenCode and Kilo keep their login in the same folder, so they are listed but not moved. **Move back** returns the files.
- **Panels update by themselves.** The Git page, the Files panel and the Projects list now pick up what agents and terminals do while you watch: changed files, new commits and branch switches on the Git page, new or deleted files in the file tree, new folders and branch names in Projects. Only the panel on screen is re-read, every 4 seconds and when you come back to the window, and nothing is re-read while O-BROS is minimized. Repository lists are re-read when you come back to the window.
- **Look deeper for repositories.** Settings → Project folders → How deep to look for repositories, from 1 to 6 folder levels (default 3), so a repository such as `C:\Users\you\source\repos\app` can be found. A search stops after 20 seconds or 100 repositories.
- **`wot wait --any`.** A lead with several members waits for whichever of its own members finishes, asks a question or exits first, instead of waiting on them one by one. Each member is reported once per piece of news; when every member is settled and already seen, it answers `NOTHING_NEW` right away instead of waiting.
- **wot: options for the agent and the folder.** `wot spawn ... -- <options>` passes options to the agent program (for example `-- --no-daemon`), and `--cwd <folder>` runs the member in another folder of the project. Options wot does not know are refused with the list of valid ones, instead of being silently dropped.

### Changed
- **Storage and memory explains itself.** The page now goes from overview to action: Your disks, Free space safely, Conversations (universal history, where each agent saves, deleting old ones), Memory right now, Where your data lives. Every action carries a label (Safe, Can undo, Permanent) and an "If you press …" line saying what happens, and the Team (wot) items moved to where they belong (task files with the safe items, member conversations with the other conversations, running members with memory). **Clear all safe items** replaces "Clear everything below" and no longer clears terminal history, which is memory, not disk.
- **Team members live under their lead in Projects.** The separate Team page is gone. A terminal that summoned members becomes a box in Open sessions with its members nested inside (spinner while working, agent icon, name, age, red when asking; hover a name to see its task). Click one to see its terminal in the main area under your tab bar, with Back, Lead › member, state and Stop. The rail button with the count opens the member that is asking a question, or the newest one. With many members, the first three show and "Show N more" reveals the rest.
- **Stopping a member always asks**, from its row or its view, and says when it is still working or waiting for an answer.
- **wot skill 1.5.0** explains the new options, `wot wait --any`, the drive-root warning and what "exited" means. O-BROS offers the update at start.
- **Every package is on its latest stable version**, including Electron 45, TypeScript 7, lucide-react 1, Vite 8.3.5, Vitest 5.0.5, Playwright 1.64.1, and oxlint 1.89. node-pty stays on the stable 1.1.0: its 1.2.0 beta made O-BROS freeze on close in about 1 of 3 quits when a terminal had just opened. `react-resizable-panels` was removed because nothing used it.
- **Pick any repository on the Git page.** A switcher at the top of the Changes panel lists every project folder, each with the repositories inside it (up to three levels down, such as `C:\xampp\htdocs\SmartPRO`). The folders are scanned in the background when the page opens, so the list opens quickly even for a whole drive. Choosing one no longer changes the selected project or hides that project's terminal tabs, and the command palette's fetch, pull and push act on the same repository. **Follow project** goes back to the folder of the selected project, which is what the page showed before. The side panel no longer stays empty when the folder is not a repository.

### Security
- **Secrets are hidden in handoffs.** Before a handoff is typed into the next agent (which sends it to its provider), anything that looks like a secret is replaced with `[hidden]`: API keys and tokens with a known start (such as `sk-`, `ghp_`, `AKIA`), values of settings named like a password, key, token or secret (`.env` lines, flags, JSON, `?secret=` in links), passwords inside links, `Bearer` tokens, private key blocks and long random strings. The notice says how many were hidden. Your own universal history copy is not changed. It is a safety net, not a guarantee: a plain word used as a password can still get through.
- **`npm audit` reports no vulnerabilities.** The 8 moderate warnings came from `sprintf-js`, pulled in by an old proxy helper (`global-agent` 3) inside electron-builder's Electron download step. A package override lifts it to `global-agent` 4.1.3, which no longer uses `sprintf-js`; nothing was downgraded.
- **The installed app ignores the developer page address.** It always loads its own built page; before, setting `ELECTRON_RENDERER_URL` on a computer made the installed app load any address with full access to files and terminals.
- **Running from source no longer shares data with the installed app.** `npm run dev` uses its own `o-bros-dev` data folder, so development settings, open tabs, saved keys, activity and logs never mix with the installed app's.
- **DevTools and Reload are only available when running from source**, and the installed app ignores `NODE_OPTIONS` and `--inspect` (Electron fuses).
- **Background requests are accepted only from the O-BROS window.** Every request from the interface is checked to come from O-BROS's own page.

### Fixed
- **Codex team members failed with "failed to open daemon process: Access is denied".** When O-BROS was started from another terminal app (for example Orca), every O-BROS terminal inherited that app's `CODEX_HOME` and session variables, so Codex used the other app's private Codex folder and background server. O-BROS terminals now start without `CODEX_HOME`, `CLAUDE_CONFIG_DIR` and the other app's session variables, so the account chosen in O-BROS applies. Reproduced with real Codex before and after the fix.
- **An agent that exited at start still got its task, typed into a bare shell, and wot said OK.** A member terminal now runs the agent itself, so it closes when the agent exits; `wot spawn` reports the agent's error and the member shows "exited".
- **A member stopped with Ctrl+C looked "finished".** It now shows "exited", and the lead's next `wot send` is refused instead of being typed into a shell.
- **A long `wot send --file` stayed in Codex's input box without being sent.** wot now waits until the text is taken in and checks that the agent started working, pressing Enter a second time when needed (measured with Codex: the first Enter after a large paste only finishes the paste).
- **wot warns when a member would work in a drive root.** Codex's Windows sandbox cannot run commands or write files in `E:\` (reproduced with `codex sandbox`); `wot spawn` now says so and suggests `--cwd`.
- **O-BROS could fail to start when browser storage is blocked.** The terminal font size was read without a guard. All saved interface settings now go through one helper that falls back to the defaults.
- **A whole drive showed no repositories.** With a drive such as `C:\` added as a project folder, the repository list stopped at the first folder Windows does not let you read (`C:\Config.Msi`) and showed nothing, with "Error occurred in handler for 'projects:repositories'" in the log. Folders that cannot be read are now skipped.
- **Collapsed project folders opened again.** A project folder collapsed on the Projects page expanded again after visiting another page or restarting. It now stays collapsed.
- **A member asking a question showed "Working" once you opened it.** Opening its view resized the terminal and the agent redrew its question, which counted as new output. A redraw that ends with the same question no longer does.
- **The History filter looked broken.** The "Delete N" button for team conversations showed as a blank white box until Settings had been opened once, the "Team only" box was the default blue, and the continue, resume and delete icons covered the end of the title on hover. The button now looks like the other delete actions, with a trash icon, the box is white like the ones in Settings, and the title makes room for the icons.

## [0.1.5] - 2026-10-20

### Added
- **Resolve merge conflicts in the Changes panel.** A merge, rebase, cherry-pick, revert or stash that stops on conflicts now shows a red box with what is in progress and every conflicted file. Pick **Use current** or **Use incoming** per file, or fix it in the editor and mark it resolved with ✓ (refused while conflict markers remain), then **Commit merge** or **Continue**, or **Abort** to go back. Before, conflicted files were missing from the Changes panel entirely.
- **Custom providers.** Settings → Provider accounts → Custom providers adds your own model endpoint: a name, Anthropic- or OpenAI-compatible, the URL, the model ID, the context window and max output tokens, and an API key. Pick one for an agent button in Settings → Agents and that agent starts with it (ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_MODEL and CLAUDE_CODE_MAX_OUTPUT_TOKENS, which Claude Code reads, or OPENAI_BASE_URL, OPENAI_API_KEY and OPENAI_MODEL). The key is encrypted with the operating system's protection, shown only by its last 4 characters, and never leaves the background process except into that agent; providers are part of the settings export, their keys are not. **Test connection** asks the provider for its model list and says whether the URL answers, whether the key is accepted and whether the model ID is offered. Team members summoned by wot from an agent button start with that button's provider too.
- **Side-by-side diff.** The diff of a changed, staged or commit file can be shown Unified or Side by side (switch in the diff header; your choice is remembered). Side by side puts the file before the change on the left and after on the right, lined up row by row, with removed lines in red, added lines in green and an empty space where a line has no counterpart. Both layouts now show the old and new line numbers, and long lines stay on one line: scroll sideways to read them while the line numbers stay in place. In Side by side each half scrolls sideways on its own, and scrolling up or down moves both together. When a line is changed rather than replaced, the words that changed are highlighted in a stronger red and green, so `i love cake` → `i love fish` marks only `cake` and `fish`.
- **The Git page names the folder.** When the selected folder is not a git repository, the main area shows its name and path and lists the repositories inside it (click one to open it), so you always know which folder you are looking at. The side panel no longer repeats the list.
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
- **Every agent shows what it needs to work.** Provider accounts → Other agents lists each installed agent CLI that needs an account sign-in, an API key or either (Gemini CLI, Qwen Code, OpenCode, Kilo Code, Cline, GitHub Copilot CLI, Cursor Agent, Amp, Factory Droid, Kimi, Goose, Aider, Crush), whether it is set up, and the command to sign in. An API key set in an environment variable (for example GEMINI_API_KEY or AMP_API_KEY) is detected by its name only; its value is never read into the app. Agents whose login O-BROS cannot read show Not checked with the sign-in steps; not signed in shows in red. The list is resources/agents/agent-auth.json. Any other installed agent from the ACP registry is listed too, as Not checked, with how to start its setup, so a newly installed agent is never missing.
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

- **The commit message box is off until something is staged.** It is greyed out with a dashed border and says "Stage changes to write a commit message", and the button reads "Nothing staged".
- **Branch pickers match the rest of the app.** Switching branch in the Changes panel and choosing a branch in the commit graph use one boxed dropdown with a check on the selected branch and "current" next to the checked-out one, instead of plain text in one place and the system select menu in the other.

- **Errors in the background are easier to find.** A failing request from the window to the background is written to the log file with its name. When running from source (`npm run dev`), it also shows as a warning toast, so you no longer have to watch the terminal.
- **For contributors:** `npm run lint` (oxlint, warnings fail) and `npm run check` (type check, lint, unit tests and build). CI now lints too.

### Removed
- **Prompts and Send to terminal.** The prompt list (`Ctrl+Shift+L`, the Prompts button in the tab bar and Settings → Prompts), Send selection to terminal in the editor (`Ctrl+Shift+Enter` and its right-click menu) and the Send to terminal button in the diff view are gone. Saved prompts are no longer exported, and older backups that contain them still import.

### Fixed
- **Team member conversations were not marked when the folder path had a short form.** On Windows a folder can also be written in its short 8.3 form (such as RUNNER~1); a Codex member's conversation then was not recognised as a team member's. Both paths are now compared by their real location.
- **Restart now showed on computers without a working graphics card.** The graphics card setting compared your choice with what Chromium reports, which is "off" when no GPU can be used, so it asked for a restart that changed nothing. It now compares with the setting O-BROS started with.
- **Problems counts language server errors.** Errors from a language server were underlined in the editor but the Problems count in the status bar stayed at 0; it now counts them with oxlint's.
- **A long diff could not be scrolled.** The diff grew taller than the window instead of scrolling; it now scrolls in both layouts.
- **Usage in the status bar lists what you have.** Settings → Agents showed Claude and Codex even when they were not installed, and OpenRouter credit could not be hidden. The list now shows Claude and Codex only when installed or signed in, plus every credit O-BROS reads (OpenRouter, with where its key comes from), each with its own switch.
- **Pages use the whole width.** Settings pages were capped at 920 pixels, which left an empty band on the right and put the scrollbar in the middle of a wide window; they now fill the main area. Empty screens such as History before you pick a session centre their text in the whole area instead of sticking to the left.
- **The Language servers page jumped when you clicked into a command box and away.** Leaving the box saved it even when nothing changed, and every save replaced the whole list with "Looking for language servers…". Nothing is saved now unless the command changed, and a re-check keeps the list on screen. The command box is hidden behind "Use my own command…", says what it is for, saves with Enter and cancels with Esc.
- **Clicking the button of an open menu reopened it.** Branch dropdowns, the branch actions menu and the All tabs menu now close when you click their button again.
- **The repository list on the Git page could not scroll.** With many repositories inside a folder, the list now scrolls, fills the width of the main area, and shows each repository's branch and an arrow in a bordered list. Repositories inside subfolders are no longer listed as long paths such as company/old/site: the list shows the subfolder once, with how many repositories it holds, and opening it shows what is inside, like a file browser. The back button names only the folder it goes back to, one level at a time.
- **Text boxes on the Git page had no style until Settings was opened.** The shared input style was loaded with the settings pages; it now loads at start, so the commit message box looks like every other input.
- **"Error occurred in handler for git:stashList" in the terminal.** Moving to a folder that is not a repository could ask git for stashes using the previous folder's data. The Changes panel now waits until the status belongs to the selected folder, and listing stashes in a non-repository folder returns an empty list instead of an error.
- **A back button that led nowhere.** In the Changes panel, a drive root such as `E:` offered to go back to itself. The folder above a drive root is now the root itself, so no back button shows at the top. The back row is a full-width bar, and a long folder name is cut with an ellipsis instead of overflowing; hover it for the full name.
- **The same notice could pile up.** A notice that is already on screen is not shown again, and the wot skill update is offered once per start. Notice buttons sit under the text.
- **Folders under a drive root were refused.** With a whole drive such as `E:\` added as a project folder, files and terminals in `E:\wot-test` were treated as outside the project, so review, file actions and language servers failed with "Path is outside the opened project folders". Paths under a drive or file system root are now recognised.
- Language servers no longer trigger Node's DEP0190 warning about passing arguments through the shell.
- **O-BROS could hang while closing.** Closing reads the list of running programs to warn about busy terminals; that read had no time limit and no error handling, so a stalled Windows process query could keep the window from closing. It now gives up after 20 seconds and closes anyway, stopping the terminals as usual.
- **Git checks, the Resource Manager and agent detection could fail at random on Windows.** When any program on the computer ran with a control character in its command line, the process list O-BROS reads could not be parsed, so an agent's git command ended with "Bad control character in string literal" instead of the guard's answer. Control characters are now removed before reading the list.
- A drive root such as `E:\` added as a project showed an empty name in the sidebar; it is now called `E:`. The Windows system folders `$RECYCLE.BIN` and `System Volume Information` are no longer listed as project folders.
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
