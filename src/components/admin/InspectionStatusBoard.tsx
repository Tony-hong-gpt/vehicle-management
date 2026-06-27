import type { InspectionStatusRow } from '@/lib/actions/admin'

interface Props {
  rows: InspectionStatusRow[]
  weekStart: string
}

export default function InspectionStatusBoard({ rows, weekStart }: Props) {
  const submitted = rows.filter((r) => r.submitted).length
  const total = rows.length

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-500">{weekStart} 주차</span>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
          submitted === total ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {submitted} / {total} 제출
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">차량</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">번호판</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">제출 여부</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">주행거리</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">제출 시각</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.vehicle_id} className={row.submitted ? '' : 'bg-yellow-50'}>
                <td className="px-4 py-3 font-medium text-gray-900">{row.vehicle_name}</td>
                <td className="px-4 py-3 text-gray-500">{row.plate}</td>
                <td className="px-4 py-3 text-center">
                  {row.submitted
                    ? <span className="inline-flex items-center gap-1 text-green-700 font-medium">✅ 완료</span>
                    : <span className="inline-flex items-center gap-1 text-yellow-700 font-medium">⏳ 미제출</span>}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {row.mileage != null ? `${row.mileage.toLocaleString()} km` : '-'}
                </td>
                <td className="px-4 py-3 text-right text-gray-400 text-xs">
                  {row.submitted_at
                    ? new Date(row.submitted_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
