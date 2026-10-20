# Architecture

o-bros is an Electron app written in TypeScript. This page explains how the pieces fit together so you can find your way around the code. The diagrams are drawn with Mermaid, which GitHub shows as pictures.

## The big picture

```mermaid
flowchart TB
    subgraph R["Renderer · src/renderer · what you see"]
        direction LR
        RT["Terminals"]
        RE["Editor"]
        RC["Changes (git)"]
        RTeam["Team view"]
        RH["History"]
        RS["Settings"]
    end

    P["Preload · src/preload<br/>window.api, the only door"]

    subgraph M["Main · src/main · owns the computer"]
        direction LR
        MP["ptyManager<br/>terminals"]
        MG["git services"]
        MF["files · oxlint · oxfmt"]
        MA["accounts and usage"]
        MW["wot server"]
        ML["language servers"]
        MK["provider keys<br/>(encrypted)"]
        MU["updater"]
    end

    subgraph OS["Your computer"]
        direction LR
        A["Shells and agent CLIs"]
        G["git"]
        F["Your project files"]
        N["Internet<br/>usage numbers, update check,<br/>ACP agent registry, your providers"]
    end

    S[("src/shared<br/>types, IPC names,<br/>pure helpers")]

    R <--> P <--> M
    M --> OS
    S -.- R
    S -.- M
```

| Process | Folder | Responsibility |
|---|---|---|
| Main | `src/main` | Everything that touches the operating system: terminals, files, git, process tables, accounts, usage requests, the wot server and language servers. |
| Preload | `src/preload` | A thin bridge. It turns each IPC channel into a function on `window.api`, and each event into an `on…` function that returns its own unsubscribe. The one call that skips IPC is `files.pathOf`, which asks Electron for the path of a dropped file. |
| Renderer | `src/renderer` | The React interface. It never imports Node. It can only ask the main process for things through `window.api`. |
| Shared | `src/shared` | Types, IPC channel names and pure helper functions used by both sides. Most unit tests live here. |

The window is created with `contextIsolation` on, `nodeIntegration` off and the sandbox on.

## What happens at start

`src/main/index.ts` runs these steps in order:

1. Use the `o-bros` data folder, and turn off the graphics card if you chose that in Settings (it must happen before Electron is ready).
2. Register every IPC handler (`src/main/ipc/*`).
3. Start the wot server on a free port of `127.0.0.1`.
4. Open the window and connect the bridge that lets main ask the window questions.
5. Start watching for agents you start by typing their name in a plain terminal, so Activity can show them (`typedAgents.ts`).

On quit, main stops the wot server, every terminal and every language server. Closing the window first asks the renderer, which can warn about unsaved files and running tasks (`closeGuard.ts`).

## The IPC contract

All communication is declared once, in `src/shared/ipc.ts`:

- `IpcChannel` lists every channel name.
- `DesktopApi` describes `window.api`: one group per area (`pty`, `files`, `git`, `wot`, `history`, `accounts`, `usage`, `projects`, `backup`, `resources`, `tools`, `agents`, `shell`, `ports`, `lsp`, `activity`, `storage`, `updater`, `app`).

```mermaid
sequenceDiagram
    participant UI as Component
    participant Store as zustand store
    participant API as window.api (preload)
    participant IPC as src/main/ipc
    participant Svc as src/main/services

    UI->>Store: user clicks "Stage"
    Store->>API: git.stage({ repoPath, filePaths })
    API->>IPC: invoke "git:stage"
    IPC->>Svc: stagePaths(...)
    Svc-->>IPC: done (or an error)
    IPC-->>API: result
    API-->>Store: result
    Store->>Store: reload status, or show a friendly error toast
    Store-->>UI: new state, screen redraws
```

Messages also go the other way. Main pushes events to the window: terminal output (`pty:data`, `pty:exit`), team changes (`wot:members`), new activity, update status and the close request. Through `rendererBridge.ts` it can also ask the window something (`wot:request`) and wait for the answer (`wot:respond`): "may this agent commit?", "what is on this member's screen?" or "which agent buttons exist?".

Adding a capability touches the same chain every time:

```mermaid
flowchart LR
    T["src/shared/types.ts<br/>request and result types"] --> C["src/shared/ipc.ts<br/>IpcChannel + DesktopApi"]
    C --> S["src/main/services<br/>the logic + path checks"]
    S --> H["src/main/ipc<br/>register the handler"]
    H --> B["src/preload/index.ts<br/>add the method"]
    B --> U["src/renderer<br/>store, then component"]
```

For example, conflict resolution touched exactly these files: `types.ts`, `ipc.ts`, `gitConflicts.ts`, `gitIpc.ts`, `preload/index.ts`, `changesStore.ts` and `ConflictSection.tsx`. The full checklist, with tests, is in [Development](DEVELOPMENT.md).

## How a terminal works

```mermaid
flowchart LR
    K["You type"] --> X["xterm.js<br/>renderer"]
    X -- "pty:input" --> PM["ptyManager<br/>main · node-pty"]
    PM --> C["Shell or agent CLI<br/>claude, gemini, codex, …"]
    C -- "output" --> PM
    PM -- "pty:data<br/>batched every 8 ms" --> X

    ENV["When a terminal starts (pty:create), main sets:<br/>PATH with wot and the git guard first<br/>CLAUDE_CONFIG_DIR / CODEX_HOME for a non-default account<br/>for an agent button: your commit identity and,<br/>if one is picked, the custom provider URL and key"] -.-> PM
```

1. `TerminalView` creates an xterm.js `Terminal` and asks the main process for a PTY with the same id (`pty:create`).
2. `ptyManager` spawns the shell with node-pty, batches output every 8 ms and sends it back.
3. Keystrokes go to the PTY; resize events follow the pane size.
4. A non-default account is selected only by setting `CLAUDE_CONFIG_DIR` or `CODEX_HOME` on the spawned process.
5. Every terminal gets the `wot` command at the front of its `PATH`, and the git guard in front of that when O-BROS found the real git program (`wotEnvironment.ts`).

## How wot (the team) works

wot lets the agent you talk to summon other agents. Any agent CLI on the computer can lead or be summoned.

```mermaid
flowchart LR
    Skill["wot skill (SKILL.md)<br/>written only on Install / Update all"] -. "teaches the command" .-> Lead

    Lead["Lead agent<br/>any CLI with the skill<br/>$ wot spawn gemini …"]
    Server["wot server<br/>inside main<br/>127.0.0.1 + secret token<br/>max 6 members"]

    Lead -- "wot agents · spawn · list · wait<br/>read · send · stop · status" --> Server

    Server -- "1. new member" --> Team["Team view (renderer)<br/>working · finished · asking you"]
    Team -- "2. opens a terminal<br/>like any other" --> M1["Member · gemini"]
    Team --> M2["Member · codex"]
    Team --> M3["Member · opencode"]
    Server -- "3. types the task" --> M1

    Server -- "live state" --> Team
    Team -- "you type or stop" --> M1
```

- You ask in your own words, for example "ask gemini to review login.ts". The skill tells the lead agent to run `wot`, which every O-BROS terminal has on its `PATH`.
- `wot` talks to a small HTTP server inside the main process that listens only on `127.0.0.1` and needs a random key that only O-BROS terminals receive. Outside O-BROS, `wot` answers that it needs the app.
- `spawnMember` (`teamRegistry.ts`) adds the member and tells the window, which opens its terminal through the normal `pty:create` path. The server waits until that terminal runs, then types the task into it.
- Members are real terminals. When one asks a question, the Team button turns red. A member cannot summon more members.
- The code is in `src/main/services/wot` (server, routes, member state, skill installer) and `src/renderer/features/team`.

## How the git guard works

Agents must not commit, push or change branches as you without your say. Every O-BROS terminal has a small `git` program (`resources/wot/guard`) in front of the real one on its `PATH`.

```mermaid
flowchart TB
    CMD["git … in an O-BROS terminal<br/>typed by you or run by an agent"] --> SHIM{"guard/git<br/>changes history?<br/>commit, push, pull, branch, checkout,<br/>switch, worktree, merge, rebase,<br/>cherry-pick, revert, am"}
    SHIM -- "no (status, diff, log …)" --> REAL["real git, unchanged"]
    SHIM -- "yes" --> GJS["git-guard.cjs<br/>POST /git-check to the wot server"]

    GJS --> DEC["decideGit (main)<br/>who started it? walks the process tree<br/>push: do the commits carry agent traces?"]
    DEC -- "you, nothing to warn about" --> REAL
    DEC -- "an agent, or warnings" --> UI["confirmAgentGit (renderer)<br/>applies Settings → Terminal policy"]

    UI -- "Never allow (default)" --> NO["GIT_BLOCKED<br/>the agent is told to ask you"]
    UI -- "Ask me, a team member,<br/>or warnings" --> ASK["You get a question<br/>no answer in 100 s = no"]
    UI -- "Allow" --> OK["real git with your name and email<br/>--author dropped"]
    ASK -- "yes" --> OK
    ASK -- "no" --> NO
    OK --> AFTER["/after-commit (when it made one new commit)<br/>Co-Authored-By and Generated with lines removed<br/>unless you allow them"]

    style NO stroke:#f85149
    style ASK stroke:#d29922
    style OK stroke:#3fb950
```

- `guard/git` (`git.cmd` on Windows) only checks the subcommand. Everything that does not change history goes straight to the real git, so normal commands stay fast.
- O-BROS tells an agent's git from yours by walking the process tree from the guard to the program that started it (`agentCaller.ts`). Your own commands are allowed as they are, except a push whose commits still have an agent author or credit line: then you are asked first. The Push button in the Changes panel makes the same check.
- The decision is split in two: the main process finds out who is asking and what to warn about (`gitDecision.ts`), and the renderer applies your policy and asks the question (`confirmAgentGit.ts`, with the rules in `src/shared/agentGitPolicy.ts`).
- If O-BROS cannot be reached, the guard refuses rather than letting the command through. Outside O-BROS the guard is not on the `PATH` at all.

## How the Changes panel works

```mermaid
flowchart LR
    ST["git status<br/>porcelain v2"] --> SP["status parser<br/>gitStatusParser.ts"]
    SP --> CP["Changes panel<br/>staged · unstaged"]
    CP -- "select a file" --> DF["git diff"]
    DF --> DR["diff parser<br/>rows + line numbers<br/>diffLines.ts"]
    DR --> WH["word highlight<br/>inlineDiff.ts"]
    WH --> V["Unified · Side by side"]

    SP -- "'u' lines" --> CF["Conflicts<br/>merge, rebase, cherry-pick, revert"]
    CF --> CA["Use current · Use incoming<br/>✓ after fixing in the editor"]
    CA --> CO["Commit merge / Continue<br/>or Abort"]
```

- The panel shows the repository in `gitRepositoryStore.ts`: the selected project, or a repository you picked in the switcher at the top. Picking one there does not change the selected project or the terminal tabs, and the command palette's fetch, pull and push use the same repository.
- The status parser and the diff parser split text by hand; there are no regular expressions.
- In a diff, each removed line is compared word by word with the added line in the same place, and only the changed words get the strong colour. A line rewritten completely stays plain red and green.
- Conflicts come from the unmerged (`u`) lines of `git status` and the state files in the git folder (`MERGE_HEAD`, `rebase-merge` or `rebase-apply`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`). The code is in `src/main/services/gitConflicts.ts` and `src/renderer/features/changes/ConflictSection.tsx`.

## Keys and tokens

O-BROS never signs in for you and never edits an agent's login. It touches secrets in exactly two ways.

**1. Usage numbers.** To show your plan usage, main reads a login that a CLI already saved and sends it only to the provider that issued it. Nothing is stored or passed on.

```mermaid
flowchart LR
    C1["~/.claude*/.credentials.json"] --> U1["api.anthropic.com<br/>Claude usage"]
    C2["~/.codex*/auth.json"] --> U2["chatgpt.com<br/>Codex usage"]
    C3["OpenCode auth.json (openrouter)<br/>or OPENROUTER_API_KEY"] --> U3["openrouter.ai<br/>credit balance"]
```

**2. Custom providers.** A key you paste in Settings → Provider accounts is the only secret O-BROS keeps.

```mermaid
flowchart LR
    subgraph REN["Renderer"]
        L4["sees only the last 4<br/>••••••••ab12"]
        EX["settings export:<br/>provider yes, key no"]
    end
    subgraph MAIN["Main"]
        KF[("provider-keys.json<br/>encrypted with safeStorage<br/>+ last 4 as a hint")]
        TC["Test connection"]
    end
    subgraph AGT["Agent terminal"]
        ENV["ANTHROPIC_AUTH_TOKEN<br/>or OPENAI_API_KEY"]
    end
    P["your provider's URL"]

    KF -- "decrypted when an agent starts" --> ENV
    KF -- "decrypted for the test" --> TC --> P
    KF -. "hint only" .-> L4
```

- The full key never reaches the renderer, a log or an export. If the computer cannot encrypt, the key is not saved.
- The provider list (name, URL, model) lives in the renderer's `localStorage` and is part of the settings export; the keys are not.
- For every other agent, O-BROS reads only the account name, the login type and provider names from its files, and checks that a key variable is set without reading its value (`src/shared/agentLogins.ts`).
- Details are in [Privacy and security](PRIVACY-AND-SECURITY.md).

## Main process layout

| Folder | What lives there |
|---|---|
| `src/main/ipc` | One small file per area. Each only registers handlers and calls a service. |
| `src/main/services` | The real work: `ptyManager`, `fileService`, `entryService`, `gitService`, `gitActions`, `gitConflicts`, `accountScanner`, `scriptService`, and so on. |
| `src/main/services/wot` | The team server, its routes, member state, the skill installer and the git guard decisions. |
| `src/main/services/usage` | Reading each provider's saved login and asking for usage numbers. |
| `src/main/services/sessions` | Reading saved Claude and Codex conversations for History. |
| `src/main/services/languageServers` | Starting and stopping language servers for the editor. |
| `src/main/services/customProviders` | Encrypted provider keys and Test connection. |
| `src/main/services/resources` | Process table, resource snapshot, listening ports, background process detection. |
| `src/main/services/tools` | Running the bundled `oxlint` and `oxfmt` command-line tools. |
| `src/main/services/updater` | Checking GitHub for a new version. |
| `src/main/pathGuard.ts` | Refuses any file path outside the folders you added. |
| `src/main/closeGuard.ts` | Holds a window close until the renderer confirms. |

## Renderer layout

| Folder | What lives there |
|---|---|
| `src/renderer/shell` | The frame: title bar, rail, side panel, main area, status bar. |
| `src/renderer/features` | One folder per feature: `terminal`, `files`, `editor`, `changes`, `team`, `history`, `activity`, `commands`, `projects`, `settings`, `resources`, `problems`, `shutdown`. |
| `src/renderer/state` | Zustand stores. A store holds data and actions; it has no markup. |
| `src/renderer/ui` | Small shared components: buttons, dialogs, popup menus, toasts, cards, chips and badges (listed below). |
| `src/renderer/styles` | Design tokens and base styles (black and white, no gradients, square corners). |
| `src/renderer/theme` | Colour themes for the terminal and the editor (O-BROS, One Dark, Dracula, GitHub Dark, Monokai, Solarized Dark …). The rest of the interface keeps its own colours. |

### Shared components (`src/renderer/ui`)

Use these before writing new markup, so every screen looks and behaves the same.

| Component | Use it for |
|---|---|
| `Button` | Every button. Variants: `outline`, `primary`, `icon`, `link`, `remove`, `plain`. Defaults to `type="button"`. Spam-safe: it ignores a second click within 350 ms, and when `onClick` returns a promise it is disabled until that promise settles, so return the promise from long actions (`onClick={() => save()}`, not `void save()`). |
| `Modal` | Every dialog: backdrop, title, content and action buttons. Pass `onEscape` to close it with the Escape key, and `onSubmit` to make it a form. |
| `SettingsPageLayout` | The title, description and header buttons of a settings page. |
| `SettingsSection` | A titled block inside a settings page, with an optional description and action. |
| `SegmentedControl` | A row of choices where one is selected (Unified or Side by side diff, editor and terminal settings, usage view). |
| `PanelHeader`, `PopupMenu`, `RefreshButton`, `EditableTitle` | Side panel header, right-click and popup menus, refresh buttons, rename in place. |
| `AgentIcon`, `AgentStatusBadge`, `ProviderMark` | Brand marks and the Connected / Signed in status. |
| `Card`, `StatTile`, `Chip`, `StatusDot`, `AgentStateBadge`, `OutcomeBadge`, `AgentName`, `Spinner`, `LoadingText`, `Dropdown`, `UsageBar` | Boxes, numbers, small labels, state colours, loading states, select menus and usage bars. |

A page with more than about 150 lines is split into one component per file in a folder next to it, as `features/settings/agents/` does for the Agents page.

### State

Each store is a small Zustand store with one job (`workspaceStore` for tabs, `projectsStore` for folders, `changesStore` for git, `teamStore` for wot members, `toastStore` for messages, and so on). Components read from stores with selectors; stores call `window.api`.

### What is saved, and where

| Data | Where |
|---|---|
| Project folders, graphics card setting | `settings.json` in the user-data folder (`%APPDATA%/o-bros` on Windows) |
| Custom provider keys | `provider-keys.json` in the user-data folder, encrypted |
| Activity log | `activity.json` in the user-data folder |
| Team member conversations (to find them in History) | `team-sessions.json` in the user-data folder |
| ACP agent registry and agent icons | `acp-registry.json` and an icon folder in the user-data folder (a cache) |
| Error log | Electron's logs folder |
| Every other setting: editor, terminal, theme, shortcuts, agent buttons, custom providers (without keys), git policy, session, recent files | Browser `localStorage` of the renderer, under keys that start with `o-bros.` |
| wot task files | `o-bros-wot` in the system temp folder, deleted after use |
| Terminal output, file contents, git data | Not stored. Read on demand. |

## How memory stays low

- A terminal is created when its tab is first shown, not when it is restored.
- The WebGL renderer is released while a terminal is hidden.
- Scrollback is limited (default 2,000 lines) and configurable.
- The editor and every language pack are loaded on demand.
- A language server starts only when you open a file it handles, and stops a minute after its last file closes. No file watcher or search index runs in the background.
- Linting and formatting run as short-lived processes.
- Search and process lists are computed when asked for.

## Design rules

The code follows the rules in `AGENTS.md`: no comments, no regular expressions in logic, one responsibility per file, shared helpers instead of duplicates, and clear names. The reasons behind larger choices are recorded in [decisions](decisions.md).
