import { access, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import {
  choiceFor,
  parseLanguageServers,
  splitCommandLine,
  type LanguageServerChoices,
  type LanguageServerDefinition,
  type LanguageServerStatus
} from '../../../shared/languageServers'
import { isPathInside } from '../../../shared/paths'
import { pathFolders } from '../agents/agentDetector'

const SERVERS_PATH = join(__dirname, '../../resources/agents/language-servers.json')
const ROOT_MARKERS = [
  'package.json',
  'tsconfig.json',
  'jsconfig.json',
  'pyproject.toml',
  'setup.py',
  'requirements.txt',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'composer.json',
  '.git'
]
const WINDOWS_EXTENSIONS = ['.cmd', '.exe', '.bat']

let definitions: LanguageServerDefinition[] | null = null

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function loadDefinitions(): Promise<LanguageServerDefinition[]> {
  definitions ??= parseLanguageServers(JSON.parse(await readFile(SERVERS_PATH, 'utf8')))
  return definitions
}

function candidateNames(command: string): string[] {
  return process.platform === 'win32' ? WINDOWS_EXTENSIONS.map((extension) => command + extension) : [command]
}

async function firstExisting(folders: string[], command: string): Promise<string | null> {
  for (const folder of folders) {
    for (const name of candidateNames(command)) {
      const candidate = join(folder, name)
      if (await exists(candidate)) {
        return candidate
      }
    }
  }
  return null
}

export async function findWorkspaceRoot(filePath: string, projectRoot: string): Promise<string> {
  const boundary = resolve(projectRoot)
  let folder = dirname(resolve(filePath))
  while (isPathInside(folder, boundary)) {
    for (const marker of ROOT_MARKERS) {
      if (await exists(join(folder, marker))) {
        return folder
      }
    }
    if (folder === boundary) {
      break
    }
    folder = dirname(folder)
  }
  return boundary
}

async function statusOf(
  definition: LanguageServerDefinition,
  workspaceRoot: string | null,
  choices: LanguageServerChoices
): Promise<LanguageServerStatus> {
  const customCommand = choiceFor(choices, definition.id).customCommand
  if (customCommand !== null && splitCommandLine(customCommand).length > 0) {
    return { ...definition, source: 'custom', resolvedPath: customCommand }
  }
  if (definition.projectLocal && workspaceRoot !== null) {
    const local = await firstExisting([join(workspaceRoot, 'node_modules', '.bin')], definition.command)
    if (local !== null) {
      return { ...definition, source: 'project', resolvedPath: local }
    }
  }
  const onPath = await firstExisting(pathFolders(process.env.PATH), definition.command)
  return { ...definition, source: onPath === null ? null : 'path', resolvedPath: onPath }
}

export async function listServerStatuses(
  workspaceRoot: string | null,
  choices: LanguageServerChoices
): Promise<LanguageServerStatus[]> {
  const all = await loadDefinitions()
  return Promise.all(all.map((definition) => statusOf(definition, workspaceRoot, choices)))
}
