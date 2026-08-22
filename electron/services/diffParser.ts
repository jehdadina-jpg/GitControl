import type { DiffHunk, DiffLine, DiffResult } from '../../src/types/git'

/** Parses `git diff` unified output for a single file into structured hunks. */
export function parseUnifiedDiff(raw: string, filePath: string): DiffResult {
  if (!raw.trim()) {
    return { filePath, binary: false, hunks: [], raw }
  }

  if (/^Binary files /m.test(raw) || raw.includes('GIT binary patch')) {
    return { filePath, binary: true, hunks: [], raw }
  }

  const lines = raw.split('\n')
  const hunks: DiffHunk[] = []
  let current: DiffHunk | null = null
  let oldLine = 0
  let newLine = 0
  let oldPath: string | undefined

  const renameMatch = raw.match(/^rename from (.+)$/m)
  if (renameMatch) oldPath = renameMatch[1]

  for (const line of lines) {
    if (line.startsWith('@@')) {
      const match = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      oldLine = match ? parseInt(match[1], 10) : 0
      newLine = match ? parseInt(match[2], 10) : 0
      current = { header: line, lines: [] }
      hunks.push(current)
      continue
    }
    if (!current) continue // skip diff --git / index / --- / +++ preamble
    if (line.startsWith('+')) {
      current.lines.push({ type: 'add', content: line.slice(1), newLine: newLine })
      newLine++
    } else if (line.startsWith('-')) {
      current.lines.push({ type: 'remove', content: line.slice(1), oldLine: oldLine })
      oldLine++
    } else if (line.startsWith('\\')) {
      current.lines.push({ type: 'meta', content: line })
    } else {
      current.lines.push({ type: 'context', content: line.slice(1), oldLine, newLine })
      oldLine++
      newLine++
    }
  }

  return { filePath, oldPath, binary: false, hunks, raw }
}

export type { DiffLine }
