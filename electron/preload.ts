import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { CHANNELS } from './ipc/channels'
import type { GitControlApi } from '../src/types/ipc'

// Every exposed method maps 1:1 to a fixed, allowlisted channel string.
// The renderer never gets a generic `invoke(channel, ...)` escape hatch.
const api: GitControlApi = {
  checkGit: () => ipcRenderer.invoke(CHANNELS.CHECK_GIT),
  checkGh: (repoPath) => ipcRenderer.invoke(CHANNELS.CHECK_GH, repoPath),
  onCommandLog: (cb) => {
    const listener = (_e: Electron.IpcRendererEvent, entry: unknown) => cb(entry as never)
    ipcRenderer.on(CHANNELS.COMMAND_LOG, listener)
    return () => ipcRenderer.removeListener(CHANNELS.COMMAND_LOG, listener)
  },

  selectFolder: () => ipcRenderer.invoke(CHANNELS.SELECT_FOLDER),
  selectCloneDestination: () => ipcRenderer.invoke(CHANNELS.SELECT_CLONE_DESTINATION),
  isGitRepository: (repoPath) => ipcRenderer.invoke(CHANNELS.IS_GIT_REPOSITORY, repoPath),
  openInTerminal: (repoPath) => ipcRenderer.invoke(CHANNELS.OPEN_IN_TERMINAL, repoPath),
  openInVsCode: (repoPath) => ipcRenderer.invoke(CHANNELS.OPEN_IN_VSCODE, repoPath),
  getPathForFile: (file) => webUtils.getPathForFile(file),

  getRepos: () => ipcRenderer.invoke(CHANNELS.GET_REPOS),
  addRepo: (repoPath) => ipcRenderer.invoke(CHANNELS.ADD_REPO, repoPath),
  removeRepo: (id) => ipcRenderer.invoke(CHANNELS.REMOVE_REPO, id),
  togglePinRepo: (id) => ipcRenderer.invoke(CHANNELS.TOGGLE_PIN_REPO, id),

  getSettings: () => ipcRenderer.invoke(CHANNELS.GET_SETTINGS),
  updateSettings: (partial) => ipcRenderer.invoke(CHANNELS.UPDATE_SETTINGS, partial),

  status: (repoPath) => ipcRenderer.invoke(CHANNELS.STATUS, repoPath),
  fetch: (repoPath) => ipcRenderer.invoke(CHANNELS.FETCH, repoPath),
  pull: (repoPath) => ipcRenderer.invoke(CHANNELS.PULL, repoPath),
  push: (repoPath, opts) => ipcRenderer.invoke(CHANNELS.PUSH, repoPath, opts),

  stageFiles: (repoPath, files) => ipcRenderer.invoke(CHANNELS.STAGE_FILES, repoPath, files),
  unstageFiles: (repoPath, files) => ipcRenderer.invoke(CHANNELS.UNSTAGE_FILES, repoPath, files),
  discardFiles: (repoPath, files) => ipcRenderer.invoke(CHANNELS.DISCARD_FILES, repoPath, files),
  commit: (repoPath, message, files) => ipcRenderer.invoke(CHANNELS.COMMIT, repoPath, message, files),

  diff: (repoPath, filePath, staged) => ipcRenderer.invoke(CHANNELS.DIFF, repoPath, filePath, staged),
  diffUntracked: (repoPath, filePath) => ipcRenderer.invoke(CHANNELS.DIFF_UNTRACKED, repoPath, filePath),

  listBranches: (repoPath) => ipcRenderer.invoke(CHANNELS.LIST_BRANCHES, repoPath),
  createBranch: (repoPath, name, checkout) => ipcRenderer.invoke(CHANNELS.CREATE_BRANCH, repoPath, name, checkout),
  checkoutBranch: (repoPath, name) => ipcRenderer.invoke(CHANNELS.CHECKOUT_BRANCH, repoPath, name),
  deleteBranch: (repoPath, name, force) => ipcRenderer.invoke(CHANNELS.DELETE_BRANCH, repoPath, name, force),
  renameBranch: (repoPath, oldName, newName) => ipcRenderer.invoke(CHANNELS.RENAME_BRANCH, repoPath, oldName, newName),
  pushBranch: (repoPath, name) => ipcRenderer.invoke(CHANNELS.PUSH_BRANCH, repoPath, name),

  mergeBranch: (repoPath, branch) => ipcRenderer.invoke(CHANNELS.MERGE_BRANCH, repoPath, branch),
  rebaseBranch: (repoPath, onto) => ipcRenderer.invoke(CHANNELS.REBASE_BRANCH, repoPath, onto),
  abortMerge: (repoPath) => ipcRenderer.invoke(CHANNELS.ABORT_MERGE, repoPath),
  abortRebase: (repoPath) => ipcRenderer.invoke(CHANNELS.ABORT_REBASE, repoPath),

  stashList: (repoPath) => ipcRenderer.invoke(CHANNELS.STASH_LIST, repoPath),
  stashCreate: (repoPath, message, includeUntracked) =>
    ipcRenderer.invoke(CHANNELS.STASH_CREATE, repoPath, message, includeUntracked),
  stashApply: (repoPath, ref) => ipcRenderer.invoke(CHANNELS.STASH_APPLY, repoPath, ref),
  stashPop: (repoPath, ref) => ipcRenderer.invoke(CHANNELS.STASH_POP, repoPath, ref),
  stashDrop: (repoPath, ref) => ipcRenderer.invoke(CHANNELS.STASH_DROP, repoPath, ref),

  logHistory: (repoPath, limit) => ipcRenderer.invoke(CHANNELS.LOG_HISTORY, repoPath, limit),
  commitDiff: (repoPath, hash) => ipcRenderer.invoke(CHANNELS.COMMIT_DIFF, repoPath, hash),

  listRemotes: (repoPath) => ipcRenderer.invoke(CHANNELS.LIST_REMOTES, repoPath),
  cloneRepository: (url, destination) => ipcRenderer.invoke(CHANNELS.CLONE_REPOSITORY, url, destination),

  createPullRequest: (repoPath, opts) => ipcRenderer.invoke(CHANNELS.CREATE_PULL_REQUEST, repoPath, opts),
  getPullRequestForBranch: (repoPath, branch) => ipcRenderer.invoke(CHANNELS.GET_PULL_REQUEST_FOR_BRANCH, repoPath, branch),
}

contextBridge.exposeInMainWorld('gitControl', api)
