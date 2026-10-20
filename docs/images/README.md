# Screenshots

The images in this folder are shown on the main README. Add your own with these exact names:

| File | What to capture |
|---|---|
| `workspace.png` | The Projects page with a terminal running `claude` or `codex` and the Files panel open |
| `editor.png` | A TypeScript file in the editor with a lint underline and the Problems count in the status bar |
| `changes.png` | The Changes panel with a few staged and unstaged files and the diff beside it |
| `history.png` | The History panel with the date field |
| `settings.png` | Settings → Provider accounts |

Tips:

- Use PNG, about 1600 pixels wide.
- Before you capture, check the title bar, the file tree, terminal text and session titles for private folder names, tokens, URLs with secrets and email addresses. Crop or blur them.
- The Resource Manager popover makes a nice extra image.

## Putting them on the README

After the images are in this folder, paste this block into `README.md` just above the "What you get" heading:

````markdown
## Screenshots

![The workspace with a terminal and the files panel](docs/images/workspace.png)

| Editor with linting | Git changes |
|---|---|
| ![The code editor](docs/images/editor.png) | ![The Changes panel](docs/images/changes.png) |

| Session history | Provider accounts |
|---|---|
| ![The History panel](docs/images/history.png) | ![Provider accounts settings](docs/images/settings.png) |
````

If you paste it before the files exist, GitHub shows broken image icons.
