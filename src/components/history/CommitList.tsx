import { useMemo } from 'react'
import { useRepoStore } from '@/store/useRepoStore'
import { useUiStore } from '@/store/useUiStore'
import { dayBucket, relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { CommitDetail } from './CommitDetail'

export function CommitList() {
  const commits = useRepoStore((s) => s.commits)
  const loading = useRepoStore((s) => s.loading.history)
  const selectedCommitHash = useUiStore((s) => s.selectedCommitHash)
  const setSelectedCommitHash = useUiStore((s) => s.setSelectedCommitHash)

  const groups = useMemo(() => {
    const map = new Map<string, typeof commits>()
    for (const commit of commits) {
      const bucket = dayBucket(commit.date)
      if (!map.has(bucket)) map.set(bucket, [])
      map.get(bucket)!.push(commit)
    }
    return [...map.entries()]
  }, [commits])

  return (
    <div className="flex flex-1 gap-4 overflow-hidden">
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-panel p-4">
        {loading && commits.length === 0 && <p className="py-8 text-center text-[12.5px] text-text-faint">Loading history…</p>}
        {!loading && commits.length === 0 && (
          <p className="py-8 text-center text-[12.5px] text-text-faint">No commits yet.</p>
        )}
        {groups.map(([bucket, items]) => (
          <div key={bucket} className="mb-5">
            <p className="mb-2 text-[11px] font-semibold tracking-wide text-text-faint">{bucket.toUpperCase()}</p>
            <div className="space-y-0.5">
              {items.map((commit) => (
                <button
                  key={commit.hash}
                  onClick={() => setSelectedCommitHash(commit.hash)}
                  className={cn(
                    'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                    selectedCommitHash === commit.hash ? 'bg-panel-hover' : 'hover:bg-panel-hover/60',
                  )}
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-text">{commit.subject}</p>
                    <p className="text-[11.5px] text-text-muted">
                      {commit.author} • {relativeTime(commit.date)}
                    </p>
                  </div>
                  <span className="mt-0.5 shrink-0 text-mono text-[11px] text-text-faint">{commit.shortHash}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedCommitHash && (
        <div className="w-[380px] shrink-0 overflow-y-auto rounded-xl border border-border bg-panel">
          <CommitDetail hash={selectedCommitHash} onClose={() => setSelectedCommitHash(null)} />
        </div>
      )}
    </div>
  )
}
