import { describe, expect, it } from 'vitest'
import { agentHintsFrom } from './agentTraces'
import { bodyFilePaths, guardedHostAction, mayCarryAgentCredits, withoutAgentCredits, type HostTool } from './hostGuard'

const HINTS = agentHintsFrom(['Claude Code', 'Codex'])

function action(command: string): string | null {
  const [tool, ...rest] = command.split(' ').filter((part) => part !== '')
  return guardedHostAction(tool as HostTool, rest)
}

describe('guardedHostAction', () => {
  it('guards commands that change something on GitHub or GitLab', () => {
    expect(action('gh pr merge 12 --squash')).toBe('gh pr merge')
    expect(action('gh pr create --title x --body y')).toBe('gh pr create')
    expect(action('gh pr --repo owner/close merge 1')).toBe('gh pr merge')
    expect(action('gh issue comment 5 --body hi')).toBe('gh issue comment')
    expect(action('gh release delete-asset v1 a.zip')).toBe('gh release delete-asset')
    expect(action('gh repo delete owner/name --yes')).toBe('gh repo delete')
    expect(action('gh repo deploy-key add key.pub')).toBe('gh repo deploy-key add')
    expect(action('gh secret set TOKEN')).toBe('gh secret set')
    expect(action('gh workflow run build.yml')).toBe('gh workflow run')
    expect(action('gh alias set m pr')).toBe('gh alias set')
    expect(action('glab mr approve 3')).toBe('glab mr approve')
    expect(action('glab mr note 3 -m done')).toBe('glab mr note')
    expect(action('glab ci retry 99')).toBe('glab ci retry')
    expect(action('glab issue board create')).toBe('glab issue board create')
  })

  it('lets reading commands through, even when a name looks like a change', () => {
    expect(action('gh pr view 12')).toBeNull()
    expect(action('gh pr view add-login-form')).toBeNull()
    expect(action('gh pr list --label close')).toBeNull()
    expect(action('gh pr checks')).toBeNull()
    expect(action('gh run view 1 --log')).toBeNull()
    expect(action('gh release download v1')).toBeNull()
    expect(action('gh search repos delete-me')).toBeNull()
    expect(action('gh status')).toBeNull()
    expect(action('gh --version')).toBeNull()
    expect(action('gh')).toBeNull()
    expect(action('glab mr list')).toBeNull()
    expect(action('glab ci status')).toBeNull()
  })

  it('guards API calls that send or change, not ones that read', () => {
    expect(action('gh api repos/o/r/pulls')).toBeNull()
    expect(action('gh api -X GET search/issues -f q=bug')).toBeNull()
    expect(action('gh api repos/o/r/issues -f title=x')).toBe('gh api (POST)')
    expect(action('gh api -X DELETE repos/o/r')).toBe('gh api (DELETE)')
    expect(action('gh api --method=patch repos/o/r')).toBe('gh api (PATCH)')
    expect(action('gh api -XPUT repos/o/r/topics')).toBe('gh api (PUT)')
    expect(action('gh api graphql -f query={viewer{login}}')).toBeNull()
    expect(action('gh api graphql -f query=mutation{addStar}')).toBe('gh api graphql (mutation)')
    expect(action('glab api projects/1/issues --field title=x')).toBe('glab api (POST)')
  })

  it('guards showing the sign-in token and changing the sign-in, but not checking it', () => {
    expect(action('gh auth status')).toBeNull()
    expect(action('gh auth git-credential get')).toBeNull()
    expect(action('gh auth token')).toBe('gh auth token')
    expect(action('gh auth status --show-token')).toBe('gh auth status --show-token')
    expect(action('glab auth status -t')).toBe('glab auth status --show-token')
    expect(action('gh auth logout')).toBe('gh auth logout')
    expect(action('glab config get token')).toBe('glab config get token')
    expect(action('glab config get editor')).toBeNull()
  })
})

describe('agent credits in gh and glab text', () => {
  const body = 'Fixes the login.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>'

  it('removes credit lines from inline text and leaves everything else as it is', () => {
    const cleaned = withoutAgentCredits(['pr', 'create', '--title', 'Fix login', '--body', body], HINTS, new Map())
    expect(cleaned).toEqual(['pr', 'create', '--title', 'Fix login', '--body', 'Fixes the login.'])
    expect(withoutAgentCredits(['api', 'x', '-f', `body=${body}`], HINTS, new Map())[3]).toBe('body=Fixes the login.')
    expect(withoutAgentCredits(['pr', 'view', '12'], HINTS, new Map())).toEqual(['pr', 'view', '12'])
  })

  it('turns a body file with credit lines into cleaned inline text', () => {
    expect(bodyFilePaths(['pr', 'create', '--body-file', 'body.md', '--notes-file=notes.md', '--body-file', '-'])).toEqual(['body.md', 'notes.md'])
    const texts = new Map([
      ['body.md', body],
      ['notes.md', 'Plain notes']
    ])
    expect(withoutAgentCredits(['pr', 'create', '--body-file', 'body.md'], HINTS, texts)).toEqual(['pr', 'create', '--body', 'Fixes the login.'])
    expect(withoutAgentCredits(['release', 'create', 'v1', '--notes-file=notes.md'], HINTS, texts)).toEqual(['release', 'create', 'v1', '--notes-file=notes.md'])
  })

  it('only looks closer when the text could carry a credit', () => {
    expect(mayCarryAgentCredits(['pr', 'list'])).toBe(false)
    expect(mayCarryAgentCredits(['pr', 'create', '--body', body])).toBe(true)
    expect(mayCarryAgentCredits(['pr', 'create', '--body-file', 'x.md'])).toBe(true)
  })
})
