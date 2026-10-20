import { dialog } from 'electron'
import { lstat, mkdir, statfs } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { formatBytes } from '../../../shared/format'
import type { ConversationFolder, ConversationMoveResult, ConversationStorage } from '../../../shared/types'
import { loadSettings, saveSettings } from '../../settings'
import { readProcessTable } from '../resources/processTable'
import { readSessionSources } from '../sessions/sessionSources'
import { agentProgramOf } from '../wot/agentCaller'
import { directorySize } from './directorySize'
import { readAgentHistoryFolders } from './dataLocations'
import { FolderMoveRefusal, linkTarget, moveFolderAndLink, moveFolderBack } from './folderMove'

interface ConversationPlace {
  title: string
  program: string
  path: string
  folderName: string
  holdsLogin: boolean
}

const PROVIDER_TITLES: Record<string, string> = { claude: 'Claude conversations', codex: 'Codex conversations' }

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path)
    return true
  } catch {
    return false
  }
}

function accountFolderName(configDir: string): string {
  const name = basename(configDir)
  return name.startsWith('.') ? name.slice(1) : name
}

async function listPlaces(): Promise<ConversationPlace[]> {
  const [sources, historyFolders] = await Promise.all([readSessionSources(), readAgentHistoryFolders().catch(() => [])])
  const sessionPlaces = sources.map((source) => {
    const title = PROVIDER_TITLES[source.account.provider] ?? `${source.account.provider} conversations`
    return {
      title: source.account.isSystemDefault ? title : `${title} (${source.account.label})`,
      program: source.account.provider,
      path: source.directory,
      folderName: accountFolderName(source.account.configDir),
      holdsLogin: false
    }
  })
  const historyPlaces = historyFolders.map((folder) => ({
    title: folder.title,
    program: folder.command,
    path: folder.path,
    folderName: folder.command,
    holdsLogin: folder.holdsLogin
  }))
  const places = [...sessionPlaces, ...historyPlaces]
  const present = await Promise.all(places.map((place) => exists(place.path)))
  return places.filter((_place, index) => present[index])
}

function idOf(place: ConversationPlace): string {
  return `conversations:${place.path}`
}

async function describe(place: ConversationPlace): Promise<ConversationFolder> {
  const [movedTo, sizeBytes] = await Promise.all([linkTarget(place.path), directorySize(place.path)])
  return { id: idOf(place), title: place.title, program: place.program, path: place.path, movedTo, sizeBytes, holdsLogin: place.holdsLogin }
}

export async function listConversationFolders(): Promise<ConversationStorage> {
  const [settings, places] = await Promise.all([loadSettings(), listPlaces()])
  return { targetFolder: settings.conversationFolder, folders: await Promise.all(places.map(describe)) }
}

export async function chooseConversationFolder(): Promise<string | null> {
  const choice = await dialog.showOpenDialog({ title: 'Folder for your agent conversations', properties: ['openDirectory', 'createDirectory'] })
  const [chosenPath] = choice.filePaths
  if (choice.canceled || chosenPath === undefined) {
    return null
  }
  await saveSettings({ ...(await loadSettings()), conversationFolder: chosenPath })
  return chosenPath
}

async function isAgentRunning(program: string): Promise<boolean> {
  const table = await readProcessTable()
  return table.some((entry) => agentProgramOf(entry, [program.toLowerCase()]) !== null)
}

async function freeBytes(path: string): Promise<number> {
  const info = await statfs(path)
  return info.bavail * info.bsize
}

function refused(message: string): ConversationMoveResult {
  return { isDone: false, message }
}

async function findPlace(id: string): Promise<ConversationPlace | null> {
  return (await listPlaces()).find((place) => idOf(place) === id) ?? null
}

async function runMove(action: () => Promise<void>, doneMessage: string): Promise<ConversationMoveResult> {
  try {
    await action()
    return { isDone: true, message: doneMessage }
  } catch (error) {
    if (error instanceof FolderMoveRefusal) {
      return refused(error.message)
    }
    const detail = error instanceof Error ? error.message : String(error)
    return refused(`Moving stopped and your files were put back where they were. ${detail}`)
  }
}

export async function moveConversations(id: string): Promise<ConversationMoveResult> {
  const place = await findPlace(id)
  if (place === null) {
    return refused('That conversation folder is no longer there.')
  }
  if (place.holdsLogin) {
    return refused(`${place.title} share a folder with the agent's login, so O-BROS does not move them.`)
  }
  const { conversationFolder } = await loadSettings()
  if (conversationFolder === null) {
    return refused('Choose a folder for your conversations first.')
  }
  if (await isAgentRunning(place.program)) {
    return refused(`${place.program} is running. Close every ${place.program} window or terminal, then move again.`)
  }
  await mkdir(conversationFolder, { recursive: true })
  const sizeBytes = await directorySize(place.path)
  if ((await freeBytes(conversationFolder)) <= sizeBytes) {
    return refused(`There is not enough free space in ${conversationFolder} for ${formatBytes(sizeBytes)}.`)
  }
  const targetPath = join(conversationFolder, place.folderName)
  return runMove(
    () => moveFolderAndLink(place.path, targetPath),
    `${place.title} moved to ${targetPath}. ${formatBytes(sizeBytes)} freed where they were.`
  )
}

export async function moveConversationsBack(id: string): Promise<ConversationMoveResult> {
  const place = await findPlace(id)
  if (place === null) {
    return refused('That conversation folder is no longer there.')
  }
  if ((await linkTarget(place.path)) === null) {
    return refused(`${place.title} were not moved, so there is nothing to move back.`)
  }
  if (await isAgentRunning(place.program)) {
    return refused(`${place.program} is running. Close every ${place.program} window or terminal, then move back again.`)
  }
  const sizeBytes = await directorySize(place.path)
  if ((await freeBytes(dirname(place.path))) <= sizeBytes) {
    return refused(`There is not enough free space next to ${place.path} for ${formatBytes(sizeBytes)}.`)
  }
  return runMove(() => moveFolderBack(place.path), `${place.title} are back in ${place.path}.`)
}
