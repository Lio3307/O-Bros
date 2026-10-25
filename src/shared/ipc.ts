import type { ActivityEntry, LiveAgent } from './activity'
import type { AgentLogin } from './agentLogins'
import type { AgentLogo } from './agentLogos'
import type {
  LanguageServerChoices,
  LanguageServerSession,
  LanguageServerStartRequest,
  LanguageServerStatus,
  RunningLanguageServer
} from './languageServers'
import type { CommitIdentity } from './commitIdentity'
import type { CustomProvider, ProviderTestResult } from './customProviders'
import type { CreditBalance } from './creditBalance'
import type { UsageFacts } from './usageSupport'
import type { TeamPolicy } from './teamPolicy'
import type { TeamAgentOption } from './teamAgents'
import type { AcpAgent } from './acpRegistry'
import type {
  AccountRef,
  AddRootResult,
  ContinuePlan,
  ContinueRequest,
  ConversationMoveResult,
  ThreadSummary,
  TypeResult,
  ConversationStorage,
  DiskReport,
  UniversalHistoryReport,
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
  GitResolveRequest,
  GitStashRefRequest,
  ReviewBaseline,
  SessionSearchHit,
  OpenedBackupFile,
  TeamMember,
  WotRendererEnvelope,
  WotSkillTarget,
  ReviewChange,
  ReviewFileRequest,
  GitStashRequest,
  GitStatus,
  ImageFile,
  RelocateRootResult,
  RepositoryEntry,
  LintRequest,
  LintResult,
  ListeningPort,
  ProcessUsage,
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
  TeamChatsReport,
  StorageReport,
  UpdateStatus
} from './types'

export const IpcChannel = {
  ptyCreate: 'pty:create',
  ptyInput: 'pty:input',
  ptyResize: 'pty:resize',
  ptyKill: 'pty:kill',
  ptyTypeWhenReady: 'pty:typeWhenReady',
  ptyData: 'pty:data',
  ptyExit: 'pty:exit',
  ptyAgentChanged: 'pty:agentChanged',
  accountsScan: 'accounts:scan',
  accountsCreateFolder: 'accounts:createFolder',
  usageGet: 'usage:get',
  usageCredits: 'usage:credits',
  usageFacts: 'usage:facts',
  accountsAgentLogins: 'accounts:agentLogins',
  accountsProviderKeyHints: 'accounts:providerKeyHints',
  accountsSaveProviderKey: 'accounts:saveProviderKey',
  accountsTestProvider: 'accounts:testProvider',
  projectsList: 'projects:list',
  projectsAddRoot: 'projects:addRoot',
  projectsRemoveRoot: 'projects:removeRoot',
  projectsRelocateRoot: 'projects:relocateRoot',
  projectsScripts: 'projects:scripts',
  projectsRepositories: 'projects:repositories',
  projectsSearchDepth: 'projects:searchDepth',
  projectsSetSearchDepth: 'projects:setSearchDepth',
  fsList: 'fs:list',
  fsRead: 'fs:read',
  fsReadImage: 'fs:readImage',
  fsSaveClipboardImage: 'fs:saveClipboardImage',
  fsWrite: 'fs:write',
  fsSearch: 'fs:search',
  fsCreate: 'fs:create',
  fsRename: 'fs:rename',
  fsTrash: 'fs:trash',
  fsWatch: 'fs:watch',
  fsUnwatch: 'fs:unwatch',
  fsChanged: 'fs:changed',
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
  gitResolveConflict: 'git:resolveConflict',
  gitContinueOperation: 'git:continueOperation',
  gitAbortOperation: 'git:abortOperation',
  historySearch: 'history:search',
  backupSave: 'backup:save',
  backupOpen: 'backup:open',
  backupAddProjectFolders: 'backup:addProjectFolders',
  wotMembers: 'wot:members',
  wotListMembers: 'wot:listMembers',
  wotCloseMember: 'wot:closeMember',
  wotRequest: 'wot:request',
  wotRespond: 'wot:respond',
  wotSkillTargets: 'wot:skillTargets',
  wotInstallSkill: 'wot:installSkill',
  wotRemoveSkill: 'wot:removeSkill',
  wotIsInstalled: 'wot:isInstalled',
  wotNotice: 'wot:notice',
  wotSetPolicy: 'wot:setPolicy',
  wotStopAll: 'wot:stopAll',
  storageClearTeamTaskFiles: 'storage:clearTeamTaskFiles',
  gitAgentTraces: 'git:agentTraces',
  gitReviewBaseline: 'git:reviewBaseline',
  gitReviewChanges: 'git:reviewChanges',
  gitReviewDiff: 'git:reviewDiff',
  gitReviewRevert: 'git:reviewRevert',
  historyList: 'history:list',
  historyGet: 'history:get',
  historyRemove: 'history:remove',
  historyStorage: 'history:storage',
  historyRemoveOlder: 'history:removeOlder',
  resourcesGet: 'resources:get',
  resourcesApp: 'resources:app',
  toolsLint: 'tools:lint',
  toolsFormat: 'tools:format',
  agentsCommands: 'agents:commands',
  agentsRegistry: 'agents:registry',
  agentsLogo: 'agents:logo',
  shellReveal: 'shell:reveal',
  portsList: 'ports:list',
  portsStop: 'ports:stop',
  portsOpen: 'ports:open',
  lspStatuses: 'lsp:statuses',
  lspStart: 'lsp:start',
  lspSend: 'lsp:send',
  lspRelease: 'lsp:release',
  lspMessage: 'lsp:message',
  lspClosed: 'lsp:closed',
  lspRunning: 'lsp:running',
  lspStop: 'lsp:stop',
  wotAgents: 'wot:agents',
  historyTeamChats: 'history:teamChats',
  historyContinueWith: 'history:continueWith',
  historyLatestSessionFile: 'history:latestSessionFile',
  historyThreads: 'history:threads',
  historyRemoveTeamChats: 'history:removeTeamChats',
  activityList: 'activity:list',
  activityClear: 'activity:clear',
  activityAdded: 'activity:added',
  activityLive: 'activity:live',
  appListRunningTasks: 'app:listRunningTasks',
  appConfirmClose: 'app:confirmClose',
  appHardwareAcceleration: 'app:hardwareAcceleration',
  appSetHardwareAcceleration: 'app:setHardwareAcceleration',
  appRestart: 'app:restart',
  appCloseRequested: 'app:closeRequested',
  appLog: 'app:log',
  appOpenLogFolder: 'app:openLogFolder',
  appHandlerError: 'app:handlerError',
  storageReport: 'storage:report',
  storageClearAppCache: 'storage:clearAppCache',
  storageClearLeftoverTemp: 'storage:clearLeftoverTemp',
  storageLocations: 'storage:locations',
  storageOpenLocation: 'storage:openLocation',
  storageConversations: 'storage:conversations',
  storageChooseConversationFolder: 'storage:chooseConversationFolder',
  storageMoveConversations: 'storage:moveConversations',
  storageMoveConversationsBack: 'storage:moveConversationsBack',
  storageHistory: 'storage:history',
  storageSaveHistoryNow: 'storage:saveHistoryNow',
  storageMoveHistory: 'storage:moveHistory',
  storageSetHistoryKeep: 'storage:setHistoryKeep',
  storageOpenHistoryFolder: 'storage:openHistoryFolder',
  storageDisks: 'storage:disks',
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
  startsAgent: boolean
  commitIdentity: CommitIdentity | null
  provider: CustomProvider | null
}

export interface PtyDataEvent {
  id: string
  chunk: string
}

export interface PtyExitEvent {
  id: string
  exitCode: number
}

export interface PaneAgentEvent {
  id: string
  agentCommand: string | null
}

export interface DesktopApi {
  pty: {
    create(request: PtyCreateRequest): Promise<void>
    input(id: string, data: string): void
    resize(id: string, columns: number, rows: number): void
    kill(id: string): void
    typeWhenReady(id: string, text: string): Promise<TypeResult>
    onData(listener: (event: PtyDataEvent) => void): () => void
    onExit(listener: (event: PtyExitEvent) => void): () => void
    onAgentChanged(listener: (event: PaneAgentEvent) => void): () => void
  }
  accounts: {
    scan(): Promise<DetectedAccount[]>
    createFolder(provider: ProviderId, accountName: string): Promise<string>
    agentLogins(): Promise<AgentLogin[]>
    providerKeyHints(): Promise<Record<string, string>>
    saveProviderKey(providerId: string, apiKey: string | null): Promise<void>
    testProvider(provider: CustomProvider): Promise<ProviderTestResult>
  }
  usage: {
    get(account: AccountRef): Promise<AccountUsage>
    credits(): Promise<CreditBalance[]>
    facts(): Promise<UsageFacts>
  }
  projects: {
    list(): Promise<ProjectRoot[]>
    addRoot(dialogTitle?: string): Promise<AddRootResult>
    removeRoot(rootPath: string): Promise<ProjectRoot[]>
    relocateRoot(oldPath: string): Promise<RelocateRootResult>
    scripts(rootPath: string): Promise<ProjectScripts>
    repositories(folderPath: string): Promise<RepositoryEntry[]>
    searchDepth(): Promise<number>
    setSearchDepth(depth: number): Promise<void>
  }
  files: {
    list(directoryPath: string): Promise<DirectoryEntry[]>
    read(filePath: string): Promise<string>
    readImage(filePath: string): Promise<ImageFile>
    saveClipboardImage(): Promise<string | null>
    write(filePath: string, content: string): Promise<void>
    search(request: SearchRequest): Promise<SearchHit[]>
    create(request: CreateEntryRequest): Promise<string>
    rename(request: RenameEntryRequest): Promise<string>
    trash(path: string): Promise<void>
    pathOf(file: File): string
    watch(filePath: string): Promise<void>
    unwatch(filePath: string): Promise<void>
    onChanged(listener: (filePath: string) => void): () => void
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
    resolveConflict(request: GitResolveRequest): Promise<void>
    continueOperation(repoPath: string): Promise<void>
    abortOperation(repoPath: string): Promise<void>
    agentTraces(repoPath: string): Promise<string[]>
    reviewBaseline(repoPath: string): Promise<ReviewBaseline | null>
    reviewChanges(baseline: ReviewBaseline): Promise<ReviewChange[]>
    reviewDiff(request: ReviewFileRequest): Promise<string>
    reviewRevert(request: ReviewFileRequest): Promise<void>
  }
  backup: {
    save(text: string, suggestedName: string): Promise<string | null>
    open(): Promise<OpenedBackupFile | null>
    addProjectFolders(folderPaths: string[]): Promise<number>
  }
  wot: {
    listMembers(): Promise<TeamMember[]>
    closeMember(memberId: string): Promise<void>
    onMembers(listener: (members: TeamMember[]) => void): () => void
    onRequest(listener: (envelope: WotRendererEnvelope) => void): () => void
    respond(requestId: string, answer: unknown, errorMessage: string | null): void
    skillTargets(): Promise<WotSkillTarget[]>
    installSkill(targetId: string): Promise<void>
    removeSkill(targetId: string): Promise<void>
    isInstalled(): Promise<boolean>
    onNotice(listener: (message: string) => void): () => void
    setPolicy(policy: TeamPolicy): Promise<void>
    stopAll(): Promise<number>
    agents(): Promise<TeamAgentOption[]>
  }
  history: {
    list(): Promise<SessionSummary[]>
    get(filePath: string): Promise<SessionMessage[]>
    search(query: string): Promise<SessionSearchHit[]>
    remove(filePaths: string[], permanently: boolean): Promise<RemoveSessionsResult>
    storage(): Promise<SessionStorageReport[]>
    removeOlderThan(request: RemoveOlderSessionsRequest): Promise<RemoveSessionsResult>
    teamChats(): Promise<TeamChatsReport>
    removeTeamChats(permanently: boolean): Promise<RemoveSessionsResult>
    continueWith(request: ContinueRequest): Promise<ContinuePlan>
    latestSessionFile(provider: ProviderId, cwd: string, since: number): Promise<string | null>
    threads(): Promise<ThreadSummary[]>
  }
  resources: {
    get(): Promise<ResourceSnapshot>
    app(): Promise<ProcessUsage>
  }
  tools: {
    lint(request: LintRequest): Promise<LintResult>
    format(request: FormatRequest): Promise<FormatResult>
  }
  agents: {
    listCommands(): Promise<string[]>
    registry(): Promise<AcpAgent[]>
    logo(command: string): Promise<AgentLogo | null>
  }
  shell: {
    reveal(path: string): Promise<void>
  }
  ports: {
    list(): Promise<ListeningPort[]>
    stop(pid: number): Promise<void>
    open(port: number): Promise<void>
  }
  lsp: {
    statuses(folderPath: string | null, choices: LanguageServerChoices): Promise<LanguageServerStatus[]>
    start(request: LanguageServerStartRequest): Promise<LanguageServerSession | null>
    send(sessionId: string, message: string): void
    release(sessionId: string): void
    onMessage(listener: (event: { sessionId: string; message: string }) => void): () => void
    onClosed(listener: (sessionId: string) => void): () => void
    running(): Promise<RunningLanguageServer[]>
    stop(sessionId: string): Promise<void>
  }
  activity: {
    list(): Promise<ActivityEntry[]>
    clear(): Promise<void>
    onAdded(listener: (entry: ActivityEntry) => void): () => void
    live(): Promise<LiveAgent[]>
  }
  app: {
    listRunningTasks(): Promise<RunningTask[]>
    confirmClose(): Promise<void>
    hardwareAcceleration(): Promise<{ isSaved: boolean; isActive: boolean }>
    setHardwareAcceleration(isEnabled: boolean): Promise<void>
    restart(): Promise<void>
    onCloseRequested(listener: () => void): () => void
    log(level: 'error' | 'warning' | 'info', message: string): void
    openLogFolder(): Promise<void>
    onHandlerError(listener: (message: string) => void): () => void
  }
  storage: {
    report(): Promise<StorageReport>
    clearAppCache(): Promise<void>
    clearLeftoverTemp(): Promise<void>
    clearTeamTaskFiles(): Promise<void>
    locations(): Promise<DataLocation[]>
    openLocation(id: string): Promise<void>
    conversations(): Promise<ConversationStorage>
    chooseConversationFolder(): Promise<string | null>
    moveConversations(id: string): Promise<ConversationMoveResult>
    moveConversationsBack(id: string): Promise<ConversationMoveResult>
    history(): Promise<UniversalHistoryReport>
    saveHistoryNow(): Promise<void>
    moveHistory(): Promise<ConversationMoveResult>
    setHistoryKeep(days: number | null): Promise<void>
    openHistoryFolder(agent: string | null): Promise<void>
    disks(): Promise<DiskReport[]>
  }
  updater: {
    status(): Promise<UpdateStatus>
    check(): Promise<void>
    download(): Promise<void>
    install(): Promise<void>
    openReleases(version?: string): Promise<void>
    onStatusChanged(listener: (status: UpdateStatus) => void): () => void
  }
}
