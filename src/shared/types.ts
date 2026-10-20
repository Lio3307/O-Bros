import type { CommitIdentity } from './commitIdentity'

export type ProviderId = 'claude' | 'codex'

export interface DetectedAccount {
  id: string
  provider: ProviderId
  configDir: string
  label: string
  isSystemDefault: boolean
}

export interface AccountRef {
  provider: ProviderId
  configDir: string
}

export interface UsageWindow {
  percentUsed: number
  resetsAt: number
}

export interface AccountUsage {
  fiveHour: UsageWindow | null
  weekly: UsageWindow | null
  errorMessage: string | null
}

export interface ProjectFolder {
  name: string
  path: string
  branch: string | null
}

export interface RepositoryEntry {
  name: string
  path: string
  branch: string
  relativePath: string
}

export interface ProjectRoot {
  name: string
  path: string
  branch: string | null
  folders: ProjectFolder[]
}

export type FileChangeKind = 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'conflicted'

export type GitOperationKind = 'merge' | 'rebase' | 'cherryPick' | 'revert'

export interface GitOperation {
  kind: GitOperationKind
  incoming: string | null
}

export type GitConflictSide = 'current' | 'incoming'

export interface GitResolveRequest {
  repoPath: string
  filePath: string
  side: GitConflictSide | null
}

export interface GitFileChange {
  path: string
  kind: FileChangeKind
  isStaged: boolean
  addedLines: number
  removedLines: number
}

export interface GitStatus {
  branch: string
  headHash: string | null
  upstream: string | null
  ahead: number
  behind: number
  lastFetchedAt: number | null
  operation: GitOperation | null
  changes: GitFileChange[]
}

export interface GitDiffRequest {
  repoPath: string
  filePath: string
  isStaged: boolean
  isUntracked: boolean
  commitHash?: string
}

export interface GitCommit {
  hash: string
  shortHash: string
  parents: string[]
  author: string
  authoredAt: number
  refs: string[]
  subject: string
}

export interface GitCommitFile {
  path: string
  addedLines: number
  removedLines: number
}

export interface GitLogRequest {
  repoPath: string
  limit: number
  allBranches?: boolean
  branch?: string
}

export interface GitCommitFilesRequest {
  repoPath: string
  hash: string
}

export interface DirectoryEntry {
  name: string
  path: string
  isDirectory: boolean
}

export type SearchMode = 'names' | 'contents'

export interface SearchRequest {
  root: string
  query: string
  mode: SearchMode
}

export interface SearchHit {
  name: string
  path: string
}

export interface SessionSummary {
  filePath: string
  sessionId: string
  provider: ProviderId
  account: AccountRef | null
  title: string
  projectPath: string | null
  lastActiveAt: number
  sizeBytes: number
  teamMemberName: string | null
}

export interface TeamChatsReport {
  sessionCount: number
  totalBytes: number
}

export interface SessionSearchHit extends SessionSummary {
  snippet: string
}

export interface SessionAgeBucket {
  days: number | null
  sessionCount: number
  totalBytes: number
}

export interface SessionStorageReport {
  provider: ProviderId
  sessionCount: number
  totalBytes: number
  oldestAt: number | null
  buckets: SessionAgeBucket[]
}

export interface RemoveOlderSessionsRequest {
  provider: ProviderId
  days: number | null
  permanently: boolean
}

export interface RemoveSessionsResult {
  removedCount: number
  freedBytes: number
  failedCount: number
  failureReason: string | null
}

export interface SessionMessage {
  role: 'user' | 'assistant'
  text: string
}

export interface ProcessUsage {
  cpuPercent: number
  workingSetBytes: number
  privateBytes: number
}

export interface TerminalResource extends ProcessUsage {
  paneId: string
}

export interface LanguageServerResource extends ProcessUsage {
  sessionId: string
  title: string
  rootPath: string
}

export interface ResourceSnapshot {
  total: ProcessUsage
  app: ProcessUsage
  terminals: TerminalResource[]
  languageServers: LanguageServerResource[]
}

export type LintSeverity = 'error' | 'warning'

export interface LintDiagnostic {
  message: string
  severity: LintSeverity
  ruleCode: string | null
  helpText: string | null
  line: number
  column: number
  length: number
}

export interface LintRequest {
  filePath: string
  content: string
  rootPath: string | null
}

export interface LintResult {
  diagnostics: LintDiagnostic[]
  errorMessage: string | null
}

export interface FormatRequest {
  filePath: string
  content: string
}

export interface FormatResult {
  formatted: string | null
  errorMessage: string | null
}

export type AddRootOutcome = 'added' | 'cancelled' | 'already-added' | 'inside-existing'

export interface AddRootResult {
  roots: ProjectRoot[]
  outcome: AddRootOutcome
  matchedRootPath: string | null
  chosenPath: string | null
}

export interface RunningTask {
  paneId: string
  commands: string[]
}

export type EntryKind = 'file' | 'folder'

export interface CreateEntryRequest {
  parentPath: string
  name: string
  kind: EntryKind
}

export interface RenameEntryRequest {
  path: string
  newName: string
}

export interface GitPathsRequest {
  repoPath: string
  filePaths: string[]
}

export interface GitCommitRequest {
  repoPath: string
  message: string
}

export interface GitDiscardRequest {
  repoPath: string
  filePath: string
  isUntracked: boolean
}

export interface GitBranchList {
  current: string | null
  branches: string[]
}

export interface GitStashEntry {
  ref: string
  message: string
  createdAt: number
}

export interface GitStashRequest {
  repoPath: string
  message?: string
}

export interface GitStashRefRequest {
  repoPath: string
  ref: string
}

export interface GitCreateBranchRequest {
  repoPath: string
  name: string
}

export interface GitRenameBranchRequest {
  repoPath: string
  from: string
  to: string
}

export interface GitDeleteBranchRequest {
  repoPath: string
  name: string
  force: boolean
}

export interface GitAmendRequest {
  repoPath: string
  message: string
}

export interface GitCheckoutRequest {
  repoPath: string
  branch: string
}

export interface ScriptEntry {
  name: string
  command: string
}

export interface ProjectScripts {
  packageManager: string
  scripts: ScriptEntry[]
}

export interface ListeningPort {
  port: number
  pid: number
  processName: string
  paneId: string
}

export type DataLocationKind =
  | 'program'
  | 'appData'
  | 'logs'
  | 'updater'
  | 'claudeSessions'
  | 'codexSessions'
  | 'teamTaskFiles'
  | 'wotSkill'
  | 'agentHistory'

export interface DataLocationCopy {
  title: string
  note: string
  command: string
}

export interface DataLocation {
  id: string
  kind: DataLocationKind
  path: string
  accountLabel: string | null
  copy: DataLocationCopy | null
}

export interface ConversationFolder {
  id: string
  title: string
  program: string
  path: string
  movedTo: string | null
  sizeBytes: number
  holdsLogin: boolean
}

export interface ConversationStorage {
  targetFolder: string | null
  folders: ConversationFolder[]
}

export interface ConversationMoveResult {
  isDone: boolean
  message: string
}

export interface StorageReport {
  appCacheBytes: number
  leftoverTempBytes: number
  leftoverTempFolders: number
  teamTaskFileBytes: number
  teamTaskFileCount: number
}

export type UpdateState = 'unavailable' | 'idle' | 'checking' | 'upToDate' | 'available' | 'downloading' | 'ready' | 'failed'

export interface UpdateStatus {
  state: UpdateState
  currentVersion: string
  latestVersion: string | null
  percent: number
  message: string | null
}

export interface ReviewBaseline {
  repoPath: string
  commit: string
  untrackedPaths: string[]
}

export interface ReviewChange {
  path: string
  kind: FileChangeKind
  addedLines: number
  removedLines: number
}

export interface ReviewFileRequest {
  baseline: ReviewBaseline
  change: ReviewChange
}

export type TeamMemberState = 'starting' | 'working' | 'idle' | 'waiting' | 'exited'

export interface TeamMember {
  id: string
  name: string
  agentName: string
  command: string
  cwd: string | null
  summonedByPaneId: string
  task: string
  createdAt: number
  state: TeamMemberState
}

export type WotSkillStatus = 'missing' | 'installed' | 'outdated'

export interface WotSkillTarget {
  id: string
  title: string
  readBy: string[]
  iconCommand: string
  skillPath: string
  status: WotSkillStatus
  installedVersion: string | null
  availableVersion: string
}

export interface AgentGitAnswer {
  allowed: boolean
  reason: string
  identity: CommitIdentity | null
  keepCoAuthors: boolean
}

export interface AgentGitRequest {
  kind: 'confirmGit'
  paneId: string
  action: string
  command: string
  cwd: string
  fromAgent: boolean
  isGuarded: boolean
  createsCommit: boolean
  warnings: string[]
}

export type WotRendererRequest =
  | { kind: 'listLaunchers' }
  | { kind: 'readScreen'; memberId: string; lines: number }
  | AgentGitRequest

export interface WotRendererEnvelope {
  requestId: string
  request: WotRendererRequest
}

export interface OpenedBackupFile {
  fileName: string
  text: string
}
