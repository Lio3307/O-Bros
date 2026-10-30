const { execSync } = require('child_process')
const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { style, write, showPrompt, onEachMessage } = require('./demoTerminal.cjs')

const ORANGE = 209
const SESSION_ID_OPTION = '--session-id'
const optionIndex = process.argv.indexOf(SESSION_ID_OPTION)
const sessionId = optionIndex === -1 ? crypto.randomUUID() : process.argv[optionIndex + 1]
const dot = style.color(ORANGE, '●')

function saveConversation(userText, answer) {
  const folder = path.join(os.homedir(), '.claude', 'projects', 'demo-todo-api')
  fs.mkdirSync(folder, { recursive: true })
  const cwd = process.cwd()
  const lines = [
    { type: 'user', cwd, message: { content: userText } },
    { type: 'assistant', cwd, message: { content: [{ type: 'text', text: answer }] } }
  ]
  fs.writeFileSync(path.join(folder, `${sessionId}.jsonl`), lines.map((line) => JSON.stringify(line)).join('\n') + '\n')
}

function runWot(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).split('\n')[0].trim()
  } catch (error) {
    return String(error.stdout || error.message).split('\n')[0].trim()
  }
}

function lead(text) {
  write(`${text}
`)
  write(`\n${dot} I'll bring in two team members with wot: Codex reviews, Gemini writes tests.\n`)
  const reviewer = runWot('wot spawn codex --name reviewer --task "Review src/todos.ts and src/server.ts for bugs. Start your answer with DONE: and list what you found."')
  write(`\n${dot} ${style.bold('Bash')}(wot spawn codex --name reviewer)\n  ${style.dim('└')} ${reviewer}\n`)
  const tester = runWot('wot spawn gemini --name test-writer --task "Write unit tests for completeTodo and listTodos in src/todos.test.ts."')
  write(`\n${dot} ${style.bold('Bash')}(wot spawn gemini --name test-writer)\n  ${style.dim('└')} ${tester}\n`)
  write(`\n${dot} Both are working. I'll wait for their answers with ${style.bold('wot wait --any')}.\n\n${style.dim('✻ Waiting for team members… (esc to interrupt)')}`)
}

write(`${style.color(ORANGE, '✻')} ${style.bold('Claude')} ${style.dim('(demo)')}\n${style.dim(`cwd: ${process.cwd()}`)}\n`)
showPrompt()
onEachMessage((text) => {
  if (text.includes('O-BROS handoff')) {
    const answer = 'Picked up the handoff: due dates stay, and listTodos now hides finished todos.'
    saveConversation(text, answer)
    write(`\n${dot} ${answer}\n`)
    showPrompt()
    return
  }
  lead(text)
})
