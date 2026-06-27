import { getAuditLog } from '@/lib/actions/admin'
import AuditLog from '@/components/admin/AuditLog'

export default async function AuditPage() {
  const items = await getAuditLog(100)

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">알림 기준 변경 감사 로그</h1>
      <p className="text-sm text-gray-500 mb-6">
        현장 관리자의 소모품 알림 기준 변경 이력 (최근 100건)
      </p>
      <AuditLog items={items} />
    </div>
  )
}
