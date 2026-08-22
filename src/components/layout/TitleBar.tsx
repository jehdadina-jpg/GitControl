import { FolderGit2 } from 'lucide-react'
import { useRepoStore } from '@/store/useRepoStore'
import { cn } from '@/lib/cn'

export function TitleBar() {
  const loading = useRepoStore((s) => s.loading)
  const gitTool = useRepoStore((s) => s.gitTool)
  const busy = Object.values(loading).some(Boolean)

  const status = !gitTool
    ? { label: 'Checking…', tone: 'text-text-faint' }
    : !gitTool.installed
      ? { label: 'Git not found', tone: 'text-danger' }
      : busy
        ? { label: 'Working…', tone: 'text-warning' }
        : { label: 'Ready', tone: 'text-success' }

  return (
    <div className="app-drag flex h-9 shrink-0 items-center justify-between border-b border-border bg-bg-elevated pl-3 pr-[140px]">
      <div className="flex items-center gap-2">
        <FolderGit2 className="size-3.5 text-accent" />
        <span className="text-[12px] font-semibold tracking-tight text-text">Git Control</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px]">
        <span
          className={cn(
            'size-1.5 rounded-full',
            status.tone === 'text-success' && 'bg-success',
            status.tone === 'text-warning' && 'bg-warning animate-pulse',
            status.tone === 'text-danger' && 'bg-danger',
            status.tone === 'text-text-faint' && 'bg-text-faint',
          )}
        />
        <span className={status.tone}>{status.label}</span>
      </div>
    </div>
  )
}
