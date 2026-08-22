import { useMemo } from 'react'
import type { CommitInfo } from '@/types/git'
import { layoutGraph, LANE_COLORS } from '@/lib/graphLayout'
import { useUiStore } from '@/store/useUiStore'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

const ROW_HEIGHT = 30
const LANE_WIDTH = 16
const LANE_X_OFFSET = 14

export function CommitGraph({ commits, limit = 12 }: { commits: CommitInfo[]; limit?: number }) {
  const visible = commits.slice(0, limit)
  const layout = useMemo(() => layoutGraph(visible), [visible])
  const setSelectedCommitHash = useUiStore((s) => s.setSelectedCommitHash)
  const selectedCommitHash = useUiStore((s) => s.selectedCommitHash)

  const width = LANE_X_OFFSET + layout.laneCount * LANE_WIDTH + 8
  const height = visible.length * ROW_HEIGHT

  if (visible.length === 0) {
    return <p className="py-8 text-center text-[12.5px] text-text-faint">No commits yet.</p>
  }

  return (
    <div className="flex gap-3">
      <svg width={width} height={height} className="shrink-0">
        {layout.edges.map((edge, i) => {
          const x1 = LANE_X_OFFSET + edge.fromLane * LANE_WIDTH
          const y1 = edge.fromRow * ROW_HEIGHT + ROW_HEIGHT / 2
          const x2 = LANE_X_OFFSET + edge.toLane * LANE_WIDTH
          const y2 = edge.toRow * ROW_HEIGHT + ROW_HEIGHT / 2
          const color = LANE_COLORS[edge.fromLane % LANE_COLORS.length]
          if (x1 === x2) {
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} opacity={0.55} />
          }
          const midY = (y1 + y2) / 2
          const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
          return <path key={i} d={path} fill="none" stroke={color} strokeWidth={1.5} opacity={0.55} />
        })}
        {layout.nodes.map((node) => {
          const x = LANE_X_OFFSET + node.lane * LANE_WIDTH
          const y = node.row * ROW_HEIGHT + ROW_HEIGHT / 2
          const color = LANE_COLORS[node.lane % LANE_COLORS.length]
          const isHead = node.commit.refs.some((r) => r.includes('HEAD'))
          return (
            <g key={node.commit.hash}>
              <circle cx={x} cy={y} r={isHead ? 4.5 : 3.5} fill={color} stroke="var(--color-bg)" strokeWidth={2} />
            </g>
          )
        })}
      </svg>

      <div className="min-w-0 flex-1">
        {visible.map((commit) => (
          <button
            key={commit.hash}
            onClick={() => setSelectedCommitHash(commit.hash)}
            style={{ height: ROW_HEIGHT }}
            className={cn(
              'flex w-full min-w-0 items-center gap-2 rounded-md px-2 text-left transition-colors',
              selectedCommitHash === commit.hash ? 'bg-panel-hover' : 'hover:bg-panel-hover/60',
            )}
          >
            <span className="truncate text-[12.5px] text-text">{commit.subject}</span>
            <span className="ml-auto shrink-0 text-mono text-[11px] text-text-faint">{commit.shortHash}</span>
            <span className="shrink-0 text-[11px] text-text-faint">{relativeTime(commit.date)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
