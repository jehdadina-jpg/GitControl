import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, FileWarning, Plus, Minus } from 'lucide-react'
import { useRepoStore } from '@/store/useRepoStore'
import { useUiStore } from '@/store/useUiStore'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { DiffResult } from '@/types/git'
import { cn } from '@/lib/cn'

export function DiffViewer() {
  const selectedFile = useUiStore((s) => s.selectedFile)
  const setSelectedFile = useUiStore((s) => s.setSelectedFile)
  const currentRepoPath = useRepoStore((s) => s.currentRepoPath)
  const status = useRepoStore((s) => s.status)
  const stageFiles = useRepoStore((s) => s.stageFiles)
  const unstageFiles = useRepoStore((s) => s.unstageFiles)
  const discardFiles = useRepoStore((s) => s.discardFiles)

  const [diff, setDiff] = useState<DiffResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const fileEntry = status?.files.find((f) => f.path === selectedFile?.path)
  const isUntracked = fileEntry?.index === 'untracked'

  useEffect(() => {
    if (!selectedFile || !currentRepoPath) {
      setDiff(null)
      return
    }
    let cancelled = false
    setLoading(true)
    const load = async () => {
      const result = isUntracked
        ? await window.gitControl.diffUntracked(currentRepoPath, selectedFile.path)
        : await window.gitControl.diff(currentRepoPath, selectedFile.path, selectedFile.staged)
      if (cancelled) return
      setLoading(false)
      if (result.ok) setDiff(result.data)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedFile, currentRepoPath, isUntracked])

  const open = !!selectedFile

  return createPortal(
    <AnimatePresence>
      {open && selectedFile && (
        <motion.div
          className="fixed inset-0 z-40 flex justify-end bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedFile(null)
          }}
        >
          <motion.div
            className="flex h-full w-[720px] max-w-[85vw] flex-col border-l border-border bg-panel shadow-2xl"
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 16, opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-mono text-[13px] text-text">{selectedFile.path}</span>
              <button
                onClick={() => setSelectedFile(null)}
                className="rounded-md p-1 text-text-faint hover:bg-panel-hover hover:text-text"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loading && <p className="py-8 text-center text-[12.5px] text-text-faint">Loading diff…</p>}
              {!loading && diff?.binary && (
                <div className="flex flex-col items-center gap-2 py-10 text-text-faint">
                  <FileWarning className="size-5" />
                  <p className="text-[12.5px]">Binary file not shown.</p>
                </div>
              )}
              {!loading && diff && !diff.binary && diff.hunks.length === 0 && (
                <p className="py-8 text-center text-[12.5px] text-text-faint">No differences to display.</p>
              )}
              {!loading &&
                diff?.hunks.map((hunk, hi) => (
                  <div key={hi} className="mb-4 overflow-hidden rounded-lg border border-border">
                    <div className="border-b border-border bg-bg-elevated px-3 py-1 text-mono text-[11px] text-text-faint">
                      {hunk.header}
                    </div>
                    <div className="text-mono text-[12.5px]">
                      {hunk.lines.map((line, li) => (
                        <div
                          key={li}
                          className={cn(
                            'flex px-3 py-[1px]',
                            line.type === 'add' && 'bg-success-muted',
                            line.type === 'remove' && 'bg-danger-muted',
                          )}
                        >
                          <span className="mr-3 w-9 shrink-0 select-none text-right text-text-faint">
                            {line.oldLine ?? ''}
                          </span>
                          <span className="mr-3 w-9 shrink-0 select-none text-right text-text-faint">
                            {line.newLine ?? ''}
                          </span>
                          <span
                            className={cn(
                              'mr-2 w-3 shrink-0 select-none',
                              line.type === 'add' && 'text-success',
                              line.type === 'remove' && 'text-danger',
                            )}
                          >
                            {line.type === 'add' && <Plus className="size-3" />}
                            {line.type === 'remove' && <Minus className="size-3" />}
                          </span>
                          <span className="whitespace-pre-wrap text-text">{line.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <Button variant="danger" size="md" onClick={() => setConfirmDiscard(true)}>
                Discard
              </Button>
              {selectedFile.staged ? (
                <Button variant="secondary" size="md" onClick={() => unstageFiles([selectedFile.path])}>
                  Unstage File
                </Button>
              ) : (
                <Button variant="primary" size="md" onClick={() => stageFiles([selectedFile.path])}>
                  Stage File
                </Button>
              )}
            </div>
          </motion.div>

          <ConfirmDialog
            open={confirmDiscard}
            onClose={() => setConfirmDiscard(false)}
            onConfirm={() => {
              discardFiles([selectedFile.path])
              setConfirmDiscard(false)
              setSelectedFile(null)
            }}
            title="Discard changes?"
            description={`This will permanently discard local changes to "${selectedFile.path}". This cannot be undone.`}
            confirmLabel="Discard Changes"
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
