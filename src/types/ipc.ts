// Contract between the preload bridge (electron/preload.ts) and the renderer.
// Every method here maps 1:1 to an allowlisted IPC channel — the renderer can
// never invoke an arbitrary channel, only these named, typed functions.

import type {
  AppSettings,
  BranchList,
  CommandLogEntry,
  CommitInfo,
  DiffResult,
  GitHubStatus,
  GitToolStatus,
  OpResult,
  PullRequestInfo,
  RemoteInfo,
  RepoEntry,
  RepoStatus,
  StashEntry,
} from './git'

export interface GitControlApi {
  // App / environment
  checkGit: () => Promise<GitToolStatus>
  checkGh: (repoPath: string) => Promise<GitHubStatus>
  onCommandLog: (cb: (entry: CommandLogEntry) => void) => () => void

  // Filesystem / repo selection
  selectFolder: () => Promise<string | null>
  selectCloneDestination: () => Promise<string | null>
  isGitRepository: (repoPath: string) => Promise<boolean>
  openInTerminal: (repoPath: string) => Promise<void>
  openInVsCode: (repoPath: string) => Promise<void>
  getPathForFile: (file: File) => string

  // Recent repositories
  getRepos: () => Promise<RepoEntry[]>
  addRepo: (repoPath: string) => Promise<RepoEntry[]>
  removeRepo: (id: string) => Promise<RepoEntry[]>
  togglePinRepo: (id: string) => Promise<RepoEntry[]>

  // Settings
  getSettings: () => Promise<AppSettings>
  updateSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>

  // Git core
  status: (repoPath: string) => Promise<OpResult<RepoStatus>>
  fetch: (repoPath: string) => Promise<OpResult<null>>
  pull: (repoPath: string) => Promise<OpResult<null>>
  push: (repoPath: string, opts?: { setUpstream?: string; force?: boolean }) => Promise<OpResult<null>>

  stageFiles: (repoPath: string, files: string[]) => Promise<OpResult<null>>
  unstageFiles: (repoPath: string, files: string[]) => Promise<OpResult<null>>
  discardFiles: (repoPath: string, files: string[]) => Promise<OpResult<null>>
  commit: (repoPath: string, message: string, files: string[] | null) => Promise<OpResult<null>>

  diff: (repoPath: string, filePath: string, staged: boolean) => Promise<OpResult<DiffResult>>
  diffUntracked: (repoPath: string, filePath: string) => Promise<OpResult<DiffResult>>

  listBranches: (repoPath: string) => Promise<OpResult<BranchList>>
  createBranch: (repoPath: string, name: string, checkout: boolean) => Promise<OpResult<null>>
  checkoutBranch: (repoPath: string, name: string) => Promise<OpResult<null>>
  deleteBranch: (repoPath: string, name: string, force: boolean) => Promise<OpResult<null>>
  renameBranch: (repoPath: string, oldName: string, newName: string) => Promise<OpResult<null>>
  pushBranch: (repoPath: string, name: string) => Promise<OpResult<null>>

  mergeBranch: (repoPath: string, branch: string) => Promise<OpResult<null>>
  rebaseBranch: (repoPath: string, onto: string) => Promise<OpResult<null>>
  abortMerge: (repoPath: string) => Promise<OpResult<null>>
  abortRebase: (repoPath: string) => Promise<OpResult<null>>

  stashList: (repoPath: string) => Promise<OpResult<StashEntry[]>>
  stashCreate: (repoPath: string, message: string | undefined, includeUntracked: boolean) => Promise<OpResult<null>>
  stashApply: (repoPath: string, ref: string) => Promise<OpResult<null>>
  stashPop: (repoPath: string, ref: string) => Promise<OpResult<null>>
  stashDrop: (repoPath: string, ref: string) => Promise<OpResult<null>>

  logHistory: (repoPath: string, limit?: number) => Promise<OpResult<CommitInfo[]>>
  commitDiff: (repoPath: string, hash: string) => Promise<OpResult<DiffResult[]>>

  listRemotes: (repoPath: string) => Promise<OpResult<RemoteInfo[]>>
  cloneRepository: (url: string, destination: string) => Promise<OpResult<string>>

  createPullRequest: (
    repoPath: string,
    opts: { base: string; head: string; title: string; body: string; draft?: boolean },
  ) => Promise<OpResult<PullRequestInfo>>
  getPullRequestForBranch: (repoPath: string, branch: string) => Promise<OpResult<PullRequestInfo | null>>
}

declare global {
  interface Window {
    gitControl: GitControlApi
  }
}
