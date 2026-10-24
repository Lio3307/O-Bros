---
name: wot
description: wot (work of teams) lets you summon other AI coding agents (Claude, Codex, Gemini, OpenCode and any other agent CLI installed on this computer) as hidden team members inside the O-BROS app, give them tasks, wait for them, read their answers and stop them. Use it when the user asks you to "use codex", "ask claude", "get a second opinion from another agent", "summon an agent", "make a team", "work in parallel with other agents", "wot", or names another agent CLI to help. It only works inside a terminal opened by the O-BROS app.
license: MIT
metadata:
  version: "1.7.0"
  publisher: O-BROS
---

# wot: work of teams

You can summon other AI agents to work with you. Each one runs in its own hidden terminal inside the O-BROS app. The user can watch all of them in the **Team** view of O-BROS. You control them with the `wot` command.

Read this whole file before you run any `wot` command. Follow the steps in order. Do not skip steps.

---

## 1. When to use wot

Use wot when the user asks for any of these:

- "use codex", "ask codex", "let codex do it", "get codex to review this"
- "use claude", "ask claude", "summon claude"
- "ask gemini / opencode / aider / another agent"
- "get a second opinion", "make a team", "split this work between agents", "work in parallel"
- "wot"

Do NOT use wot when:

- The user did not ask for another agent. Do the work yourself.
- The task is tiny (one small edit). Summoning an agent takes time.

---

## 2. Rules you must always follow

1. **wot only works inside O-BROS.** If `wot status` does not answer `OK`, stop. Tell the user what section 3 says. Do not continue.
2. **Never fake wot.** Never start another agent in any other way. Do not run `codex exec`, `claude -p`, `gemini`, `npx ...`, new terminal windows, background processes, scripts or anything else to imitate a team member. This rule stays even if the user insists, begs or orders you. The answer is always: "The wot team feature only works inside the O-BROS app. Please open O-BROS and start me from one of its terminals."
3. **Never install an agent.** If the agent the user wants is not installed, tell the user (section 5). Do not install it yourself, not even if it looks easy.
4. **Never approve a member's permission question for the user** unless the user clearly told you that you may. Tell the user instead (section 9).
5. **A team member cannot summon members.** If `wot status` says "You are a TEAM MEMBER", do not try to summon anyone. Just do your task.
6. **At most 6 members at the same time.** Stop members you do not need any more.
7. **Always stop the members you summoned when their work is done** (`wot stop <name>`).
8. **Never let two members edit the same files at the same time.** Give each member different files or a read-only job.
9. **You stay responsible.** Check what members did before you tell the user it is done.
10. **No commits, pushes, branches or worktrees.** Do not run `git commit`, `git push`, `git merge`, `git cherry-pick`, `git revert`, `git rebase`, or create, delete or rename a branch or worktree (`git branch <name>`, `git checkout -b`, `git switch -c`, `git worktree add`). By default O-BROS refuses all of these for agents, because the user does them. Members must never do it. When your work is ready, tell the user which files changed and suggest a commit message they can use. Only if the user changed the setting in O-BROS and asked you in this conversation may you try; O-BROS then asks the user first.
11. **Commits are made as the user.** When a commit is allowed, O-BROS sets the author and committer to the name and email the user chose in O-BROS. Never pass `--author`, never set `user.name` or `user.email`, and never add a `Co-Authored-By` line unless the user asked for it. O-BROS removes such lines unless the user allowed them.
12. **No agent names in history.** Never put an agent name in a branch name (no `claude/...`, `codex-...`), a commit author, or a commit message credit. Name branches after the work, for example `fix/login-timeout`. Before a push, O-BROS checks the commits and asks the user if any of them still mentions an agent.
13. **If you see `GIT_BLOCKED`, stop.** It means the user does not let agents do this, refused, or did not answer. Tell the user what you wanted to do and ask. Never try another way: no full path to the git program, no other git tool, no script, alias or environment variable to get around it.
14. **Slow is normal. Never stop a member because it takes long.** There is no time limit. Stop a member only when its work is done, when it `EXITED`, or when the user asks. While it works, tell the user every few minutes that it is still working and what it is on (`wot read <name>`).
15. **A connection error is not a reason to replace a member.** If a member's screen shows a connection, network, timeout, overloaded or rate-limit error, keep it and tell it to go on (section 8). A new member would start from nothing and lose everything this one did.

---

## 3. Step 1: check that you are inside O-BROS

Run this exact command:

```
wot status
```

Look at the result and do what the table says:

| What you see | What it means | What you do |
|---|---|---|
| `OK: O-BROS is running and wot is ready.` and `You are the LEAD agent` | Everything works. | Go to step 2 (section 4). |
| `OK: ...` and `You are a TEAM MEMBER` | You were summoned by another agent. | Do not summon anyone. Do your own task only. |
| `command not found`, `is not recognized as the name of a cmdlet`, `not recognized as an internal or external command` | You are not in an O-BROS terminal, or O-BROS is not installed. | First try section 13 (fallback). If that also fails, tell the user the message below and stop. |
| Starts with `WOT_UNAVAILABLE` | O-BROS is closed, uninstalled, or this terminal was not opened by O-BROS. | Tell the user the message below and stop. |
| Starts with `WOT_NOT_INSTALLED` | O-BROS is open, but the user has not installed the wot skill in O-BROS, so team features are off. | Tell the user to install it in O-BROS → Settings → Team (wot), then ask again. Stop. |
| Starts with `WOT_BLOCKED` | Your sandbox blocked the local connection. | Run the same command again and request permission to run it outside the sandbox (with network access). If the user says no, tell them wot cannot work without it and stop. |

Message to tell the user when wot is not available (copy it):

> The wot team feature needs the O-BROS app. Please open O-BROS and start me from one of its terminals, then ask me again. I cannot summon other agents without O-BROS.

After you tell the user this, **stop**. Do not try other ways (see rule 2).

---

## 4. Step 2: find out which agents you can summon

Run:

```
wot agents
```

You get two lists:

- **Agents you CAN summon (installed on this computer)**: you may use these.
- **Agents that are NOT installed**: you cannot use these.

How to pick the agent:

| The user said | Use this agent name in `wot spawn` |
|---|---|
| "codex", "openai", "gpt" | `codex` |
| "claude", "anthropic" | `claude` |
| "gemini", "google" | `gemini` |
| "opencode" | `opencode` |
| any other name | the name from the `wot agents` list that matches it |
| "another agent", "a second opinion" (no name) | pick an agent from the "CAN summon" list that is **different from you**. Use only what `wot agents` shows: every computer has different agents. If the only installed agent is you, summon a new member of your own kind. |

If the user asked for **you** (for example you are Claude and the user says "use claude"), that is fine: summon a new member of your own kind.

Never promise an agent before you ran `wot agents`. The names in this file are only examples; the user may have none of them, or other ones.

---

## 5. If the agent the user wants is not installed

If the agent is in the "NOT installed" list, or `wot spawn` ends with exit code 3, do this:

1. Do **not** install it. Do **not** imitate it.
2. Tell the user exactly which agent is missing and which ones are installed. Example:

   > Gemini is not installed on this computer, so I cannot summon it. The agents I can summon are: <the names from the "CAN summon" list>. Do you want me to use one of those instead? You can also install Gemini yourself and ask me again.

3. Wait for the user's answer. Do nothing else with wot until they answer.

If the name is not in either list (`is not an agent O-BROS knows`), tell the user you do not know that agent and show them the installed list.

---

## 6. Step 3: write the task

A team member knows **nothing** about your conversation. It only sees the text you send. Write the task so that a new person could do it without asking anything.

A good task has these parts. Use this template:

```
You are "<member name>", a member of a team working in this project folder.
Lead agent: <your name, for example Claude>.

GOAL
<one or two sentences: what must be done>

CONTEXT
<what the project is, what the user wants, what you already know>

FILES
<the exact files or folders to look at or change>
<the files it must NOT change>

RULES
- Do not commit, push, or create, delete, rename or switch git branches. O-BROS blocks these and asks the user.
- Do not install packages unless this task says so.
- Do not edit files outside the FILES list.
- If you need permission or an answer, ask and wait.

WHEN YOU ARE DONE
Reply with a short summary that starts with "DONE:".
List every file you changed and what you changed.
If you could not finish, start with "BLOCKED:" and explain why.
```

How to send the task text (choose A when the task has more than one line, quotes, or special characters like & | < > % ^ $ `):

**A. Long task (recommended, works in every shell):**

1. Run `wot new-file <member name>`. It prints the path of a new empty file.
2. Write the whole task into that file with your normal file writing or editing tool.
3. Use `--task-file <that path>` in step 4. wot deletes the file after reading it.

**B. Short one-line task with only letters, numbers, spaces and simple punctuation:**

Use `--task "the task"`.

---

## 7. Step 4: summon the member

Choose a short name that says the job, using only lowercase letters, numbers and `-`. Examples: `reviewer`, `test-writer`, `docs`, `codex-review`.

Run:

```
wot spawn <agent> --name <name> --task-file <path from wot new-file>
```

Example:

```
wot spawn codex --name reviewer --task-file C:\Users\me\AppData\Local\Temp\o-bros-wot\reviewer-1712345678901.md
```

This command returns within a few seconds. The member keeps starting in the background, and O-BROS types the task in by itself as soon as the agent has opened (usually within a minute). While it starts, `wot wait` says it is still starting. Do not summon it again, do not send the task again, and do not stop it because it is still starting: go to step 5.

No wot command cancels anything when your shell stops it because of a time limit. If your shell stops a wot command, do not `wot stop` the member: run `wot list` or `wot wait <name>` to see where it is.

Options:

- `--cwd <folder>`: the member works in another folder of the project (relative to your folder). Use it when your folder is the top of a drive such as `E:\`: Codex's Windows sandbox cannot run commands or write files there.
- `-- <agent options>`: everything after `--` is passed to the agent program itself, for example `wot spawn codex --name docs --task-file <path> -- --no-daemon`. wot refuses options it does not know, so never put agent options before `--`.

Results:

| Result | What you do |
|---|---|
| `OK: Summoned team member "<name>"` | Tell the user in one sentence that you summoned it (they can watch it under your terminal in Projects). Go to step 5. |
| A line starting with `NOTE:` | Read it. If it says the member works at the top of a drive and the member later reports shell or file-write failures, stop it and summon it again with `--cwd`. |
| Exit code 3 (`is not installed`, `is not an agent O-BROS knows`) | Section 5. |
| `The team is full` | Stop a member you do not need (`wot list`, then `wot stop <name>`) and try again. |
| `A team member cannot summon more agents` | You are a member. Do your own task only. |
| `Team members only work inside a project folder` | You were started in the home folder. Tell the user to open a project folder in O-BROS and start you from a terminal in that folder. Stop. |
| `stopped right after it started` | Run `wot read <name>` to see why (often: not signed in). Tell the user what you saw. Then `wot stop <name>`. |
| Any other `ERROR:` | Tell the user the error text. Do not retry more than once. |

---

## 8. Step 5: wait for the member and read its answer

Repeat this loop until the member is finished:

1. Run `wot wait <name>`
2. Look at the first word of the answer:

| First word | Meaning | What you do |
|---|---|---|
| `FINISHED:` | It finished its turn. | Run `wot read <name>`. Read the screen. Look for `DONE:` or `BLOCKED:`. If it shows a connection or rate-limit error instead, see the notes below. |
| `QUESTION:` | It is asking a question or asking permission. | Run `wot read <name>`. Go to section 9. |
| `STILL_WORKING:` | It is still busy. | Run `wot wait <name>` again. You can run `wot read <name>` to peek. |
| `EXITED:` | The agent program stopped: it crashed, it could not start (for example not signed in, or a wrong agent option), or the user stopped it with Ctrl+C. | Run `wot read <name>` to see its last screen. Fix the cause if you can (for example pass an agent option after `--`) and summon it again once; otherwise tell the user what you saw. Then `wot stop <name>`. Do not send it more messages; `wot send` is refused. |
| `There is no team member named` … `It was stopped:` | O-BROS removed it and says why. | Tell the user the reason. Summon it again at most once. |

Notes:

- There is no time limit. A member may work for many minutes or even hours; keep running `wot wait <name>` for as long as it says `STILL_WORKING`. Do not stop it, do not summon a replacement, and do not do its task yourself because it is slow. If the user asks, tell them it is still working and what its screen shows.
- If the screen shows a connection, network, timeout, overloaded or rate-limit error (for example "stream disconnected", "reconnecting", "network error", "429", "overloaded"), the member keeps everything it did so far. If the agent is still retrying on its own, just wait. If it stopped and waits for you, wait about a minute, then `wot send <name> "The connection is back. Please continue where you stopped."` and wait again. After two more failures in a row, tell the user that the connection or the agent's service has a problem, and ask whether to keep trying. Do not `wot stop` it and summon a new one for this.
- `wot wait` returns after at most about 100 seconds. That is normal. Just run it again. Use `--timeout <seconds>` (maximum 280) if your own command timeout allows longer.
- If your shell stops commands sooner than 100 seconds (some agents stop them after about 10 seconds), pass a `--timeout` a few seconds below that limit, for example `wot wait <name> --timeout 8`, and run it again as often as needed. A `wot wait` that your shell stops does no harm: nothing is cancelled.
- `wot read <name>` shows the last 80 lines of its screen. Use `--lines 200` to see more.
- The screen is the agent's own terminal interface. It may contain boxes, menus and progress lines. Look for the actual answer text.
- "FINISHED" only means it stopped printing. Always read the screen to check that it really says `DONE:`.
- Read the answer soon after `FINISHED:`. To save memory, O-BROS may stop a member that finished and stayed idle (the user chooses after how long, 10 minutes by default), and it stops members when your terminal closes. If `wot read` then says there is no such member, it was stopped; summon a new one if you still need it.

---

## 9. When a member asks a question or permission

Run `wot read <name>` and look at the question.

**Permission questions** (for example "Do you want to proceed?", "Allow command?", "1. Yes 2. No", "(y/n)"):

- If the user already told you that you may approve this kind of action, you may answer. Send the exact key or text the menu asks for, for example `wot send <name> "1"` or `wot send <name> "y"`.
- Otherwise, **do not approve it.** Tell the user:

  > Team member "<name>" is asking for permission: <short description of what it wants to do>. It is under my terminal in O-BROS Projects: click it and answer there, or tell me whether I may approve it.

  Then wait for the user.

- Never approve: deleting files or folders, `git push`, `git reset --hard`, force pushes, installing software, anything with passwords, tokens or money, anything outside the project folder.

**Git questions:** if the member's screen shows `GIT_BLOCKED`, or O-BROS asked the user about a commit, push or branch, do not help the member get around it. Tell the user what the member wanted to do.

**Normal questions** (for example "Which file should I change?"): answer them yourself if you know the answer from your conversation. Use `wot send <name> "your answer"` or `wot send <name> --file <path>` for long answers. If you do not know, ask the user.

After answering, go back to the loop in section 8.

---

## 10. Step 6: give follow-up instructions

To ask a member to do more, or to correct it:

1. Short message: `wot send <name> "your message"`
2. Long message: `wot new-file <name>`, write the message into the file, then `wot send <name> --file <path>`.
3. Then go back to section 8 (`wot wait <name>`).

`wot send` types the text and presses Enter for you. Do not add Enter yourself.

---

## 11. Step 7: check the work and report to the user

When a member says `DONE:`:

1. Read the files it says it changed (use your normal file reading tool, or `git diff`).
2. Check that the change is correct and does what the user wanted.
3. Fix small problems yourself, or send the member a follow-up (section 10).
4. Tell the user what the member did, in a few lines, including which files changed.

Then stop the member (section 12) unless the user wants to keep it.

---

## 12. Step 8: stop members you do not need

```
wot stop <name>
```

This closes the member's terminal. Stop every member you summoned when its work is done. Use `wot list` to see which members still exist.

---

## 13. Fallback when the `wot` command is not found

Sometimes the shell does not find `wot` even inside O-BROS. Try the long form once:

- bash, zsh, Git Bash:

  ```
  ELECTRON_RUN_AS_NODE=1 "$O_BROS_WOT_NODE" "$O_BROS_WOT_CLI" status
  ```

- PowerShell:

  ```
  $env:ELECTRON_RUN_AS_NODE='1'; & $env:O_BROS_WOT_NODE $env:O_BROS_WOT_CLI status
  ```

If this works, use the same long form for every other command (replace `status` with the command, for example `agents`).

If it fails, or the variables are empty, you are not inside O-BROS. Follow section 3 ("Message to tell the user") and stop.

---

## 14. Working with several members at once

- Summon them one after another (one `wot spawn` at a time).
- Give each member different files, or make some members read-only (for example "review only, do not edit files").
- Wait with `wot wait --any`: it returns as soon as any of YOUR members finishes, asks a question or exits, and names it. Handle that member (`wot read`, then answer or stop it), then run `wot wait --any` again for the next one.
- `NOTHING_NEW:` means every member already finished or is waiting and you have seen it. Read them, send new work, or stop them; do not keep waiting.
- `STILL_WORKING:` lists every member's state; run `wot wait --any` again.
- Use `wot list` to see all of them and their state.

---

## 15. Command reference

| Command | What it does |
|---|---|
| `wot status` | Checks that O-BROS is running and tells you if you are the lead or a member. |
| `wot agents` | Lists agents you can summon and agents that are not installed. |
| `wot new-file <name>` | Creates an empty temporary file for a long task or message and prints its path. |
| `wot spawn <agent> --name <name> --task-file <path>` | Summons a member and sends the task from the file. |
| `wot spawn <agent> --name <name> --task "<text>"` | Summons a member with a short one-line task. |
| `wot spawn ... --cwd <folder>` | The member works in that folder of the project. |
| `wot spawn ... -- <agent options>` | Passes the options after `--` to the agent program. |
| `wot list` | Lists members, their state and their task. |
| `wot wait <name> [--timeout <seconds>]` | Waits until the member finishes its turn, asks something, or stops. |
| `wot wait --any [--timeout <seconds>]` | Waits for whichever of your members finishes, asks or stops first, and names it. |
| `wot read <name> [--lines <number>]` | Prints the member's screen. |
| `wot send <name> "<text>"` / `wot send <name> --file <path>` | Types a message into the member and presses Enter. |
| `wot stop <name>` | Stops the member and closes its terminal. |
| `wot help` | Shows the help. |

Member states:

| State | Meaning |
|---|---|
| `starting` | The agent is still opening. |
| `working` | It is busy. Wait. |
| `idle` | It finished its turn. Read its screen. |
| `waiting` | It is asking a question. Read its screen. |
| `exited` | The agent program stopped. |

Exit codes:

| Code | Meaning | What you do |
|---|---|---|
| 0 | OK | Continue. |
| 1 | Failed | Read the `ERROR:` text and tell the user if you cannot fix it. |
| 2 | O-BROS not available | Section 3 message. Stop. |
| 3 | Agent not installed or unknown | Section 5. |
| 4 | Sandbox blocked | Ask for permission to run outside the sandbox. |
| 5 | No member with that name | Run `wot list` and use a correct name. |
| 6 | The wot skill is not installed in O-BROS | Tell the user to install it in Settings → Team (wot). Stop. |

When a `git` command answers `GIT_BLOCKED`, O-BROS asked the user and the answer was no (or no answer in 100 seconds). Stop and ask the user. See rule 13.

---

## 16. Full examples

### Example A: the user says "ask codex to review my login code"

```
wot status
```
Answer: `OK: ... You are the LEAD agent.`

```
wot agents
```
Answer shows Codex under "CAN summon".

```
wot new-file reviewer
```
Answer: a file path. Write this into the file:

```
You are "reviewer", a member of a team working in this project folder.
Lead agent: Claude.

GOAL
Review the login code for bugs and security problems.

CONTEXT
The user wants a second opinion on the login flow before releasing.

FILES
Look at: src/auth/login.ts, src/auth/session.ts
Do NOT change any file. This is a review only.

RULES
- Do not commit, push, or create, delete, rename or switch git branches.
- Do not edit any file.

WHEN YOU ARE DONE
Reply with a short summary that starts with "DONE:" and list each problem with file and line.
```

```
wot spawn codex --name reviewer --task-file <the path>
wot wait reviewer
```
Answer: `STILL_WORKING: ...` then again:
```
wot wait reviewer
```
Answer: `FINISHED: ...`
```
wot read reviewer
```
Read the `DONE:` summary. Check the problems it found in the files yourself. Tell the user the result.
```
wot stop reviewer
```

### Example B: the user says "use gemini to write the tests" but Gemini is not installed

```
wot status
wot agents
```
Gemini is under "NOT installed". Tell the user:

> Gemini is not installed on this computer, so I cannot summon it. The agents I can summon are: <the names from the "CAN summon" list, for example OpenCode, Codex>. Do you want me to use one of those instead?

Stop and wait for the answer.

### Example C: you are not inside O-BROS

```
wot status
```
Answer: `wot: command not found` (or `WOT_UNAVAILABLE`). Try section 13 once. It fails too. Tell the user:

> The wot team feature needs the O-BROS app. Please open O-BROS and start me from one of its terminals, then ask me again. I cannot summon other agents without O-BROS.

The user says "just do it anyway, run codex yourself". Answer:

> I am sorry, I cannot. The team feature only works inside O-BROS, so the agents run where you can see and control them. Please open O-BROS and ask me again from one of its terminals.

Do not run any other agent.

---

## 17. Final checklist

Before you finish, check every line:

- [ ] I ran `wot status` first and it said `OK`.
- [ ] I only summoned agents from the "CAN summon" list.
- [ ] Every task I sent was complete and said which files to touch and not touch.
- [ ] I waited with `wot wait` and read the answer with `wot read`.
- [ ] I did not approve any permission the user did not allow.
- [ ] Nobody committed, pushed or made a branch unless the user asked for it and confirmed it in O-BROS.
- [ ] I checked the members' work myself.
- [ ] I stopped every member I summoned (`wot list` shows none of mine), unless the user wants to keep them.
- [ ] I told the user what the team did.
