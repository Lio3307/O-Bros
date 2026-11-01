const COMMENT_MARKS = ['#', ';']
const SAFE_FSMONITOR_VALUES = ['true', 'false', '']

const RISKY_KEYS = [
  'core.sshcommand',
  'core.gitproxy',
  'core.askpass',
  'core.hookspath',
  'core.pager',
  'core.editor',
  'sequence.editor',
  'diff.external',
  'gpg.program',
  'credential.helper',
  'include.path'
]

const RISKY_ENDINGS: [string, string][] = [
  ['filter.', '.clean'],
  ['filter.', '.smudge'],
  ['filter.', '.process'],
  ['diff.', '.command'],
  ['diff.', '.textconv'],
  ['merge.', '.driver'],
  ['credential.', '.helper'],
  ['gpg.', '.program'],
  ['remote.', '.uploadpack'],
  ['remote.', '.receivepack'],
  ['submodule.', '.update']
]

const RISKY_PREFIXES = ['includeif.', 'pager.']

function isRiskyKey(key: string, value: string): boolean {
  if (key === 'core.fsmonitor') {
    return !SAFE_FSMONITOR_VALUES.includes(value.toLowerCase())
  }
  return (
    RISKY_KEYS.includes(key) ||
    RISKY_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
    RISKY_ENDINGS.some(([start, end]) => key.startsWith(start) && key.endsWith(end))
  )
}

function sectionNameOf(header: string): string {
  const quote = header.indexOf('"')
  if (quote === -1) {
    return header.trim().toLowerCase()
  }
  const name = header.slice(0, quote).trim().toLowerCase()
  const subsection = header.slice(quote + 1, header.lastIndexOf('"'))
  return `${name}.${subsection}`
}

function keyAndValueOf(line: string): [string, string] {
  const equals = line.indexOf('=')
  if (equals === -1) {
    return [line.trim().toLowerCase(), '']
  }
  return [line.slice(0, equals).trim().toLowerCase(), line.slice(equals + 1).trim()]
}

export function riskyGitSettings(configText: string): string[] {
  const found = new Set<string>()
  let section = ''
  for (const rawLine of configText.split('\n')) {
    let line = rawLine.trim()
    if (line.startsWith('[')) {
      const close = line.indexOf(']')
      if (close === -1) {
        continue
      }
      section = sectionNameOf(line.slice(1, close))
      line = line.slice(close + 1).trim()
    }
    if (line === '' || COMMENT_MARKS.includes(line.charAt(0))) {
      continue
    }
    const [key, value] = keyAndValueOf(line)
    const fullKey = `${section}.${key}`
    if (isRiskyKey(fullKey.toLowerCase(), value)) {
      found.add(fullKey)
    }
  }
  return [...found]
}
