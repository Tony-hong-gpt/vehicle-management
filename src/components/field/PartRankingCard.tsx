import type { PartCountPoint } from '@/lib/actions/stats'

const RANK_COLORS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

export default function PartRankingCard({ data }: { data: PartCountPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">교환 이력이 없습니다.</p>
  }

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={item.part_name} className="flex items-center gap-3 py-2">
          <span className="text-lg leading-none w-6 text-center">{RANK_COLORS[i]}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{item.part_name}</p>
            {item.total_cost > 0 && (
              <p className="text-xs text-gray-400">{item.total_cost.toLocaleString()}원</p>
            )}
          </div>
          <span className="text-sm font-bold text-blue-600">{item.count}회</span>
        </div>
      ))}
    </div>
  )
}
