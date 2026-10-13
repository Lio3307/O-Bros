import type { ITerminalOptions } from '@xterm/xterm'

export const terminalOptions: ITerminalOptions = {
  fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
  fontSize: 13,
  lineHeight: 1.5,
  cursorBlink: true,
  theme: {
    background: '#000000',
    foreground: '#EDEDED',
    cursor: '#FFFFFF',
    cursorAccent: '#000000',
    selectionBackground: '#3A3A3A'
  }
}
