const { style, write, showPrompt, onEachMessage } = require('./demoTerminal.cjs')

const STEPS = ['Reading src/todos.ts', 'Reading src/server.ts', 'Checking how listTodos filters done todos']

const say = (event) => process.stdout.write(`${JSON.stringify(event)}\n`)

function runOneTask() {
  process.stdin.resume()
  process.stdin.on('end', () => {
    say({ type: 'thread.started', thread_id: 'demo-thread' })
    say({ type: 'item.completed', item: { type: 'agent_message', text: 'Reviewing the todo API.' } })
    STEPS.forEach((step) => say({ type: 'item.completed', item: { type: 'command_execution', command: step } }))
    setInterval(() => undefined, 1000)
  })
}

function showInteractive() {
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
}

if (process.argv.includes('exec')) {
  runOneTask()
} else {
  showInteractive()
}
