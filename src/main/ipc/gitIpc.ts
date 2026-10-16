import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type {
  GitAmendRequest,
  GitCheckoutRequest,
  GitCommitFilesRequest,
  GitCommitRequest,
  GitDiffRequest,
  GitCreateBranchRequest,
  GitDeleteBranchRequest,
  GitDiscardRequest,
  GitLogRequest,
  GitPathsRequest,
  GitRenameBranchRequest,
  GitStashRefRequest,
  GitStashRequest,
  ReviewBaseline,
  ReviewFileRequest
} from '../../shared/types'
import {
  commitStaged,
  discardChange,
  listBranches,
  stagePaths,
  switchBranch,
  unstagePaths
} from '../services/gitActions'
import {
  amendLastCommitMessage,
  createBranch,
  deleteBranch,
  readLastCommitMessage,
  renameBranch,
  undoLastCommit
} from '../services/gitBranchActions'
import { readCommitFiles, readCommitLog } from '../services/gitHistory'
import { pullFastForward, pushCurrentBranch } from '../services/gitRemote'
import { applyStash, dropStash, listStashes, stashChanges } from '../services/gitStash'
import { findPushTraces } from '../services/wot/pushTraces'
import { loadAgentCatalog } from '../services/wot/agentCatalog'
import { describeTraces } from '../../shared/agentTraces'
import { assertInsideProjectRoots } from '../pathGuard'
import { captureReviewBaseline, readReviewChanges, readReviewDiff, revertReviewFile } from '../services/gitReview'
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
  ipcMain.handle(IpcChannel.gitLog, (_event, request: GitLogRequest) => readCommitLog(request))
  ipcMain.handle(IpcChannel.gitCommitFiles, (_event, request: GitCommitFilesRequest) => readCommitFiles(request))
  ipcMain.handle(IpcChannel.gitCreateBranch, (_event, request: GitCreateBranchRequest) => createBranch(request))
  ipcMain.handle(IpcChannel.gitRenameBranch, (_event, request: GitRenameBranchRequest) => renameBranch(request))
  ipcMain.handle(IpcChannel.gitDeleteBranch, (_event, request: GitDeleteBranchRequest) => deleteBranch(request))
  ipcMain.handle(IpcChannel.gitUndoCommit, (_event, repoPath: string) => undoLastCommit(repoPath))
  ipcMain.handle(IpcChannel.gitLastMessage, (_event, repoPath: string) => readLastCommitMessage(repoPath))
  ipcMain.handle(IpcChannel.gitAmendCommit, (_event, request: GitAmendRequest) => amendLastCommitMessage(request))
  ipcMain.handle(IpcChannel.gitPull, (_event, repoPath: string) => pullFastForward(repoPath))
  ipcMain.handle(IpcChannel.gitPush, (_event, repoPath: string) => pushCurrentBranch(repoPath))
  ipcMain.handle(IpcChannel.gitStash, (_event, request: GitStashRequest) => stashChanges(request))
  ipcMain.handle(IpcChannel.gitStashList, (_event, repoPath: string) => listStashes(repoPath))
  ipcMain.handle(IpcChannel.gitStashApply, (_event, request: GitStashRefRequest) => applyStash(request))
  ipcMain.handle(IpcChannel.gitStashDrop, (_event, request: GitStashRefRequest) => dropStash(request))
  ipcMain.handle(IpcChannel.gitAgentTraces, async (_event, repoPath: string) => {
    await assertInsideProjectRoots(repoPath)
    return describeTraces(await findPushTraces(repoPath, [], await loadAgentCatalog()))
  })
  ipcMain.handle(IpcChannel.gitReviewBaseline, (_event, repoPath: string) => captureReviewBaseline(repoPath))
  ipcMain.handle(IpcChannel.gitReviewChanges, (_event, baseline: ReviewBaseline) => readReviewChanges(baseline))
  ipcMain.handle(IpcChannel.gitReviewDiff, (_event, request: ReviewFileRequest) => readReviewDiff(request))
  ipcMain.handle(IpcChannel.gitReviewRevert, (_event, request: ReviewFileRequest) => revertReviewFile(request))
  ipcMain.handle(IpcChannel.gitSwitch, (_event, request: GitCheckoutRequest) => switchBranch(request))
}
