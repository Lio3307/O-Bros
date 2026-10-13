import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { detectPackageManager, parsePackageScripts } from '../../shared/scripts'
import type { ProjectScripts } from '../../shared/types'
import { assertInsideProjectRoots } from '../pathGuard'

export async function readProjectScripts(rootPath: string): Promise<ProjectScripts> {
  await assertInsideProjectRoots(rootPath)
  const fileNames = await readdir(rootPath)
  const packageManager = detectPackageManager(fileNames)

  if (!fileNames.includes('package.json')) {
    return { packageManager, scripts: [] }
  }
  const packageJsonText = await readFile(join(rootPath, 'package.json'), 'utf8')
  return { packageManager, scripts: parsePackageScripts(packageJsonText) }
}
