import type { CommitInfo } from '@/types/git'

export interface GraphNode {
  commit: CommitInfo
  row: number
  lane: number
}

export interface GraphEdge {
  fromRow: number
  fromLane: number
  toRow: number
  toLane: number
}

export interface GraphLayout {
  nodes: GraphNode[]
  edges: GraphEdge[]
  laneCount: number
}

/**
 * Assigns a simple lane per commit from a linear, date-descending commit list.
 * Not a full Git graph algorithm — good enough for a restrained, at-a-glance
 * visualization rather than a dense enterprise diagram.
 */
export function layoutGraph(commits: CommitInfo[]): GraphLayout {
  const lanes: (string | null)[] = []
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const hashToNode = new Map<string, GraphNode>()

  function findLaneFor(hash: string): number {
    const idx = lanes.indexOf(hash)
    if (idx !== -1) return idx
    const free = lanes.indexOf(null)
    if (free !== -1) return free
    lanes.push(null)
    return lanes.length - 1
  }

  commits.forEach((commit, row) => {
    const lane = findLaneFor(commit.hash)
    const node: GraphNode = { commit, row, lane }
    nodes.push(node)
    hashToNode.set(commit.hash, node)

    const [firstParent, ...restParents] = commit.parents

    if (firstParent) {
      if (lanes.includes(firstParent) && lanes.indexOf(firstParent) !== lane) {
        // Another lane already awaits this parent — this lane converges into it.
        lanes[lane] = null
      } else {
        lanes[lane] = firstParent
      }
    } else {
      lanes[lane] = null
    }

    for (const parent of restParents) {
      if (lanes.includes(parent)) continue
      const mergeLane = findLaneFor(parent)
      lanes[mergeLane] = parent
    }
  })

  // Second pass: draw edges once child/parent rows are both known.
  for (const node of nodes) {
    for (const parentHash of node.commit.parents) {
      const parentNode = hashToNode.get(parentHash)
      if (!parentNode) continue
      edges.push({ fromRow: node.row, fromLane: node.lane, toRow: parentNode.row, toLane: parentNode.lane })
    }
  }

  return { nodes, edges, laneCount: Math.max(1, lanes.length) }
}

export const LANE_COLORS = [
  '#7c8cff',
  '#4ade80',
  '#f87171',
  '#fbbf24',
  '#38bdf8',
  '#e879f9',
  '#a3e635',
  '#fb923c',
]
