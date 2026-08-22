import { promises as fs } from 'node:fs'
import path from 'node:path'
import { runCommand } from './exec'
import { classifyGitError } from './errors'
import { parseStatusV2 } from './statusParser'
import { parseUnifiedDiff } from './diffParser'
import { getSettings } from './configStore'
import type {
  BranchInfo,
  BranchList,
  CommandLogEntry,
  CommitInfo,
  DiffResult,
  GitToolStatus,
  OpResult,
  RemoteInfo,
  RepoStatus,
  StashEntry,
} from '../../src/types/git'

const FIELD_SEP = '\x1f'

async function gitBin(): Promise<string> {
  const settings = await getSettings()
  return settings.gitExecutable || 'git'
}

async function git(repoPath: string, args: string[], log: CommandLogEntry[], timeoutMs?: number) {
  const bin = await gitBin()
  const result = await runCommand(bin, args, { cwd: repoPath, timeoutMs })
  log.push(result.log)
  return result
}

function ok<T>(data: T, log: CommandLogEntry[]): OpResult<T> {
  return { ok: true, data, log }
}

function fail<T>(stderr: string, stdout: string, exitCode: number | null, log: CommandLogEntry[]): OpResult<T> {
  return { ok: false, error: classifyGitError(stderr, stdout, exitCode), log }
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

export async function checkGitInstalled(): Promise<GitToolStatus> {
  try {
    const bin = await gitBin()
    const result = await runCommand(bin, ['--version'], { cwd: process.cwd(), timeoutMs: 5000 })
    if (result.code === 0) {
      return { installed: true, version: result.stdout.trim(), path: bin }
    }
    return { installed: false, version: null, path: null }
  } catch {
    return { installed: false, version: null, path: null }
  }
}

export async function isGitRepository(repoPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path.join(repoPath, '.git'))
    if (stat.isDirectory() || stat.isFile()) return true
  } catch {
    // fall through to `git rev-parse` in case of worktrees/submodules
  }
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['rev-parse', '--is-inside-work-tree'], log, 5000)
  return result.code === 0 && result.stdout.trim() === 'true'
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export async function status(repoPath: string): Promise<OpResult<RepoStatus>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['status', '--porcelain=v2', '--branch', '--untracked-files=all'], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)

  const parsed = parseStatusV2(repoPath, result.stdout)

  const mergeHead = await fileExists(path.join(repoPath, '.git', 'MERGE_HEAD'))
  const rebaseMerge = await fileExists(path.join(repoPath, '.git', 'rebase-merge'))
  const rebaseApply = await fileExists(path.join(repoPath, '.git', 'rebase-apply'))

  parsed.mergeInProgress = mergeHead
  parsed.rebaseInProgress = rebaseMerge || rebaseApply

  return ok(parsed, log)
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Remote sync: fetch / pull / push
// ---------------------------------------------------------------------------

export async function fetch(repoPath: string): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['fetch', '--all', '--prune'], log, 60_000)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function pull(repoPath: string): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['pull', '--ff-only'], log, 60_000)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function push(repoPath: string, opts?: { setUpstream?: string; force?: boolean }): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const args = ['push']
  if (opts?.setUpstream) args.push('--set-upstream', 'origin', opts.setUpstream)
  if (opts?.force) args.push('--force-with-lease')
  const result = await git(repoPath, args, log, 60_000)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function aheadBehindSummary(repoPath: string): Promise<{ ahead: number; behind: number }> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['rev-list', '--left-right', '--count', 'HEAD...@{u}'], log, 10_000)
  if (result.code !== 0) return { ahead: 0, behind: 0 }
  const [a, b] = result.stdout.trim().split(/\s+/).map((n) => parseInt(n, 10) || 0)
  return { ahead: a, behind: b }
}

// ---------------------------------------------------------------------------
// Staging / commit
// ---------------------------------------------------------------------------

export async function stageFiles(repoPath: string, files: string[]): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['add', '--', ...files], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function unstageFiles(repoPath: string, files: string[]): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['restore', '--staged', '--', ...files], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function discardFiles(repoPath: string, files: string[]): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  // Untracked files must be removed with clean; tracked changes are reverted with restore.
  const trackedResult = await git(repoPath, ['restore', '--worktree', '--', ...files], log)
  const cleanResult = await git(repoPath, ['clean', '-f', '--', ...files], log)
  if (trackedResult.code !== 0 && cleanResult.code !== 0) {
    return fail(trackedResult.stderr, trackedResult.stdout, trackedResult.code, log)
  }
  return ok(null, log)
}

export async function commit(repoPath: string, message: string, files: string[] | null): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  if (files && files.length > 0) {
    const addResult = await git(repoPath, ['add', '--', ...files], log)
    if (addResult.code !== 0) return fail(addResult.stderr, addResult.stdout, addResult.code, log)
  }
  const result = await git(repoPath, ['commit', '-m', message], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

export async function diff(repoPath: string, filePath: string, staged: boolean): Promise<OpResult<DiffResult>> {
  const log: CommandLogEntry[] = []
  const args = staged ? ['diff', '--staged', '--', filePath] : ['diff', '--', filePath]
  const result = await git(repoPath, args, log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(parseUnifiedDiff(result.stdout, filePath), log)
}

export async function diffUntracked(repoPath: string, filePath: string): Promise<OpResult<DiffResult>> {
  const log: CommandLogEntry[] = []
  // Untracked files have no blob to diff against in Git's object store, and
  // relying on `/dev/null` as a real path is not reliably portable on Windows.
  // Read the file directly and present it as an all-additions hunk instead.
  const absolutePath = path.join(repoPath, filePath)
  try {
    const buffer = await fs.readFile(absolutePath)
    if (isLikelyBinary(buffer)) {
      return ok({ filePath, binary: true, hunks: [], raw: '' }, log)
    }
    const content = buffer.toString('utf-8')
    const lines = content.length > 0 ? content.replace(/\n$/, '').split('\n') : []
    const hunk = {
      header: `@@ -0,0 +1,${lines.length} @@`,
      lines: lines.map((content, i) => ({ type: 'add' as const, content, newLine: i + 1 })),
    }
    return ok({ filePath, binary: false, hunks: lines.length > 0 ? [hunk] : [], raw: content }, log)
  } catch (err) {
    return fail((err as Error).message, '', null, log)
  }
}

function isLikelyBinary(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, 8000)
  return sample.includes(0)
}

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

export async function listBranches(repoPath: string): Promise<OpResult<BranchList>> {
  const log: CommandLogEntry[] = []
  const format = ['%(refname)', '%(HEAD)', '%(upstream:short)', '%(upstream:track)', '%(objectname:short)', '%(contents:subject)', '%(committerdate:iso-strict)'].join(FIELD_SEP)
  const result = await git(repoPath, ['for-each-ref', `--format=${format}`, 'refs/heads', 'refs/remotes'], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)

  const local: BranchInfo[] = []
  const remote: BranchInfo[] = []
  let current: string | null = null

  for (const line of result.stdout.split('\n').filter(Boolean)) {
    const [refname, head, upstream, track, hash, subject, date] = line.split(FIELD_SEP)
    const isRemote = refname.startsWith('refs/remotes/')
    if (isRemote && refname.endsWith('/HEAD')) continue
    const name = refname.replace(/^refs\/(heads|remotes)\//, '')
    const isCurrent = head === '*'
    if (isCurrent) current = name

    let ahead = 0
    let behind = 0
    const aheadMatch = track.match(/ahead (\d+)/)
    const behindMatch = track.match(/behind (\d+)/)
    if (aheadMatch) ahead = parseInt(aheadMatch[1], 10)
    if (behindMatch) behind = parseInt(behindMatch[1], 10)

    const info: BranchInfo = {
      name,
      current: isCurrent,
      remote: isRemote,
      upstream: upstream || null,
      ahead,
      behind,
      lastCommitHash: hash || null,
      lastCommitMessage: subject || null,
      lastCommitDate: date || null,
    }
    if (isRemote) remote.push(info)
    else local.push(info)
  }

  return ok({ current, local, remote }, log)
}

export async function createBranch(repoPath: string, name: string, checkout: boolean): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const args = checkout ? ['checkout', '-b', name] : ['branch', name]
  const result = await git(repoPath, args, log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function checkoutBranch(repoPath: string, name: string): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['checkout', name], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function deleteBranch(repoPath: string, name: string, force: boolean): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['branch', force ? '-D' : '-d', name], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function renameBranch(repoPath: string, oldName: string, newName: string): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['branch', '-m', oldName, newName], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function pushBranch(repoPath: string, name: string): Promise<OpResult<null>> {
  return push(repoPath, { setUpstream: name })
}

// ---------------------------------------------------------------------------
// Merge / rebase
// ---------------------------------------------------------------------------

export async function mergeBranch(repoPath: string, branch: string): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['merge', '--no-edit', branch], log, 60_000)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function rebaseBranch(repoPath: string, onto: string): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['rebase', onto], log, 60_000)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function abortMerge(repoPath: string): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['merge', '--abort'], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function abortRebase(repoPath: string): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['rebase', '--abort'], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

// ---------------------------------------------------------------------------
// Stash
// ---------------------------------------------------------------------------

export async function stashList(repoPath: string): Promise<OpResult<StashEntry[]>> {
  const log: CommandLogEntry[] = []
  const format = ['%gd', '%gs', '%ai'].join(FIELD_SEP)
  const result = await git(repoPath, ['stash', 'list', `--format=${format}`], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  const entries: StashEntry[] = result.stdout
    .split('\n')
    .filter(Boolean)
    .map((line, i) => {
      const [ref, subject, date] = line.split(FIELD_SEP)
      const branchMatch = subject.match(/^WIP on ([^:]+):|^On ([^:]+):/)
      return {
        index: i,
        ref,
        message: subject.replace(/^WIP on [^:]+:\s*|^On [^:]+:\s*/, ''),
        date,
        branch: branchMatch ? branchMatch[1] || branchMatch[2] : null,
      }
    })
  return ok(entries, log)
}

export async function stashCreate(repoPath: string, message: string | undefined, includeUntracked: boolean): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const args = ['stash', 'push']
  if (includeUntracked) args.push('--include-untracked')
  if (message) args.push('-m', message)
  const result = await git(repoPath, args, log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function stashApply(repoPath: string, ref: string): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['stash', 'apply', ref], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function stashPop(repoPath: string, ref: string): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['stash', 'pop', ref], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

export async function stashDrop(repoPath: string, ref: string): Promise<OpResult<null>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['stash', 'drop', ref], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(null, log)
}

// ---------------------------------------------------------------------------
// Log / history
// ---------------------------------------------------------------------------

export async function logHistory(repoPath: string, limit = 200): Promise<OpResult<CommitInfo[]>> {
  const log: CommandLogEntry[] = []
  const format = ['%H', '%h', '%P', '%an', '%ae', '%ad', '%s', '%D'].join(FIELD_SEP)
  const result = await git(
    repoPath,
    ['log', '--all', '--date=iso-strict', `--pretty=format:${format}`, `-n`, String(limit)],
    log,
  )
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)

  const commits: CommitInfo[] = result.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, shortHash, parents, author, authorEmail, date, subject, refs] = line.split(FIELD_SEP)
      return {
        hash,
        shortHash,
        parents: parents ? parents.split(' ').filter(Boolean) : [],
        author,
        authorEmail,
        date,
        message: subject,
        subject,
        refs: refs ? refs.split(', ').filter(Boolean) : [],
      }
    })
  return ok(commits, log)
}

export async function commitDiff(repoPath: string, hash: string): Promise<OpResult<DiffResult[]>> {
  const log: CommandLogEntry[] = []
  const filesResult = await git(repoPath, ['show', '--name-only', '--pretty=format:', hash], log)
  if (filesResult.code !== 0) return fail(filesResult.stderr, filesResult.stdout, filesResult.code, log)
  const files = filesResult.stdout.split('\n').filter(Boolean)

  const diffs: DiffResult[] = []
  for (const file of files) {
    const result = await git(repoPath, ['show', '--pretty=format:', hash, '--', file], log)
    diffs.push(parseUnifiedDiff(result.stdout, file))
  }
  return ok(diffs, log)
}

// ---------------------------------------------------------------------------
// Remotes / clone
// ---------------------------------------------------------------------------

export async function listRemotes(repoPath: string): Promise<OpResult<RemoteInfo[]>> {
  const log: CommandLogEntry[] = []
  const result = await git(repoPath, ['remote', '-v'], log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  const map = new Map<string, RemoteInfo>()
  for (const line of result.stdout.split('\n').filter(Boolean)) {
    const [name, urlAndType] = line.split('\t')
    const [url, type] = urlAndType.split(' ')
    const entry = map.get(name) ?? { name, fetchUrl: '', pushUrl: '' }
    if (type === '(fetch)') entry.fetchUrl = url
    if (type === '(push)') entry.pushUrl = url
    map.set(name, entry)
  }
  return ok([...map.values()], log)
}

export async function cloneRepository(url: string, destination: string): Promise<OpResult<string>> {
  const log: CommandLogEntry[] = []
  const bin = await gitBin()
  const result = await runCommand(bin, ['clone', url, destination], { cwd: path.dirname(destination), timeoutMs: 120_000 })
  log.push(result.log)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)
  return ok(destination, log)
}
