import Link from 'next/link'
import { getVehicleStatuses } from '@/lib/actions/status'
import { getWeeklyInspectionStatus } from '@/lib/actions/admin'
import { getUnreadCount } from '@/lib/actions/notifications'
import { getMondayOfWeek } from '@/lib/utils/date'

export default async function DashboardPage() {
  const [statuses, inspectionRows, unreadCount] = await Promise.all([
    getVehicleStatuses(),
    getWeeklyInspectionStatus(),
    getUnreadCount(),
  ])

  const counts = { green: 0, yellow: 0, red: 0, purple: 0 }
  for (const s of statuses) counts[s.color]++

  const submitted = inspectionRows.filter((r) => r.submitted).length
  const total = inspectionRows.length
  const weekStart = getMondayOfWeek(new Date())

  const unsubmitted = inspectionRows.filter((r) => !r.submitted)

  const SIGNAL_CARDS = [
    { color: 'purple', label: '법정 위반', count: counts.purple, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
    { color: 'red',    label: '경고',      count: counts.red,    bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500' },
    { color: 'yellow', label: '주의',      count: counts.yellow, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-400' },
    { color: 'green',  label: '정상',      count: counts.green,  bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-500' },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">전체 관제판</h1>
        <Link href="/field/notifications" className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-50">
          🔔 알림
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-8">전체 차량 {total}대 실시간 현황</p>

      {/* 신호등 요약 */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">신호등 현황</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SIGNAL_CARDS.map((c) => (
            <div key={c.color} className={`rounded-2xl border p-5 ${c.bg} ${c.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${c.dot}`} />
                <span className={`text-xs font-semibold ${c.text}`}>{c.label}</span>
              </div>
              <p className={`text-3xl font-bold ${c.text}`}>{c.count}</p>
              <p className={`text-xs mt-1 ${c.text} opacity-70`}>대</p>
            </div>
          ))}
        </div>
      </section>

      {/* 주간 점검 요약 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">주간 점검 제출 현황</h2>
          <Link href="/admin/inspections" className="text-xs text-blue-500 hover:underline">전체 보기 →</Link>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{submitted}</p>
              <p className="text-xs text-gray-400 mt-1">제출 완료</p>
            </div>
            <div className="text-2xl text-gray-300">/</div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-300">{total}</p>
              <p className="text-xs text-gray-400 mt-1">전체 차량</p>
            </div>
            <div className="flex-1 ml-4">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all"
                  style={{ width: total > 0 ? `${(submitted / total) * 100}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{weekStart} 주차</p>
            </div>
          </div>

          {unsubmitted.length > 0 && (
            <div>
              <p className="text-xs text-yellow-700 font-medium mb-2">⏳ 미제출 차량</p>
              <div className="flex flex-wrap gap-2">
                {unsubmitted.map((r) => (
                  <span key={r.vehicle_id} className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-2.5 py-1 rounded-full">
                    {r.vehicle_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 빠른 링크 */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">빠른 이동</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { href: '/field/status',      icon: '🚦', label: '차량 현황 카드뷰' },
            { href: '/field/calendar',    icon: '📅', label: '법정 만기 캘린더' },
            { href: '/field/stats',       icon: '📊', label: '통계' },
            { href: '/admin/vehicles',    icon: '🚌', label: '차량 관리' },
            { href: '/admin/defaults',    icon: '⚙️', label: '알림 기준 기본값' },
            { href: '/admin/audit',       icon: '🔍', label: '변경 감사 로그' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm font-medium text-gray-700"
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
