import { expect, test, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { mkdir, utimes, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const OUT = process.env.README_SHOTS
const isWindows = process.platform === 'win32'
const DAY_MS = 24 * 60 * 60 * 1000
const AGENTS_FOLDER = join(__dirname, 'readmeShots')
const AGENT_SCRIPTS = ['demoTerminal.cjs', 'claude.cjs', 'codex.cjs', 'gemini.cjs']

const TODOS = `export interface Todo {
  id: number
  title: string
  done: boolean
}

export function createTodo(id: number, title: string): Todo {
  return { id, title, done: false }
}

export function completeTodo(todo: Todo): Todo {
  return { ...todo, done: true }
}
`

const TODOS_CHANGED = `export interface Todo {
  id: number
  title: string
  done: boolean
  dueDate?: string
}

export function createTodo(id: number, title: string, dueDate?: string): Todo {
  return { id, title: title.trim(), done: false, dueDate }
}

export function completeTodo(todo: Todo): Todo {
  return { ...todo, done: true }
}
`

const SERVER = `import { createTodo, type Todo } from './todos'

const todos: Todo[] = [createTodo(1, 'Write the README')]

export function listTodos(): Todo[] {
  return todos
}
`

const MAIN = `import { listTodos } from './server'
import type { Todo } from './todos'

const count: number = 'two'

function summarize(todos: Todo[]): string {
  const lines: string[] = []
  for (const todo of todos) {
    if (todo.done) {
      lines.push(\`done  \${todo.title}\`)
    } else {
      for (const word of todo.title.split(' ')) {
        if (word.length > 4) {
          lines.push(\`todo  \${word}\`)
        }
      }
    }
  }
  return lines.join(', ')
}

export function report(): void {
  const todos = listTodos()
  if (todos.length > 0) {
    console.log(summarize(todos), count)
  }
}
`

const WALLPAPER = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1d3a"/><stop offset="0.55" stop-color="#3b1d5e"/><stop offset="1" stop-color="#c2410c"/></linearGradient></defs><rect width="1600" height="900" fill="url(#s)"/><circle cx="1180" cy="250" r="170" fill="#fcd34d" opacity="0.7"/><path d="M0 700 L380 430 L700 680 L1050 390 L1600 720 L1600 900 L0 900 Z" fill="#020617" opacity="0.9"/></svg>`

let app: RunningApp

test.skip(OUT === undefined, 'Set README_SHOTS to the folder for the README screenshots, for example docs/images.')

function binFiles(): Record<string, string> {
  const scripts = Object.fromEntries(AGENT_SCRIPTS.map((name) => [name, readFileSync(join(AGENTS_FOLDER, name), 'utf8')]))
  const wrapper = (command: string, script: string): Record<string, string> =>
    isWindows ? { [`${command}.cmd`]: `@node "%~dp0${script}" %*\r\n` } : { [command]: `#!/bin/sh\nexec node "$(dirname "$0")/${script}" "$@"\n` }
  return { ...scripts, ...wrapper('claude', 'claude.cjs'), ...wrapper('codex', 'codex.cjs'), ...wrapper('gemini', 'gemini.cjs') }
}

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', ['-c', 'user.name=Demo', '-c', 'user.email=demo@example.com', '-c', 'init.defaultBranch=main', ...args], { cwd })
}

async function writeFiles(folder: string, files: Record<string, string>): Promise<void> {
  for (const [name, text] of Object.entries(files)) {
    await mkdir(dirname(join(folder, name)), { recursive: true })
    await writeFile(join(folder, name), text, 'utf8')
  }
}

async function createProjects(root: string): Promise<string> {
  const todoApi = join(root, 'todo-api')
  await writeFiles(todoApi, {
    'package.json': JSON.stringify({ name: 'todo-api', type: 'module' }, null, 2),
    'tsconfig.json': JSON.stringify({ compilerOptions: { strict: true, target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler' } }, null, 2),
    'src/todos.ts': TODOS,
    'src/server.ts': SERVER,
    'src/main.ts': MAIN,
    '.gitignore': 'ModuleAnalysisCache\n'
  })
  git(todoApi, 'init')
  git(todoApi, 'add', '.')
  git(todoApi, 'commit', '-m', 'Set up the todo API')
  await writeFile(join(todoApi, 'src/server.ts'), SERVER.split('Write the README').join('Write the README and the changelog'), 'utf8')
  git(todoApi, 'commit', '-am', 'Cap titles at 80 characters')
  await writeFile(join(todoApi, 'src/server.ts'), SERVER.split('return todos').join('return todos.filter((todo) => !todo.done)'), 'utf8')
  git(todoApi, 'add', 'src/server.ts')
  await writeFile(join(todoApi, 'src/todos.ts'), TODOS_CHANGED, 'utf8')

  const webApp = join(root, 'web-app')
  await writeFiles(webApp, { 'index.html': '<!doctype html>\n<title>Todos</title>\n' })
  git(webApp, 'init')
  git(webApp, 'add', '.')
  git(webApp, 'commit', '-m', 'Start the web app')
  return todoApi
}

async function writeConversation(file: string, lines: unknown[], daysAgo: number): Promise<void> {
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, lines.map((line) => JSON.stringify(line)).join('\n') + '\n', 'utf8')
  const when = new Date(Date.now() - daysAgo * DAY_MS)
  await utimes(file, when, when)
}

function codexLines(id: string, cwd: string, ask: string, answer: string): unknown[] {
  return [
    { type: 'session_meta', payload: { id, cwd } },
    { type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text: ask }] } },
    { type: 'response_item', payload: { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: answer }] } }
  ]
}

async function createConversations(home: string, todoApi: string): Promise<void> {
  const sessions = join(home, '.codex', 'sessions', '2026', '10')
  await writeConversation(
    join(sessions, '29', 'rollout-demo-due-dates.jsonl'),
    codexLines('demo-due-dates', todoApi, 'Add due dates to todos and show only open ones', 'Added dueDate to Todo and filtered done todos in listTodos.'),
    1
  )
  await writeConversation(
    join(sessions, '24', 'rollout-demo-server.jsonl'),
    codexLines('demo-server', todoApi, 'Explain how the server folder is organized', 'server.ts keeps the todos in memory and exports listTodos.'),
    6
  )
  await writeConversation(
    join(home, '.claude', 'projects', 'demo-todo-api', 'demo-setup.jsonl'),
    [
      { type: 'user', cwd: todoApi, message: { content: 'Set up the todo API project with strict TypeScript' } },
      { type: 'assistant', cwd: todoApi, message: { content: [{ type: 'text', text: 'Created package.json, tsconfig.json and src/todos.ts.' }] } }
    ],
    8
  )
}

async function fakeAccounts(): Promise<void> {
  const home = app.homeFolder ?? ''
  await app.application.evaluate(({ ipcMain }, folders) => {
    const inHours = (hours: number) => Date.now() + hours * 60 * 60 * 1000
    const usageByFolder: Record<string, { five: number; week: number }> = {
      [folders.claude]: { five: 34, week: 61 },
      [folders.codex]: { five: 12, week: 43 },
      [folders.codexWork]: { five: 0, week: 8 }
    }
    ipcMain.removeHandler('accounts:scan')
    ipcMain.handle('accounts:scan', () => [
      { id: 'claude-default', provider: 'claude', configDir: folders.claude, label: 'System default', isSystemDefault: true },
      { id: 'codex-default', provider: 'codex', configDir: folders.codex, label: 'System default', isSystemDefault: true },
      { id: 'codex-work', provider: 'codex', configDir: folders.codexWork, label: 'work', isSystemDefault: false }
    ])
    ipcMain.removeHandler('usage:get')
    ipcMain.handle('usage:get', (_event, account: { configDir: string }) => {
      const usage = usageByFolder[account.configDir] ?? { five: 0, week: 0 }
      return {
        fiveHour: { percentUsed: usage.five, resetsAt: inHours(3) },
        weekly: { percentUsed: usage.week, resetsAt: inHours(90) },
        errorMessage: null
      }
    })
    ipcMain.removeHandler('usage:plans')
    ipcMain.handle('usage:plans', () => [])
    ipcMain.removeHandler('usage:facts')
    ipcMain.handle('usage:facts', () => ({
      claudeHasLoginFile: true,
      claudePlan: 'Max',
      codexLoginMode: 'chatgpt',
      codexPlan: 'Plus',
      geminiAuthType: null,
      grokHasLogin: false,
      clineHasLogin: false
    }))
  }, { claude: join(home, '.claude'), codex: join(home, '.codex'), codexWork: join(home, '.codex-work') })
}

async function shoot(page: Page, name: string): Promise<void> {
  for (const close of await page.locator('.toast-close').all()) {
    await close.click()
  }
  await page.mouse.move(5, 600)
  await page.waitForTimeout(900)
  await page.screenshot({ path: join(OUT ?? '', `${name}.png`) })
}

async function openSettingsPage(page: Page, name: string): Promise<void> {
  const pageButton = page.locator('.side-panel').getByRole('button', { name, exact: true })
  if (!(await pageButton.isVisible())) {
    await page.getByTitle('Settings', { exact: true }).click()
  }
  await pageButton.click()
}

async function installTeamSkill(page: Page): Promise<void> {
  await openSettingsPage(page, 'Team (wot)')
  const sharedRow = page.locator('.table-row', { hasText: 'Shared skills folder' })
  await sharedRow.getByRole('button', { name: 'Install' }).click()
  await expect(sharedRow.getByRole('button', { name: 'Remove' })).toBeVisible({ timeout: 15_000 })
}

async function openFile(page: Page, name: string): Promise<void> {
  await page.keyboard.press('ControlOrMeta+P')
  await page.getByPlaceholder('Go to file by name').fill(name)
  await page.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await page.keyboard.press('Enter')
}

test('README screenshots', async () => {
  test.setTimeout(10 * 60_000)
  app = await launchApp({ separateHome: true, binFiles: binFiles() })
  const page = app.window
  const todoApi = await createProjects(app.projectFolder)
  await createConversations(app.homeFolder ?? '', todoApi)
  const launchers = [
    { id: 'claude', name: 'Claude Code', command: 'claude' },
    { id: 'codex', name: 'Codex', command: 'codex' },
    { id: 'gemini', name: 'Gemini CLI', command: 'gemini' }
  ]
  await page.evaluate((saved) => {
    localStorage.setItem('o-bros.agentLaunchers', saved)
    localStorage.setItem('o-bros.shownAgents', JSON.stringify(['claude', 'codex']))
  }, JSON.stringify(launchers))
  await fakeAccounts()
  await page.reload()
  await page.waitForSelector('.rail')
  await installTeamSkill(page)

  await page.getByTitle('Projects', { exact: true }).click()
  await page.getByTitle(todoApi, { exact: true }).click()
  await page.getByTitle('Plain terminal in the selected folder').click()
  const terminal = page.locator('.workspace .xterm-helper-textarea').first()
  await terminal.waitFor({ state: 'attached' })
  await page.waitForTimeout(2500)
  await terminal.focus()
  await page.keyboard.type('claude')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(3000)
  await page.keyboard.type('Review the todo API with Codex and have Gemini write the missing tests')
  await page.keyboard.press('Enter')
  const members = page.locator('.row-session .session-member, .session-members .row')
  await expect(page.getByText('test-writer', { exact: true }).first()).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText('asking', { exact: true }).first()).toBeVisible({ timeout: 60_000 })
  await expect(members.first()).toBeVisible()
  await shoot(page, 'workspace')

  await page.getByText('test-writer', { exact: true }).first().click()
  await page.waitForTimeout(6000)
  await expect(page.getByText('Waiting for an answer').first()).toBeVisible({ timeout: 30_000 })
  await shoot(page, 'team')

  await page.getByTitle('Changes', { exact: true }).click()
  await page.locator('.row-change', { hasText: 'todos.ts' }).first().click()
  await page.getByRole('button', { name: 'Side by side' }).click()
  await expect(page.locator('.diff-split-column').first()).toBeVisible({ timeout: 15_000 })
  await shoot(page, 'changes')

  await page.getByTitle('History', { exact: true }).click()
  const dueDates = page.locator('.session-item', { hasText: 'Add due dates', hasNotText: 'Continued:' })
  await expect(dueDates).toBeVisible({ timeout: 30_000 })
  await dueDates.locator('.session-row').click()
  await page.locator('.replay-actions').getByRole('button', { name: 'Continue with…' }).click()
  await page.locator('.popup-menu-item', { hasText: 'Claude' }).click()
  const continued = page.locator('.session-item', { hasText: 'Continued: Add due dates' })
  await page.waitForTimeout(8000)
  await expect
    .poll(
      async () => {
        await openSettingsPage(page, 'Storage and memory')
        await page.getByRole('button', { name: 'Save now' }).click()
        await page.waitForTimeout(2000)
        await page.getByTitle('History', { exact: true }).click()
        return continued.count()
      },
      { timeout: 120_000, intervals: [3000] }
    )
    .toBe(1)
  await dueDates.locator('.session-row').click()
  await expect(dueDates.locator('.chip')).toBeVisible({ timeout: 30_000 })
  await shoot(page, 'history')

  await openSettingsPage(page, 'Storage and memory')
  const saveNow = page.getByRole('button', { name: 'Save now' })
  await saveNow.click()
  await page.getByText('Universal history', { exact: true }).first().evaluate((heading) => heading.scrollIntoView({ block: 'start' }))
  await shoot(page, 'storage')

  await openSettingsPage(page, 'Provider accounts')
  await page.getByRole('button', { name: 'Rescan' }).first().click()
  await expect(page.getByText('61%').first()).toBeVisible({ timeout: 15_000 })
  await shoot(page, 'settings')

  await page.getByTitle('Projects', { exact: true }).click()
  await openFile(page, 'main.ts')
  await page.locator('.cm-content').click({ position: { x: 300, y: 250 } })
  await page.locator('.cm-lint-marker-error').first().waitFor({ state: 'visible', timeout: 60_000 })
  await page.waitForTimeout(2000)
  await shoot(page, 'editor')

  const wallpaper = join(dirname(app.projectFolder), 'dusk.svg')
  await writeFile(wallpaper, WALLPAPER, 'utf8')
  await app.application.evaluate(({ dialog }, chosen) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [chosen] })
  }, wallpaper)
  await openSettingsPage(page, 'Appearance')
  await page.getByRole('button', { name: 'Your image', exact: true }).click()
  await page.getByRole('button', { name: 'Choose image…' }).click()
  await page.getByRole('button', { name: 'Midnight', exact: true }).click()
  await page.locator('.app-wallpaper-image').waitFor({ state: 'visible' })
  await page.getByTitle('Projects', { exact: true }).click()
  await shoot(page, 'appearance')
})

test.afterEach(async () => {
  await app?.close()
})
