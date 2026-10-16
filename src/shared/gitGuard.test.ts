import { describe, expect, it } from 'vitest'
import { createsCommits, guardedGitAction, makesOneNewCommit, namesAfterSubcommand, withoutAuthorOption } from './gitGuard'

function action(command: string): string | null {
  return guardedGitAction(command.split(' ').filter((part) => part !== ''))
}

describe('guardedGitAction', () => {
  it('guards commits and pushes, also behind global options', () => {
    expect(action('commit -m fix')).toBe('commit')
    expect(action('commit --amend --no-edit')).toBe('commit')
    expect(action('-C ../other -c user.name=x commit -m fix')).toBe('commit')
    expect(action('push origin main')).toBe('push')
    expect(action('--no-pager push')).toBe('push')
  })

  it('guards creating, deleting and renaming branches', () => {
    expect(action('branch feature/login')).toBe('create a branch')
    expect(action('branch -D old')).toBe('delete a branch')
    expect(action('branch -m new-name')).toBe('rename or copy a branch')
    expect(action('checkout -b feature')).toBe('create a branch')
    expect(action('switch -c feature')).toBe('create a branch')
    expect(action('switch --create=feature')).toBe('create a branch')
    expect(action('worktree add ../copy')).toBe('create a worktree')
  })

  it('lets reading commands through', () => {
    expect(action('status')).toBeNull()
    expect(action('log --grep push')).toBeNull()
    expect(action('diff HEAD')).toBeNull()
    expect(action('branch')).toBeNull()
    expect(action('branch -a')).toBeNull()
    expect(action('branch --show-current')).toBeNull()
    expect(action('branch --contains HEAD')).toBeNull()
    expect(action('checkout main')).toBeNull()
    expect(action('switch main')).toBeNull()
    expect(action('worktree list')).toBeNull()
    expect(action('')).toBeNull()
  })
})

describe('commit helpers', () => {
  it('knows which commands create commits', () => {
    expect(createsCommits(['merge', 'feature'])).toBe(true)
    expect(createsCommits(['-C', 'x', 'cherry-pick', 'abc'])).toBe(true)
    expect(createsCommits(['status'])).toBe(false)
    expect(makesOneNewCommit(['commit', '-m', 'x'])).toBe(true)
    expect(makesOneNewCommit(['rebase', 'main'])).toBe(false)
  })

  it('removes the author option in both forms', () => {
    expect(withoutAuthorOption(['commit', '--author', 'Bot <b@x>', '-m', 'x'])).toEqual(['commit', '-m', 'x'])
    expect(withoutAuthorOption(['-C', 'dir', 'commit', '--author=Bot <b@x>', '-m', 'x'])).toEqual(['-C', 'dir', 'commit', '-m', 'x'])
  })

  it('lists the names given after the subcommand', () => {
    expect(namesAfterSubcommand(['checkout', '-b', 'claude/fix'])).toEqual(['claude/fix'])
  })
})
