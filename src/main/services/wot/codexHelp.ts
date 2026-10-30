import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'

const HELP_TIMEOUT_MS = 3000

const helpByCommand = new Map<string, Promise<string>>()

function runHelp(command: string): Promise<string> {
  return new Promise((resolve) => {
    let output = ''
    const child = spawn(`${command} --help`, { cwd: tmpdir(), shell: true, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] })
    const timer = setTimeout(() => {
      child.kill()
      resolve(output)
    }, HELP_TIMEOUT_MS)
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    child.on('error', () => resolve(output))
    child.on('close', () => {
      clearTimeout(timer)
      resolve(output)
    })
  })
}

export function readAgentHelp(command: string): Promise<string> {
  const known = helpByCommand.get(command)
  if (known !== undefined) {
    return known
  }
  const reading = runHelp(command)
  helpByCommand.set(command, reading)
  return reading
}
