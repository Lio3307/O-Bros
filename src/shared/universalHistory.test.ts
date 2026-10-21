import { describe, expect, it } from 'vitest'
import {
  agentFolderName,
  agentOfFolderName,
  historyFileName,
  historyKeepDaysOf,
  isHistoryExpired,
  isHistoryFileOf,
  readHistoryRecord
} from './universalHistory'

describe('universal history names', () => {
  it('uses one <agent>-resume folder per agent', () => {
    expect(agentFolderName('codex')).toBe('codex-resume')
    expect(agentOfFolderName('claude-resume')).toBe('claude')
    expect(agentOfFolderName('-resume')).toBeNull()
    expect(agentOfFolderName('notes')).toBeNull()
  })

  it('names a file by the day it was first saved and the session id', () => {
    const name = historyFileName('abc-123', new Date(2026, 9, 21, 9, 15).getTime())
    expect(name).toBe('2026-10-21_abc-123.json')
    expect(isHistoryFileOf(name, 'abc-123')).toBe(true)
    expect(isHistoryFileOf(name, '123')).toBe(false)
  })
})

describe('keeping history', () => {
  it('accepts only the offered keep periods', () => {
    expect(historyKeepDaysOf(90)).toBe(90)
    expect(historyKeepDaysOf(7)).toBeNull()
    expect(historyKeepDaysOf(null)).toBeNull()
  })

  it('expires a record only when a keep period is set and has passed', () => {
    const day = 24 * 60 * 60 * 1000
    expect(isHistoryExpired(0, null, 1000 * day)).toBe(false)
    expect(isHistoryExpired(0, 30, 31 * day)).toBe(true)
    expect(isHistoryExpired(0, 30, 29 * day)).toBe(false)
  })
})

describe('readHistoryRecord', () => {
  it('reads a saved record and refuses anything else', () => {
    const record = {
      formatVersion: 1,
      agent: 'codex',
      sessionId: 's1',
      title: 'Fix login',
      projectPath: null,
      updatedAt: 5,
      source: 'transcript',
      sourceFile: 'C:/x.jsonl',
      messages: [{ role: 'user', text: 'hi' }]
    }
    expect(readHistoryRecord(record)?.title).toBe('Fix login')
    expect(readHistoryRecord({ ...record, formatVersion: 2 })).toBeNull()
    expect(readHistoryRecord({ ...record, messages: 'no' })).toBeNull()
    expect(readHistoryRecord(null)).toBeNull()
  })
})
