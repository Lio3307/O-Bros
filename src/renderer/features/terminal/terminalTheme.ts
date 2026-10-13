import type { ITerminalOptions } from '@xterm/xterm'

export const terminalOptions: ITerminalOptions = {
  fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
  fontSize: 13,
  lineHeight: 1.15,
  cursorStyle: 'block',
  cursorBlink: true,
  theme: {
    background: '#000000',
    foreground: '#EDEDED',
    cursor: '#B8B8B8',
    cursorAccent: '#000000',
    selectionBackground: '#3A3A3A'
  }
}
