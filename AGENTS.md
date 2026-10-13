# o-bros

Electron + React + TypeScript desktop app: a terminal-first workspace for the Claude and Codex CLIs.
Design source: the `Design 4` page of the Framer project (frames 1 to 8).

Technical decisions and their rationale live in `docs/decisions.md`. Read it before changing the stack, the account model, or the IPC contract.

## Learned project conventions

- Scope: whole repository
  Convention: Do not write comments in code. Express intent with clear names and small functions.
  Reason: The user wants to read the code quickly without spending time on commentary.
  Evidence: Explicit user instruction (set-rules); applied across `src/`.
  Status: User-directed; implementation awaiting feedback.

- Scope: whole repository
  Convention: Never use regular expressions in logic. Use `startsWith`, `includes`, `split`, `indexOf` and named helper functions.
  Reason: The user finds regex hard to read and maintain.
  Evidence: Explicit user instruction (set-rules); example in `src/main/services/gitStatusParser.ts`.
  Status: User-directed; implementation awaiting feedback.

- Scope: whole repository
  Convention: Keep one responsibility per file, avoid duplicated logic, and reuse shared helpers (`src/shared/paths.ts`, `src/shared/time.ts`).
  Reason: The user wants code that is easy to read and maintain.
  Evidence: Explicit user instruction; example in `src/main/pathGuard.ts` reusing `isPathInside`.
  Status: User-directed; implementation awaiting feedback.

- Scope: whole repository
  Convention: Provider accounts are read-only. o-bros detects logins on the computer and never signs in, stores tokens, or edits CLI config. The only write is Add account, which creates an empty `~/.claude-N` or `~/.codex-N` folder and opens a terminal where the official CLI signs in. A non-default account is selected only through `CLAUDE_CONFIG_DIR` or `CODEX_HOME` on the spawned PTY.
  Reason: The app only reads the user's computer; credentials must stay with the official CLIs.
  Evidence: Explicit user instruction; example in `src/main/services/accountEnvironment.ts`.
  Status: User-directed; implementation awaiting feedback.

- Scope: dependencies
  Convention: Prefer packages that ship prebuilt binaries. Do not add a package that needs node-gyp or Python to install.
  Reason: The user does not have Python installed.
  Evidence: Explicit user statement; `@lydell/node-pty` chosen for this reason.
  Status: User-directed; not yet verified by an install.

- Scope: src/
  Convention: `src/shared` holds the contract (types, IPC channels, pure helpers). `src/main` owns the OS, `src/preload` only bridges, `src/renderer` never imports Node.
  Reason: Not stated by the user; chosen to keep trust boundaries explicit.
  Evidence: Agent-selected layout; example in `src/shared/ipc.ts`.
  Status: Provisional, not yet confirmed by the user.
