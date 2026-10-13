# Privacy and security

This page lists everything o-bros reads, writes and sends, so you can decide whether you are comfortable running it.

## What o-bros reads

| What | Why |
|---|---|
| Folders you added, and the files inside them | The file tree, the editor, search, git |
| `~/.claude*` and `~/.codex*` folders | To list your logins and read the email shown for a Claude login |
| The login token inside those folders (`.credentials.json`, `auth.json`) | Only to ask the provider for your usage numbers |
| Claude conversation files under `~/.claude*/projects` | The History panel |
| `package.json` and lock file names in a project | The scripts list |
| The operating-system process list and open ports | Resource Manager, ports, and the "still running" list when you close the app |

## What o-bros writes

| What | When |
|---|---|
| Files you edit or create in your project folders | When you save, create, rename or delete |
| `settings.json` in the Electron user-data folder | Your list of project folders |
| Browser storage (`localStorage`) | Editor and terminal settings, the last session, recent files |
| An empty folder such as `~/.claude-work` or `~/.codex-work` | Only when you press **Add account** |
| Git changes in your repositories | Only when you stage, unstage, discard, commit or switch branches |
| Temporary copies of an open file | While linting. They are deleted right away. |

Deleting a file, a history session or a discarded new file moves it to the Recycle Bin or Trash. It is not erased.

## What o-bros sends over the network

| Destination | Data | When |
|---|---|---|
| `api.anthropic.com` | Your saved Claude token, to read your usage | Every few minutes and when you press refresh |
| `chatgpt.com` | Your saved Codex token, to read your usage | Every few minutes and when you press refresh |
| Your git remote | Whatever `git fetch` does | Only when you press fetch |

Nothing else. There is no analytics, no crash reporting and no update check.

Usage requests identify themselves honestly as `o-bros`. The two usage endpoints are not documented by the providers, so they may change or be restricted.

## What o-bros never does

- It never asks for or stores your password.
- It never sends a saved token anywhere except the provider that issued it, and it never logs one.
- It never refreshes, rewrites or copies login files.
- It never edits Claude or Codex settings.
- It never runs a command you did not start. Scripts and terminals start only when you press a button.

## How the app protects you

- The interface runs with `contextIsolation` and the sandbox on, and without Node access.
- Every file path from the interface is checked in the main process and refused if it is outside the folders you added.
- File names you type are validated, so a name cannot contain a path separator or `..`.
- Names of scripts are checked before they are placed in a terminal command.
- Closing the app lists what is still running before it stops anything.

## Things to be aware of

- Terminals are real shells. Anything you or a tool types in them runs with your permissions.
- Linting and formatting run bundled tools on your files.
- On macOS, Claude logins stored in the keychain are not read.

## Reporting a problem

Open an issue in the repository. If it concerns security, describe the kind of problem without posting a token or a working exploit.
