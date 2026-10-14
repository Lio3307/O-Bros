import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron'
import { IpcChannel, type DesktopApi, type PtyDataEvent, type PtyExitEvent } from '../shared/ipc'
import type { UpdateStatus } from '../shared/types'

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
    onData: (listener) => subscribe<PtyDataEvent>(IpcChannel.ptyData, listener),
    onExit: (listener) => subscribe<PtyExitEvent>(IpcChannel.ptyExit, listener)
  },
  accounts: {
    scan: () => ipcRenderer.invoke(IpcChannel.accountsScan),
    createFolder: (provider, accountName) => ipcRenderer.invoke(IpcChannel.accountsCreateFolder, provider, accountName)
  },
  usage: {
    get: (account) => ipcRenderer.invoke(IpcChannel.usageGet, account)
  },
  projects: {
    list: () => ipcRenderer.invoke(IpcChannel.projectsList),
    addRoot: () => ipcRenderer.invoke(IpcChannel.projectsAddRoot),
    removeRoot: (rootPath) => ipcRenderer.invoke(IpcChannel.projectsRemoveRoot, rootPath),
    scripts: (rootPath) => ipcRenderer.invoke(IpcChannel.projectsScripts, rootPath)
  },
  files: {
    list: (directoryPath) => ipcRenderer.invoke(IpcChannel.fsList, directoryPath),
    read: (filePath) => ipcRenderer.invoke(IpcChannel.fsRead, filePath),
    write: (filePath, content) => ipcRenderer.invoke(IpcChannel.fsWrite, filePath, content),
    search: (request) => ipcRenderer.invoke(IpcChannel.fsSearch, request),
    create: (request) => ipcRenderer.invoke(IpcChannel.fsCreate, request),
    rename: (request) => ipcRenderer.invoke(IpcChannel.fsRename, request),
    trash: (path) => ipcRenderer.invoke(IpcChannel.fsTrash, path),
    pathOf: (file) => webUtils.getPathForFile(file)
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
    switchBranch: (request) => ipcRenderer.invoke(IpcChannel.gitSwitch, request)
  },
  history: {
    list: (day) => ipcRenderer.invoke(IpcChannel.historyList, day),
    get: (filePath) => ipcRenderer.invoke(IpcChannel.historyGet, filePath),
    remove: (filePaths, permanently) => ipcRenderer.invoke(IpcChannel.historyRemove, filePaths, permanently),
    storage: () => ipcRenderer.invoke(IpcChannel.historyStorage),
    removeOlderThan: (request) => ipcRenderer.invoke(IpcChannel.historyRemoveOlder, request)
  },
  resources: {
    get: () => ipcRenderer.invoke(IpcChannel.resourcesGet)
  },
  tools: {
    lint: (request) => ipcRenderer.invoke(IpcChannel.toolsLint, request),
    format: (request) => ipcRenderer.invoke(IpcChannel.toolsFormat, request)
  },
  agents: {
    listCommands: () => ipcRenderer.invoke(IpcChannel.agentsCommands),
    registry: () => ipcRenderer.invoke(IpcChannel.agentsRegistry)
  },
  shell: {
    reveal: (path) => ipcRenderer.invoke(IpcChannel.shellReveal, path)
  },
  ports: {
    list: () => ipcRenderer.invoke(IpcChannel.portsList),
    stop: (pid) => ipcRenderer.invoke(IpcChannel.portsStop, pid)
  },
  app: {
    listRunningTasks: () => ipcRenderer.invoke(IpcChannel.appListRunningTasks),
    confirmClose: () => ipcRenderer.invoke(IpcChannel.appConfirmClose),
    onCloseRequested: (listener) => subscribe<undefined>(IpcChannel.appCloseRequested, () => listener()),
    log: (level, message) => ipcRenderer.send(IpcChannel.appLog, level, message),
    openLogFolder: () => ipcRenderer.invoke(IpcChannel.appOpenLogFolder)
  },
  storage: {
    report: () => ipcRenderer.invoke(IpcChannel.storageReport),
    clearAppCache: () => ipcRenderer.invoke(IpcChannel.storageClearAppCache),
    clearLeftoverTemp: () => ipcRenderer.invoke(IpcChannel.storageClearLeftoverTemp),
    locations: () => ipcRenderer.invoke(IpcChannel.storageLocations),
    openLocation: (id) => ipcRenderer.invoke(IpcChannel.storageOpenLocation, id)
  },
  updater: {
    status: () => ipcRenderer.invoke(IpcChannel.updaterStatus),
    check: () => ipcRenderer.invoke(IpcChannel.updaterCheck),
    download: () => ipcRenderer.invoke(IpcChannel.updaterDownload),
    openReleases: () => ipcRenderer.invoke(IpcChannel.updaterOpenReleases),
    onStatusChanged: (listener) => subscribe<UpdateStatus>(IpcChannel.updaterStatusChanged, listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
