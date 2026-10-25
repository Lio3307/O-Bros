import type { Terminal } from '@xterm/xterm'

const MINIMUM_COLUMNS = 2
const MINIMUM_ROWS = 1

function pixelsOf(value: string): number {
  const parsed = parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function overflowPixels(host: HTMLElement, screen: HTMLElement): { right: number; bottom: number } {
  const hostBox = host.getBoundingClientRect()
  const screenBox = screen.getBoundingClientRect()
  const style = getComputedStyle(host)
  return {
    right: screenBox.right - (hostBox.right - pixelsOf(style.paddingRight)),
    bottom: screenBox.bottom - (hostBox.bottom - pixelsOf(style.paddingBottom))
  }
}

export function trimTerminalToHost(terminal: Terminal, host: HTMLElement): boolean {
  const screen = host.querySelector('.xterm-screen')
  const isHidden = host.clientWidth === 0 || host.clientHeight === 0
  if (!(screen instanceof HTMLElement) || isHidden) {
    return false
  }
  const overflow = overflowPixels(host, screen)
  const screenBox = screen.getBoundingClientRect()
  const columnsToRemove = overflow.right > 0 ? Math.ceil(overflow.right / (screenBox.width / terminal.cols)) : 0
  const rowsToRemove = overflow.bottom > 0 ? Math.ceil(overflow.bottom / (screenBox.height / terminal.rows)) : 0
  if (columnsToRemove === 0 && rowsToRemove === 0) {
    return false
  }
  terminal.resize(Math.max(MINIMUM_COLUMNS, terminal.cols - columnsToRemove), Math.max(MINIMUM_ROWS, terminal.rows - rowsToRemove))
  return true
}
