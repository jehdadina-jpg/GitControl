import type { ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  RefreshCw,
  GitCommitHorizontal,
  GitMerge,
  GitBranchPlus,
  Archive,
  GitCompare,
  GitPullRequest,
} from 'lucide-react'
import { cn } from '@/lib/cn'

interface ActionItem {
  key: string
  label: string
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
  badge?: number
}

export function ActionsGrid({ actions }: { actions: ActionItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            'group relative flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-bg-elevated py-3.5',
            'transition-colors hover:border-border-strong hover:bg-panel-hover disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          {!!action.badge && (
            <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
              {action.badge}
            </span>
          )}
          <span className="text-text-muted transition-colors group-hover:text-text">{action.icon}</span>
          <span className="text-[12px] font-medium text-text-muted transition-colors group-hover:text-text">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  )
}

export const actionIcons = {
  pull: <ArrowDown className="size-4" />,
  push: <ArrowUp className="size-4" />,
  fetch: <RefreshCw className="size-4" />,
  commit: <GitCommitHorizontal className="size-4" />,
  merge: <GitMerge className="size-4" />,
  branch: <GitBranchPlus className="size-4" />,
  stash: <Archive className="size-4" />,
  rebase: <GitCompare className="size-4" />,
  pr: <GitPullRequest className="size-4" />,
}
