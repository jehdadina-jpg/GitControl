import { runCommand } from './exec'
import { classifyGitError } from './errors'
import { getSettings } from './configStore'
import type { CommandLogEntry, GitHubStatus, OpResult, PullRequestInfo } from '../../src/types/git'

async function ghBin(): Promise<string> {
  const settings = await getSettings()
  return settings.ghExecutable || 'gh'
}

async function gh(repoPath: string, args: string[], log: CommandLogEntry[], timeoutMs?: number) {
  const bin = await ghBin()
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

export async function checkGhStatus(repoPath: string): Promise<GitHubStatus> {
  try {
    const bin = await ghBin()
    const versionResult = await runCommand(bin, ['--version'], { cwd: repoPath, timeoutMs: 5000 })
    if (versionResult.code !== 0) {
      return { installed: false, version: null, authenticated: false, login: null }
    }
    const version = versionResult.stdout.split('\n')[0]?.trim() ?? null

    const authResult = await runCommand(bin, ['auth', 'status'], { cwd: repoPath, timeoutMs: 8000 })
    const authenticated = authResult.code === 0
    const loginMatch = authResult.stdout.match(/Logged in to [^\s]+ as ([^\s]+)/) ||
      authResult.stderr.match(/Logged in to [^\s]+ as ([^\s]+)/)
    return {
      installed: true,
      version,
      authenticated,
      login: loginMatch ? loginMatch[1] : null,
    }
  } catch {
    return { installed: false, version: null, authenticated: false, login: null }
  }
}

export async function createPullRequest(
  repoPath: string,
  opts: { base: string; head: string; title: string; body: string; draft?: boolean },
): Promise<OpResult<PullRequestInfo>> {
  const log: CommandLogEntry[] = []
  const args = ['pr', 'create', '--base', opts.base, '--head', opts.head, '--title', opts.title, '--body', opts.body]
  if (opts.draft) args.push('--draft')
  const result = await gh(repoPath, args, log, 30_000)
  if (result.code !== 0) return fail(result.stderr, result.stdout, result.code, log)

  const urlMatch = result.stdout.trim().match(/https?:\/\/\S+/)
  const url = urlMatch ? urlMatch[0] : result.stdout.trim()
  const numberMatch = url.match(/\/pull\/(\d+)/)

  return ok(
    {
      number: numberMatch ? parseInt(numberMatch[1], 10) : 0,
      title: opts.title,
      url,
      state: 'OPEN',
      isDraft: !!opts.draft,
      headRefName: opts.head,
      baseRefName: opts.base,
      author: null,
    },
    log,
  )
}

export async function getPullRequestForBranch(repoPath: string, branch: string): Promise<OpResult<PullRequestInfo | null>> {
  const log: CommandLogEntry[] = []
  const result = await gh(
    repoPath,
    ['pr', 'view', branch, '--json', 'number,title,url,state,isDraft,headRefName,baseRefName,author'],
    log,
    15_000,
  )
  if (result.code !== 0) {
    if (/no pull requests found/i.test(result.stderr) || /no default remote repository/i.test(result.stderr)) {
      return ok(null, log)
    }
    return fail(result.stderr, result.stdout, result.code, log)
  }
  try {
    const parsed = JSON.parse(result.stdout)
    return ok(
      {
        number: parsed.number,
        title: parsed.title,
        url: parsed.url,
        state: parsed.state,
        isDraft: parsed.isDraft,
        headRefName: parsed.headRefName,
        baseRefName: parsed.baseRefName,
        author: parsed.author?.login ?? null,
      },
      log,
    )
  } catch {
    return ok(null, log)
  }
}
