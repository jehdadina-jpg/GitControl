import { useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { useUiStore } from '@/store/useUiStore'
import { useRepoStore } from '@/store/useRepoStore'

export function CloneDialog() {
  const open = useUiStore((s) => s.cloneDialogOpen)
  const setOpen = useUiStore((s) => s.setCloneDialogOpen)
  const setActiveView = useUiStore((s) => s.setActiveView)
  const selectRepo = useRepoStore((s) => s.selectRepo)

  const [url, setUrl] = useState('')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const repoNameFromUrl = url.trim().replace(/\.git$/, '').split(/[/\\]/).filter(Boolean).pop() ?? ''
  const fullDestination = destination && repoNameFromUrl ? `${destination}\\${repoNameFromUrl}` : ''

  async function pickDestination() {
    const folder = await window.gitControl.selectCloneDestination()
    if (folder) setDestination(folder)
  }

  async function handleClone() {
    if (!url.trim() || !fullDestination) return
    setLoading(true)
    setError(null)
    const result = await window.gitControl.cloneRepository(url.trim(), fullDestination)
    setLoading(false)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setOpen(false)
    setUrl('')
    setDestination('')
    await selectRepo(result.data)
    setActiveView('dashboard')
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Clone Repository" width="max-w-lg">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-faint">REPOSITORY URL</label>
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/user/repository.git"
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-mono text-[12.5px] text-text placeholder:text-text-faint focus:border-accent/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-faint">CLONE INTO</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={fullDestination}
              placeholder="Choose a destination folder"
              className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-mono text-[12.5px] text-text placeholder:text-text-faint"
            />
            <Button variant="secondary" icon={<FolderOpen className="size-3.5" />} onClick={pickDestination}>
              Browse
            </Button>
          </div>
        </div>

        {error && <p className="text-[12px] text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleClone} loading={loading} disabled={!url.trim() || !fullDestination}>
            Clone
          </Button>
        </div>
      </div>
    </Modal>
  )
}
