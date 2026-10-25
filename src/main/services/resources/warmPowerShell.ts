import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'

const END_MARK = '__O_BROS_QUERY_END__'
const IDLE_CLOSE_MS = 15_000
const SETUP = "[Console]::OutputEncoding = [Text.Encoding]::UTF8; [System.Diagnostics.Process]::GetCurrentProcess().PriorityClass = 'BelowNormal'\n"

interface PendingQuery {
  resolve: (output: string) => void
  reject: (error: Error) => void
  timer: NodeJS.Timeout
}

let shell: ChildProcessWithoutNullStreams | null = null
let output = ''
let pending: PendingQuery | null = null
let queue: Promise<unknown> = Promise.resolve()
let idleTimer: NodeJS.Timeout | null = null

function failPending(error: Error): void {
  if (pending !== null) {
    clearTimeout(pending.timer)
    pending.reject(error)
    pending = null
  }
}

export function closeWarmPowerShell(): void {
  if (idleTimer !== null) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
  const closing = shell
  shell = null
  output = ''
  failPending(new Error('PowerShell was closed.'))
  closing?.kill()
}

function finishFromOutput(): void {
  const endAt = output.indexOf(END_MARK)
  if (endAt === -1 || pending === null) {
    return
  }
  const result = output.slice(0, endAt)
  output = output.slice(endAt + END_MARK.length)
  clearTimeout(pending.timer)
  pending.resolve(result)
  pending = null
}

function startShell(): ChildProcessWithoutNullStreams {
  const started = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-NoLogo', '-Command', '-'], { windowsHide: true })
  started.stdout.setEncoding('utf8')
  started.stdout.on('data', (chunk: string) => {
    output += chunk
    finishFromOutput()
  })
  started.stderr.resume()
  started.on('exit', () => {
    if (shell === started) {
      shell = null
      output = ''
      failPending(new Error('PowerShell stopped.'))
    }
  })
  started.stdin.on('error', () => undefined)
  started.stdin.write(SETUP)
  return started
}

function closeWhenIdle(): void {
  if (idleTimer !== null) {
    clearTimeout(idleTimer)
  }
  idleTimer = setTimeout(closeWarmPowerShell, IDLE_CLOSE_MS)
}

function runOne(script: string, timeoutMs: number): Promise<string> {
  shell ??= startShell()
  const target = shell
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      closeWarmPowerShell()
      reject(new Error(`PowerShell took longer than ${timeoutMs} ms.`))
    }, timeoutMs)
    pending = { resolve, reject, timer }
    target.stdin.write(`${script}; Write-Output '${END_MARK}'\n`)
  })
}

export function runInWarmPowerShell(script: string, timeoutMs: number): Promise<string> {
  const run = queue.then(() => runOne(script, timeoutMs)).finally(closeWhenIdle)
  queue = run.catch(() => undefined)
  return run
}
