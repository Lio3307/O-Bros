import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { parseRegistryValues } from '../../shared/registryValues'

const execFileAsync = promisify(execFile)

const REGISTRY_TIMEOUT_MS = 5000

export async function readRegistryKey(key: string): Promise<Record<string, string>> {
  if (process.platform !== 'win32') {
    return {}
  }
  try {
    const { stdout } = await execFileAsync('reg', ['query', key], { windowsHide: true, timeout: REGISTRY_TIMEOUT_MS })
    return parseRegistryValues(stdout)
  } catch {
    return {}
  }
}
