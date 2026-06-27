import Link from 'next/link'
import { getVehicles } from '@/lib/actions/vehicles'

const FUEL_LABEL: Record<string, string> = {
  diesel: '디젤', gasoline: '가솔린', electric: '전기', hybrid: '하이브리드',
}

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function expireBadge(date: string | null) {
  if (!date) return null
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  if (days < 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">만료</span>
  if (days <= 15) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">{days}일 남음</span>
  if (days <= 30) return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{days}일 남음</span>
  return null
}

export default async function VehicleListPage() {
  const vehicles = await getVehicles()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">차량 목록</h1>
        <Link
          href="/admin/vehicles/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + 차량 등록
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">등록된 차량이 없습니다.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">차량명</th>
                <th className="px-4 py-3 text-left">번호판</th>
                <th className="px-4 py-3 text-left">연료</th>
                <th className="px-4 py-3 text-right">정원</th>
                <th className="px-4 py-3 text-right">주행거리</th>
                <th className="px-4 py-3 text-left">보험 만기</th>
                <th className="px-4 py-3 text-left">검사 만기</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vehicles.map(v => (
                <tr key={v.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                  <td className="px-4 py-3 text-gray-600">{v.plate}</td>
                  <td className="px-4 py-3 text-gray-600">{v.fuel_type ? FUEL_LABEL[v.fuel_type] : '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{v.capacity ?? '-'}명</td>
                  <td className="px-4 py-3 text-right text-gray-600">{v.current_mileage.toLocaleString()}km</td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600">{formatDate(v.insurance_expire_date)}</span>
                    {' '}{expireBadge(v.insurance_expire_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600">{formatDate(v.next_inspection_date)}</span>
                    {' '}{expireBadge(v.next_inspection_date)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/vehicles/${v.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
