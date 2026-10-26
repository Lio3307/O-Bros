import { expandWindowsVariables, mergeWindowsPath } from '../../shared/windowsPath'
import { readRegistryKey } from './registry'

const USER_ENVIRONMENT_KEY = 'HKCU\\Environment'
const SYSTEM_ENVIRONMENT_KEY = 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment'

export async function addNewlyInstalledFoldersToPath(): Promise<void> {
  if (process.platform !== 'win32') {
    return
  }
  const [user, system] = await Promise.all([readRegistryKey(USER_ENVIRONMENT_KEY), readRegistryKey(SYSTEM_ENVIRONMENT_KEY)])
  const savedPaths = [system.path, user.path].filter((value): value is string => value !== undefined && value !== '')
  if (savedPaths.length === 0) {
    return
  }
  const expanded = savedPaths.map((value) => expandWindowsVariables(value, process.env))
  process.env.PATH = mergeWindowsPath(process.env.PATH ?? '', expanded)
}
