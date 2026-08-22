import { Plus, Minus, Trash2 } from 'lucide-react'
import type { ChangedFile } from '@/types/git'
import { fileDisplayCode, statusVisual } from '@/lib/fileStatus'
import { cn } from '@/lib/cn'

interface FileRowProps {
  file: ChangedFile
  active: boolean
  onOpen: () => void
  onToggleStage: () => void
  onDiscard: () => void
}

export function FileRow({ file, active, onOpen, onToggleStage, onDiscard }: FileRowProps) {
  const code = fileDisplayCode(file.index, file.worktree)
  const visual = statusVisual(code)
  const segments = file.path.split(/[\\/]/)
  const base = segments.pop()
  const dir = segments.join('/')

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-[5px] text-[12.5px] cursor-pointer',
        active ? 'bg-panel-hover' : 'hover:bg-panel-hover/60',
      )}
      onClick={onOpen}
    >
      <span className={cn('w-3.5 shrink-0 text-center text-mono text-[11px] font-semibold', visual.className)}>
        {visual.letter}
      </span>
      <span className="min-w-0 flex-1 truncate text-mono">
        {dir && <span className="text-text-faint">{dir}/</span>}
        <span className="text-text">{base}</span>
      </span>
      <span className="hidden items-center gap-0.5 group-hover:flex">
        <button
          title={file.staged ? 'Unstage' : 'Stage'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleStage()
          }}
          className="rounded p-1 text-text-faint hover:bg-panel hover:text-text"
        >
          {file.staged ? <Minus className="size-3" /> : <Plus className="size-3" />}
        </button>
        <button
          title="Discard changes"
          onClick={(e) => {
            e.stopPropagation()
            onDiscard()
          }}
          className="rounded p-1 text-text-faint hover:bg-danger-muted hover:text-danger"
        >
          <Trash2 className="size-3" />
        </button>
      </span>
    </div>
  )
}
