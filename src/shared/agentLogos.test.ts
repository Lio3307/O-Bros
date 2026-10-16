import { describe, expect, it } from 'vitest'
import { parseAgentLogoIndex } from './agentLogos'

describe('parseAgentLogoIndex', () => {
  it('reads logo entries by command, in lower case', () => {
    expect(
      parseAgentLogoIndex({
        logos: { Claude: { file: 'claude-color.svg', style: 'color' }, cline: { file: 'cline.svg', style: 'mono' } }
      })
    ).toEqual({ claude: { file: 'claude-color.svg', style: 'color' }, cline: { file: 'cline.svg', style: 'mono' } })
  })

  it('refuses file names that could leave the logo folder or are not SVG', () => {
    expect(
      parseAgentLogoIndex({
        logos: {
          a: { file: '../secret.svg', style: 'color' },
          b: { file: 'folder/logo.svg', style: 'color' },
          c: { file: 'logo.png', style: 'color' },
          d: { file: 'ok.svg', style: 'unknown' }
        }
      })
    ).toEqual({ d: { file: 'ok.svg', style: 'mono' } })
  })

  it('returns nothing for a broken index', () => {
    expect(parseAgentLogoIndex(null)).toEqual({})
  })
})
