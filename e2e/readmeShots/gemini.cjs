const { style, write, showPrompt, onEachMessage } = require('./demoTerminal.cjs')

const BLUE = 75

write(`${style.color(BLUE, '✦')} ${style.bold('Gemini CLI')} ${style.dim('(demo)')}\n`)
showPrompt()
onEachMessage((text) => {
  write(`${text}\n\n${style.color(BLUE, '✦')} I'll add ${style.bold('src/todos.test.ts')} with 4 tests.\n\n${style.bold('WriteFile')} src/todos.test.ts\nAllow this change? Do you want to proceed? (y/n) `)
})
