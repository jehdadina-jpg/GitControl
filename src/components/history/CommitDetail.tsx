import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useRepoStore } from '@/store/useRepoStore'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { DiffResult } from '@/types/git'

export function CommitDetail({ hash, onClose }: { hash: string; onClose: () => void }) {
  const commits = useRepoStore((s) => s.commits)
  const currentRepoPath = useRepoStore((s) => s.currentRepoPath)
  const commit = commits.find((c) => c.hash === hash)
  const [diffs, setDiffs] = useState<DiffResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeFile, setActiveFile] = useState<string | null>(null)

  useEffect(() => {
    if (!currentRepoPath) return
    setLoading(true)
    setActiveFile(null)
    window.gitControl.commitDiff(currentRepoPath, hash).then((result) => {
      setLoading(false)
      if (result.ok) {
        setDiffs(result.data)
        setActiveFile(result.data[0]?.filePath ?? null)
      }
    })
  }, [hash, currentRepoPath])

  if (!commit) return null
  const activeDiff = diffs.find((d) => d.filePath === activeFile)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-[13px] leading-snug text-text">{commit.subject}</p>
          <p className="mt-1 text-[11.5px] text-text-muted">
            {commit.author} • {relativeTime(commit.date)}
          </p>
          <p className="mt-0.5 text-mono text-[11px] text-text-faint">{commit.shortHash}</p>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-text-faint hover:bg-panel-hover hover:text-text">
          <X className="size-4" />
        </button>
      </div>

      <div className="border-b border-border px-2 py-1.5">
        {loading && <p className="px-2 py-2 text-[12px] text-text-faint">Loading files…</p>}
        {diffs.map((d) => (
          <button
            key={d.filePath}
            onClick={() => setActiveFile(d.filePath)}
            className={cn(
              'block w-full truncate rounded-md px-2 py-1 text-left text-mono text-[11.5px]',
              activeFile === d.filePath ? 'bg-panel-hover text-text' : 'text-text-muted hover:bg-panel-hover/60',
            )}
          >
            {d.filePath}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {activeDiff?.hunks.map((hunk, hi) => (
          <div key={hi} className="mb-3 overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border bg-bg-elevated px-2.5 py-1 text-mono text-[10.5px] text-text-faint">
              {hunk.header}
            </div>
            <div className="text-mono text-[11.5px]">
              {hunk.lines.map((line, li) => (
                <div
                  key={li}
                  className={cn(
                    'px-2.5 py-[1px] whitespace-pre-wrap',
                    line.type === 'add' && 'bg-success-muted text-text',
                    line.type === 'remove' && 'bg-danger-muted text-text',
                    line.type === 'context' && 'text-text-muted',
                  )}
                >
                  {line.content}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
