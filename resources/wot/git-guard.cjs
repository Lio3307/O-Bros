'use strict'

const { spawnSync } = require('node:child_process')

const CHECKED_WORDS = ['commit', 'commit-tree', 'update-ref', 'push', 'branch', 'checkout', 'switch', 'worktree', 'merge', 'cherry-pick', 'revert', 'rebase', 'am', 'pull']
const COMMON_READ_COMMANDS = ['status', 'diff', 'log', 'show', 'add', 'rev-parse', 'ls-files', 'config', 'blame', 'grep', 'remote', 'fetch']
const GLOBAL_OPTIONS_WITH_VALUE = ['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--config-env']
const ALIAS_SHELL_MARK = '!'

function subcommandIndexOf(args) {
  let index = 0
  while (index < args.length && args[index].startsWith('-')) {
    index += GLOBAL_OPTIONS_WITH_VALUE.includes(args[index]) ? 2 : 1
  }
  return index
}

function withAliasExpanded(args) {
  const realGit = process.env.O_BROS_REAL_GIT
  const index = subcommandIndexOf(args)
  const word = args[index]
  if (!realGit || word === undefined || CHECKED_WORDS.includes(word) || COMMON_READ_COMMANDS.includes(word)) {
    return args
  }
  const environment = { ...process.env }
  delete environment.ELECTRON_RUN_AS_NODE
  const result = spawnSync(realGit, [...args.slice(0, index), 'config', '--get', `alias.${word}`], { encoding: 'utf8', env: environment, windowsHide: true })
  const value = (result.stdout || '').trim()
  const isShellAlias = value.startsWith(ALIAS_SHELL_MARK)
  const words = (isShellAlias ? value.slice(ALIAS_SHELL_MARK.length) : value).split(' ').filter((part) => part !== '')
  const aliasedCommand = isShellAlias && words[0] === 'git' ? words.slice(1) : words
  if (!aliasedCommand.some((part) => CHECKED_WORDS.includes(part))) {
    return args
  }
  return [...args.slice(0, index), ...aliasedCommand, ...args.slice(index + 1)]
}

const gitArguments = withAliasExpanded(process.argv.slice(2))

function stop(text) {
  process.stderr.write(text + '\n')
  process.exit(1)
}

function runRealGit(finalArguments, extraEnvironment) {
  const realGit = process.env.O_BROS_REAL_GIT
  if (!realGit) {
    stop('ERROR: O-BROS could not find the real git program on this computer.')
  }
  const environment = { ...process.env, ...extraEnvironment }
  delete environment.ELECTRON_RUN_AS_NODE
  delete environment.O_BROS_CMD_LINE
  const result = spawnSync(realGit, finalArguments, { stdio: 'inherit', env: environment, windowsHide: !process.stdout.isTTY })
  if (result.error) {
    stop(`ERROR: Could not run git: ${result.error.message}`)
  }
  return result.status === null ? 1 : result.status
}

function blockedMessage(action, reason) {
  return [
    `GIT_BLOCKED: O-BROS did not let this agent ${action}. ${reason}`,
    'Do not try again in another way (no other git program, script or alias).',
    'Tell the user what you wanted to do and ask them. Only run it again after the user says yes.'
  ].join('\n')
}

async function post(route, body) {
  const response = await fetch(process.env.O_BROS_WOT_URL + route, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-wot-token': process.env.O_BROS_WOT_TOKEN },
    body: JSON.stringify({ ...body, pane: process.env.O_BROS_WOT_PANE, args: gitArguments, cwd: process.cwd(), pid: process.pid })
  })
  return response.json()
}

function wasCutByWindows() {
  const commandLine = process.env.O_BROS_CMD_LINE || ''
  return commandLine.includes('\n') || commandLine.includes('\r')
}

async function main() {
  if (wasCutByWindows()) {
    stop(
      'ERROR: Windows cut this git command at its first line break, so O-BROS did not run it. ' +
        'Put the message in a file and use git commit -F <file>, use one -m for each paragraph, or run it from Git Bash.'
    )
  }
  const needsCheck = gitArguments.some((argument) => CHECKED_WORDS.includes(argument))
  if (!needsCheck || !process.env.O_BROS_WOT_URL || !process.env.O_BROS_WOT_TOKEN || !process.env.O_BROS_WOT_PANE) {
    process.exit(runRealGit(gitArguments, {}))
  }
  let payload
  try {
    payload = await post('/git-check', {})
  } catch {
    stop(blockedMessage('run this git command', 'O-BROS could not be reached to ask the user.'))
  }
  if (!payload.ok) {
    stop(`ERROR: ${payload.message}`)
  }
  const decision = payload.result
  if (!decision.allowed) {
    stop(blockedMessage(decision.action, decision.reason))
  }
  const status = runRealGit(decision.arguments, decision.environment)
  if (status === 0 && decision.cleanAfterCommit) {
    await post('/after-commit', { identity: decision.identity }).catch(() => undefined)
  }
  process.exit(status)
}

main().catch((error) => stop(`ERROR: ${error && error.message ? error.message : String(error)}`))
