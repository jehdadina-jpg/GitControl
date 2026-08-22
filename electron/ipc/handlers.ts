import { ipcMain, dialog, type BrowserWindow } from 'electron'
import path from 'node:path'
import { CHANNELS } from './channels'
import * as git from '../services/gitService'
import * as gh from '../services/ghService'
import * as shell from '../services/shellService'
import * as configStore from '../services/configStore'
import type { CommandLogEntry, OpResult } from '../../src/types/git'

function broadcastLogs(win: BrowserWindow, log: CommandLogEntry[]) {
  for (const entry of log) {
    win.webContents.send(CHANNELS.COMMAND_LOG, entry)
  }
}

/** Wraps a service call so every command it runs is streamed to the terminal drawer. */
function withLog<Args extends unknown[], T>(win: BrowserWindow, fn: (...args: Args) => Promise<OpResult<T>>) {
  return async (...args: Args): Promise<OpResult<T>> => {
    const result = await fn(...args)
    broadcastLogs(win, result.log)
    return result
  }
}

export function registerIpcHandlers(win: BrowserWindow): void {
  ipcMain.handle(CHANNELS.CHECK_GIT, () => git.checkGitInstalled())
  ipcMain.handle(CHANNELS.CHECK_GH, (_e, repoPath: string) => gh.checkGhStatus(repoPath))

  ipcMain.handle(CHANNELS.SELECT_FOLDER, async () => {
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle(CHANNELS.SELECT_CLONE_DESTINATION, async () => {
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle(CHANNELS.IS_GIT_REPOSITORY, (_e, repoPath: string) => git.isGitRepository(repoPath))
  ipcMain.handle(CHANNELS.OPEN_IN_TERMINAL, (_e, repoPath: string) => shell.openInTerminal(repoPath))
  ipcMain.handle(CHANNELS.OPEN_IN_VSCODE, (_e, repoPath: string) => shell.openInVsCode(repoPath))

  ipcMain.handle(CHANNELS.GET_REPOS, () => configStore.getRepos())
  ipcMain.handle(CHANNELS.ADD_REPO, (_e, repoPath: string) => configStore.upsertRepo(repoPath, path.basename(repoPath)))
  ipcMain.handle(CHANNELS.REMOVE_REPO, (_e, id: string) => configStore.removeRepo(id))
  ipcMain.handle(CHANNELS.TOGGLE_PIN_REPO, (_e, id: string) => configStore.togglePinRepo(id))

  ipcMain.handle(CHANNELS.GET_SETTINGS, () => configStore.getSettings())
  ipcMain.handle(CHANNELS.UPDATE_SETTINGS, (_e, partial) => configStore.updateSettings(partial))

  ipcMain.handle(CHANNELS.STATUS, (_e, repoPath: string) => withLog(win, git.status)(repoPath))
  ipcMain.handle(CHANNELS.FETCH, (_e, repoPath: string) => withLog(win, git.fetch)(repoPath))
  ipcMain.handle(CHANNELS.PULL, (_e, repoPath: string) => withLog(win, git.pull)(repoPath))
  ipcMain.handle(CHANNELS.PUSH, (_e, repoPath: string, opts) => withLog(win, git.push)(repoPath, opts))

  ipcMain.handle(CHANNELS.STAGE_FILES, (_e, repoPath: string, files: string[]) => withLog(win, git.stageFiles)(repoPath, files))
  ipcMain.handle(CHANNELS.UNSTAGE_FILES, (_e, repoPath: string, files: string[]) => withLog(win, git.unstageFiles)(repoPath, files))
  ipcMain.handle(CHANNELS.DISCARD_FILES, (_e, repoPath: string, files: string[]) => withLog(win, git.discardFiles)(repoPath, files))
  ipcMain.handle(CHANNELS.COMMIT, (_e, repoPath: string, message: string, files: string[] | null) =>
    withLog(win, git.commit)(repoPath, message, files),
  )

  ipcMain.handle(CHANNELS.DIFF, (_e, repoPath: string, filePath: string, staged: boolean) =>
    withLog(win, git.diff)(repoPath, filePath, staged),
  )
  ipcMain.handle(CHANNELS.DIFF_UNTRACKED, (_e, repoPath: string, filePath: string) =>
    withLog(win, git.diffUntracked)(repoPath, filePath),
  )

  ipcMain.handle(CHANNELS.LIST_BRANCHES, (_e, repoPath: string) => withLog(win, git.listBranches)(repoPath))
  ipcMain.handle(CHANNELS.CREATE_BRANCH, (_e, repoPath: string, name: string, checkout: boolean) =>
    withLog(win, git.createBranch)(repoPath, name, checkout),
  )
  ipcMain.handle(CHANNELS.CHECKOUT_BRANCH, (_e, repoPath: string, name: string) => withLog(win, git.checkoutBranch)(repoPath, name))
  ipcMain.handle(CHANNELS.DELETE_BRANCH, (_e, repoPath: string, name: string, force: boolean) =>
    withLog(win, git.deleteBranch)(repoPath, name, force),
  )
  ipcMain.handle(CHANNELS.RENAME_BRANCH, (_e, repoPath: string, oldName: string, newName: string) =>
    withLog(win, git.renameBranch)(repoPath, oldName, newName),
  )
  ipcMain.handle(CHANNELS.PUSH_BRANCH, (_e, repoPath: string, name: string) => withLog(win, git.pushBranch)(repoPath, name))

  ipcMain.handle(CHANNELS.MERGE_BRANCH, (_e, repoPath: string, branch: string) => withLog(win, git.mergeBranch)(repoPath, branch))
  ipcMain.handle(CHANNELS.REBASE_BRANCH, (_e, repoPath: string, onto: string) => withLog(win, git.rebaseBranch)(repoPath, onto))
  ipcMain.handle(CHANNELS.ABORT_MERGE, (_e, repoPath: string) => withLog(win, git.abortMerge)(repoPath))
  ipcMain.handle(CHANNELS.ABORT_REBASE, (_e, repoPath: string) => withLog(win, git.abortRebase)(repoPath))

  ipcMain.handle(CHANNELS.STASH_LIST, (_e, repoPath: string) => withLog(win, git.stashList)(repoPath))
  ipcMain.handle(CHANNELS.STASH_CREATE, (_e, repoPath: string, message: string | undefined, includeUntracked: boolean) =>
    withLog(win, git.stashCreate)(repoPath, message, includeUntracked),
  )
  ipcMain.handle(CHANNELS.STASH_APPLY, (_e, repoPath: string, ref: string) => withLog(win, git.stashApply)(repoPath, ref))
  ipcMain.handle(CHANNELS.STASH_POP, (_e, repoPath: string, ref: string) => withLog(win, git.stashPop)(repoPath, ref))
  ipcMain.handle(CHANNELS.STASH_DROP, (_e, repoPath: string, ref: string) => withLog(win, git.stashDrop)(repoPath, ref))

  ipcMain.handle(CHANNELS.LOG_HISTORY, (_e, repoPath: string, limit?: number) => withLog(win, git.logHistory)(repoPath, limit))
  ipcMain.handle(CHANNELS.COMMIT_DIFF, (_e, repoPath: string, hash: string) => withLog(win, git.commitDiff)(repoPath, hash))

  ipcMain.handle(CHANNELS.LIST_REMOTES, (_e, repoPath: string) => withLog(win, git.listRemotes)(repoPath))
  ipcMain.handle(CHANNELS.CLONE_REPOSITORY, (_e, url: string, destination: string) =>
    withLog(win, git.cloneRepository)(url, destination),
  )

  ipcMain.handle(CHANNELS.CREATE_PULL_REQUEST, (_e, repoPath: string, opts) => withLog(win, gh.createPullRequest)(repoPath, opts))
  ipcMain.handle(CHANNELS.GET_PULL_REQUEST_FOR_BRANCH, (_e, repoPath: string, branch: string) =>
    withLog(win, gh.getPullRequestForBranch)(repoPath, branch),
  )
}
