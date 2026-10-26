const GLOBAL_OPTIONS_WITH_VALUE = ['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--config-env']
const BRANCH_DELETE_FLAGS = ['-d', '-D', '--delete']
const BRANCH_MOVE_FLAGS = ['-m', '-M', '--move', '-c', '-C', '--copy']
const BRANCH_LISTING_FLAGS = [
  '-l',
  '--list',
  '--show-current',
  '-a',
  '--all',
  '-r',
  '--remotes',
  '--contains',
  '--no-contains',
  '--merged',
  '--no-merged',
  '--points-at',
  '--format',
  '--sort',
  '-u',
  '--set-upstream-to',
  '--unset-upstream',
  '--edit-description'
]
const CHECKOUT_CREATE_FLAGS = ['-b', '-B', '--orphan']
const SWITCH_CREATE_FLAGS = ['-c', '-C', '--create', '--force-create', '--orphan']

export function optionName(argument: string): string {
  const equalsIndex = argument.indexOf('=')
  return equalsIndex === -1 ? argument : argument.slice(0, equalsIndex)
}

export function hasAnyFlag(argumentsAfter: string[], flags: string[]): boolean {
  return argumentsAfter.some((argument) => flags.includes(optionName(argument)))
}

function subcommandIndex(gitArguments: string[]): number {
  let index = 0
  while (index < gitArguments.length && gitArguments[index].startsWith('-')) {
    const isSeparateValue = GLOBAL_OPTIONS_WITH_VALUE.includes(gitArguments[index])
    index += isSeparateValue ? 2 : 1
  }
  return index
}

function branchAction(argumentsAfter: string[]): string | null {
  if (hasAnyFlag(argumentsAfter, BRANCH_DELETE_FLAGS)) {
    return 'delete a branch'
  }
  if (hasAnyFlag(argumentsAfter, BRANCH_MOVE_FLAGS)) {
    return 'rename or copy a branch'
  }
  if (hasAnyFlag(argumentsAfter, BRANCH_LISTING_FLAGS)) {
    return null
  }
  const createsBranch = argumentsAfter.some((argument) => !argument.startsWith('-'))
  return createsBranch ? 'create a branch' : null
}

export function gitGlobalArguments(gitArguments: string[]): string[] {
  return gitArguments.slice(0, subcommandIndex(gitArguments))
}

export function guardedGitAction(gitArguments: string[]): string | null {
  const index = subcommandIndex(gitArguments)
  const subcommand = gitArguments[index]
  const argumentsAfter = gitArguments.slice(index + 1)

  if (subcommand === 'commit') {
    return 'commit'
  }
  if (subcommand === 'push') {
    return 'push'
  }
  if (subcommand === 'branch') {
    return branchAction(argumentsAfter)
  }
  if (subcommand === 'checkout' && hasAnyFlag(argumentsAfter, CHECKOUT_CREATE_FLAGS)) {
    return 'create a branch'
  }
  if (subcommand === 'switch' && hasAnyFlag(argumentsAfter, SWITCH_CREATE_FLAGS)) {
    return 'create a branch'
  }
  if (subcommand === 'worktree' && argumentsAfter[0] === 'add') {
    return 'create a worktree'
  }
  return null
}

const COMMIT_CREATING_COMMANDS = ['commit', 'merge', 'cherry-pick', 'revert', 'rebase', 'am', 'pull']
const SINGLE_COMMIT_COMMANDS = ['commit', 'merge', 'revert']
const AUTHOR_OPTION = '--author'

export function gitSubcommand(gitArguments: string[]): string | null {
  return gitArguments[subcommandIndex(gitArguments)] ?? null
}

export function createsCommits(gitArguments: string[]): boolean {
  return COMMIT_CREATING_COMMANDS.includes(gitSubcommand(gitArguments) ?? '')
}

export function makesOneNewCommit(gitArguments: string[]): boolean {
  return SINGLE_COMMIT_COMMANDS.includes(gitSubcommand(gitArguments) ?? '')
}

export function withoutAuthorOption(gitArguments: string[]): string[] {
  const index = subcommandIndex(gitArguments)
  const kept = gitArguments.slice(0, index + 1)
  let position = index + 1
  while (position < gitArguments.length) {
    const argument = gitArguments[position]
    if (argument === AUTHOR_OPTION) {
      position += 2
      continue
    }
    if (!argument.startsWith(`${AUTHOR_OPTION}=`)) {
      kept.push(argument)
    }
    position += 1
  }
  return kept
}

export function namesAfterSubcommand(gitArguments: string[]): string[] {
  return gitArguments.slice(subcommandIndex(gitArguments) + 1).filter((argument) => !argument.startsWith('-'))
}
