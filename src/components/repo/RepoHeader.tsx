import { ArrowUp, ArrowDown, GitBranch, CheckCircle2, RefreshCw } from 'lucide-react'
import { useRepoStore, repoName } from '@/store/useRepoStore'
import { Badge } from '@/components/common/Badge'
import { cn } from '@/lib/cn'

export function RepoHeader() {
  const currentRepoPath = useRepoStore((s) => s.currentRepoPath)
  const status = useRepoStore((s) => s.status)
  const loadingStatus = useRepoStore((s) => s.loading.status)
  const refreshAll = useRepoStore((s) => s.refreshAll)

  if (!currentRepoPath) return null
  const name = repoName(currentRepoPath)

  return (
    <div className="flex items-start justify-between px-6 pb-4 pt-5">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[19px] font-semibold tracking-tight text-text uppercase">{name}</h1>
          <button
            onClick={() => refreshAll()}
            className="rounded-md p-1 text-text-faint transition-colors hover:bg-panel-hover hover:text-text"
            title="Refresh repository state"
          >
            <RefreshCw className={cn('size-3.5', loadingStatus && 'animate-spin')} />
          </button>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px]">
          {status?.clean ? (
            <span className="flex items-center gap-1 text-success">
              <CheckCircle2 className="size-3.5" /> Working tree clean
            </span>
          ) : status ? (
            <Badge tone="warning">{status.files.length} changes</Badge>
          ) : null}

          <span className="flex items-center gap-1 text-mono text-text-muted">
            <GitBranch className="size-3.5" />
            {status?.detached ? 'detached HEAD' : status?.branch ?? '—'}
          </span>

          {status?.upstream && <span className="text-mono text-text-faint">{status.upstream}</span>}

          {!!status?.ahead && (
            <span className="flex items-center gap-0.5 text-mono text-accent">
              <ArrowUp className="size-3" />
              {status.ahead} ahead
            </span>
          )}
          {!!status?.behind && (
            <span className="flex items-center gap-0.5 text-mono text-warning">
              <ArrowDown className="size-3" />
              {status.behind} behind
            </span>
          )}

          {status?.mergeInProgress && <Badge tone="danger">Merge in progress</Badge>}
          {status?.rebaseInProgress && <Badge tone="danger">Rebase in progress</Badge>}
        </div>

        <p className="mt-1.5 text-mono text-[11.5px] text-text-faint">{currentRepoPath}</p>
      </div>
    </div>
  )
}
