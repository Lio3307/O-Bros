# o-bros

Electron + React + TypeScript desktop app: a terminal-first workspace for any agent CLI the user has installed (Claude, Codex, Gemini CLI, OpenCode and others).
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
  Convention: Provider accounts are read-only. o-bros detects logins on the computer and never signs in, stores tokens, or edits CLI config. The only writes are Add account, which creates an empty `~/.claude-N` or `~/.codex-N` folder and opens a terminal where the official CLI signs in, and the wot skill, which writes `<Claude account folder>/skills/wot/SKILL.md` or `~/.agents/skills/wot/SKILL.md` only when the user presses Install in Settings → Team (wot) or Update all in the update notice O-BROS shows at start when an installed skill is older than the one it ships. A non-default account is selected only through `CLAUDE_CONFIG_DIR` or `CODEX_HOME` on the spawned PTY.
  Exception: custom providers (Settings → Provider accounts). Their API key is stored only when the user pastes it, encrypted with Electron safeStorage in `provider-keys.json`, decrypted only in the main process when an agent that uses the provider starts, and never sent to the renderer, logged or exported; the renderer only sees the last 4 characters.
  Exception: moving conversations (Settings → Storage and memory → Where conversations are saved). Only when the user presses Move or Move back, O-BROS moves a conversation-only folder (Claude `projects` and Codex `sessions` per account, and `history-folders.json` entries without `holdsLogin`) into the folder the user chose and leaves a junction or symlink in its place. It refuses while the agent runs, never moves a folder that holds a login, and puts the files back if any step fails.
  Reason: The app only reads the user's computer; credentials must stay with the official CLIs. Custom providers are the user's own endpoints, so the user chose to let O-BROS keep their key, encrypted and never exported. Conversations can fill the system drive, so the user asked to control where they are saved.
  Evidence: Explicit user instruction; example in `src/main/services/accountEnvironment.ts`.
  Status: User-directed; implementation awaiting feedback.

- Scope: Settings → Provider accounts
  Convention: Show only the agents installed on the computer. Claude and Codex keep switchable accounts and usage. Every other agent CLI is listed read-only with the login it uses, parsed in `src/shared/agentLogins.ts` from its own files; the parsers keep only the account name, the login type and provider names, never a key or token value, and nothing is written. What each agent needs (account, API key or either), its key variables and sign-in steps live in resources/agents/agent-auth.json; key variables are checked for being set, never read for their value. Add a new agent by adding a reader in `src/main/services/agentLogins.ts` and a parser with a test.
  Reason: The user wants every agent they have to appear, without O-BROS ever touching credentials.
  Evidence: User request; `src/shared/agentLogins.test.ts` checks that no key value reaches the result.
  Status: User-directed; implementation awaiting feedback.

- Scope: src/renderer styles
  Convention: Boxy surfaces in the JetBrains style. Every non-circular corner uses `var(--radius)` from `styles/tokens.css` (0px); do not write pixel radii. Reuse the shared components in `src/renderer/ui` (Card, StatTile, Chip, StatusDot, AgentStateBadge, OutcomeBadge, AgentName, Spinner, LoadingText) instead of new one-off styles. Start actions turn green on hover (`hover-positive`), delete and stop actions red (`hover-danger`).
  Reason: The user asked for square boxes everywhere and consistent, reusable components.
  Evidence: User request with a screenshot of the rounded lint tooltip.
  Status: User-directed; implementation awaiting feedback.

- Scope: whole repository
  Convention: Agent-agnostic. Never design, word, test or document a feature for Claude and Codex only. Build agent lists from detection (ACP registry, PATH, launchers) and write examples with names from the installed list or "your agent". When a feature really is limited to some agents (History and saved sessions read only Claude and Codex transcripts; plan usage limits and account switching exist only for them), say so in the UI and say what other agents do instead.
  Reason: O-BROS users run whatever agents they have installed.
  Evidence: Explicit user instruction ("any agent not only focused on claude or codex but it depends what user have in their computer").
  Status: User-directed.

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
