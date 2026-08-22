import { useState } from 'react'
import { Archive, Play, Trash2, ArrowDownToLine } from 'lucide-react'
import { useRepoStore } from '@/store/useRepoStore'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { relativeTime } from '@/lib/format'

export function StashDrawer() {
  const stashes = useRepoStore((s) => s.stashes)
  const stashCreate = useRepoStore((s) => s.stashCreate)
  const stashApply = useRepoStore((s) => s.stashApply)
  const stashPop = useRepoStore((s) => s.stashPop)
  const stashDrop = useRepoStore((s) => s.stashDrop)
  const status = useRepoStore((s) => s.status)

  const [createOpen, setCreateOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [includeUntracked, setIncludeUntracked] = useState(true)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const hasChanges = !status?.clean

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-panel p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-text">Stashes</h2>
        <Button
          variant="primary"
          size="sm"
          icon={<Archive className="size-3.5" />}
          disabled={!hasChanges}
          onClick={() => setCreateOpen(true)}
        >
          Stash Changes
        </Button>
      </div>

      {stashes.length === 0 ? (
        <p className="py-8 text-center text-[12.5px] text-text-faint">No stashes.</p>
      ) : (
        <div className="space-y-2">
          {stashes.map((stash) => (
            <div key={stash.ref} className="rounded-lg border border-border bg-bg-elevated p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-mono text-[11.5px] text-text-faint">{stash.ref}</p>
                  <p className="mt-0.5 truncate text-[13px] text-text">{stash.message}</p>
                  <p className="mt-1 text-[11.5px] text-text-faint">{relativeTime(stash.date)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" icon={<ArrowDownToLine className="size-3.5" />} onClick={() => stashApply(stash.ref)}>
                    Apply
                  </Button>
                  <Button variant="ghost" size="sm" icon={<Play className="size-3.5" />} onClick={() => stashPop(stash.ref)}>
                    Pop
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="size-3.5" />}
                    onClick={() => setDropTarget(stash.ref)}
                    className="hover:text-danger"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Stash changes"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                await stashCreate(message.trim() || undefined, includeUntracked)
                setMessage('')
                setCreateOpen(false)
              }}
            >
              Stash Changes
            </Button>
          </>
        }
      >
        <input
          autoFocus
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Optional message"
          className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text placeholder:text-text-faint focus:border-accent/60 focus:outline-none"
        />
        <label className="mt-3 flex items-center gap-2 text-[12.5px] text-text-muted">
          <input
            type="checkbox"
            checked={includeUntracked}
            onChange={(e) => setIncludeUntracked(e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          Include untracked files
        </label>
      </Modal>

      <ConfirmDialog
        open={!!dropTarget}
        onClose={() => setDropTarget(null)}
        onConfirm={() => {
          if (dropTarget) stashDrop(dropTarget)
          setDropTarget(null)
        }}
        title="Delete stash?"
        description={`"${dropTarget}" will be permanently deleted.`}
        confirmLabel="Delete Stash"
      />
    </div>
  )
}
