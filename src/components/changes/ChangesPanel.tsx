import { useState } from 'react'
import { useRepoStore } from '@/store/useRepoStore'
import { useUiStore } from '@/store/useUiStore'
import { FileRow } from './FileRow'
import { CommitBox } from './CommitBox'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

export function ChangesPanel() {
  const status = useRepoStore((s) => s.status)
  const stageFiles = useRepoStore((s) => s.stageFiles)
  const unstageFiles = useRepoStore((s) => s.unstageFiles)
  const discardFiles = useRepoStore((s) => s.discardFiles)
  const selectedFile = useUiStore((s) => s.selectedFile)
  const setSelectedFile = useUiStore((s) => s.setSelectedFile)
  const [discardTarget, setDiscardTarget] = useState<string | null>(null)

  const files = status?.files ?? []
  const staged = files.filter((f) => f.staged)
  const unstaged = files.filter((f) => !f.staged)

  return (
    <div className="flex flex-col rounded-xl border border-border bg-panel">
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <span className="text-[11px] font-semibold tracking-wide text-text-faint">CHANGES</span>
        <span className="text-[11px] font-medium text-text-muted">{files.length}</span>
      </div>

      <div className="max-h-[280px] min-h-[120px] overflow-y-auto px-2 py-1.5">
        {files.length === 0 && (
          <p className="px-2 py-6 text-center text-[12px] text-text-faint">No changes to show.</p>
        )}

        {staged.length > 0 && (
          <div className="mb-1.5">
            <p className="px-2 py-1 text-[10.5px] font-semibold tracking-wide text-text-faint">STAGED</p>
            {staged.map((f) => (
              <FileRow
                key={f.path}
                file={f}
                active={selectedFile?.path === f.path}
                onOpen={() => setSelectedFile({ path: f.path, staged: true })}
                onToggleStage={() => unstageFiles([f.path])}
                onDiscard={() => setDiscardTarget(f.path)}
              />
            ))}
          </div>
        )}

        {unstaged.length > 0 && (
          <div>
            <p className="px-2 py-1 text-[10.5px] font-semibold tracking-wide text-text-faint">CHANGES</p>
            {unstaged.map((f) => (
              <FileRow
                key={f.path}
                file={f}
                active={selectedFile?.path === f.path}
                onOpen={() => setSelectedFile({ path: f.path, staged: false })}
                onToggleStage={() => stageFiles([f.path])}
                onDiscard={() => setDiscardTarget(f.path)}
              />
            ))}
          </div>
        )}
      </div>

      <CommitBox />

      <ConfirmDialog
        open={!!discardTarget}
        onClose={() => setDiscardTarget(null)}
        onConfirm={() => {
          if (discardTarget) discardFiles([discardTarget])
          setDiscardTarget(null)
        }}
        title="Discard changes?"
        description={`This will permanently discard local changes to "${discardTarget}". This cannot be undone.`}
        confirmLabel="Discard Changes"
      />
    </div>
  )
}
