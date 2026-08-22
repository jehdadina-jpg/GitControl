import type { FileStatusCode } from '@/types/git'

export interface StatusVisual {
  letter: string
  className: string
  label: string
}

export function statusVisual(code: FileStatusCode): StatusVisual {
  switch (code) {
    case 'modified':
      return { letter: 'M', className: 'text-warning', label: 'Modified' }
    case 'added':
      return { letter: 'A', className: 'text-success', label: 'Added' }
    case 'deleted':
      return { letter: 'D', className: 'text-danger', label: 'Deleted' }
    case 'renamed':
      return { letter: 'R', className: 'text-accent', label: 'Renamed' }
    case 'copied':
      return { letter: 'C', className: 'text-accent', label: 'Copied' }
    case 'untracked':
      return { letter: 'U', className: 'text-text-muted', label: 'Untracked' }
    case 'conflicted':
      return { letter: '!', className: 'text-danger', label: 'Conflicted' }
    default:
      return { letter: '?', className: 'text-text-faint', label: 'Unknown' }
  }
}

export function fileDisplayCode(index: FileStatusCode, worktree: FileStatusCode): FileStatusCode {
  if (index === 'conflicted' || worktree === 'conflicted') return 'conflicted'
  if (index === 'untracked' || worktree === 'untracked') return 'untracked'
  if (index !== 'unknown') return index
  return worktree
}
