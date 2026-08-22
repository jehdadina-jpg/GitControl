import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'accent'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-panel-hover text-text-muted border-border',
  success: 'bg-success-muted text-success border-success/25',
  danger: 'bg-danger-muted text-danger border-danger/25',
  warning: 'bg-warning-muted text-warning border-warning/25',
  accent: 'bg-accent-muted text-accent border-accent/25',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
