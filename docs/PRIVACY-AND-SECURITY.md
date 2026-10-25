# Privacy and security

This page lists everything o-bros reads, writes and sends, so you can decide whether you are comfortable running it.

**In short:** O-BROS has no account, no analytics, no crash reporting and no server of its own. Nothing about you, your projects or your conversations ever reaches the people who make O-BROS. Everything below either stays on your computer or goes only to a service you already use.

## What o-bros reads

| What | Why |
|---|---|
| Folders you added, and the files inside them | The file tree, the editor, search, git |
| `~/.claude*` and `~/.codex*` folders | To list your logins and read the email shown for a Claude login |
| The login token inside those folders (`.credentials.json`, `auth.json`) | Only to ask the provider for your usage numbers |
| Claude conversation files under `~/.claude*/projects` and Codex conversation files under `~/.codex*/sessions` | The History panel and Settings → Storage and memory (titles, sizes and ages; full text only when you open a session) |
| `package.json` and lock file names in a project | The scripts list |
| The operating-system process list and open ports | Resource Manager, ports, and the "still running" list when you close the app |
| Warp's custom themes folder (`~/.warp/themes`, `%LOCALAPPDATA%\warp\Warp\data\themes` on Windows, `~/.local/share/warp-terminal/themes` on Linux) | Only when you press **Import from Warp** in Settings → Appearance → Theme: the `.yaml` theme files, for their colors and names. Nothing else in Warp's folders is opened. |
| Your Windows wallpaper (`%APPDATA%\Microsoft\Windows\Themes\TranscodedWallpaper`, or the file named in the registry) and the wallpaper fit and desktop color under `HKCU\Control Panel` | Only while Settings → Appearance is set to **Desktop wallpaper**, to show it behind O-BROS. It is read again when O-BROS becomes the active window, never copied, saved or uploaded. |

**Agent sign-ins.** For the agents listed in resources/agents/agent-auth.json, o-bros checks whether their API key environment variables (for example GEMINI_API_KEY) are set. It looks only at whether the variable has a value; the value itself is never kept, shown or sent.

## What o-bros writes

| What | When |
|---|---|
| Files you edit or create in your project folders | When you save, create, rename or delete |
| `threads.json` next to the universal history | When you use Continue with…: which conversations belong together (agent, session ID, folder, start time and the handoff's first line). |
| A handoff typed into the agent you pick | Only when you press Continue with…: a summary built from the universal history of the conversation you continue, the folder and the files changed in git. That agent sends what it reads to its own provider, so before typing it O-BROS replaces anything that looks like a secret with `[hidden]`: API keys and tokens with a known start (such as `sk-`, `ghp_`, `AKIA`), values of settings named like a password, key, token or secret (in `.env` lines, flags, JSON and links such as `?secret=`), passwords inside links, `Bearer` tokens, private key blocks and long random strings. It tells you how many it hid. This is a safety net, not a guarantee: a secret with no recognisable shape, such as a plain word used as a password in a sentence, can still get through. Your own universal history copy is not changed. |
| `settings.json` in the Electron user-data folder | Your list of project folders, and your storage choices (conversation folder, universal history folder and keep period, repository search depth) |
| The universal history: `o-bros-history\<agent>-resume\*.json` in the Electron user-data folder, or in the folder you move it to | Every minute while O-BROS runs, a plain-text copy of each Claude and Codex conversation that changed: your messages, the agent's answers, its title, folder and session ID. Tool output and file contents are left out. It stays on your computer and is never uploaded or put in your projects. Remove it with Keep (30, 90 or 365 days) or by deleting the folder; it can contain anything you typed into an agent, including secrets you pasted. |
| `team-sessions.json` in the Electron user-data folder (newest 1000 entries) | When wot summons a Claude or Codex member: its name, agent, folder, start time, session ID and the first 30 characters of its task, so History can mark its conversation. |
| Moves a team member's conversation to the Recycle Bin or Trash | Only when the member stops and you turned on that option in Settings → Team (wot) |
| `activity.json` in the Electron user-data folder (newest 500 entries) | When an agent session starts or ends, an agent asks for a guarded git action, or a team member joins or leaves. It holds times, folder paths, agent names and the git command line, never file contents. Clear it from the Activity panel. |
| Browser storage (`localStorage`) | Your theme choices and the themes you imported (only their names and colors), editor and terminal settings, the last session, recent files, and the name and email for commits made by agents |
| An empty folder such as `~/.claude-work` or `~/.codex-work` | Only when you press **Add account** |
| Git changes in your repositories | Only when you stage, unstage, discard, commit or switch branches |
| `window-state.json` in the Electron user-data folder | When you move, resize, maximize or close the window: its size, position, and whether it was maximized or full screen, so it opens the same way next time. |
| `pasted-images` in the Electron user-data folder | When you paste an image into a terminal (Ctrl+Shift+V or Paste in the terminal menu): the image as a PNG, so the agent can read it. Images older than 7 days are deleted the next time you paste one. They are never put in your projects or uploaded by O-BROS; the agent you paste the path into may send the image to its own provider. |
| `wallpaper` in the Electron user-data folder | Only when you choose a wallpaper in Settings → Appearance: a copy of that image, so it stays even if you move the original. **Remove** deletes it. It is never uploaded. |
| `acp-registry.json` and `agent-icons` in the Electron user-data folder | A cached copy of the public agent list and the agents' logos, so Settings → Agents works offline. |
| `provider-keys.json` in the Electron user-data folder | Only when you paste an API key into a custom provider (Settings → Provider accounts → Custom providers). The key is encrypted with the operating system's protection (Windows DPAPI, macOS Keychain, the Linux secret store) and only its last 4 characters are kept readable. It is decrypted only in the background process, when an agent that uses the provider starts, and is never sent to the app window, shown, logged or exported. **Forget key** or deleting the provider removes it. |
| Temporary copies of an open file | While linting. They are deleted right away. |
| A log file `o-bros.log` in the Electron logs folder (about 1 MB, then one older copy is kept) | When the app crashes, a helper process stops, or an error is hidden behind a friendly message. It stays on your computer and may contain file paths. Open it from Settings → About and updates. |
| A settings export file (JSON) where you choose to save it | Only when you press **Export settings**. It contains your commit name and email if you set them and your custom providers without their keys, never logins, keys or tokens. |
| Deletes the app cache and old `o-bros-lint-*` temp folders | Only when you press a button in Settings → Storage and memory |
| The wot skill file `<Claude account folder>/skills/wot/SKILL.md` or `~/.agents/skills/wot/SKILL.md` (instructions only, no secrets) | Only when you press **Install** in Settings → Team (wot). **Remove** deletes it again. |
| Short task files in the system temp folder (`o-bros-wot`) | When an agent uses `wot new-file`. `wot` deletes each one after reading it. |
| Deletes Claude and Codex conversation files (Recycle Bin or Trash by default, permanently if you tick the box) | Only after you confirm, from History or Settings → Storage and memory |

Deleting a file, a history session or a discarded new file moves it to the Recycle Bin or Trash. It is not erased.

## Language servers

Language servers are programs you installed (for example typescript-language-server or pyright). O-BROS starts them on your computer for the project you work in, talks to them over a pipe, and stops them a minute after you close their last file or when O-BROS quits. They read your project files like your editor does. Some servers go online on their own, for example the TypeScript server can download type definitions for packages; that is the server's behaviour, not O-BROS's. Documentation a server shows on hover is cleaned before display: only plain formatting and web links are kept, and web links open in your browser. A custom command you set in Settings → Language servers runs when you open a matching file; it is never imported from a settings backup.

## What o-bros sends over the network

| Destination | Data | When |
|---|---|---|
| `api.anthropic.com` | Your saved Claude token, to read your usage | Every few minutes and when you press refresh |
| `chatgpt.com` | Your saved Codex token, to read your usage | Every few minutes and when you press refresh |
| `openrouter.ai` | The OpenRouter key saved in OpenCode (or `OPENROUTER_API_KEY`), to read that key's spending and credit | Every few minutes and when you press refresh, only if such a key exists |
| The URL of a custom provider you added | A request for its model list, with the provider's saved key | Only when you press **Test connection** on that provider |
| Your git remote | Whatever `git fetch` does | Only when you press fetch |
| `cdn.agentclientprotocol.com` | A plain request for the public ACP Registry list of agents and their logos. Nothing about you is sent | When you open Settings → Agents, at most once an hour; each logo once, then it is cached |
| `github.com` (the o-bros releases) | A request for the latest release information, and then the installer file | Release information: 30 seconds after start and every 6 hours, unless you turn off "Check for new versions automatically" in Settings → About and updates, and when you press **Check for updates**. The installer: only when you press **Download** |

Nothing else leaves your computer. There is no analytics and no crash reporting. Update checks only ask GitHub which version is the latest; they send no information about you or your projects. If the ACP Registry cannot be reached, o-bros uses its built-in list of agents and nothing breaks.

Usage requests identify themselves honestly as `o-bros` and its version number, nothing about you. The two usage endpoints are not documented by the providers, so they may change or be restricted.

## What o-bros never does

- It never asks for or stores your password. The only secret it stores is an API key you paste into a custom provider, encrypted as described above.
- It never sends a saved token anywhere except the provider that issued it, and it never logs one.
- It never refreshes, rewrites or copies login files.
- It never edits Claude or Codex settings.
- It never runs a command you did not start. Scripts and terminals start only when you press a button, or when an agent you started uses `wot` to summon a team member. Team members always show under the terminal that summoned them in Projects, where you can stop them.

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
- Uninstalling O-BROS leaves its user-data folder (settings, activity log, universal history, pasted images, logs and encrypted custom-provider keys) in place, so your setup comes back if you reinstall. Delete that folder yourself to remove everything. Settings → Storage and memory shows where it is.

## Reporting a problem

Open an issue in the repository. If it concerns security, describe the kind of problem without posting a token or a working exploit.
