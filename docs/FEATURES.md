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
| Finished notification | If a terminal prints for 8 seconds or more and then stays quiet for 4 seconds while you are in another tab or app, you get a notification and a dot on its tab. Turn it off in Settings → Terminal. |
| History size | How many lines each terminal keeps (1,000 to 10,000). A smaller number uses less memory. Settings → Terminal. |

Terminals only start when their tab is first shown, and the GPU renderer is released for hidden terminals, so many open tabs stay cheap.

## Tabs

- Close with the X, the middle mouse button, or right-click → Close.
- Right-click also offers **Close other tabs**, **Copy path** and **Reveal in folder**.
- Drag tabs to reorder them.
- The arrow next to the split buttons lists every tab.
- Closing a file with unsaved changes asks first.
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
| Snippets | Type a prefix and pick it from the suggestions. Edit them per language in Settings → Snippets. `${1}` and `${2:name}` mark places to jump to with Tab. |
| Linter | `oxlint` for JavaScript and TypeScript. Modes: Off, On save (default), As you type. Uses a `.oxlintrc.json` in your project if there is one. |
| Formatter | `oxfmt` with `Shift+Alt+F` or on save. Supports JavaScript, TypeScript, JSON, CSS, HTML, Markdown and YAML. |
| Auto save | Settings → Editor → Auto save. Saves after you stop typing for 200 ms, 500 ms, 1 s, 2 s, 5 s or any delay from 100 ms to 60 s. It never formats, so the cursor does not jump. Pending changes are saved when you leave the tab. |
| Problems | The status bar shows error and warning counts for open files. Press it for a list; click a row to jump to that line. |
| Quick open | `Ctrl+P`. With an empty box it lists recently opened files. |

Files larger than 2 MB are not opened.

## Git (Changes panel)

- Branch card: current branch, tracking branch, ahead and behind counts, last fetch time and a fetch button.
- Click the branch name to switch to another local branch.
- Stage, unstage or discard a file, or stage and unstage all. Discarding asks first; a new file goes to the Recycle Bin.
- Write a message and commit (`Ctrl+Enter` inside the message box).
- Select a file to read its diff.

Git must already know your name and email (`git config`). o-bros shows a clear message if it does not.

## History

- Lists your Claude conversations, newest first, grouped by Today, Yesterday and Earlier.
- Pick a date to see one day.
- Delete one session, or every session of the chosen day. They move to the Recycle Bin or Trash.
- Click a session to read it. It is read-only.

## Accounts and usage

- Detects every `~/.claude*` and `~/.codex*` folder that looks like a login.
- Shows the 5-hour and weekly usage of each, with when it resets.
- **Use** switches which account new terminals run with.
- **Add account** creates a named login (see [Getting started](GETTING-STARTED.md)).
- The status bar shows the active Claude and Codex usage. Press it for a detailed or compact popover.

## Projects panel

- Open sessions per project, with how long ago each started.
- Folders in each project with their git branch. Feature branches are shown in white.
- **Scripts:** the selected project's `package.json` scripts. Press one to run it in a new terminal. The package manager (npm, pnpm, yarn or bun) is chosen from the lock file.

## Resource Manager

Press the memory figure in the status bar.

- Total CPU and memory for the app and every terminal, grouped by project.
- **Listening ports** opened by programs inside your terminals, with a Stop button for each.

## Notifications and messages

Short messages (toasts) appear bottom right, with an icon for success, warning or error. Errors are shown in bold. System error text is translated into plain sentences; o-bros does not show raw error codes.

## Settings reference

| Page | Setting |
|---|---|
| Provider accounts | Rescan, Use, Add account |
| Project folders | Add and remove folders |
| Editor | Auto save and delay, linter mode, format on save, enabled languages |
| Snippets | Per-language snippets, reset to defaults |
| Terminal | History size, finished notification |
