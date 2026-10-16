'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const EXIT_CODES = {
  ok: 0,
  failed: 1,
  unavailable: 2,
  agentMissing: 3,
  blocked: 4,
  notFound: 5,
  notInstalled: 6
}

const EXIT_CODE_BY_ERROR = {
  'bad-request': EXIT_CODES.failed,
  'not-allowed': EXIT_CODES.failed,
  'unknown-agent': EXIT_CODES.agentMissing,
  'not-installed': EXIT_CODES.agentMissing,
  'not-found': EXIT_CODES.notFound,
  limit: EXIT_CODES.failed,
  disabled: EXIT_CODES.notInstalled,
  failed: EXIT_CODES.failed
}

const UNREACHABLE_CODES = ['ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENOTFOUND']
const BLOCKED_CODES = ['EPERM', 'EACCES', 'ENETUNREACH']
const TASK_FOLDER = path.join(os.tmpdir(), 'o-bros-wot')
const MAX_FILE_BYTES = 200 * 1024

const NOT_IN_O_BROS_MESSAGE = [
  'WOT_UNAVAILABLE: wot only works inside a terminal that O-BROS opened, and O-BROS must be running.',
  'This terminal was not opened by O-BROS (or O-BROS is not installed).',
  'Tell the user: "The wot team feature needs the O-BROS app. Open O-BROS and start me from one of its terminals."',
  'Do NOT start other agents yourself in any other way.'
].join('\n')

const NOT_RUNNING_MESSAGE = [
  'WOT_UNAVAILABLE: O-BROS is not running anymore (or it was closed or uninstalled).',
  'Tell the user: "O-BROS was closed, so I cannot use the wot team feature. Open O-BROS and start me from one of its terminals."',
  'Do NOT start other agents yourself in any other way.'
].join('\n')

const BLOCKED_MESSAGE = [
  'WOT_BLOCKED: your sandbox blocked the local connection to O-BROS (127.0.0.1).',
  'Run the same wot command again and ask for permission to run it outside the sandbox (with network access).',
  'If the user refuses, tell them that wot cannot work without that permission.'
].join('\n')

const HELP = `wot - work of teams (O-BROS)

Commands:
  wot status                                   Check that O-BROS is running and wot is ready.
  wot agents                                   List the agents you can summon and the ones that are not installed.
  wot new-file <name>                          Create an empty text file for a long task and print its path.
  wot spawn <agent> --name <name> --task-file <path>
  wot spawn <agent> --name <name> --task "<short one-line task>"
                                               Start a hidden team member and give it its task.
  wot list                                     List team members and what they are doing.
  wot wait <name> [--timeout <seconds>]        Wait until the member finishes its turn or asks a question.
  wot read <name> [--lines <number>]           Print what is on the member's screen.
  wot send <name> --file <path>
  wot send <name> "<short one-line message>"   Type a message into the member and press Enter.
  wot stop <name>                              Stop the member and close its terminal.
  wot help                                     Show this help.

Exit codes: 0 ok, 1 failed, 2 O-BROS not available, 3 agent not installed, 4 sandbox blocked, 5 no such member, 6 wot skill not installed.`

function finish(exitCode, text) {
  const stream = exitCode === EXIT_CODES.ok ? process.stdout : process.stderr
  stream.write(text.endsWith('\n') ? text : text + '\n')
  process.exit(exitCode)
}

function parseArguments(argv) {
  const positional = []
  const flags = {}
  let index = 0
  while (index < argv.length) {
    const argument = argv[index]
    if (argument.startsWith('--')) {
      const equalsIndex = argument.indexOf('=')
      if (equalsIndex !== -1) {
        flags[argument.slice(2, equalsIndex)] = argument.slice(equalsIndex + 1)
        index += 1
        continue
      }
      flags[argument.slice(2)] = argv[index + 1] === undefined ? '' : argv[index + 1]
      index += 2
      continue
    }
    positional.push(argument)
    index += 1
  }
  return { positional, flags }
}

function isInsideTaskFolder(filePath) {
  const relative = path.relative(TASK_FOLDER, path.resolve(filePath))
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}

function readTextFile(filePath) {
  let info
  try {
    info = fs.statSync(filePath)
  } catch {
    finish(EXIT_CODES.failed, `ERROR: The file "${filePath}" does not exist. Write the text into it first.`)
  }
  if (info.size > MAX_FILE_BYTES) {
    finish(EXIT_CODES.failed, `ERROR: The file "${filePath}" is too large. Keep the text under 200 KB.`)
  }
  const text = fs.readFileSync(filePath, 'utf8')
  if (isInsideTaskFolder(filePath)) {
    fs.rmSync(filePath, { force: true })
  }
  return text
}

function textFrom(flags, positional, fileFlag, textFlag) {
  if (flags[fileFlag] !== undefined && flags[fileFlag] !== '') {
    return readTextFile(flags[fileFlag])
  }
  if (flags[textFlag] !== undefined) {
    return flags[textFlag]
  }
  return positional.join(' ')
}

function connection() {
  const url = process.env.O_BROS_WOT_URL
  const token = process.env.O_BROS_WOT_TOKEN
  const pane = process.env.O_BROS_WOT_PANE
  if (!url || !token || !pane) {
    finish(EXIT_CODES.unavailable, NOT_IN_O_BROS_MESSAGE)
  }
  return { url, token, pane }
}

function errorCodeOf(error) {
  if (error && error.cause && typeof error.cause.code === 'string') {
    return error.cause.code
  }
  return error && typeof error.code === 'string' ? error.code : ''
}

async function call(route, body) {
  const { url, token, pane } = connection()
  let response
  try {
    response = await fetch(url + route, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-wot-token': token },
      body: JSON.stringify({ ...body, pane })
    })
  } catch (error) {
    const code = errorCodeOf(error)
    if (UNREACHABLE_CODES.includes(code)) {
      finish(EXIT_CODES.unavailable, NOT_RUNNING_MESSAGE)
    }
    if (BLOCKED_CODES.includes(code)) {
      finish(EXIT_CODES.blocked, BLOCKED_MESSAGE)
    }
    finish(EXIT_CODES.unavailable, NOT_RUNNING_MESSAGE + `\n(Details: ${error && error.message ? error.message : code})`)
  }
  let payload
  try {
    payload = await response.json()
  } catch {
    finish(EXIT_CODES.failed, 'ERROR: O-BROS sent an answer wot could not read. Try again.')
  }
  if (!payload.ok) {
    const prefix = payload.code === 'disabled' ? 'WOT_NOT_INSTALLED' : 'ERROR'
    finish(EXIT_CODE_BY_ERROR[payload.code] ?? EXIT_CODES.failed, `${prefix}: ${payload.message}`)
  }
  return payload.result
}

function describeState(state) {
  const descriptions = {
    starting: 'starting (the agent is still opening)',
    working: 'working (it is busy, wait for it)',
    idle: 'idle (it finished its turn, read its screen)',
    waiting: 'waiting (it is asking a question, read its screen)',
    exited: 'exited (the agent program stopped)'
  }
  return descriptions[state] ?? state
}

function oneLine(text, maximum) {
  const flat = text.split('\n').join(' ').trim()
  return flat.length > maximum ? flat.slice(0, maximum - 1) + '…' : flat
}

function requireName(positional, usage) {
  if (positional[0] === undefined || positional[0].trim() === '') {
    finish(EXIT_CODES.failed, `ERROR: The member name is missing. Usage: ${usage}`)
  }
  return positional[0]
}

async function showStatus() {
  const status = await call('/status', {})
  const role = status.isMember
    ? 'You are a TEAM MEMBER. You cannot summon agents. Just do the task you were given.'
    : 'You are the LEAD agent. You can summon team members.'
  finish(EXIT_CODES.ok, `OK: O-BROS is running and wot is ready.\n${role}\nTeam members right now: ${status.memberCount}`)
}

async function showAgents() {
  const agents = await call('/agents', {})
  const installed = agents.filter((agent) => agent.isInstalled)
  const missing = agents.filter((agent) => !agent.isInstalled)
  const lines = ['Agents you CAN summon (installed on this computer):']
  if (installed.length === 0) {
    lines.push('  (none)')
  }
  for (const agent of installed) {
    const program = agent.command.split(' ')[0]
    lines.push(`  - ${agent.name}   ->   wot spawn ${program} --name <name> --task-file <path>`)
  }
  lines.push('', 'Agents that are NOT installed (you CANNOT summon these):')
  lines.push(missing.length === 0 ? '  (none)' : '  ' + missing.map((agent) => agent.name).join(', '))
  finish(EXIT_CODES.ok, lines.join('\n'))
}

function createTaskFile(positional) {
  const cleanName = (positional[0] || 'task')
    .toLowerCase()
    .split('')
    .filter((character) => (character >= 'a' && character <= 'z') || (character >= '0' && character <= '9') || character === '-')
    .join('')
  fs.mkdirSync(TASK_FOLDER, { recursive: true })
  const filePath = path.join(TASK_FOLDER, `${cleanName || 'task'}-${Date.now()}.md`)
  fs.writeFileSync(filePath, '')
  finish(
    EXIT_CODES.ok,
    `OK: Created an empty file:\n${filePath}\nWrite the full text into this file with your file editing tool, then pass it with --task-file (or --file for wot send). wot deletes it after reading.`
  )
}

async function spawnMember(positional, flags) {
  const agent = positional[0]
  if (agent === undefined || agent.trim() === '') {
    finish(EXIT_CODES.failed, 'ERROR: The agent is missing. Usage: wot spawn <agent> --name <name> --task-file <path>\nRun "wot agents" to see which agents you can use.')
  }
  const task = textFrom(flags, positional.slice(1), 'task-file', 'task')
  const { member, taskSent } = await call('/spawn', { agent, name: flags.name ?? '', task })
  const lines = [
    `OK: Summoned team member "${member.name}" (${member.agentName}).`,
    `It works in: ${member.cwd ?? 'the home folder'}`,
    taskSent ? 'Its task was typed in and sent.' : 'No task was sent. Send one with: wot send ' + member.name + ' --file <path>',
    `Next: run  wot wait ${member.name}  and then  wot read ${member.name}`
  ]
  finish(EXIT_CODES.ok, lines.join('\n'))
}

async function listMembers() {
  const members = await call('/list', {})
  if (members.length === 0) {
    finish(EXIT_CODES.ok, 'There are no team members right now. Summon one with: wot spawn <agent> --name <name> --task-file <path>')
  }
  const lines = [`Team members (${members.length}):`]
  for (const member of members) {
    lines.push(`- ${member.name} (${member.agentName}): ${describeState(member.state)}`)
    lines.push(`    task: ${oneLine(member.task, 120) || '(none)'}`)
  }
  finish(EXIT_CODES.ok, lines.join('\n'))
}

async function waitForMember(positional, flags) {
  const name = requireName(positional, 'wot wait <name> [--timeout <seconds>]')
  const timeout = flags.timeout === undefined ? undefined : Number(flags.timeout)
  const { member, timedOut, waitedSeconds } = await call('/wait', { member: name, timeout })
  if (timedOut) {
    finish(
      EXIT_CODES.ok,
      `STILL_WORKING: "${member.name}" is still ${describeState(member.state)} after ${waitedSeconds} seconds.\nRun  wot wait ${member.name}  again (you can peek with  wot read ${member.name}).`
    )
  }
  const nextStep = {
    idle: `FINISHED: "${member.name}" finished its turn. Run  wot read ${member.name}  to see its answer.`,
    waiting: `QUESTION: "${member.name}" is asking a question or a permission. Run  wot read ${member.name}  to see it.`,
    exited: `EXITED: "${member.name}" stopped running. Run  wot read ${member.name}  to see its last screen, then  wot stop ${member.name}.`
  }
  finish(EXIT_CODES.ok, nextStep[member.state] ?? `"${member.name}" is ${describeState(member.state)}.`)
}

async function readMember(positional, flags) {
  const name = requireName(positional, 'wot read <name> [--lines <number>]')
  const lines = flags.lines === undefined ? undefined : Number(flags.lines)
  const { member, screen } = await call('/read', { member: name, lines })
  finish(
    EXIT_CODES.ok,
    `----- screen of "${member.name}" (${member.agentName}), state: ${member.state} -----\n${screen}\n----- end of screen -----`
  )
}

async function sendToMember(positional, flags) {
  const name = requireName(positional, 'wot send <name> --file <path>')
  const text = textFrom(flags, positional.slice(1), 'file', 'text')
  const { member } = await call('/send', { member: name, text })
  finish(EXIT_CODES.ok, `OK: Typed your message into "${member.name}" and pressed Enter.\nNext: run  wot wait ${member.name}`)
}

async function stopMember(positional) {
  const name = requireName(positional, 'wot stop <name>')
  const { member } = await call('/stop', { member: name })
  finish(EXIT_CODES.ok, `OK: Stopped "${member.name}" and closed its terminal.`)
}

async function main() {
  const { positional, flags } = parseArguments(process.argv.slice(2))
  const command = (positional.shift() || 'help').toLowerCase()
  const commands = {
    status: () => showStatus(),
    agents: () => showAgents(),
    'new-file': () => createTaskFile(positional),
    spawn: () => spawnMember(positional, flags),
    list: () => listMembers(),
    wait: () => waitForMember(positional, flags),
    read: () => readMember(positional, flags),
    send: () => sendToMember(positional, flags),
    stop: () => stopMember(positional),
    help: () => finish(EXIT_CODES.ok, HELP)
  }
  const run = commands[command]
  if (run === undefined) {
    finish(EXIT_CODES.failed, `ERROR: Unknown command "${command}".\n\n${HELP}`)
  }
  await run()
}

main().catch((error) => finish(EXIT_CODES.failed, `ERROR: ${error && error.message ? error.message : String(error)}`))
