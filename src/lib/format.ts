import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns'

export function relativeTime(iso: string): string {
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true })
  } catch {
    return iso
  }
}

export function dayBucket(iso: string): string {
  const date = new Date(iso)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMMM d, yyyy')
}

export function shortPath(fullPath: string, maxSegments = 3): string {
  const parts = fullPath.split(/[\\/]/).filter(Boolean)
  if (parts.length <= maxSegments) return fullPath
  return '…' + parts.slice(-maxSegments).join('\\')
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
