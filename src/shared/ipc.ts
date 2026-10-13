import type {
  AccountRef,
  AddRootResult,
  CreateEntryRequest,
  AccountUsage,
  DetectedAccount,
  DirectoryEntry,
  FormatRequest,
  FormatResult,
  GitBranchList,
  GitCheckoutRequest,
  GitCommitRequest,
  GitDiffRequest,
  GitDiscardRequest,
  GitPathsRequest,
  GitStatus,
  LintRequest,
  LintResult,
  ListeningPort,
  ProjectRoot,
  ProjectScripts,
  ProviderId,
  RemoveOlderSessionsRequest,
  RemoveSessionsResult,
  RenameEntryRequest,
  ResourceSnapshot,
  RunningTask,
  SearchHit,
  SearchRequest,
  SessionMessage,
  SessionStorageReport,
  SessionSummary,
  StorageReport
} from './types'

export const IpcChannel = {
  ptyCreate: 'pty:create',
  ptyInput: 'pty:input',
  ptyResize: 'pty:resize',
  ptyKill: 'pty:kill',
  ptyData: 'pty:data',
  ptyExit: 'pty:exit',
  accountsScan: 'accounts:scan',
  accountsCreateFolder: 'accounts:createFolder',
  usageGet: 'usage:get',
  projectsList: 'projects:list',
  projectsAddRoot: 'projects:addRoot',
  projectsRemoveRoot: 'projects:removeRoot',
  projectsScripts: 'projects:scripts',
  fsList: 'fs:list',
  fsRead: 'fs:read',
  fsWrite: 'fs:write',
  fsSearch: 'fs:search',
  fsCreate: 'fs:create',
  fsRename: 'fs:rename',
  fsTrash: 'fs:trash',
  gitStatus: 'git:status',
  gitDiff: 'git:diff',
  gitFetch: 'git:fetch',
  gitStage: 'git:stage',
  gitUnstage: 'git:unstage',
  gitCommit: 'git:commit',
  gitDiscard: 'git:discard',
  gitBranches: 'git:branches',
  gitSwitch: 'git:switch',
  historyList: 'history:list',
  historyGet: 'history:get',
  historyRemove: 'history:remove',
  historyStorage: 'history:storage',
  historyRemoveOlder: 'history:removeOlder',
  resourcesGet: 'resources:get',
  toolsLint: 'tools:lint',
  toolsFormat: 'tools:format',
  shellReveal: 'shell:reveal',
  portsList: 'ports:list',
  portsStop: 'ports:stop',
  appListRunningTasks: 'app:listRunningTasks',
  appConfirmClose: 'app:confirmClose',
  appCloseRequested: 'app:closeRequested',
  storageReport: 'storage:report',
  storageClearAppCache: 'storage:clearAppCache',
  storageClearLeftoverTemp: 'storage:clearLeftoverTemp'
} as const

export interface PtyCreateRequest {
  id: string
  cwd: string | null
  account: AccountRef | null
  startCommand: string | null
}

export interface PtyDataEvent {
  id: string
  chunk: string
}

export interface PtyExitEvent {
  id: string
  exitCode: number
}

export interface DesktopApi {
  pty: {
    create(request: PtyCreateRequest): Promise<void>
    input(id: string, data: string): void
    resize(id: string, columns: number, rows: number): void
    kill(id: string): void
    onData(listener: (event: PtyDataEvent) => void): () => void
    onExit(listener: (event: PtyExitEvent) => void): () => void
  }
  accounts: {
    scan(): Promise<DetectedAccount[]>
    createFolder(provider: ProviderId, accountName: string): Promise<string>
  }
  usage: {
    get(account: AccountRef): Promise<AccountUsage>
  }
  projects: {
    list(): Promise<ProjectRoot[]>
    addRoot(): Promise<AddRootResult>
    removeRoot(rootPath: string): Promise<ProjectRoot[]>
    scripts(rootPath: string): Promise<ProjectScripts>
  }
  files: {
    list(directoryPath: string): Promise<DirectoryEntry[]>
    read(filePath: string): Promise<string>
    write(filePath: string, content: string): Promise<void>
    search(request: SearchRequest): Promise<SearchHit[]>
    create(request: CreateEntryRequest): Promise<string>
    rename(request: RenameEntryRequest): Promise<string>
    trash(path: string): Promise<void>
    pathOf(file: File): string
  }
  git: {
    status(repoPath: string): Promise<GitStatus | null>
    diff(request: GitDiffRequest): Promise<string>
    fetch(repoPath: string): Promise<GitStatus | null>
    stage(request: GitPathsRequest): Promise<void>
    unstage(request: GitPathsRequest): Promise<void>
    commit(request: GitCommitRequest): Promise<void>
    discard(request: GitDiscardRequest): Promise<void>
    branches(repoPath: string): Promise<GitBranchList>
    switchBranch(request: GitCheckoutRequest): Promise<void>
  }
  history: {
    list(day: string | null): Promise<SessionSummary[]>
    get(filePath: string): Promise<SessionMessage[]>
    remove(filePaths: string[], permanently: boolean): Promise<number>
    storage(): Promise<SessionStorageReport[]>
    removeOlderThan(request: RemoveOlderSessionsRequest): Promise<RemoveSessionsResult>
  }
  resources: {
    get(): Promise<ResourceSnapshot>
  }
  tools: {
    lint(request: LintRequest): Promise<LintResult>
    format(request: FormatRequest): Promise<FormatResult>
  }
  shell: {
    reveal(path: string): Promise<void>
  }
  ports: {
    list(): Promise<ListeningPort[]>
    stop(pid: number): Promise<void>
  }
  app: {
    listRunningTasks(): Promise<RunningTask[]>
    confirmClose(): Promise<void>
    onCloseRequested(listener: () => void): () => void
  }
  storage: {
    report(): Promise<StorageReport>
    clearAppCache(): Promise<void>
    clearLeftoverTemp(): Promise<void>
  }
}
