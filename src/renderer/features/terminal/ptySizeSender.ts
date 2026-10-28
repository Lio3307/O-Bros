import { noteAgentResize } from './agentStatusTracking'

const RESIZE_GAP_MS = 120

interface PtySize {
  columns: number
  rows: number
  sentColumns: number
  sentRows: number
  timer: ReturnType<typeof setTimeout> | null
}

const sizesByPane = new Map<string, PtySize>()

function sendIfChanged(paneId: string, size: PtySize): boolean {
  if (size.sentColumns === size.columns && size.sentRows === size.rows) {
    return false
  }
  size.sentColumns = size.columns
  size.sentRows = size.rows
  noteAgentResize(paneId)
  window.api.pty.resize(paneId, size.columns, size.rows)
  return true
}

function sendAndWait(paneId: string, size: PtySize): void {
  size.timer = null
  if (sendIfChanged(paneId, size)) {
    size.timer = setTimeout(() => sendAndWait(paneId, size), RESIZE_GAP_MS)
  }
}

export function sendPtySize(paneId: string, columns: number, rows: number): void {
  const size = sizesByPane.get(paneId) ?? { columns, rows, sentColumns: 0, sentRows: 0, timer: null }
  sizesByPane.set(paneId, size)
  size.columns = columns
  size.rows = rows
  if (size.timer === null) {
    sendAndWait(paneId, size)
  }
}

export function forgetPtySize(paneId: string): void {
  const size = sizesByPane.get(paneId)
  if (size !== undefined && size.timer !== null) {
    clearTimeout(size.timer)
  }
  sizesByPane.delete(paneId)
}
