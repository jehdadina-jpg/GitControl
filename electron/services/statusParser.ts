import type { ChangedFile, FileStatusCode, RepoStatus } from '../../src/types/git'

function codeFromChar(ch: string): FileStatusCode {
  switch (ch) {
    case 'M':
      return 'modified'
    case 'A':
      return 'added'
    case 'D':
      return 'deleted'
    case 'R':
      return 'renamed'
    case 'C':
      return 'copied'
    case 'U':
      return 'conflicted'
    default:
      return 'unknown'
  }
}

/** Parses `git status --porcelain=v2 --branch` output into a typed RepoStatus. */
export function parseStatusV2(repoPath: string, raw: string): RepoStatus {
  const lines = raw.split('\n').filter((l) => l.length > 0)
  const files: ChangedFile[] = []
  const conflicted: string[] = []

  let branch: string | null = null
  let upstream: string | null = null
  let ahead = 0
  let behind = 0
  let detached = false

  for (const line of lines) {
    if (line.startsWith('# branch.head')) {
      const value = line.slice('# branch.head '.length)
      if (value === '(detached)') {
        detached = true
        branch = null
      } else {
        branch = value
      }
      continue
    }
    if (line.startsWith('# branch.upstream')) {
      upstream = line.slice('# branch.upstream '.length)
      continue
    }
    if (line.startsWith('# branch.ab')) {
      const match = line.match(/\+(\d+) -(\d+)/)
      if (match) {
        ahead = parseInt(match[1], 10)
        behind = parseInt(match[2], 10)
      }
      continue
    }
    if (line.startsWith('#')) continue

    if (line.startsWith('?')) {
      const path = line.slice(2)
      files.push({ path, index: 'untracked', worktree: 'untracked', staged: false, unstaged: true, conflicted: false })
      continue
    }
    if (line.startsWith('!')) {
      continue // ignored files are not surfaced in the changes panel
    }
    if (line.startsWith('1 ')) {
      const parts = line.split(' ')
      const xy = parts[1]
      const path = parts.slice(8).join(' ')
      const x = xy[0]
      const y = xy[1]
      files.push({
        path,
        index: codeFromChar(x),
        worktree: codeFromChar(y),
        staged: x !== '.',
        unstaged: y !== '.',
        conflicted: false,
      })
      continue
    }
    if (line.startsWith('2 ')) {
      const parts = line.split(' ')
      const xy = parts[1]
      const rest = parts.slice(8).join(' ')
      const [path, originalPath] = rest.split('\t')
      const x = xy[0]
      const y = xy[1]
      files.push({
        path,
        originalPath,
        index: codeFromChar(x),
        worktree: codeFromChar(y),
        staged: x !== '.',
        unstaged: y !== '.',
        conflicted: false,
      })
      continue
    }
    if (line.startsWith('u ')) {
      const parts = line.split(' ')
      const path = parts.slice(10).join(' ')
      files.push({
        path,
        index: 'conflicted',
        worktree: 'conflicted',
        staged: false,
        unstaged: true,
        conflicted: true,
      })
      conflicted.push(path)
      continue
    }
  }

  return {
    repoPath,
    branch,
    upstream: upstream || null,
    ahead,
    behind,
    detached,
    clean: files.length === 0,
    files,
    mergeInProgress: false,
    rebaseInProgress: false,
    conflicted,
  }
}
