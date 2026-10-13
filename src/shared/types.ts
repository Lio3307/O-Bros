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

export interface ProjectRoot {
  name: string
  path: string
  branch: string | null
  folders: ProjectFolder[]
}

export type FileChangeKind = 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked'

export interface GitFileChange {
  path: string
  kind: FileChangeKind
  isStaged: boolean
  addedLines: number
  removedLines: number
}

export interface GitStatus {
  branch: string
  upstream: string | null
  ahead: number
  behind: number
  lastFetchedAt: number | null
  changes: GitFileChange[]
}

export interface GitDiffRequest {
  repoPath: string
  filePath: string
  isStaged: boolean
  isUntracked: boolean
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
  provider: ProviderId
  title: string
  projectPath: string | null
  lastActiveAt: number
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

export interface ResourceSnapshot {
  total: ProcessUsage
  app: ProcessUsage
  terminals: TerminalResource[]
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
