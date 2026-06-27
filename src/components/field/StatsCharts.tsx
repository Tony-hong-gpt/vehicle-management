'use client'

import dynamic from 'next/dynamic'
import type { WeeklyMileagePoint, MonthlyCostPoint, VehicleUsagePoint, PartCountPoint } from '@/lib/actions/stats'

const MileageChart    = dynamic(() => import('./MileageChart'),    { ssr: false })
const CostChart       = dynamic(() => import('./CostChart'),       { ssr: false })
const UsageChart      = dynamic(() => import('./UsageChart'),      { ssr: false })
const PartRankingCard = dynamic(() => import('./PartRankingCard'), { ssr: false })

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h2 className="text-sm font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

interface Props {
  mileageData: WeeklyMileagePoint[]
  vehicleNames: string[]
  costData: MonthlyCostPoint[]
  usageData: VehicleUsagePoint[]
  partRanking: PartCountPoint[]
}

export default function StatsCharts({ mileageData, vehicleNames, costData, usageData, partRanking }: Props) {
  return (
    <div className="space-y-4">
      <ChartCard title="📈 주간 주행거리 추이 (최근 12주)">
        <MileageChart data={mileageData} vehicleNames={vehicleNames} />
      </ChartCard>

      <ChartCard title="💰 월별 소모품 교환 비용 (최근 6개월)">
        <CostChart data={costData} />
      </ChartCard>

      <ChartCard title="🚌 차량별 누적 주행거리">
        <UsageChart data={usageData} />
      </ChartCard>

      <ChartCard title="🔧 소모품 교환 횟수 TOP 5">
        <PartRankingCard data={partRanking} />
      </ChartCard>
    </div>
  )
}
