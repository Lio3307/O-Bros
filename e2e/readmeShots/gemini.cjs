const { style, write, showPrompt, onEachMessage } = require('./demoTerminal.cjs')

const BLUE = 75

const say = (event) => process.stdout.write(`${JSON.stringify(event)}\n`)

function runOneTask() {
  process.stdin.resume()
  process.stdin.on('end', () => {
    say({ type: 'init', session_id: 'demo-session' })
    say({ type: 'message', role: 'assistant', content: "I'll add src/todos.test.ts with 4 tests.", delta: true })
    say({ type: 'tool_use', tool_name: 'write_file src/todos.test.ts' })
    say({ type: 'tool_use', tool_name: 'run_tests' })
    say({ type: 'message', role: 'assistant', content: 'Added src/todos.test.ts. All 4 tests pass.', delta: true })
    say({ type: 'result', status: 'success' })
    process.exit(0)
  })
}

function showInteractive() {
  write(`${style.color(BLUE, '✦')} ${style.bold('Gemini CLI')} ${style.dim('(demo)')}\n`)
  showPrompt()
  onEachMessage((text) => {
    write(`${text}\n\n${style.color(BLUE, '✦')} I'll add ${style.bold('src/todos.test.ts')} with 4 tests.\n`)
  })
}

if (process.argv.includes('-o')) {
  runOneTask()
} else {
  showInteractive()
}
