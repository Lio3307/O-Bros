import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { riskyGitSettings } from '../../shared/gitConfigRisk'
import { isPathInside } from '../../shared/paths'
import { loadSettings, saveSettings } from '../settings'
import { isFolder, pathExists } from './fileSystem'

const GIT_LINK_PREFIX = 'gitdir:'
const COMMON_DIR_FILE = 'commondir'
const BARE_REPOSITORY_ENTRIES = ['HEAD', 'objects', 'refs']
const SAMPLE_HOOK_ENDING = '.sample'

export const NOT_TRUSTED_MESSAGE = 'This folder is not trusted, so O-BROS does not run git in it.'

let trustedFolders: string[] | null = null

async function readTextOrEmpty(path: string): Promise<string> {
  return readFile(path, 'utf8').catch(() => '')
}

async function gitFoldersOfLink(linkFile: string): Promise<string[]> {
  const text = (await readTextOrEmpty(linkFile)).trim()
  if (!text.startsWith(GIT_LINK_PREFIX)) {
    return []
  }
  const gitFolder = resolve(dirname(linkFile), text.slice(GIT_LINK_PREFIX.length).trim())
  const common = (await readTextOrEmpty(join(gitFolder, COMMON_DIR_FILE))).trim()
  return common === '' ? [gitFolder] : [gitFolder, resolve(gitFolder, common)]
}

async function looksLikeBareRepository(folder: string): Promise<boolean> {
  const found = await Promise.all(BARE_REPOSITORY_ENTRIES.map((entry) => pathExists(join(folder, entry))))
  return found.every((exists) => exists)
}

async function gitFoldersFor(startFolder: string): Promise<string[]> {
  let folder = resolve(startFolder)
  while (true) {
    const dotGit = join(folder, '.git')
    if (await isFolder(dotGit)) {
      return [dotGit]
    }
    if (await pathExists(dotGit)) {
      return gitFoldersOfLink(dotGit)
    }
    if (await looksLikeBareRepository(folder)) {
      return [folder]
    }
    const parent = dirname(folder)
    if (parent === folder) {
      return []
    }
    folder = parent
  }
}

async function activeHooksIn(gitFolder: string): Promise<string[]> {
  const entries = await readdir(join(gitFolder, 'hooks')).catch(() => [])
  return entries.filter((name) => !name.endsWith(SAMPLE_HOOK_ENDING))
}

export async function gitRisksOf(folder: string): Promise<string[]> {
  const gitFolders = await gitFoldersFor(folder)
  const perFolder = await Promise.all(
    gitFolders.map(async (gitFolder) => [
      ...riskyGitSettings(await readTextOrEmpty(join(gitFolder, 'config'))).map((setting) => `Git setting ${setting}`),
      ...(await activeHooksIn(gitFolder)).map((hook) => `Git hook ${hook}`)
    ])
  )
  return [...new Set(perFolder.flat())]
}

async function loadTrustedFolders(): Promise<string[]> {
  trustedFolders ??= (await loadSettings()).trustedFolders
  return trustedFolders
}

export async function isFolderTrusted(folder: string): Promise<boolean> {
  return (await loadTrustedFolders()).some((trusted) => isPathInside(folder, trusted))
}

export async function trustFolder(folder: string): Promise<void> {
  const settings = await loadSettings()
  trustedFolders = [...new Set([...settings.trustedFolders, resolve(folder)])]
  await saveSettings({ ...settings, trustedFolders })
}

export async function assertGitIsAllowed(folder: string): Promise<void> {
  if ((await gitRisksOf(folder)).length > 0 && !(await isFolderTrusted(folder))) {
    throw new Error(NOT_TRUSTED_MESSAGE)
  }
}
