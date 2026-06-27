import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getVehicles } from '@/lib/actions/vehicles'
import { getMondayOfWeek } from '@/lib/utils/date'

export default async function InspectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const vehicles = await getVehicles()
  const weekStart = getMondayOfWeek(new Date())

  // 이번 주 제출 현황 조회
  const { data: submitted } = await supabase
    .from('weekly_inspections')
    .select('vehicle_id')
    .eq('week_start', weekStart)

  const submittedIds = new Set((submitted ?? []).map((r: { vehicle_id: string }) => r.vehicle_id))

  // 담당 차량 필터 (field 유저는 assigned, admin은 전체)
  const role = (user?.user_metadata?.role as string) ?? 'field'
  const userId = user?.id
  const filteredVehicles = role === 'admin'
    ? vehicles
    : vehicles.filter((v) => v.assigned_field_user_id === userId)

  const displayVehicles = filteredVehicles.length > 0 ? filteredVehicles : vehicles

  return (
    <div className="px-4 pt-5">
      <p className="text-xs text-gray-400 mb-1">주간 점검</p>
      <h1 className="text-xl font-bold text-gray-900 mb-1">차량 선택</h1>
      <p className="text-sm text-gray-500 mb-5">
        점검할 차량을 선택하거나 QR을 스캔하세요.
      </p>

      <div className="space-y-3">
        {displayVehicles.map((v) => {
          const done = submittedIds.has(v.id)
          return (
            <Link
              key={v.id}
              href={`/field/inspect/${v.id}`}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                done
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:border-blue-300 active:bg-blue-50'
              }`}
            >
              <div>
                <p className="font-semibold text-gray-900">{v.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{v.plate}</p>
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                done
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {done ? '완료 ✅' : '미제출'}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Link
          href="/field/scan"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium min-h-[48px]"
        >
          📷 QR 스캔으로 바로 시작
        </Link>
        <Link
          href="/field/thresholds"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium min-h-[48px]"
        >
          ⚙️ 알림 기준 설정
        </Link>
      </div>
    </div>
  )
}
