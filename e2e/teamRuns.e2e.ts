import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

const isWindows = process.platform === 'win32'

const FAKE_CODEX = `
const fs = require('fs')
const args = process.argv.slice(2)
const say = (event) => process.stdout.write(JSON.stringify(event) + '\\n')
let task = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => { task += chunk })
process.stdin.on('end', () => {
  fs.appendFileSync('fake-calls.jsonl', JSON.stringify({ args, task }) + '\\n')
  say({ type: 'thread.started', thread_id: 'thread-42' })
  say({ type: 'item.completed', item: { type: 'error', message: 'Ignoring a setting' } })
  if (task.includes('not signed in')) {
    process.stderr.write('Please sign in first.\\n')
    process.exit(3)
  }
  if (task.includes('long answer')) {
    say({ type: 'item.completed', item: { type: 'agent_message', text: 'x'.repeat(300000) + ' END-OF-LONG-ANSWER' } })
    process.exit(0)
  }
  if (task.includes('take your time')) {
    setTimeout(() => process.exit(0), 60000)
    return
  }
  say({ type: 'item.completed', item: { type: 'agent_message', text: 'Looking at it.' } })
  say({ type: 'item.completed', item: { type: 'command_execution', command: 'git status' } })
  setTimeout(() => {
    say({ type: 'item.completed', item: { type: 'agent_message', text: 'DONE: answer to ' + task.trim() } })
    say({ type: 'turn.completed' })
    process.exit(0)
  }, 6000)
})
`

const WRAPPERS: Record<string, string> = isWindows
  ? { 'codex.cmd': '@node "%~dp0fake-codex.cjs" %*\r\n' }
  : { codex: '#!/bin/sh\nexec node "$(dirname "$0")/fake-codex.cjs" "$@"\n' }

function savedOutput(command: string, fileName: string): string {
  return isWindows ? `${command} 2>&1 | Out-File -Encoding utf8 ${fileName}` : `${command} > ${fileName} 2>&1`
}

async function readProof(fileName: string): Promise<string> {
  return readFile(join(app.projectFolder, fileName), 'utf8').catch(() => '')
}

let commandNumber = 0

async function run(command: string): Promise<string> {
  commandNumber += 1
  const fileName = `proof-${commandNumber}.txt`
  const finishedMark = isWindows ? `; Add-Content ${fileName} WOT_COMMAND_ENDED` : `; echo WOT_COMMAND_ENDED >> ${fileName}`
  const terminalInput = app.window.locator('.workspace .xterm-helper-textarea').first()
  await terminalInput.focus()
  await app.window.keyboard.type(savedOutput(command, fileName) + finishedMark)
  await app.window.keyboard.press('Enter')
  await expect.poll(() => readProof(fileName), { timeout: 60_000 }).toContain('WOT_COMMAND_ENDED')
  return readProof(fileName)
}

async function calls(): Promise<{ args: string[]; task: string }[]> {
  const text = await readProof('fake-calls.jsonl')
  return text
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => JSON.parse(line) as { args: string[]; task: string })
}

test.beforeEach(async () => {
  app = await launchApp({ separateHome: true, binFiles: { 'fake-codex.cjs': FAKE_CODEX, ...WRAPPERS } })
  await app.window.getByTitle('Settings').click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Team (wot)' }).click()
  const sharedRow = app.window.locator('.table-row', { hasText: 'Shared skills folder' })
  await sharedRow.getByRole('button', { name: 'Install' }).click()
  await expect(sharedRow.getByRole('button', { name: 'Remove' })).toBeVisible({ timeout: 15_000 })
  await app.window.getByTitle('Projects').click()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.workspace .xterm-helper-textarea').first().waitFor({ state: 'attached' })
})

test.afterEach(async () => {
  await app.close()
})

test('a member runs a task, stays working through a long quiet spell, and gives only its final answer', async () => {
  test.setTimeout(180_000)
  const spawned = await run('wot spawn codex --name helper')
  expect(spawned).toContain('Mode: task runs')
  expect(spawned).toContain('It can only read files')

  expect(await run('wot wait helper')).toContain('has no task yet')

  await run('wot send helper "héllo first job"')
  const whileQuiet = await run('wot wait helper --timeout 3')
  expect(whileQuiet).toContain('STILL_WORKING')
  expect(await run('wot send helper "too soon"')).toContain('still working')

  const finished = await run('wot wait helper')
  expect(finished).toContain('FINISHED')
  expect(finished).toContain('DONE: answer to h')
  expect(finished).toContain('first job')
  expect(finished).not.toContain('Looking at it.')
  expect(finished).not.toContain('Ignoring a setting')

  const [first] = await calls()
  expect(first.task).toBe('héllo first job')
  expect(first.args).toEqual(expect.arrayContaining(['exec', '--json', 'sandbox_mode=read-only']))

  await run('wot send helper "second job"')
  expect(await run('wot wait helper')).toContain('DONE: answer to second job')
  const [, second] = await calls()
  expect(second.args.slice(0, 4)).toEqual(['exec', 'resume', 'thread-42', '-'])

  await app.window.locator('.session-member-row').click()
  await expect(app.window.locator('.team-frame:not(.tab-content-hidden) .member-bar-member')).toContainText('helper')
  await expect(app.window.locator('.team-frame:not(.tab-content-hidden)')).toContainText('Finished')
  await app.window.getByRole('button', { name: 'Back' }).click()

  expect(await run('wot stop helper')).toContain('Stopped "helper"')
  expect(await run('wot list')).toContain('no team members')
})

test('edit access reaches the agent, and a failed run says why and keeps the member', async () => {
  test.setTimeout(120_000)
  expect(await run('wot spawn codex --name broken --access edit')).toContain('It can edit files')
  await run('wot send broken "you are not signed in"')
  const failed = await run('wot wait broken')
  expect(failed).toContain('FAILED')
  expect(failed).toContain('Please sign in first.')
  expect((await calls())[0].args).toContain('sandbox_mode=workspace-write')

  await run('wot send broken "try again"')
  expect(await run('wot wait broken')).toContain('DONE: answer to try again')
})

test('a very long answer reaches the lead whole, and the monitor shows the member as working', async () => {
  test.setTimeout(120_000)
  await run('wot spawn codex --name writer')
  await run('wot send writer "take your time"')
  await app.window.getByTitle('Activity', { exact: true }).click()
  const card = app.window.locator('.live-card', { hasText: 'writer' })
  await expect(card).toContainText('Working', { timeout: 15_000 })
  await app.window.getByTitle('Projects').click()
  await run('wot stop writer')

  await run('wot spawn codex --name long')
  await run('wot send long "give a long answer"')
  const answer = await run('wot wait long')
  expect(answer).toContain('END-OF-LONG-ANSWER')
  expect(answer.length).toBeGreaterThan(300000)
})

test('Ctrl+C in the member stops the task but keeps the conversation, and the lead hears about it', async () => {
  test.setTimeout(120_000)
  await run('wot spawn codex --name slow')
  await run('wot send slow "take your time"')
  await expect.poll(calls, { timeout: 30_000 }).toHaveLength(1)

  await app.window.locator('.session-member-row').click()
  await app.window.locator('.team-frame:not(.tab-content-hidden) .xterm-helper-textarea').first().focus()
  await app.window.keyboard.press('Control+c')
  await app.window.getByRole('button', { name: 'Back' }).click()

  const stopped = await run('wot wait slow')
  expect(stopped).toContain('FAILED')
  expect(stopped).toContain('The user stopped this task')
  await run('wot send slow "go on"')
  expect(await run('wot wait slow')).toContain('DONE: answer to go on')
})
