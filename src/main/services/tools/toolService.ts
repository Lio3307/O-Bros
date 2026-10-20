import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import type { FormatRequest, FormatResult, LintRequest, LintResult } from '../../../shared/types'
import { assertInsideProjectRoots } from '../../pathGuard'
import { parseOxlintReport } from './oxlintParser'
import { LINT_TEMP_PREFIX } from '../storage/leftoverTempFolders'
import { runBundledTool } from './toolRunner'
import { pathExists } from '../fileSystem'

const OXLINT_CONFIG_FILE = '.oxlintrc.json'
const MAX_FAILURE_TEXT_LENGTH = 300

function failureText(stderr: string, stdout: string): string {
  const text = (stderr.trim() || stdout.trim()).slice(0, MAX_FAILURE_TEXT_LENGTH)
  return text === '' ? 'The tool stopped without a message.' : text
}

export async function lintContent(request: LintRequest): Promise<LintResult> {
  await assertInsideProjectRoots(request.filePath)
  const workingDirectory = request.rootPath ?? dirname(request.filePath)
  await assertInsideProjectRoots(workingDirectory)

  const temporaryDirectory = await mkdtemp(join(tmpdir(), LINT_TEMP_PREFIX))
  try {
    const temporaryFile = join(temporaryDirectory, basename(request.filePath))
    await writeFile(temporaryFile, request.content, 'utf8')

    const configPath = join(workingDirectory, OXLINT_CONFIG_FILE)
    const configArgs = (await pathExists(configPath)) ? ['-c', configPath] : []
    const output = await runBundledTool('oxlint', {
      args: ['--format=json', ...configArgs, temporaryFile],
      workingDirectory
    })

    if (output.stdout.trim().startsWith('{')) {
      return { diagnostics: parseOxlintReport(output.stdout), errorMessage: null }
    }
    return { diagnostics: [], errorMessage: failureText(output.stderr, output.stdout) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Linting failed.'
    return { diagnostics: [], errorMessage: message }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
}

export async function formatContent(request: FormatRequest): Promise<FormatResult> {
  await assertInsideProjectRoots(request.filePath)

  try {
    const output = await runBundledTool('oxfmt', {
      args: [`--stdin-filepath=${request.filePath}`],
      workingDirectory: dirname(request.filePath),
      stdin: request.content
    })
    if (output.exitCode !== 0) {
      return { formatted: null, errorMessage: failureText(output.stderr, output.stdout) }
    }
    return { formatted: output.stdout, errorMessage: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Formatting failed.'
    return { formatted: null, errorMessage: message }
  }
}
