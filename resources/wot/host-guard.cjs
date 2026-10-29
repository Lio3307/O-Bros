'use strict'

const { spawnSync } = require('node:child_process')
const { existsSync } = require('node:fs')
const { delimiter, join, resolve } = require('node:path')

const [tool, ...toolArguments] = process.argv.slice(2)
const isWindows = process.platform === 'win32'
const ownFolder = join(__dirname, 'host-guard')

function stop(text) {
  process.stderr.write(text + '\n')
  process.exit(1)
}

function sameFolder(first, second) {
  const normalize = (folder) => {
    const full = resolve(folder)
    return isWindows ? full.toLowerCase() : full
  }
  return normalize(first) === normalize(second)
}

function findRealTool() {
  const fileName = isWindows ? `${tool}.exe` : tool
  for (const folder of (process.env.PATH || '').split(delimiter)) {
    if (folder === '' || sameFolder(folder, ownFolder)) {
      continue
    }
    const candidate = join(folder, fileName)
    if (existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

function childEnvironment() {
  const environment = { ...process.env }
  delete environment.ELECTRON_RUN_AS_NODE
  delete environment.O_BROS_CMD_LINE
  return environment
}

function runRealTool(realTool, finalArguments) {
  const result = spawnSync(realTool, finalArguments, { stdio: 'inherit', env: childEnvironment(), windowsHide: !process.stdout.isTTY })
  if (result.error) {
    stop(`ERROR: Could not run ${tool}: ${result.error.message}`)
  }
  return result.status === null ? 1 : result.status
}

function blockedMessage(action, reason) {
  return [
    `${tool.toUpperCase()}_BLOCKED: O-BROS did not let this agent run ${action}. ${reason}`,
    `Do not try again in another way (no full path to ${tool}, no API call, script or alias).`,
    'Tell the user what you wanted to do and ask them. Only run it again after the user says yes.'
  ].join('\n')
}

function wasCutByWindows() {
  const commandLine = process.env.O_BROS_CMD_LINE || ''
  return commandLine.includes('\n') || commandLine.includes('\r')
}

async function post(route, body) {
  const response = await fetch(process.env.O_BROS_WOT_URL + route, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-wot-token': process.env.O_BROS_WOT_TOKEN },
    body: JSON.stringify({ ...body, pane: process.env.O_BROS_WOT_PANE, args: toolArguments, cwd: process.cwd(), pid: process.pid })
  })
  return response.json()
}

async function main() {
  if (wasCutByWindows()) {
    stop(
      `ERROR: Windows cut this ${tool} command at its first line break, so O-BROS did not run it. ` +
        'Put the text in a file and pass the file (for example --body-file), or run the command from Git Bash.'
    )
  }
  const realTool = findRealTool()
  if (realTool === null) {
    stop(`${tool} is not installed on this computer. Install it from O-BROS: Settings → Integrations.`)
  }
  if (!process.env.O_BROS_WOT_URL || !process.env.O_BROS_WOT_TOKEN || !process.env.O_BROS_WOT_PANE) {
    process.exit(runRealTool(realTool, toolArguments))
  }
  let payload
  try {
    payload = await post('/host-check', { tool })
  } catch {
    stop(blockedMessage(tool, 'O-BROS could not be reached to ask the user.'))
  }
  if (!payload.ok) {
    stop(`ERROR: ${payload.message}`)
  }
  const decision = payload.result
  if (!decision.allowed) {
    stop(blockedMessage(decision.action, decision.reason))
  }
  process.exit(runRealTool(realTool, decision.arguments))
}

main().catch((error) => stop(`ERROR: ${error && error.message ? error.message : String(error)}`))
