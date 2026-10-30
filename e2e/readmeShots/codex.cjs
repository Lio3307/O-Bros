const { style, write, showPrompt, onEachMessage } = require('./demoTerminal.cjs')

const STEPS = ['Reading src/todos.ts', 'Reading src/server.ts', 'Checking how listTodos filters done todos']

write(`${style.bold('>_ Codex')} ${style.dim('(demo)')}\n${style.dim(process.cwd())}\n`)
showPrompt()
onEachMessage((text) => {
  write(`${text}\n\n`)
  STEPS.forEach((step) => write(`${style.dim('•')} ${step}\n`))
  let seconds = 0
  setInterval(() => {
    seconds += 1
    write(`\r${style.color(39, '◦')} Working (${seconds}s • esc to interrupt)`)
  }, 1000)
})
