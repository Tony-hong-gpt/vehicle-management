import type { TrafficColor } from '@/lib/actions/status'

const CONFIG: Record<TrafficColor, { bg: string; border: string; text: string; label: string; dot: string }> = {
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  label: '정상',    dot: 'bg-green-500' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: '주의',    dot: 'bg-yellow-400' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    label: '경고',    dot: 'bg-red-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', label: '법정위반', dot: 'bg-purple-500' },
}

export default function TrafficLight({ color, size = 'md' }: { color: TrafficColor; size?: 'sm' | 'md' }) {
  const c = CONFIG[color]
  const dotSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${c.bg} ${c.border} ${c.text}`}>
      <span className={`rounded-full inline-block ${dotSize} ${c.dot}`} />
      {c.label}
    </span>
  )
}
