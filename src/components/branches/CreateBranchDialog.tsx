import { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { useRepoStore } from '@/store/useRepoStore'

export function CreateBranchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [checkout, setCheckout] = useState(true)
  const createBranch = useRepoStore((s) => s.createBranch)
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    const ok = await createBranch(name.trim(), checkout)
    setLoading(false)
    if (ok) {
      setName('')
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New branch"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} loading={loading} disabled={!name.trim()}>
            Create Branch
          </Button>
        </>
      }
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        placeholder="feature/my-change"
        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-mono text-[13px] text-text placeholder:text-text-faint focus:border-accent/60 focus:outline-none"
      />
      <label className="mt-3 flex items-center gap-2 text-[12.5px] text-text-muted">
        <input
          type="checkbox"
          checked={checkout}
          onChange={(e) => setCheckout(e.target.checked)}
          className="accent-[var(--color-accent)]"
        />
        Checkout branch after creating
      </label>
    </Modal>
  )
}
