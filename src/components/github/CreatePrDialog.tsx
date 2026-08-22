import { useEffect, useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { useRepoStore } from '@/store/useRepoStore'

export function CreatePrDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const branches = useRepoStore((s) => s.branches)
  const status = useRepoStore((s) => s.status)
  const createPr = useRepoStore((s) => s.createPr)
  const loading = useRepoStore((s) => s.loading.pr)

  const [base, setBase] = useState('main')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    if (open) {
      setBase(branches?.local.find((b) => b.name === 'main' || b.name === 'master')?.name ?? branches?.local[0]?.name ?? 'main')
      setTitle('')
      setBody('')
    }
  }, [open, branches])

  const head = status?.branch ?? ''

  async function handleCreate() {
    if (!title.trim() || !head) return
    const pr = await createPr({ base, head, title: title.trim(), body })
    if (pr) onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Create pull request" width="max-w-lg">
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-mono text-[12.5px]">
          <span className="text-text-faint">base</span>
          <select value={base} onChange={(e) => setBase(e.target.value)} className="flex-1 bg-transparent text-text focus:outline-none">
            {branches?.local.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          <span className="text-text-faint">← compare</span>
          <span className="text-accent">{head}</span>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-faint">TITLE</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add payment integration"
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text placeholder:text-text-faint focus:border-accent/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-faint">DESCRIPTION</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Describe the changes…"
            className="w-full resize-none rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text placeholder:text-text-faint focus:border-accent/60 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} loading={loading} disabled={!title.trim()}>
            Create Pull Request
          </Button>
        </div>
      </div>
    </Modal>
  )
}
