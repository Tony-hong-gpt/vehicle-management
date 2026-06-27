import { getConsumableDefaultsAdmin } from '@/lib/actions/admin'
import DefaultsForm from '@/components/admin/DefaultsForm'

export default async function DefaultsPage() {
  const defaults = await getConsumableDefaultsAdmin()

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">소모품 알림 기준 기본값</h1>
      <p className="text-sm text-gray-500 mb-2">
        전체 차량에 적용되는 기본 교환 주기와 현장 관리자 조정 가능 하한선을 설정합니다.
      </p>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6">
        ⚠️ 기본값 변경은 커스텀 기준이 없는 모든 차량에 즉시 반영됩니다.
      </p>
      <DefaultsForm defaults={defaults} />
    </div>
  )
}
