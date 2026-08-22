import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  details?: string[]
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Continue',
  danger = true,
  loading,
  details,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} size="md" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {danger && (
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-warning-muted">
            <AlertTriangle className="size-4 text-warning" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-[13px] leading-relaxed text-text-muted">{description}</p>
          {details && details.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-lg border border-border bg-bg-elevated p-2.5 text-mono text-[12px] text-text-muted">
              {details.map((d) => (
                <li key={d} className="truncate">
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
