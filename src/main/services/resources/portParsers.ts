export interface ListeningSocket {
  port: number
  pid: number
}

const WINDOWS_COLUMN_COUNT = 5
const LISTENING_STATE = 'LISTENING'

function portOfAddress(address: string): number {
  return Number(address.slice(address.lastIndexOf(':') + 1))
}

export function parseWindowsNetstat(output: string): ListeningSocket[] {
  const sockets: ListeningSocket[] = []

  for (const line of output.split('\n')) {
    const columns = line.trim().split(' ').filter((column) => column !== '')
    const isListeningRow = columns.length >= WINDOWS_COLUMN_COUNT && columns[0] === 'TCP' && columns[3] === LISTENING_STATE
    if (!isListeningRow) {
      continue
    }
    const port = portOfAddress(columns[1])
    const pid = Number(columns[4])
    if (Number.isInteger(port) && Number.isInteger(pid) && port > 0) {
      sockets.push({ port, pid })
    }
  }
  return sockets
}

export function parseLsofFields(output: string): ListeningSocket[] {
  const sockets: ListeningSocket[] = []
  let currentPid: number | null = null

  for (const line of output.split('\n')) {
    const field = line.slice(0, 1)
    const value = line.slice(1)
    if (field === 'p') {
      currentPid = Number(value)
    } else if (field === 'n' && currentPid !== null) {
      const port = portOfAddress(value)
      if (Number.isInteger(port) && port > 0) {
        sockets.push({ port, pid: currentPid })
      }
    }
  }
  return sockets
}

export function removeDuplicateSockets(sockets: ListeningSocket[]): ListeningSocket[] {
  const seen = new Set<string>()
  return sockets.filter((socket) => {
    const key = `${socket.pid}:${socket.port}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
