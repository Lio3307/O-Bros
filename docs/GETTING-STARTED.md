# Getting started

This page walks through your first ten minutes with o-bros.

## 1. Run the app

```
npm install
npm run dev
```

The window opens with a narrow icon rail on the left, a side panel, the main area and a status bar at the bottom.

## 2. Add a project folder

1. In the **Projects** panel, press the folder-plus button ("Open a folder").
2. Choose a folder that holds your code.

o-bros only reads and edits files inside folders you add. You can remove a folder later in **Settings → Project folders**; your files are not deleted.

If you add a folder that is already in the list, nothing is duplicated. The existing entry is selected and a message tells you.

## 3. Open a terminal

At the top of the Projects panel there are three buttons:

| Button | What it starts |
|---|---|
| Claude | A terminal in the selected project that runs `claude` |
| Codex | A terminal in the selected project that runs `codex` |
| Terminal icon | A plain shell in the selected project |

- Use the **+** in the tab bar for another terminal.
- Use the split buttons (top right of the tab bar) to split a terminal right or down.
- Double-click a terminal tab title to rename it.
- Terminals you open stay running while you work in other tabs.

## 4. Work with files

Press the panel icon at the top right of the window to show the **Files** panel. It only appears on the Projects page.

- Click a file to open it in the editor. Click a folder to expand it.
- Right-click for New File, New Folder, Copy Path, Rename, Delete and more.
- Type in the search box to find files by name or by text.
- Press `Ctrl+P` to jump to any file by name.

## 5. Choose your account

Open **Settings → Provider accounts**. o-bros lists every Claude and Codex login it finds on this computer, with the 5-hour and weekly usage for each.

- Press **Use** on an account to make new terminals run with that login.
- Press **Add account** to create another login. o-bros asks for a short name, creates an empty folder (for example `~/.claude-work`) and opens a terminal where the official tool signs you in. Then press **Rescan**.

o-bros never sees your password.

## 6. See what changed

Open the **Changes** panel (the branch icon in the rail).

- Press `+` on a file to stage it, or **Stage all**.
- Write a message and press **Commit**.
- Click the branch name to switch branches.

## 7. Read old sessions

Open **History** (the clock icon in the rail). Sessions are grouped by day. Use the date field to see one day, and the trash icon to move a session to the Recycle Bin.

## 8. Tune it

**Settings** has pages for the editor, snippets and the terminal. A good first change is turning on **Auto save** in Settings → Editor.

## Closing the app

If a terminal is still running a program, o-bros lists what is running and asks before it stops everything. Unsaved files are listed too.

## Where to go next

- [Features](FEATURES.md) for the full list, with every setting.
- [Privacy and security](PRIVACY-AND-SECURITY.md) to see exactly what the app touches.
