import { describe, expect, it } from 'vitest'
import { riskyGitSettings } from './gitConfigRisk'

describe('riskyGitSettings', () => {
  it('finds nothing in a normal repository', () => {
    const config = `[core]
	repositoryformatversion = 0
	filemode = false
	bare = false
	logallrefupdates = true
	symlinks = false
	ignorecase = true
[remote "origin"]
	url = https://example.com/repo.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
	remote = origin
	merge = refs/heads/main
[user]
	name = Someone
	email = someone@example.com
`
    expect(riskyGitSettings(config)).toEqual([])
  })

  it('finds every setting that can run a program', () => {
    const config = `[core]
	fsmonitor = ./evil.sh
	sshCommand = ./evil.sh
	hooksPath = .husky
[diff]
	external = ./evil.sh
[diff "x"]
	textconv = ./evil.sh
[filter "lfs"]
	clean = ./evil.sh
	smudge = ./evil.sh
[merge "y"]
	driver = ./evil.sh
[include]
	path = ../other
[includeIf "gitdir:/"]
	path = ../other
[credential]
	helper = ./evil.sh
`
    expect(riskyGitSettings(config).length).toBe(11)
  })

  it('allows the built-in file monitor, which runs no outside program', () => {
    expect(riskyGitSettings('[core]\n\tfsmonitor = true\n')).toEqual([])
    expect(riskyGitSettings('[core]\n\tfsmonitor = false\n')).toEqual([])
  })

  it('is not fooled by capital letters or a setting on the header line', () => {
    expect(riskyGitSettings('[CORE]\n\tFSMONITOR = ./evil.sh\n')).toHaveLength(1)
    expect(riskyGitSettings('[core] fsmonitor = ./evil.sh\n')).toHaveLength(1)
    expect(riskyGitSettings('[core.x]\n[DIFF]\nEXTERNAL=./evil\n')).toHaveLength(1)
  })

  it('ignores comments', () => {
    expect(riskyGitSettings('[core]\n# fsmonitor = ./evil.sh\n; sshCommand = x\n')).toEqual([])
  })

  it('survives broken files', () => {
    expect(riskyGitSettings('')).toEqual([])
    expect(riskyGitSettings('[unclosed\nnot a setting\n=\n')).toEqual([])
  })
})
