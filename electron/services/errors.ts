import type { GitError, GitErrorKind } from '../../src/types/git'

const PATTERNS: Array<{ kind: GitErrorKind; test: RegExp }> = [
  { kind: 'merge-conflict', test: /conflict/i },
  { kind: 'rebase-conflict', test: /could not apply|rebase.*conflict/i },
  { kind: 'auth-failed', test: /authentication failed|permission denied \(publickey\)|could not read username|invalid credentials/i },
  { kind: 'no-remote', test: /no configured push destination|does not appear to be a git repository|no such remote/i },
  { kind: 'detached-head', test: /you are not currently on a branch/i },
  { kind: 'diverged', test: /have diverged|non-fast-forward|updates were rejected/i },
  { kind: 'nothing-to-commit', test: /nothing to commit/i },
  { kind: 'not-a-repo', test: /not a git repository/i },
  { kind: 'git-not-found', test: /is not recognized as an internal or external command|command not found/i },
]

export function classifyGitError(stderr: string, stdout: string, exitCode: number | null): GitError {
  const combined = `${stderr}\n${stdout}`
  for (const { kind, test } of PATTERNS) {
    if (test.test(combined)) {
      return {
        kind,
        message: friendlyMessage(kind),
        detail: stderr.trim() || stdout.trim(),
        exitCode,
      }
    }
  }
  return {
    kind: 'unknown',
    message: stderr.trim() ? firstLine(stderr) : 'Git reported an error.',
    detail: stderr.trim() || stdout.trim(),
    exitCode,
  }
}

function firstLine(text: string): string {
  return text.trim().split('\n')[0] ?? text.trim()
}

function friendlyMessage(kind: GitErrorKind): string {
  switch (kind) {
    case 'merge-conflict':
      return 'Merge conflict detected.'
    case 'rebase-conflict':
      return 'Rebase stopped because of a conflict.'
    case 'auth-failed':
      return "Couldn't authenticate with the remote."
    case 'no-remote':
      return 'No remote is configured for this repository.'
    case 'detached-head':
      return 'You are in a detached HEAD state.'
    case 'diverged':
      return 'Your branch and the remote have diverged.'
    case 'nothing-to-commit':
      return 'There is nothing to commit.'
    case 'not-a-repo':
      return 'This folder is not a Git repository.'
    case 'git-not-found':
      return 'Git was not found on this system.'
    case 'gh-not-found':
      return 'GitHub CLI was not found on this system.'
    case 'gh-not-authenticated':
      return 'GitHub CLI is not authenticated.'
    default:
      return 'Git reported an error.'
  }
}
