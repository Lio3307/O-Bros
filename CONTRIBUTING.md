# Contributing

Thanks for taking a look at o-bros.

## Before you start

1. Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup and the project conventions.
2. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) so you know where a change belongs.
3. Check [docs/decisions.md](docs/decisions.md). If your idea reverses a recorded decision, say why.

## Making a change

- Keep a change focused on one thing.
- Follow `AGENTS.md`: no comments in code, no regular expressions in logic, one responsibility per file, clear names.
- Put logic that can be tested into a small pure function and add a test next to it.
- Do not add a dependency without saying why. Prefer packages that ship prebuilt binaries.
- Do not put raw system error text on screen. Use `friendlyErrorMessage`.

## Before you open a pull request

```
npm run typecheck
npm test
npm run build
npm audit
```

All four should finish without errors.

## Describing your change

Say what changed, why, and what you ran. If something is untested (for example macOS or Linux behaviour), say so rather than leaving it out.

## Ideas that fit

- Features that are cheap in memory and run on demand.
- Clearer messages and safer defaults.
- Testing on macOS and Linux and reporting what breaks.

## Ideas that do not fit

- Always-on file watchers, language servers or search indexes.
- Anything that stores or copies provider credentials.
