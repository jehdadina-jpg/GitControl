import { motion } from 'framer-motion'

export function ProgressBar({ label, sublabel }: { label: string; sublabel?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <p className="text-[13px] font-medium text-text">{label}</p>
      <div className="h-1 w-56 overflow-hidden rounded-full bg-panel-hover">
        <motion.div
          className="h-full w-1/3 rounded-full bg-accent"
          animate={{ x: ['-100%', '260%'] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
        />
      </div>
      {sublabel && <p className="text-mono text-[11px] text-text-faint">{sublabel}</p>}
    </div>
  )
}
