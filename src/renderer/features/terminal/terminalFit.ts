import type { Terminal } from '@xterm/xterm'

const MINIMUM_COLUMNS = 2

function pixelsOf(value: string): number {
  const parsed = parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function overflowPixels(host: HTMLElement, screen: HTMLElement): number {
  const contentRight = host.getBoundingClientRect().right - pixelsOf(getComputedStyle(host).paddingRight)
  return screen.getBoundingClientRect().right - contentRight
}

export function trimTerminalToHost(terminal: Terminal, host: HTMLElement): boolean {
  const screen = host.querySelector('.xterm-screen')
  const isHidden = host.clientWidth === 0 || host.clientHeight === 0
  if (!(screen instanceof HTMLElement) || terminal.cols <= MINIMUM_COLUMNS || isHidden) {
    return false
  }
  const overflow = overflowPixels(host, screen)
  if (overflow <= 0) {
    return false
  }
  const cellWidth = screen.getBoundingClientRect().width / terminal.cols
  const columnsToRemove = Math.ceil(overflow / cellWidth)
  terminal.resize(Math.max(MINIMUM_COLUMNS, terminal.cols - columnsToRemove), terminal.rows)
  return true
}
