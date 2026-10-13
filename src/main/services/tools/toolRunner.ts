import { app } from 'electron'
import { spawn } from 'node:child_process'
import { join } from 'node:path'

export type BundledTool = 'oxlint' | 'oxfmt'

export interface ToolRun {
  args: string[]
  workingDirectory: string
  stdin?: string
}

export interface ToolOutput {
  stdout: string
  stderr: string
  exitCode: number
}

const TOOL_TIMEOUT_MS = 15_000

function toolScriptPath(tool: BundledTool): string {
  return join(app.getAppPath(), 'node_modules', tool, 'bin', tool)
}

export function runBundledTool(tool: BundledTool, run: ToolRun): Promise<ToolOutput> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [toolScriptPath(tool), ...run.args], {
      cwd: run.workingDirectory,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      windowsHide: true
    })

    const outputChunks: Buffer[] = []
    const errorChunks: Buffer[] = []
    const timeout = setTimeout(() => {
      child.kill()
      reject(new Error(`${tool} took longer than ${TOOL_TIMEOUT_MS / 1000} seconds and was stopped.`))
    }, TOOL_TIMEOUT_MS)

    child.stdout.on('data', (chunk: Buffer) => outputChunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => errorChunks.push(chunk))
    child.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    child.on('close', (exitCode) => {
      clearTimeout(timeout)
      resolve({
        stdout: Buffer.concat(outputChunks).toString('utf8'),
        stderr: Buffer.concat(errorChunks).toString('utf8'),
        exitCode: exitCode ?? 1
      })
    })

    if (run.stdin !== undefined) {
      child.stdin.write(run.stdin)
    }
    child.stdin.end()
  })
}
