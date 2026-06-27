import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getVehicleStatuses } from '@/lib/actions/status'
import VehicleStatusCard from '@/components/field/VehicleStatusCard'

export default async function StatusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const statuses = await getVehicleStatuses()

  const counts = { green: 0, yellow: 0, red: 0, purple: 0 }
  for (const s of statuses) counts[s.color]++

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">차량 현황</h1>
            <p className="text-sm text-gray-500 mt-1">전체 {statuses.length}대</p>
          </div>
          <div className="flex gap-2">
            <Link href="/field/stats" className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5">
              📊 통계
            </Link>
            <Link href="/field/calendar" className="text-xs text-blue-500 border border-blue-200 rounded-lg px-3 py-1.5">
              📅 만기 캘린더
            </Link>
          </div>
        </div>

        {/* 요약 배지 */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {counts.purple > 0 && <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">🟣 법정위반 {counts.purple}</span>}
          {counts.red    > 0 && <span className="text-xs bg-red-100    text-red-700    px-2.5 py-1 rounded-full font-medium">🔴 경고 {counts.red}</span>}
          {counts.yellow > 0 && <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">🟡 주의 {counts.yellow}</span>}
          {counts.green  > 0 && <span className="text-xs bg-green-100  text-green-700  px-2.5 py-1 rounded-full font-medium">🟢 정상 {counts.green}</span>}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {statuses.length === 0 && (
          <p className="text-center text-gray-400 mt-12 text-sm">담당 차량이 없습니다.</p>
        )}
        {statuses.map((s) => (
          <VehicleStatusCard key={s.vehicle.id} result={s} />
        ))}
      </div>
    </div>
  )
}
