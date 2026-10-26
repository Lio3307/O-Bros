import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseCommandAliases, parseExtraAgents } from '../../../shared/acpRegistry'

describe('the agent commands file shipped with O-BROS', () => {
  it('lists agents outside the registry and the commands for registry agents', () => {
    const shipped: unknown = JSON.parse(readFileSync(join(__dirname, '../../../../resources/agents/cli-commands.json'), 'utf8'))
    expect(parseExtraAgents(shipped).map((agent) => agent.commands[0])).toContain('freebuff')
    expect(parseCommandAliases(shipped)['antigravity-acp']).toBe('agy')
  })
})
