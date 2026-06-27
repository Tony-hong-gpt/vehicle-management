import Link from 'next/link'
import TrafficLight from './TrafficLight'
import type { VehicleStatusResult, ConsumableStatus } from '@/lib/actions/status'

const GAUGE_COLOR: Record<ConsumableStatus['level'], string> = {
  ok:       'bg-green-400',
  warn:     'bg-yellow-400',
  critical: 'bg-red-500',
}

function ConsumableGauge({ c }: { c: ConsumableStatus }) {
  const pct = Math.min(c.pct, 100)
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-gray-500 w-24 shrink-0 truncate">{c.part_name}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${GAUGE_COLOR[c.level]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-medium w-10 text-right ${
        c.level === 'critical' ? 'text-red-600' : c.level === 'warn' ? 'text-yellow-600' : 'text-gray-400'
      }`}>
        {c.pct}%
      </span>
    </div>
  )
}

export default function VehicleStatusCard({ result }: { result: VehicleStatusResult }) {
  const { vehicle, color, reasons, consumables, legals, weekSubmitted } = result

  // 게이지 보여줄 소모품만 (이력 있거나 warn/critical)
  const visibleConsumables = consumables.filter((c) => c.level !== 'ok' || c.last_service_date !== null)
  const topConsumables = visibleConsumables.slice(0, 5)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-900">{vehicle.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{vehicle.plate} · {vehicle.current_mileage.toLocaleString()} km</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <TrafficLight color={color} />
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            weekSubmitted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {weekSubmitted ? '주간점검 완료' : '주간점검 미제출'}
          </span>
        </div>
      </div>

      {/* 이유 태그 */}
      {reasons.length > 0 && reasons[0] !== '정상' && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {reasons.slice(0, 3).map((r, i) => (
            <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">{r}</span>
          ))}
        </div>
      )}

      {/* 소모품 게이지 */}
      {topConsumables.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 mb-2 font-medium">소모품 현황</p>
          {topConsumables.map((c) => <ConsumableGauge key={c.part_name} c={c} />)}
        </div>
      )}

      {/* 법정 만기 */}
      {legals.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          {legals.map((l) => (
            <span key={l.doc_type} className={`text-xs px-2 py-1 rounded-lg font-medium ${
              l.level === 'overdue' ? 'bg-purple-100 text-purple-700' :
              l.level === 'critical' ? 'bg-red-100 text-red-700' :
              l.level === 'warn'     ? 'bg-yellow-100 text-yellow-700' :
                                       'bg-gray-100 text-gray-500'
            }`}>
              {l.doc_type} {l.days_left !== null ? (l.days_left < 0 ? `${Math.abs(l.days_left)}일 경과` : `D-${l.days_left}`) : ''}
            </span>
          ))}
        </div>
      )}

      {/* 이력 보기 링크 */}
      <div className="border-t border-gray-50 px-4 py-2.5">
        <Link href={`/field/history/${vehicle.id}`} className="text-xs text-blue-500 font-medium">
          정비 이력 보기 →
        </Link>
      </div>
    </div>
  )
}
