import { getWeeklyInspectionStatus } from '@/lib/actions/admin'
import { getMondayOfWeek } from '@/lib/utils/date'
import InspectionStatusBoard from '@/components/admin/InspectionStatusBoard'

export default async function InspectionsPage() {
  const rows = await getWeeklyInspectionStatus()
  const weekStart = getMondayOfWeek(new Date())
  const submitted = rows.filter((r) => r.submitted).length

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">주간 점검 현황</h1>
      <p className="text-sm text-gray-500 mb-6">
        이번 주 제출 현황 — {submitted}/{rows.length}대 완료
      </p>
      <InspectionStatusBoard rows={rows} weekStart={weekStart} />
    </div>
  )
}
