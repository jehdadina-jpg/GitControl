import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, ChevronDown } from 'lucide-react'
import { useRepoStore } from '@/store/useRepoStore'
import { useUiStore } from '@/store/useUiStore'
import { cn } from '@/lib/cn'

export function TerminalDrawer() {
  const terminalOpen = useUiStore((s) => s.terminalOpen)
  const setTerminalOpen = useUiStore((s) => s.setTerminalOpen)
  const commandLog = useRepoStore((s) => s.commandLog)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalOpen) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    }
  }, [commandLog, terminalOpen])

  return (
    <div className="shrink-0 border-t border-border bg-bg-elevated">
      <button
        onClick={() => setTerminalOpen(!terminalOpen)}
        className="flex w-full items-center gap-2 px-4 py-1.5 text-[11px] font-medium text-text-faint hover:text-text-muted"
      >
        <Terminal className="size-3.5" />
        COMMAND OUTPUT
        {commandLog.length > 0 && <span className="text-text-faint">({commandLog.length})</span>}
        <ChevronDown className={cn('ml-auto size-3.5 transition-transform', terminalOpen && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {terminalOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 220 }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border"
          >
            <div ref={scrollRef} className="h-[220px] overflow-y-auto px-4 py-2 text-mono text-[12px]">
              {commandLog.length === 0 && <p className="text-text-faint">No commands run yet.</p>}
              {commandLog.map((entry) => (
                <div key={entry.id} className="mb-2.5">
                  <div className="flex items-center gap-2 text-text-muted">
                    <span className="text-accent">$</span>
                    <span>
                      {entry.command} {entry.args.join(' ')}
                    </span>
                    {entry.ok === true && <span className="text-success">✓</span>}
                    {entry.ok === false && <span className="text-danger">✗ ({entry.exitCode})</span>}
                  </div>
                  {entry.stdout && (
                    <pre className="whitespace-pre-wrap pl-4 text-text-muted">{entry.stdout.trim().slice(0, 4000)}</pre>
                  )}
                  {entry.stderr && entry.ok === false && (
                    <pre className="whitespace-pre-wrap pl-4 text-danger/80">{entry.stderr.trim().slice(0, 4000)}</pre>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
