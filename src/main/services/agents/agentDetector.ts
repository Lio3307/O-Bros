import { access, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { delimiter, join } from 'node:path'

const WINDOWS_EXTENSIONS = ['.exe', '.cmd', '.bat', '.ps1']

export function pathFolders(pathVariable: string | undefined): string[] {
  return (pathVariable ?? '').split(delimiter).filter((folder) => folder !== '')
}

export function commandNameOf(fileName: string, platform: NodeJS.Platform): string | null {
  if (platform !== 'win32') {
    return fileName
  }
  const lowerName = fileName.toLowerCase()
  const extension = WINDOWS_EXTENSIONS.find((candidate) => lowerName.endsWith(candidate))
  return extension === undefined ? null : lowerName.slice(0, lowerName.length - extension.length)
}

async function isRunnable(path: string, platform: NodeJS.Platform): Promise<boolean> {
  if (platform === 'win32') {
    return true
  }
  try {
    await access(path, constants.X_OK)
    return true
  } catch {
    return false
  }
}

async function commandsInFolder(folder: string, platform: NodeJS.Platform): Promise<string[]> {
  let fileNames: string[]
  try {
    const entries = await readdir(folder, { withFileTypes: true })
    fileNames = entries.filter((entry) => !entry.isDirectory()).map((entry) => entry.name)
  } catch {
    return []
  }
  const found = await Promise.all(
    fileNames.map(async (fileName) => {
      const name = commandNameOf(fileName, platform)
      return name !== null && (await isRunnable(join(folder, fileName), platform)) ? name : null
    })
  )
  return found.filter((name): name is string => name !== null)
}

export async function listPathCommands(
  folders: string[] = pathFolders(process.env.PATH),
  platform: NodeJS.Platform = process.platform
): Promise<string[]> {
  const perFolder = await Promise.all(folders.map((folder) => commandsInFolder(folder, platform)))
  return Array.from(new Set(perFolder.flat())).sort()
}
