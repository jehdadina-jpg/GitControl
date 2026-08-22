// Shared types between the Electron main process and the React renderer.
// Keep this file free of any Node/DOM-specific imports so it can be used on both sides.

export type FileStatusCode =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'untracked'
  | 'conflicted'
  | 'ignored'
  | 'unknown'

export interface ChangedFile {
  path: string
  originalPath?: string
  index: FileStatusCode
  worktree: FileStatusCode
  staged: boolean
  unstaged: boolean
  conflicted: boolean
}

export interface RepoStatus {
  repoPath: string
  branch: string | null
  upstream: string | null
  ahead: number
  behind: number
  detached: boolean
  clean: boolean
  files: ChangedFile[]
  mergeInProgress: boolean
  rebaseInProgress: boolean
  conflicted: string[]
}

export interface BranchInfo {
  name: string
  current: boolean
  remote: boolean
  upstream: string | null
  ahead: number
  behind: number
  lastCommitHash: string | null
  lastCommitMessage: string | null
  lastCommitDate: string | null
}

export interface BranchList {
  current: string | null
  local: BranchInfo[]
  remote: BranchInfo[]
}

export interface CommitInfo {
  hash: string
  shortHash: string
  parents: string[]
  author: string
  authorEmail: string
  date: string
  message: string
  subject: string
  refs: string[]
}

export interface DiffResult {
  filePath: string
  oldPath?: string
  binary: boolean
  hunks: DiffHunk[]
  raw: string
}

export interface DiffHunk {
  header: string
  lines: DiffLine[]
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'meta'
  content: string
  oldLine?: number
  newLine?: number
}

export interface StashEntry {
  index: number
  ref: string
  message: string
  date: string
  branch: string | null
}

export interface RemoteInfo {
  name: string
  fetchUrl: string
  pushUrl: string
}

export interface GitToolStatus {
  installed: boolean
  version: string | null
  path: string | null
}

export interface GitHubStatus {
  installed: boolean
  version: string | null
  authenticated: boolean
  login: string | null
}

export interface PullRequestInfo {
  number: number
  title: string
  url: string
  state: string
  isDraft: boolean
  headRefName: string
  baseRefName: string
  author: string | null
}

export interface RepoEntry {
  id: string
  path: string
  name: string
  pinned: boolean
  lastOpened: string
}

export interface AppSettings {
  gitExecutable: string
  ghExecutable: string
  defaultBranch: string
  terminalPreference: 'powershell' | 'cmd' | 'wsl'
  openReposOnStartup: boolean
  confirmDestructiveActions: boolean
  theme: 'dark' | 'system'
}

export interface CommandLogEntry {
  id: string
  command: string
  args: string[]
  cwd: string
  startedAt: string
  finishedAt?: string
  exitCode?: number | null
  stdout?: string
  stderr?: string
  ok?: boolean
}

// ---- IPC operation result envelope ----

export type GitErrorKind =
  | 'not-a-repo'
  | 'git-not-found'
  | 'gh-not-found'
  | 'gh-not-authenticated'
  | 'merge-conflict'
  | 'rebase-conflict'
  | 'auth-failed'
  | 'no-remote'
  | 'detached-head'
  | 'diverged'
  | 'nothing-to-commit'
  | 'unknown'

export interface GitError {
  kind: GitErrorKind
  message: string
  detail?: string
  affectedFiles?: string[]
  exitCode?: number | null
}

export type OpResult<T> =
  | { ok: true; data: T; log: CommandLogEntry[] }
  | { ok: false; error: GitError; log: CommandLogEntry[] }
