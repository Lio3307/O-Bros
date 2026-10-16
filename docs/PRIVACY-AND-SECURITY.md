# Privacy and security

This page lists everything o-bros reads, writes and sends, so you can decide whether you are comfortable running it.

## What o-bros reads

| What | Why |
|---|---|
| Folders you added, and the files inside them | The file tree, the editor, search, git |
| `~/.claude*` and `~/.codex*` folders | To list your logins and read the email shown for a Claude login |
| The login token inside those folders (`.credentials.json`, `auth.json`) | Only to ask the provider for your usage numbers |
| Claude conversation files under `~/.claude*/projects` and Codex conversation files under `~/.codex*/sessions` | The History panel and Settings → Storage and memory (titles, sizes and ages; full text only when you open a session) |
| `package.json` and lock file names in a project | The scripts list |
| The operating-system process list and open ports | Resource Manager, ports, and the "still running" list when you close the app |

## What o-bros writes

| What | When |
|---|---|
| Files you edit or create in your project folders | When you save, create, rename or delete |
| `settings.json` in the Electron user-data folder | Your list of project folders |
| `team-sessions.json` in the Electron user-data folder (newest 1000 entries) | When wot summons a Claude or Codex member: its name, agent, folder, start time, session ID and the first 30 characters of its task, so History can mark its conversation. |
| Moves a team member's conversation to the Recycle Bin or Trash | Only when the member stops and you turned on that option in Settings → Team (wot) |
| `activity.json` in the Electron user-data folder (newest 500 entries) | When an agent session starts or ends, an agent asks for a guarded git action, or a team member joins or leaves. It holds times, folder paths, agent names and the git command line, never file contents. Clear it from the Activity panel. |
| Browser storage (`localStorage`) | Editor and terminal settings, the last session, recent files, and the name and email for commits made by agents |
| An empty folder such as `~/.claude-work` or `~/.codex-work` | Only when you press **Add account** |
| Git changes in your repositories | Only when you stage, unstage, discard, commit or switch branches |
| Temporary copies of an open file | While linting. They are deleted right away. |
| A log file `o-bros.log` in the Electron logs folder (about 1 MB, then one older copy is kept) | When the app crashes, a helper process stops, or an error is hidden behind a friendly message. It stays on your computer and may contain file paths. Open it from Settings → About and updates. |
| A settings export file (JSON) where you choose to save it | Only when you press **Export settings**. It contains your commit name and email if you set them, never logins or tokens. |
| Deletes the app cache and old `o-bros-lint-*` temp folders | Only when you press a button in Settings → Storage and memory |
| The wot skill file `<Claude account folder>/skills/wot/SKILL.md` or `~/.agents/skills/wot/SKILL.md` (instructions only, no secrets) | Only when you press **Install** in Settings → Team (wot). **Remove** deletes it again. |
| Short task files in the system temp folder (`o-bros-wot`) | When an agent uses `wot new-file`. `wot` deletes each one after reading it. |
| Deletes Claude and Codex conversation files (Recycle Bin or Trash by default, permanently if you tick the box) | Only after you confirm, from History or Settings → Storage and memory |

Deleting a file, a history session or a discarded new file moves it to the Recycle Bin or Trash. It is not erased.

## What o-bros sends over the network

| Destination | Data | When |
|---|---|---|
| `api.anthropic.com` | Your saved Claude token, to read your usage | Every few minutes and when you press refresh |
| `chatgpt.com` | Your saved Codex token, to read your usage | Every few minutes and when you press refresh |
| `openrouter.ai` | The OpenRouter key saved in OpenCode (or `OPENROUTER_API_KEY`), to read that key's spending and credit | Every few minutes and when you press refresh, only if such a key exists |
| Your git remote | Whatever `git fetch` does | Only when you press fetch |
| `cdn.agentclientprotocol.com` | A plain request for the public ACP Registry list of agents. Nothing about you is sent | When you open Settings → Agents, at most once an hour |
| `github.com` (the o-bros releases) | A request for the latest release information, and then the installer file | Only when you press **Check for updates** or **Download** in Settings → About and updates |

Nothing else leaves your computer. There is no analytics and no crash reporting. Updates are only checked when you press the button. If the ACP Registry cannot be reached, o-bros uses its built-in list of agents and nothing breaks.

Usage requests identify themselves honestly as `o-bros`. The two usage endpoints are not documented by the providers, so they may change or be restricted.

## What o-bros never does

- It never asks for or stores your password.
- It never sends a saved token anywhere except the provider that issued it, and it never logs one.
- It never refreshes, rewrites or copies login files.
- It never edits Claude or Codex settings.
- It never runs a command you did not start. Scripts and terminals start only when you press a button, or when an agent you started uses `wot` to summon a team member. Team members always show in the Team view, where you can stop them.

## How the app protects you

- The interface runs with `contextIsolation` and the sandbox on, and without Node access.
- Every file path from the interface is checked in the main process and refused if it is outside the folders you added.
- File names you type are validated, so a name cannot contain a path separator or `..`.
- Names of scripts are checked before they are placed in a terminal command.
- Closing the app lists what is still running before it stops anything.
- The Team feature (wot) listens only on `127.0.0.1`, on a random port, and needs a random key that only terminals opened by O-BROS receive. The key changes every time the app starts. Team members cannot summon more members, and at most six run at once.
- Every O-BROS terminal passes `git` through a small guard. For a guarded command (commit, push, branches, merges and similar) it reads the list of running programs to see whether an agent started it. Nothing about this leaves your computer.
- Agents in O-BROS cannot commit, push or create, delete or rename a branch without you pressing **Allow**. This is a guard, not a sandbox: it covers the `git` command the agent's shell finds, not a git program called by its full path.

## Things to be aware of

- Terminals are real shells. Anything you or a tool types in them runs with your permissions.
- Linting and formatting run bundled tools on your files.
- On macOS, Claude logins stored in the keychain are not read.

## Reporting a problem

Open an issue in the repository. If it concerns security, describe the kind of problem without posting a token or a working exploit.
