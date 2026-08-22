import { create } from 'zustand'
import type {
  AppSettings,
  BranchList,
  CommandLogEntry,
  CommitInfo,
  GitHubStatus,
  GitToolStatus,
  PullRequestInfo,
  RemoteInfo,
  RepoEntry,
  RepoStatus,
  StashEntry,
} from '@/types/git'

export type OperationKey =
  | 'status'
  | 'fetch'
  | 'pull'
  | 'push'
  | 'commit'
  | 'branches'
  | 'history'
  | 'stash'
  | 'merge'
  | 'rebase'
  | 'pr'
  | 'clone'

interface RepoState {
  gitTool: GitToolStatus | null
  ghStatus: GitHubStatus | null
  settings: AppSettings | null

  repos: RepoEntry[]
  currentRepoPath: string | null

  status: RepoStatus | null
  branches: BranchList | null
  stashes: StashEntry[]
  commits: CommitInfo[]
  remotes: RemoteInfo[]
  currentPr: PullRequestInfo | null

  stagedSelection: Set<string>
  loading: Partial<Record<OperationKey, boolean>>
  lastErrorMessage: string | null

  commandLog: CommandLogEntry[]

  init: () => Promise<void>
  selectRepo: (repoPath: string) => Promise<void>
  addRepoByPath: (repoPath: string) => Promise<'ok' | 'not-a-repo'>
  removeRepo: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>

  refreshStatus: () => Promise<void>
  refreshBranches: () => Promise<void>
  refreshStashes: () => Promise<void>
  refreshHistory: () => Promise<void>
  refreshAll: () => Promise<void>

  doFetch: () => Promise<void>
  doPull: () => Promise<{ ok: boolean; conflicted?: string[] }>
  doPush: (opts?: { setUpstream?: string; force?: boolean }) => Promise<boolean>

  stageFiles: (files: string[]) => Promise<void>
  unstageFiles: (files: string[]) => Promise<void>
  discardFiles: (files: string[]) => Promise<void>
  doCommit: (message: string, files: string[] | null, push: boolean) => Promise<boolean>

  createBranch: (name: string, checkout: boolean) => Promise<boolean>
  checkoutBranch: (name: string) => Promise<boolean>
  deleteBranch: (name: string, force: boolean) => Promise<boolean>
  pushBranch: (name: string) => Promise<boolean>
  mergeBranch: (branch: string) => Promise<boolean>
  rebaseBranch: (onto: string) => Promise<boolean>

  stashCreate: (message: string | undefined, includeUntracked: boolean) => Promise<void>
  stashApply: (ref: string) => Promise<void>
  stashPop: (ref: string) => Promise<void>
  stashDrop: (ref: string) => Promise<void>

  refreshGh: () => Promise<void>
  createPr: (opts: { base: string; head: string; title: string; body: string; draft?: boolean }) => Promise<PullRequestInfo | null>

  updateSettings: (partial: Partial<AppSettings>) => Promise<void>

  pushCommandLog: (entry: CommandLogEntry) => void
}

function repoName(p: string): string {
  const parts = p.split(/[\\/]/).filter(Boolean)
  return parts[parts.length - 1] ?? p
}

// The store is a module-level singleton, but `init()` can legitimately run
// more than once (React StrictMode's double-invoked effects in dev, or any
// future re-init). Guard so the IPC listener is only ever attached once —
// otherwise duplicate subscriptions push the same log entry twice.
let commandLogListenerAttached = false

export const useRepoStore = create<RepoState>((set, get) => ({
  gitTool: null,
  ghStatus: null,
  settings: null,

  repos: [],
  currentRepoPath: null,

  status: null,
  branches: null,
  stashes: [],
  commits: [],
  remotes: [],
  currentPr: null,

  stagedSelection: new Set(),
  loading: {},
  lastErrorMessage: null,

  commandLog: [],

  init: async () => {
    const [gitTool, repos, settings] = await Promise.all([
      window.gitControl.checkGit(),
      window.gitControl.getRepos(),
      window.gitControl.getSettings(),
    ])
    set({ gitTool, repos, settings })

    if (!commandLogListenerAttached) {
      commandLogListenerAttached = true
      window.gitControl.onCommandLog((entry) => get().pushCommandLog(entry))
    }

    if (settings.openReposOnStartup && repos.length > 0) {
      await get().selectRepo(repos[0].path)
    }
  },

  selectRepo: async (repoPath) => {
    const isRepo = await window.gitControl.isGitRepository(repoPath)
    if (!isRepo) {
      set({ lastErrorMessage: `${repoPath} is not a Git repository.` })
      return
    }
    const repos = await window.gitControl.addRepo(repoPath)
    set({
      currentRepoPath: repoPath,
      repos,
      status: null,
      branches: null,
      stashes: [],
      commits: [],
      currentPr: null,
      stagedSelection: new Set(),
    })
    await get().refreshAll()
  },

  addRepoByPath: async (repoPath) => {
    const isRepo = await window.gitControl.isGitRepository(repoPath)
    if (!isRepo) return 'not-a-repo'
    await get().selectRepo(repoPath)
    return 'ok'
  },

  removeRepo: async (id) => {
    const repos = await window.gitControl.removeRepo(id)
    set({ repos })
  },

  togglePin: async (id) => {
    const repos = await window.gitControl.togglePinRepo(id)
    set({ repos })
  },

  refreshStatus: async () => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    set((s) => ({ loading: { ...s.loading, status: true } }))
    const result = await window.gitControl.status(repoPath)
    set((s) => ({ loading: { ...s.loading, status: false } }))
    if (result.ok) {
      set({ status: result.data })
    } else {
      set({ lastErrorMessage: result.error.message })
    }
  },

  refreshBranches: async () => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    set((s) => ({ loading: { ...s.loading, branches: true } }))
    const result = await window.gitControl.listBranches(repoPath)
    set((s) => ({ loading: { ...s.loading, branches: false } }))
    if (result.ok) set({ branches: result.data })
  },

  refreshStashes: async () => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    const result = await window.gitControl.stashList(repoPath)
    if (result.ok) set({ stashes: result.data })
  },

  refreshHistory: async () => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    set((s) => ({ loading: { ...s.loading, history: true } }))
    const result = await window.gitControl.logHistory(repoPath, 300)
    set((s) => ({ loading: { ...s.loading, history: false } }))
    if (result.ok) set({ commits: result.data })
  },

  refreshAll: async () => {
    await Promise.all([
      get().refreshStatus(),
      get().refreshBranches(),
      get().refreshStashes(),
      get().refreshHistory(),
      get().refreshGh(),
    ])
  },

  doFetch: async () => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    set((s) => ({ loading: { ...s.loading, fetch: true } }))
    const result = await window.gitControl.fetch(repoPath)
    set((s) => ({ loading: { ...s.loading, fetch: false } }))
    if (!result.ok) set({ lastErrorMessage: result.error.message })
    await get().refreshStatus()
    await get().refreshBranches()
  },

  doPull: async () => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return { ok: false }
    set((s) => ({ loading: { ...s.loading, pull: true } }))
    const result = await window.gitControl.pull(repoPath)
    set((s) => ({ loading: { ...s.loading, pull: false } }))
    await get().refreshStatus()
    if (!result.ok) {
      set({ lastErrorMessage: result.error.message })
      return { ok: false, conflicted: result.error.affectedFiles }
    }
    await get().refreshHistory()
    return { ok: true }
  },

  doPush: async (opts) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return false
    set((s) => ({ loading: { ...s.loading, push: true } }))
    const result = await window.gitControl.push(repoPath, opts)
    set((s) => ({ loading: { ...s.loading, push: false } }))
    if (!result.ok) {
      set({ lastErrorMessage: result.error.message })
      return false
    }
    await get().refreshStatus()
    await get().refreshBranches()
    return true
  },

  stageFiles: async (files) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    await window.gitControl.stageFiles(repoPath, files)
    await get().refreshStatus()
  },

  unstageFiles: async (files) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    await window.gitControl.unstageFiles(repoPath, files)
    await get().refreshStatus()
  },

  discardFiles: async (files) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    await window.gitControl.discardFiles(repoPath, files)
    await get().refreshStatus()
  },

  doCommit: async (message, files, push) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return false
    set((s) => ({ loading: { ...s.loading, commit: true } }))
    const result = await window.gitControl.commit(repoPath, message, files)
    set((s) => ({ loading: { ...s.loading, commit: false } }))
    if (!result.ok) {
      set({ lastErrorMessage: result.error.message })
      return false
    }
    await get().refreshStatus()
    await get().refreshHistory()
    if (push) {
      return get().doPush()
    }
    return true
  },

  createBranch: async (name, checkout) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return false
    const result = await window.gitControl.createBranch(repoPath, name, checkout)
    if (!result.ok) {
      set({ lastErrorMessage: result.error.message })
      return false
    }
    await get().refreshBranches()
    await get().refreshStatus()
    return true
  },

  checkoutBranch: async (name) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return false
    const result = await window.gitControl.checkoutBranch(repoPath, name)
    if (!result.ok) {
      set({ lastErrorMessage: result.error.message })
      return false
    }
    await get().refreshAll()
    return true
  },

  deleteBranch: async (name, force) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return false
    const result = await window.gitControl.deleteBranch(repoPath, name, force)
    if (!result.ok) {
      set({ lastErrorMessage: result.error.message })
      return false
    }
    await get().refreshBranches()
    return true
  },

  pushBranch: async (name) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return false
    const result = await window.gitControl.pushBranch(repoPath, name)
    if (!result.ok) {
      set({ lastErrorMessage: result.error.message })
      return false
    }
    await get().refreshBranches()
    return true
  },

  mergeBranch: async (branch) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return false
    set((s) => ({ loading: { ...s.loading, merge: true } }))
    const result = await window.gitControl.mergeBranch(repoPath, branch)
    set((s) => ({ loading: { ...s.loading, merge: false } }))
    if (!result.ok) {
      set({ lastErrorMessage: result.error.message })
      await get().refreshStatus()
      return false
    }
    await get().refreshAll()
    return true
  },

  rebaseBranch: async (onto) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return false
    set((s) => ({ loading: { ...s.loading, rebase: true } }))
    const result = await window.gitControl.rebaseBranch(repoPath, onto)
    set((s) => ({ loading: { ...s.loading, rebase: false } }))
    if (!result.ok) {
      set({ lastErrorMessage: result.error.message })
      await get().refreshStatus()
      return false
    }
    await get().refreshAll()
    return true
  },

  stashCreate: async (message, includeUntracked) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    await window.gitControl.stashCreate(repoPath, message, includeUntracked)
    await get().refreshStashes()
    await get().refreshStatus()
  },

  stashApply: async (ref) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    await window.gitControl.stashApply(repoPath, ref)
    await get().refreshStatus()
  },

  stashPop: async (ref) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    await window.gitControl.stashPop(repoPath, ref)
    await get().refreshStashes()
    await get().refreshStatus()
  },

  stashDrop: async (ref) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    await window.gitControl.stashDrop(repoPath, ref)
    await get().refreshStashes()
  },

  refreshGh: async () => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return
    const ghStatus = await window.gitControl.checkGh(repoPath)
    set({ ghStatus })
    const branch = get().status?.branch
    if (ghStatus.authenticated && branch) {
      const prResult = await window.gitControl.getPullRequestForBranch(repoPath, branch)
      if (prResult.ok) set({ currentPr: prResult.data })
    } else {
      set({ currentPr: null })
    }
  },

  createPr: async (opts) => {
    const repoPath = get().currentRepoPath
    if (!repoPath) return null
    set((s) => ({ loading: { ...s.loading, pr: true } }))
    const result = await window.gitControl.createPullRequest(repoPath, opts)
    set((s) => ({ loading: { ...s.loading, pr: false } }))
    if (!result.ok) {
      set({ lastErrorMessage: result.error.message })
      return null
    }
    set({ currentPr: result.data })
    return result.data
  },

  updateSettings: async (partial) => {
    const settings = await window.gitControl.updateSettings(partial)
    set({ settings })
  },

  pushCommandLog: (entry) => {
    set((s) => {
      if (s.commandLog.some((e) => e.id === entry.id)) return s
      return { commandLog: [...s.commandLog.slice(-199), entry] }
    })
  },
}))

export { repoName }
