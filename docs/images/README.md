# Screenshots

The images in this folder are shown on the main README. Add your own with these exact names:

| File | What to capture |
|---|---|
| `workspace.png` | Projects with a lead agent and its wot team members nested under it |
| `team.png` | A team member opened in the main area, asking a question |
| `editor.png` | A TypeScript file in the editor with a lint underline and the Problems count in the status bar |
| `changes.png` | The Changes panel with staged and unstaged files and a side-by-side diff |
| `history.png` | History with a conversation continued in another agent (thread chip and Continue with…) |
| `storage.png` | Settings → Storage and memory, the universal history section |
| `settings.png` | Settings → Provider accounts |

Tips:

- Use PNG, about 1600 pixels wide.
- Before you capture, check the title bar, the file tree, terminal text and session titles for private folder names, tokens, URLs with secrets and email addresses. Crop or blur them.
- The Resource Manager popover makes a nice extra image.

## Putting them on the README

After the images are in this folder, paste this block into `README.md` just above the "What you get" heading:

````markdown## Screenshots

![A lead agent with two team members nested under it in Projects](docs/images/workspace.png)

| Team member view | Continue in another agent |
|---|---|
| ![A team member asking a question](docs/images/team.png) | ![A Codex conversation continued in Claude](docs/images/history.png) |

| Git changes, side by side | Storage you control |
|---|---|
| ![The Changes panel with a side-by-side diff](docs/images/changes.png) | ![Universal history in Storage and memory](docs/images/storage.png) |

| Editor with linting | Provider accounts |
|---|---|
| ![The code editor](docs/images/editor.png) | ![Provider accounts settings](docs/images/settings.png) |
````

If you paste it before the files exist, GitHub shows broken image icons.
