const ESC = String.fromCharCode(27)

const style = {
  bold: (text) => `${ESC}[1m${text}${ESC}[0m`,
  dim: (text) => `${ESC}[2m${text}${ESC}[0m`,
  color: (code, text) => `${ESC}[38;5;${code}m${text}${ESC}[0m`
}

function write(text) {
  process.stdout.write(text.split('\n').join('\r\n'))
}

function showPrompt() {
  write(`${ESC}[?2004h\n> `)
}

function onEachMessage(handle) {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }
  let typed = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (chunk) => {
    for (const character of chunk) {
      if (character === String.fromCharCode(3)) {
        process.exit(0)
      }
      if (character !== '\r') {
        typed += character
        continue
      }
      const text = typed.split(`${ESC}[200~`).join('').split(`${ESC}[201~`).join('').trim()
      typed = ''
      if (text !== '') {
        handle(text)
      }
    }
  })
}

module.exports = { style, write, showPrompt, onEachMessage }
