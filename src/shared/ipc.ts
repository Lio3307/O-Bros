import type { AcpAgent } from './acpRegistry'
import type {
  AccountRef,
  AddRootResult,
  DataLocation,
  CreateEntryRequest,
  AccountUsage,
  DetectedAccount,
  DirectoryEntry,
  FormatRequest,
  FormatResult,
  GitAmendRequest,
  GitBranchList,
  GitCreateBranchRequest,
  GitDeleteBranchRequest,
  GitRenameBranchRequest,
  GitCheckoutRequest,
  GitCommit,
  GitCommitFile,
  GitCommitFilesRequest,
  GitCommitRequest,
  GitDiffRequest,
  GitDiscardRequest,
  GitLogRequest,
  GitPathsRequest,
  GitStashEntry,
  GitStashRefRequest,
  GitStashRequest,
  GitStatus,
  RepositoryEntry,
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
  StorageReport,
  UpdateStatus
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
  projectsRepositories: 'projects:repositories',
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
  gitLog: 'git:log',
  gitCommitFiles: 'git:commitFiles',
  gitSwitch: 'git:switch',
  gitCreateBranch: 'git:createBranch',
  gitRenameBranch: 'git:renameBranch',
  gitDeleteBranch: 'git:deleteBranch',
  gitUndoCommit: 'git:undoCommit',
  gitLastMessage: 'git:lastMessage',
  gitAmendCommit: 'git:amendCommit',
  gitPull: 'git:pull',
  gitPush: 'git:push',
  gitStash: 'git:stash',
  gitStashList: 'git:stashList',
  gitStashApply: 'git:stashApply',
  gitStashDrop: 'git:stashDrop',
  historyList: 'history:list',
  historyGet: 'history:get',
  historyRemove: 'history:remove',
  historyStorage: 'history:storage',
  historyRemoveOlder: 'history:removeOlder',
  resourcesGet: 'resources:get',
  toolsLint: 'tools:lint',
  toolsFormat: 'tools:format',
  agentsCommands: 'agents:commands',
  agentsRegistry: 'agents:registry',
  shellReveal: 'shell:reveal',
  portsList: 'ports:list',
  portsStop: 'ports:stop',
  appListRunningTasks: 'app:listRunningTasks',
  appConfirmClose: 'app:confirmClose',
  appCloseRequested: 'app:closeRequested',
  appLog: 'app:log',
  appOpenLogFolder: 'app:openLogFolder',
  storageReport: 'storage:report',
  storageClearAppCache: 'storage:clearAppCache',
  storageClearLeftoverTemp: 'storage:clearLeftoverTemp',
  storageLocations: 'storage:locations',
  storageOpenLocation: 'storage:openLocation',
  updaterStatus: 'updater:status',
  updaterCheck: 'updater:check',
  updaterDownload: 'updater:download',
  updaterInstall: 'updater:install',
  updaterOpenReleases: 'updater:openReleases',
  updaterStatusChanged: 'updater:statusChanged'
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
    repositories(folderPath: string): Promise<RepositoryEntry[]>
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
    log(request: GitLogRequest): Promise<GitCommit[]>
    commitFiles(request: GitCommitFilesRequest): Promise<GitCommitFile[]>
    switchBranch(request: GitCheckoutRequest): Promise<void>
    createBranch(request: GitCreateBranchRequest): Promise<void>
    renameBranch(request: GitRenameBranchRequest): Promise<void>
    deleteBranch(request: GitDeleteBranchRequest): Promise<void>
    undoCommit(repoPath: string): Promise<void>
    lastMessage(repoPath: string): Promise<string>
    amendCommit(request: GitAmendRequest): Promise<void>
    pull(repoPath: string): Promise<void>
    push(repoPath: string): Promise<void>
    stash(request: GitStashRequest): Promise<void>
    stashList(repoPath: string): Promise<GitStashEntry[]>
    stashApply(request: GitStashRefRequest): Promise<void>
    stashDrop(request: GitStashRefRequest): Promise<void>
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
  agents: {
    listCommands(): Promise<string[]>
    registry(): Promise<AcpAgent[]>
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
    log(level: 'error' | 'warning' | 'info', message: string): void
    openLogFolder(): Promise<void>
  }
  storage: {
    report(): Promise<StorageReport>
    clearAppCache(): Promise<void>
    clearLeftoverTemp(): Promise<void>
    locations(): Promise<DataLocation[]>
    openLocation(id: string): Promise<void>
  }
  updater: {
    status(): Promise<UpdateStatus>
    check(): Promise<void>
    download(): Promise<void>
    install(): Promise<void>
    openReleases(): Promise<void>
    onStatusChanged(listener: (status: UpdateStatus) => void): () => void
  }
}
