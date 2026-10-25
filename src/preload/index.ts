import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron'
import { IpcChannel, type DesktopApi, type PaneAgentEvent, type PtyDataEvent, type PtyExitEvent } from '../shared/ipc'
import type { ActivityEntry } from '../shared/activity'
import type { TeamMember, UpdateStatus, WotRendererEnvelope } from '../shared/types'

function subscribe<Payload>(channel: string, listener: (payload: Payload) => void): () => void {
  const handler = (_event: IpcRendererEvent, payload: Payload) => listener(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const api: DesktopApi = {
  pty: {
    create: (request) => ipcRenderer.invoke(IpcChannel.ptyCreate, request),
    input: (id, data) => ipcRenderer.send(IpcChannel.ptyInput, id, data),
    resize: (id, columns, rows) => ipcRenderer.send(IpcChannel.ptyResize, id, columns, rows),
    kill: (id) => ipcRenderer.send(IpcChannel.ptyKill, id),
    typeWhenReady: (id, text) => ipcRenderer.invoke(IpcChannel.ptyTypeWhenReady, id, text),
    onData: (listener) => subscribe<PtyDataEvent>(IpcChannel.ptyData, listener),
    onExit: (listener) => subscribe<PtyExitEvent>(IpcChannel.ptyExit, listener),
    onAgentChanged: (listener) => subscribe<PaneAgentEvent>(IpcChannel.ptyAgentChanged, listener)
  },
  accounts: {
    scan: () => ipcRenderer.invoke(IpcChannel.accountsScan),
    createFolder: (provider, accountName) => ipcRenderer.invoke(IpcChannel.accountsCreateFolder, provider, accountName),
    agentLogins: () => ipcRenderer.invoke(IpcChannel.accountsAgentLogins),
    providerKeyHints: () => ipcRenderer.invoke(IpcChannel.accountsProviderKeyHints),
    saveProviderKey: (providerId, apiKey) => ipcRenderer.invoke(IpcChannel.accountsSaveProviderKey, providerId, apiKey),
    testProvider: (provider) => ipcRenderer.invoke(IpcChannel.accountsTestProvider, provider)
  },
  usage: {
    get: (account) => ipcRenderer.invoke(IpcChannel.usageGet, account),
    credits: () => ipcRenderer.invoke(IpcChannel.usageCredits),
    facts: () => ipcRenderer.invoke(IpcChannel.usageFacts)
  },
  projects: {
    list: () => ipcRenderer.invoke(IpcChannel.projectsList),
    addRoot: (dialogTitle) => ipcRenderer.invoke(IpcChannel.projectsAddRoot, dialogTitle),
    removeRoot: (rootPath) => ipcRenderer.invoke(IpcChannel.projectsRemoveRoot, rootPath),
    relocateRoot: (oldPath) => ipcRenderer.invoke(IpcChannel.projectsRelocateRoot, oldPath),
    scripts: (rootPath) => ipcRenderer.invoke(IpcChannel.projectsScripts, rootPath),
    repositories: (folderPath) => ipcRenderer.invoke(IpcChannel.projectsRepositories, folderPath),
    searchDepth: () => ipcRenderer.invoke(IpcChannel.projectsSearchDepth),
    setSearchDepth: (depth) => ipcRenderer.invoke(IpcChannel.projectsSetSearchDepth, depth)
  },
  files: {
    list: (directoryPath) => ipcRenderer.invoke(IpcChannel.fsList, directoryPath),
    read: (filePath) => ipcRenderer.invoke(IpcChannel.fsRead, filePath),
    readImage: (filePath) => ipcRenderer.invoke(IpcChannel.fsReadImage, filePath),
    saveClipboardImage: () => ipcRenderer.invoke(IpcChannel.fsSaveClipboardImage),
    write: (filePath, content) => ipcRenderer.invoke(IpcChannel.fsWrite, filePath, content),
    search: (request) => ipcRenderer.invoke(IpcChannel.fsSearch, request),
    create: (request) => ipcRenderer.invoke(IpcChannel.fsCreate, request),
    rename: (request) => ipcRenderer.invoke(IpcChannel.fsRename, request),
    trash: (path) => ipcRenderer.invoke(IpcChannel.fsTrash, path),
    pathOf: (file) => webUtils.getPathForFile(file),
    watch: (filePath) => ipcRenderer.invoke(IpcChannel.fsWatch, filePath),
    unwatch: (filePath) => ipcRenderer.invoke(IpcChannel.fsUnwatch, filePath),
    onChanged: (listener) => subscribe<string>(IpcChannel.fsChanged, listener)
  },
  git: {
    status: (repoPath) => ipcRenderer.invoke(IpcChannel.gitStatus, repoPath),
    diff: (request) => ipcRenderer.invoke(IpcChannel.gitDiff, request),
    fetch: (repoPath) => ipcRenderer.invoke(IpcChannel.gitFetch, repoPath),
    stage: (request) => ipcRenderer.invoke(IpcChannel.gitStage, request),
    unstage: (request) => ipcRenderer.invoke(IpcChannel.gitUnstage, request),
    commit: (request) => ipcRenderer.invoke(IpcChannel.gitCommit, request),
    discard: (request) => ipcRenderer.invoke(IpcChannel.gitDiscard, request),
    branches: (repoPath) => ipcRenderer.invoke(IpcChannel.gitBranches, repoPath),
    log: (request) => ipcRenderer.invoke(IpcChannel.gitLog, request),
    commitFiles: (request) => ipcRenderer.invoke(IpcChannel.gitCommitFiles, request),
    switchBranch: (request) => ipcRenderer.invoke(IpcChannel.gitSwitch, request),
    createBranch: (request) => ipcRenderer.invoke(IpcChannel.gitCreateBranch, request),
    renameBranch: (request) => ipcRenderer.invoke(IpcChannel.gitRenameBranch, request),
    deleteBranch: (request) => ipcRenderer.invoke(IpcChannel.gitDeleteBranch, request),
    undoCommit: (repoPath) => ipcRenderer.invoke(IpcChannel.gitUndoCommit, repoPath),
    lastMessage: (repoPath) => ipcRenderer.invoke(IpcChannel.gitLastMessage, repoPath),
    amendCommit: (request) => ipcRenderer.invoke(IpcChannel.gitAmendCommit, request),
    pull: (repoPath) => ipcRenderer.invoke(IpcChannel.gitPull, repoPath),
    push: (repoPath) => ipcRenderer.invoke(IpcChannel.gitPush, repoPath),
    stash: (request) => ipcRenderer.invoke(IpcChannel.gitStash, request),
    stashList: (repoPath) => ipcRenderer.invoke(IpcChannel.gitStashList, repoPath),
    stashApply: (request) => ipcRenderer.invoke(IpcChannel.gitStashApply, request),
    stashDrop: (request) => ipcRenderer.invoke(IpcChannel.gitStashDrop, request),
    resolveConflict: (request) => ipcRenderer.invoke(IpcChannel.gitResolveConflict, request),
    continueOperation: (repoPath) => ipcRenderer.invoke(IpcChannel.gitContinueOperation, repoPath),
    abortOperation: (repoPath) => ipcRenderer.invoke(IpcChannel.gitAbortOperation, repoPath),
    agentTraces: (repoPath) => ipcRenderer.invoke(IpcChannel.gitAgentTraces, repoPath),
    reviewBaseline: (repoPath) => ipcRenderer.invoke(IpcChannel.gitReviewBaseline, repoPath),
    reviewChanges: (baseline) => ipcRenderer.invoke(IpcChannel.gitReviewChanges, baseline),
    reviewDiff: (request) => ipcRenderer.invoke(IpcChannel.gitReviewDiff, request),
    reviewRevert: (request) => ipcRenderer.invoke(IpcChannel.gitReviewRevert, request)
  },
  backup: {
    save: (text, suggestedName) => ipcRenderer.invoke(IpcChannel.backupSave, text, suggestedName),
    open: () => ipcRenderer.invoke(IpcChannel.backupOpen),
    addProjectFolders: (folderPaths) => ipcRenderer.invoke(IpcChannel.backupAddProjectFolders, folderPaths)
  },
  wot: {
    listMembers: () => ipcRenderer.invoke(IpcChannel.wotListMembers),
    closeMember: (memberId) => ipcRenderer.invoke(IpcChannel.wotCloseMember, memberId),
    onMembers: (listener) => subscribe<TeamMember[]>(IpcChannel.wotMembers, listener),
    onRequest: (listener) => subscribe<WotRendererEnvelope>(IpcChannel.wotRequest, listener),
    respond: (requestId, answer, errorMessage) => ipcRenderer.send(IpcChannel.wotRespond, requestId, answer, errorMessage),
    skillTargets: () => ipcRenderer.invoke(IpcChannel.wotSkillTargets),
    installSkill: (targetId) => ipcRenderer.invoke(IpcChannel.wotInstallSkill, targetId),
    removeSkill: (targetId) => ipcRenderer.invoke(IpcChannel.wotRemoveSkill, targetId),
    isInstalled: () => ipcRenderer.invoke(IpcChannel.wotIsInstalled),
    onNotice: (listener) => subscribe<string>(IpcChannel.wotNotice, listener),
    setPolicy: (policy) => ipcRenderer.invoke(IpcChannel.wotSetPolicy, policy),
    stopAll: () => ipcRenderer.invoke(IpcChannel.wotStopAll),
    agents: () => ipcRenderer.invoke(IpcChannel.wotAgents)
  },
  history: {
    list: () => ipcRenderer.invoke(IpcChannel.historyList),
    get: (filePath) => ipcRenderer.invoke(IpcChannel.historyGet, filePath),
    search: (query) => ipcRenderer.invoke(IpcChannel.historySearch, query),
    remove: (filePaths, permanently) => ipcRenderer.invoke(IpcChannel.historyRemove, filePaths, permanently),
    storage: () => ipcRenderer.invoke(IpcChannel.historyStorage),
    removeOlderThan: (request) => ipcRenderer.invoke(IpcChannel.historyRemoveOlder, request),
    teamChats: () => ipcRenderer.invoke(IpcChannel.historyTeamChats),
    removeTeamChats: (permanently) => ipcRenderer.invoke(IpcChannel.historyRemoveTeamChats, permanently),
    continueWith: (request) => ipcRenderer.invoke(IpcChannel.historyContinueWith, request),
    latestSessionFile: (provider, cwd, since) => ipcRenderer.invoke(IpcChannel.historyLatestSessionFile, provider, cwd, since),
    threads: () => ipcRenderer.invoke(IpcChannel.historyThreads)
  },
  resources: {
    get: () => ipcRenderer.invoke(IpcChannel.resourcesGet),
    app: () => ipcRenderer.invoke(IpcChannel.resourcesApp)
  },
  tools: {
    lint: (request) => ipcRenderer.invoke(IpcChannel.toolsLint, request),
    format: (request) => ipcRenderer.invoke(IpcChannel.toolsFormat, request)
  },
  agents: {
    listCommands: () => ipcRenderer.invoke(IpcChannel.agentsCommands),
    registry: () => ipcRenderer.invoke(IpcChannel.agentsRegistry),
    logo: (command) => ipcRenderer.invoke(IpcChannel.agentsLogo, command)
  },
  shell: {
    reveal: (path) => ipcRenderer.invoke(IpcChannel.shellReveal, path)
  },
  ports: {
    list: () => ipcRenderer.invoke(IpcChannel.portsList),
    stop: (pid) => ipcRenderer.invoke(IpcChannel.portsStop, pid),
    open: (port) => ipcRenderer.invoke(IpcChannel.portsOpen, port)
  },
  lsp: {
    statuses: (folderPath, choices) => ipcRenderer.invoke(IpcChannel.lspStatuses, folderPath, choices),
    start: (request) => ipcRenderer.invoke(IpcChannel.lspStart, request),
    send: (sessionId, message) => ipcRenderer.send(IpcChannel.lspSend, sessionId, message),
    release: (sessionId) => ipcRenderer.send(IpcChannel.lspRelease, sessionId),
    onMessage: (listener) => subscribe<{ sessionId: string; message: string }>(IpcChannel.lspMessage, listener),
    onClosed: (listener) => subscribe<string>(IpcChannel.lspClosed, listener),
    running: () => ipcRenderer.invoke(IpcChannel.lspRunning),
    stop: (sessionId) => ipcRenderer.invoke(IpcChannel.lspStop, sessionId)
  },
  activity: {
    list: () => ipcRenderer.invoke(IpcChannel.activityList),
    clear: () => ipcRenderer.invoke(IpcChannel.activityClear),
    onAdded: (listener) => subscribe<ActivityEntry>(IpcChannel.activityAdded, listener),
    live: () => ipcRenderer.invoke(IpcChannel.activityLive)
  },
  app: {
    listRunningTasks: () => ipcRenderer.invoke(IpcChannel.appListRunningTasks),
    confirmClose: () => ipcRenderer.invoke(IpcChannel.appConfirmClose),
    hardwareAcceleration: () => ipcRenderer.invoke(IpcChannel.appHardwareAcceleration),
    setHardwareAcceleration: (isEnabled) => ipcRenderer.invoke(IpcChannel.appSetHardwareAcceleration, isEnabled),
    restart: () => ipcRenderer.invoke(IpcChannel.appRestart),
    onCloseRequested: (listener) => subscribe<undefined>(IpcChannel.appCloseRequested, () => listener()),
    log: (level, message) => ipcRenderer.send(IpcChannel.appLog, level, message),
    openLogFolder: () => ipcRenderer.invoke(IpcChannel.appOpenLogFolder),
    onHandlerError: (listener) => subscribe<string>(IpcChannel.appHandlerError, listener)
  },
  storage: {
    report: () => ipcRenderer.invoke(IpcChannel.storageReport),
    clearAppCache: () => ipcRenderer.invoke(IpcChannel.storageClearAppCache),
    clearLeftoverTemp: () => ipcRenderer.invoke(IpcChannel.storageClearLeftoverTemp),
    clearTeamTaskFiles: () => ipcRenderer.invoke(IpcChannel.storageClearTeamTaskFiles),
    locations: () => ipcRenderer.invoke(IpcChannel.storageLocations),
    openLocation: (id) => ipcRenderer.invoke(IpcChannel.storageOpenLocation, id),
    conversations: () => ipcRenderer.invoke(IpcChannel.storageConversations),
    chooseConversationFolder: () => ipcRenderer.invoke(IpcChannel.storageChooseConversationFolder),
    moveConversations: (id) => ipcRenderer.invoke(IpcChannel.storageMoveConversations, id),
    moveConversationsBack: (id) => ipcRenderer.invoke(IpcChannel.storageMoveConversationsBack, id),
    history: () => ipcRenderer.invoke(IpcChannel.storageHistory),
    saveHistoryNow: () => ipcRenderer.invoke(IpcChannel.storageSaveHistoryNow),
    moveHistory: () => ipcRenderer.invoke(IpcChannel.storageMoveHistory),
    setHistoryKeep: (days) => ipcRenderer.invoke(IpcChannel.storageSetHistoryKeep, days),
    openHistoryFolder: (agent) => ipcRenderer.invoke(IpcChannel.storageOpenHistoryFolder, agent),
    disks: () => ipcRenderer.invoke(IpcChannel.storageDisks)
  },
  updater: {
    status: () => ipcRenderer.invoke(IpcChannel.updaterStatus),
    check: () => ipcRenderer.invoke(IpcChannel.updaterCheck),
    download: () => ipcRenderer.invoke(IpcChannel.updaterDownload),
    install: () => ipcRenderer.invoke(IpcChannel.updaterInstall),
    openReleases: (version) => ipcRenderer.invoke(IpcChannel.updaterOpenReleases, version),
    onStatusChanged: (listener) => subscribe<UpdateStatus>(IpcChannel.updaterStatusChanged, listener)
  },
  appearance: {
    loadWallpaper: () => ipcRenderer.invoke(IpcChannel.appearanceLoadWallpaper),
    chooseWallpaper: () => ipcRenderer.invoke(IpcChannel.appearanceChooseWallpaper),
    removeWallpaper: () => ipcRenderer.invoke(IpcChannel.appearanceRemoveWallpaper),
    showDesktop: (isSeeThrough) => ipcRenderer.invoke(IpcChannel.appearanceShowDesktop, isSeeThrough)
  }
}

contextBridge.exposeInMainWorld('api', api)
