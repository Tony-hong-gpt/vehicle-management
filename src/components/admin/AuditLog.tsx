import type { AuditLogItem } from '@/lib/actions/admin'

export default function AuditLog({ items }: { items: AuditLogItem[] }) {
  if (items.length === 0) {
    return <p className="text-center text-gray-400 py-12 text-sm">변경 이력이 없습니다.</p>
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-medium text-gray-600">변경 시각</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">변경자</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">차량</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">소모품</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">변경 전</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">변경 후</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                {new Date(item.changed_at).toLocaleString('ko-KR', {
                  month: 'numeric', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {item.changer_email ?? item.changed_by?.slice(0, 8) ?? '-'}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">
                {item.vehicle_name ?? '-'}
              </td>
              <td className="px-4 py-3 text-gray-700">{item.part_name ?? '-'}</td>
              <td className="px-4 py-3 text-center text-gray-500 text-xs">
                {item.old_km != null ? `${item.old_km.toLocaleString()} km` : ''}
                {item.old_km != null && item.old_months != null ? ' / ' : ''}
                {item.old_months != null ? `${item.old_months}개월` : ''}
              </td>
              <td className="px-4 py-3 text-center text-blue-600 font-medium text-xs">
                {item.new_km != null ? `${item.new_km.toLocaleString()} km` : ''}
                {item.new_km != null && item.new_months != null ? ' / ' : ''}
                {item.new_months != null ? `${item.new_months}개월` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
