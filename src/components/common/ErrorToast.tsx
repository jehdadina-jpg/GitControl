import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { useRepoStore } from '@/store/useRepoStore'

export function ErrorToast() {
  const message = useRepoStore((s) => s.lastErrorMessage)

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] -translate-x-1/2">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-danger/30 bg-panel px-3.5 py-2.5 shadow-2xl shadow-black/40"
          >
            <AlertCircle className="size-4 shrink-0 text-danger" />
            <span className="max-w-sm text-[12.5px] text-text">{message}</span>
            <button
              onClick={() => useRepoStore.setState({ lastErrorMessage: null })}
              className="rounded p-0.5 text-text-faint hover:text-text"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
