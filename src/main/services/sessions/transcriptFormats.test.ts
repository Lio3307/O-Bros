import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { claudeFormat } from './claudeFormat'
import { codexFormat } from './codexFormat'

const createdFolders: string[] = []

async function writeTranscript(fileName: string, lines: object[]): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'o-bros-transcript-test-'))
  createdFolders.push(folder)
  const filePath = join(folder, fileName)
  await writeFile(filePath, lines.map((line) => JSON.stringify(line)).join('\n'), 'utf8')
  return filePath
}

afterEach(async () => {
  await Promise.all(createdFolders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })))
})

describe('claudeFormat', () => {
  it('reads the session id from the file name and the title from the first real user message', async () => {
    const filePath = await writeTranscript('abc-123.jsonl', [
      { type: 'summary', cwd: 'C:/work/app' },
      { type: 'user', message: { content: '<command-name>/clear</command-name>' } },
      { type: 'user', message: { content: [{ type: 'text', text: 'Fix the login bug' }] } }
    ])

    const header = await claudeFormat.readHeader(filePath)

    expect(header).toEqual({ sessionId: 'abc-123', title: 'Fix the login bug', projectPath: 'C:/work/app' })
  })

  it('returns user and assistant text only', async () => {
    const filePath = await writeTranscript('s.jsonl', [
      { type: 'user', message: { content: 'hello' } },
      { type: 'assistant', message: { content: [{ type: 'text', text: 'hi' }, { type: 'tool_use' }] } },
      { type: 'system', message: { content: 'ignored' } }
    ])

    expect(await claudeFormat.readMessages(filePath)).toEqual([
      { role: 'user', text: 'hello' },
      { role: 'assistant', text: 'hi' }
    ])
  })

  it('reads only what was added since the last read and leaves a line still being written for later', async () => {
    const first = JSON.stringify({ type: 'user', message: { content: 'héllo' } })
    const second = JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'hi' }] } })
    const filePath = await writeTranscript('grow.jsonl', [])
    await writeFile(filePath, `${first}\r\n${second.slice(0, 20)}`, 'utf8')

    const earlier = await claudeFormat.readMessagesFrom(filePath, 0)
    expect(earlier.messages).toEqual([{ role: 'user', text: 'héllo' }])
    expect(earlier.endByte).toBe(Buffer.byteLength(`${first}\r\n`))

    await writeFile(filePath, `${first}\r\n${second}\n`, 'utf8')
    const later = await claudeFormat.readMessagesFrom(filePath, earlier.endByte)
    expect(later.messages).toEqual([{ role: 'assistant', text: 'hi' }])
    expect(later.endByte).toBe(Buffer.byteLength(`${first}\r\n${second}\n`))
  })
})

describe('codexFormat', () => {
  const lines = [
    { type: 'session_meta', payload: { id: '019c-uuid', cwd: 'C:/work/api' } },
    { type: 'response_item', payload: { type: 'message', role: 'developer', content: [{ type: 'input_text', text: 'rules' }] } },
    { type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text: '# AGENTS.md instructions for C:/work/api' }] } },
    { type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Add a health route' }] } },
    { type: 'response_item', payload: { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Done.' }] } },
    { type: 'event_msg', payload: { type: 'token_count' } }
  ]

  it('reads the id and folder from session_meta and skips instruction blocks for the title', async () => {
    const filePath = await writeTranscript('rollout-2026.jsonl', lines)

    const header = await codexFormat.readHeader(filePath)

    expect(header).toEqual({ sessionId: '019c-uuid', title: 'Add a health route', projectPath: 'C:/work/api' })
  })

  it('returns only real user and assistant messages', async () => {
    const filePath = await writeTranscript('rollout-2026.jsonl', lines)

    expect(await codexFormat.readMessages(filePath)).toEqual([
      { role: 'user', text: 'Add a health route' },
      { role: 'assistant', text: 'Done.' }
    ])
  })
})
