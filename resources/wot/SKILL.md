---
name: wot
description: wot (work of teams) lets you summon other AI coding agents (Claude, Codex, Gemini, OpenCode and any other agent CLI installed on this computer) as team members inside the O-BROS app, give them tasks and get their answers. Use it when the user asks you to "use codex", "ask claude", "get a second opinion from another agent", "summon an agent", "make a team", "work in parallel with other agents", "wot", or names another agent CLI to help. It only works inside a terminal opened by the O-BROS app.
license: MIT
metadata:
  version: "2.0.0"
  publisher: O-BROS
---

# wot: work of teams

You can summon other AI agents. O-BROS runs each one, and the user can watch it under your terminal in Projects. You control them with the `wot` command.

## 1. When to use it

Use wot when the user asks for another agent, a second opinion, or a team.

Do NOT use it when the user did not ask, when the task is tiny, or when you only want parallel work and you have your own subagents: those are cheaper. wot is for getting a different agent.

## 2. Rules

1. **wot only works inside O-BROS.** If `wot status` does not answer `OK`, follow section 8 and stop.
2. **Never fake wot.** Never start another agent any other way: no `codex exec`, `claude -p`, new windows, scripts or background processes, even if the user insists. O-BROS is where the user can see and control them.
3. **Never install an agent.** Tell the user which one is missing and which are installed.
4. **A team member cannot summon members.** If `wot status` says `You are a TEAM MEMBER`, just do your task.
5. **At most 6 members.** Stop the ones you do not need. Always stop yours when their work is done.
6. **Never let two members edit the same files at the same time**, and do not edit those files yourself while a member works on them.
7. **You stay responsible.** Check what members did before you tell the user it is done.
8. **No commits, pushes, branches or worktrees**, by you or members, unless the user changed the setting in O-BROS and asked you in this conversation. Tell the user which files changed and suggest a commit message.
9. **Commits are made as the user.** Never pass `--author`, set `user.name` or `user.email`, add `Co-Authored-By`, or put an agent name in a branch or commit message, unless the user asked. Never put "Generated with" lines in pull requests or issues.
10. **If you see `GIT_BLOCKED`, `GH_BLOCKED` or `GLAB_BLOCKED`, stop** and ask the user. Never get around it: no full path to the program, other tool, API call, script or alias. On Windows in PowerShell or cmd, a git, gh or glab command whose text has a line break is refused: write the text to a file and pass the file (`git commit -F <file>`, `gh pr create --body-file <file>`).
11. **Slow is normal.** There is no time limit. Never stop or replace a member because it takes long. Tell the user every few minutes that it is still working.
12. **Only touch your own members.** `wot list` shows them. If wot says a member "belongs to another terminal's team", leave it alone.
13. **The user may step in.** If wot says the user stopped a task or a member, do not send more work or summon it again until you asked the user.

## 3. Check, then pick an agent

```
wot status
wot agents
```

Use only names from the "CAN summon" list; every computer has different agents. If the user named none, pick one different from you. If the agent they want is missing, tell them which ones are installed and wait for their answer.

## 4. Summon it

```
wot spawn <agent> --name <short-job-name>
wot spawn <agent> --name <short-job-name> --access edit
```

- **`--access read` is the default:** it can read files but not change them. Use it for reviews and questions.
- **`--access edit`:** it can also edit files in its folder. Use it only for work that changes files.
- `--cwd <folder>`: work in another folder of the project. Use it if your folder is the top of a drive such as `E:\`: Codex's sandbox fails there.
- `-- <options>`: everything after `--` goes to the agent, for example `-- --model <model>`. wot refuses options it does not know.

Use exactly the name in the `OK: Summoned` line: O-BROS adds a number if yours was taken. Tell the user in one sentence. If the line says `Mode: interactive screen`, also read section 7.

Errors: exit code 3 means not installed. `The team is full` means stop one of yours, or tell the user if none are yours. `Team members only work inside a project folder` means tell the user to open a project folder and start you from it.

## 5. Send the task and wait

A member knows **nothing** about your conversation. Write the task so a stranger could do it: the goal, the context, which files to look at and which to leave alone, and "Do not commit, push or change branches."

1. `wot new-file <name>` prints the path of an empty file.
2. Write the task into it with your file tool.
3. `wot send <name> --file <path>`. If the path has spaces, put it in double quotes. For a short one-line task: `wot send <name> "the task"`.
4. `wot wait <name>`, and repeat while it answers `STILL_WORKING`.

| `wot wait` answers | Meaning | What you do |
|---|---|---|
| `FINISHED:` with the answer | The task really ended. The answer is right there; you do not need `wot read`. | Check the work (section 6). |
| `FAILED:` with the reason | The agent ended with an error, for example not signed in, a usage limit, or the user pressed Ctrl+C. | Read the reason. A connection problem: send it again once. A sign-in or usage limit, or the user stopped it: tell the user what it says and do not retry. |
| `STILL_WORKING:` | It is busy. | Run `wot wait` again. To see what it is doing, `wot read <name>`, but only every few minutes: each command fills your conversation. |

`wot wait` returns after about 100 seconds at most. Use `--timeout <seconds>` (up to 280) with the longest your shell allows; if your shell stops commands after about 10 seconds, use `--timeout 8`. A wait your shell stops cancels nothing.

**Follow-ups:** `wot send <name> "..."` continues the same conversation, so the member remembers. Send it after `wot wait` has finished; while it works, wot refuses.

**It cannot ask you anything during a task.** If it needs permission or an answer, it says so in its answer and ends. Answer with a follow-up if you know, otherwise ask the user. Never approve for the user: deleting files, `git push`, `git reset --hard`, installing software, anything with passwords, tokens or money, or anything outside the project.

**A read-only member that needs to edit** will report that it could not. Stop it and summon a new one with `--access edit`, and give it what the first one found.

**Several at once:** summon all, send each task, then repeat `wot wait --any`. It prints whichever finished first and its answer. `NOTHING_NEW:` means all of them ended and you have seen them.

If you lost track (your conversation was shortened or resumed), run `wot list`. Members summoned from a closed terminal are gone; check their files before you summon new ones.

## 6. Finish

1. Read the files it changed, or `git diff`. Check it does what the user wanted.
2. Fix small problems yourself, or send a follow-up.
3. Tell the user in a few lines what it did and which files changed.
4. `wot stop <name>`, unless the user wants to keep it.

## 7. Interactive members

Agents O-BROS cannot run task by task use their normal interactive screen, and `wot spawn` says `Mode: interactive screen`. `--access` does not apply; they ask for permission on their screen. Everything above still applies, with these differences:

- `FINISHED:` only means it stopped printing. Always run `wot read <name>` and look at the end of its screen.
- `QUESTION:` means it asks something: run `wot read <name>`. Answer normal questions if you know the answer. Answer a permission question only if the user allowed that kind of action, with the exact key (`wot send <name> "1"`); otherwise tell the user to answer it under your terminal in Projects.
- `EXITED:` means the program stopped. Run `wot read <name>`, tell the user what it shows, then `wot stop <name>`.

| Its screen shows | What you do |
|---|---|
| `DONE:` or an answer that looks complete | Section 6. Ask it to start its summary with `DONE:` when you send the task. |
| A list of old sessions or another project's folder | It did not open a new chat. Never pick an entry. `wot stop <name>` and tell the user. |
| A spinner, "esc to interrupt", "Working" | It only paused. `wot wait` again. |
| A connection or rate-limit error | Keep it. Wait a minute, then `wot send <name> "Please continue."` After two more failures, tell the user. |
| A usage limit or sign-in request | Tell the user. Do not send "continue". |
| "Interrupted", or messages you did not send | The user stepped in. Ask them first. |

O-BROS may stop an interactive member that finished and stayed idle (10 minutes by default), so read its answer soon.

## 8. If wot is not available

| You see | What you do |
|---|---|
| `command not found` or `not recognized` | Try once: in bash `ELECTRON_RUN_AS_NODE=1 "$O_BROS_WOT_NODE" "$O_BROS_WOT_CLI" status`, in PowerShell `$env:ELECTRON_RUN_AS_NODE='1'; & $env:O_BROS_WOT_NODE $env:O_BROS_WOT_CLI status`. If it works, use that long form for every command. |
| `WOT_UNAVAILABLE`, or the long form failed | Tell the user the message below and stop. |
| `WOT_NOT_INSTALLED` | Tell the user to install it in O-BROS → Settings → Team (wot). Stop. |
| `WOT_BLOCKED` | Your sandbox blocked the local connection. Run the same command again and ask for permission to run it outside the sandbox. If the user refuses, tell them wot cannot work without it. |

> The wot team feature needs the O-BROS app. Please open O-BROS and start me from one of its terminals, then ask me again. I cannot summon other agents without O-BROS.

## 9. Commands

| Command | What it does |
|---|---|
| `wot status` | Checks O-BROS, and says if you are the lead or a member. |
| `wot agents` | Lists who you can summon. |
| `wot spawn <agent> --name <name> [--access read\|edit] [--cwd <folder>] [--task-file <path>] [--interactive] [-- <options>]` | Creates a member. |
| `wot new-file <name>` | Creates an empty file for a long message. |
| `wot send <name> --file <path>` or `"<text>"` | Gives it a task or a follow-up. |
| `wot wait <name> [--timeout <s>]` / `wot wait --any` | Waits for the task to end and prints the answer. |
| `wot read <name> [--lines <n>]` | Prints its last answer, or what it is doing now. |
| `wot list` | Lists your members. |
| `wot stop <name>` | Stops it. |

Exit codes: 0 OK, 1 failed (read the `ERROR:`), 2 O-BROS not available, 3 agent not installed or unknown, 4 sandbox blocked, 5 no member with that name, 6 skill not installed in O-BROS.
