import { app, dialog, shell } from 'electron'
import { readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { agentFolderName, HISTORY_FOLDER_NAME, historyKeepDaysOf } from '../../../shared/universalHistory'
import type { ConversationMoveResult, UniversalHistoryReport } from '../../../shared/types'
import { loadSettings, saveSettings } from '../../settings'
import { entryExists } from '../fileSystem'
import { writeLog } from '../logging/logFile'
import { listSourceFiles, readSessionSources } from '../sessions/sessionSources'
import { driveOf } from '../storage/driveSpace'
import { copyAndCheck, isSameOrInside } from '../storage/folderMove'
import { measureHistory, pruneHistory, syncHistory, type HistorySource } from './historySync'

const FIRST_SAVE_DELAY_MS = 15_000
const SAVE_EVERY_MS = 60_000
const BACKGROUND_QUIET_MS = 120_000

let queue: Promise<unknown> = Promise.resolve()
let isSaveQueued = false
let queuedQuietMs = 0
let isSaving = false
let lastSavedAt: number | null = null
let firstTimer: NodeJS.Timeout | null = null
let repeatTimer: NodeJS.Timeout | null = null

function exclusive<Result>(task: () => Promise<Result>): Promise<Result> {
  const run = queue.then(task)
  queue = run.catch(() => undefined)
  return run
}

function defaultHistoryFolder(): string {
  return join(app.getPath('userData'), HISTORY_FOLDER_NAME)
}

export async function currentHistoryFolder(): Promise<string> {
  return (await loadSettings()).historyFolder ?? defaultHistoryFolder()
}

async function historySources(): Promise<HistorySource[]> {
  const files = await listSourceFiles(await readSessionSources())
  return files.map((file) => ({
    agent: file.source.format.provider,
    filePath: file.filePath,
    modifiedAt: file.modifiedAt,
    readHeader: file.source.format.readHeader,
    readMessages: file.source.format.readMessages
  }))
}

function queueSave(waitForQuietMs: number): Promise<unknown> {
  queuedQuietMs = isSaveQueued ? Math.min(queuedQuietMs, waitForQuietMs) : waitForQuietMs
  if (isSaveQueued) {
    return queue
  }
  isSaveQueued = true
  return exclusive(async () => {
    isSaveQueued = false
    const quietMs = queuedQuietMs
    isSaving = true
    try {
      const settings = await loadSettings()
      await syncHistory(await currentHistoryFolder(), await historySources(), settings.historyKeepDays, Date.now(), quietMs)
      lastSavedAt = Date.now()
    } finally {
      isSaving = false
    }
  }).catch((error: unknown) => writeLog('error', `Universal history: ${error instanceof Error ? error.message : String(error)}`))
}

export function saveUniversalHistoryNow(): Promise<unknown> {
  return queueSave(0)
}

export function startUniversalHistory(): void {
  firstTimer = setTimeout(() => {
    void queueSave(BACKGROUND_QUIET_MS)
    repeatTimer = setInterval(() => void queueSave(BACKGROUND_QUIET_MS), SAVE_EVERY_MS)
  }, FIRST_SAVE_DELAY_MS)
}

export function stopUniversalHistory(): void {
  if (firstTimer !== null) {
    clearTimeout(firstTimer)
  }
  if (repeatTimer !== null) {
    clearInterval(repeatTimer)
  }
}

export async function universalHistoryReport(): Promise<UniversalHistoryReport> {
  const settings = await loadSettings()
  const folder = await currentHistoryFolder()
  const [agents, drive] = await Promise.all([measureHistory(folder), driveOf(folder)])
  return {
    folder,
    isDefaultFolder: settings.historyFolder === null,
    agents,
    conversationCount: agents.reduce((total, agent) => total + agent.conversationCount, 0),
    totalBytes: agents.reduce((total, agent) => total + agent.totalBytes, 0),
    keepDays: settings.historyKeepDays,
    lastSavedAt,
    isSaving,
    drive
  }
}

export async function setUniversalHistoryKeepDays(value: unknown): Promise<void> {
  const keepDays = historyKeepDaysOf(value)
  await saveSettings({ ...(await loadSettings()), historyKeepDays: keepDays })
  await exclusive(async () => pruneHistory(await currentHistoryFolder(), keepDays, Date.now()))
}

export async function openUniversalHistoryFolder(agent: unknown): Promise<void> {
  const folder = await currentHistoryFolder()
  const target = typeof agent === 'string' && agent !== '' ? join(folder, agentFolderName(agent)) : folder
  const failure = await shell.openPath((await entryExists(target)) ? target : folder)
  if (failure !== '') {
    throw new Error(`ENOENT: ${failure}`)
  }
}

function refused(message: string): ConversationMoveResult {
  return { isDone: false, message }
}

async function isEmptyOrMissing(folder: string): Promise<boolean> {
  return !(await entryExists(folder)) || (await readdir(folder)).length === 0
}

export async function moveUniversalHistory(): Promise<ConversationMoveResult> {
  const choice = await dialog.showOpenDialog({ title: 'Folder for the universal history', properties: ['openDirectory', 'createDirectory'] })
  const [chosenFolder] = choice.filePaths
  if (choice.canceled || chosenFolder === undefined) {
    return refused('')
  }
  const current = await currentHistoryFolder()
  const target = join(chosenFolder, HISTORY_FOLDER_NAME)
  if (isSameOrInside(target, current) || isSameOrInside(current, target)) {
    return refused('Pick a folder outside the current universal history folder.')
  }
  if (!(await isEmptyOrMissing(target))) {
    return refused(`${target} already has files in it. Pick another folder.`)
  }
  return exclusive(async () => {
    try {
      if (await entryExists(current)) {
        await copyAndCheck(current, target)
      }
      await saveSettings({ ...(await loadSettings()), historyFolder: target })
    } catch (error) {
      await rm(target, { recursive: true, force: true })
      const detail = error instanceof Error ? error.message : String(error)
      return refused(`Moving stopped; your history stays in ${current}. ${detail}`)
    }
    await rm(current, { recursive: true, force: true }).catch(() => undefined)
    return { isDone: true, message: `The universal history now lives in ${target}.` }
  })
}
