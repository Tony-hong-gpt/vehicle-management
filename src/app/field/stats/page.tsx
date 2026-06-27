import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getStatsPageData,
  getWeeklyMileageStats,
  getMonthlyCostStats,
  getVehicleUsageStats,
  getPartRankingStats,
} from '@/lib/actions/stats'
import StatsCharts from '@/components/field/StatsCharts'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { vehicles, isAdmin } = await getStatsPageData()

  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center">
        <p className="text-gray-400 text-sm">담당 차량이 없습니다.</p>
      </div>
    )
  }

  const vehicleIds = vehicles.map((v) => v.id)
  const vehicleNames = Object.fromEntries(vehicles.map((v) => [v.id, v.name]))

  const [mileageData, costData, usageData, partRanking] = await Promise.all([
    getWeeklyMileageStats(vehicleIds, vehicleNames),
    getMonthlyCostStats(vehicleIds),
    getVehicleUsageStats(vehicleIds),
    getPartRankingStats(vehicleIds),
  ])

  const namesForChart = vehicles.map((v) => v.name)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
        <Link href="/field/status" className="text-xs text-blue-500">← 차량 현황으로</Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-gray-900">통계</h1>
          {isAdmin && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full font-medium">
              전체 차량 {vehicles.length}대
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {isAdmin ? '전체 차량 통계' : `담당 차량 ${vehicles.length}대`}
        </p>
      </div>

      <div className="px-4 mt-4">
        <StatsCharts
          mileageData={mileageData}
          vehicleNames={namesForChart}
          costData={costData}
          usageData={usageData}
          partRanking={partRanking}
        />
      </div>
    </div>
  )
}
