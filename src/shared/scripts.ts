import type { ScriptEntry } from './types'

export type PackageManager = 'bun' | 'pnpm' | 'yarn' | 'npm'

const LOCK_FILES: { fileName: string; manager: PackageManager }[] = [
  { fileName: 'bun.lock', manager: 'bun' },
  { fileName: 'bun.lockb', manager: 'bun' },
  { fileName: 'pnpm-lock.yaml', manager: 'pnpm' },
  { fileName: 'yarn.lock', manager: 'yarn' }
]

const EXTRA_SCRIPT_NAME_CHARACTERS = '-_:.'

export function detectPackageManager(fileNames: string[]): PackageManager {
  const found = LOCK_FILES.find((lockFile) => fileNames.includes(lockFile.fileName))
  return found === undefined ? 'npm' : found.manager
}

function isLetterOrDigit(character: string): boolean {
  const isLetter = (character >= 'a' && character <= 'z') || (character >= 'A' && character <= 'Z')
  return isLetter || (character >= '0' && character <= '9')
}

export function isSafeScriptName(name: string): boolean {
  return (
    name !== '' &&
    Array.from(name).every((character) => isLetterOrDigit(character) || EXTRA_SCRIPT_NAME_CHARACTERS.includes(character))
  )
}

export function parsePackageScripts(packageJsonText: string): ScriptEntry[] {
  try {
    const parsed: unknown = JSON.parse(packageJsonText)
    const scripts = typeof parsed === 'object' && parsed !== null ? (parsed as { scripts?: unknown }).scripts : undefined
    if (typeof scripts !== 'object' || scripts === null || Array.isArray(scripts)) {
      return []
    }
    return Object.entries(scripts)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .map(([name, command]) => ({ name, command }))
  } catch {
    return []
  }
}

export function buildRunCommand(manager: PackageManager, scriptName: string): string {
  return manager === 'yarn' ? `yarn ${scriptName}` : `${manager} run ${scriptName}`
}
