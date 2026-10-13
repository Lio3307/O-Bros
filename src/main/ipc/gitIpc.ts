import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type {
  GitCheckoutRequest,
  GitCommitRequest,
  GitDiffRequest,
  GitDiscardRequest,
  GitPathsRequest
} from '../../shared/types'
import {
  commitStaged,
  discardChange,
  listBranches,
  stagePaths,
  switchBranch,
  unstagePaths
} from '../services/gitActions'
import { fetchAndReadStatus, readGitDiff, readGitStatus } from '../services/gitService'

export function registerGitIpc(): void {
  ipcMain.handle(IpcChannel.gitStatus, (_event, repoPath: string) => readGitStatus(repoPath))
  ipcMain.handle(IpcChannel.gitDiff, (_event, request: GitDiffRequest) => readGitDiff(request))
  ipcMain.handle(IpcChannel.gitFetch, (_event, repoPath: string) => fetchAndReadStatus(repoPath))
  ipcMain.handle(IpcChannel.gitStage, (_event, request: GitPathsRequest) => stagePaths(request))
  ipcMain.handle(IpcChannel.gitUnstage, (_event, request: GitPathsRequest) => unstagePaths(request))
  ipcMain.handle(IpcChannel.gitCommit, (_event, request: GitCommitRequest) => commitStaged(request))
  ipcMain.handle(IpcChannel.gitDiscard, (_event, request: GitDiscardRequest) => discardChange(request))
  ipcMain.handle(IpcChannel.gitBranches, (_event, repoPath: string) => listBranches(repoPath))
  ipcMain.handle(IpcChannel.gitSwitch, (_event, request: GitCheckoutRequest) => switchBranch(request))
}
