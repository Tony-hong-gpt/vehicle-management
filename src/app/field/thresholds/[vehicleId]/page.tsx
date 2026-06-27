import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getThresholdsForVehicle } from '@/lib/actions/thresholds'
import ThresholdForm from '@/components/thresholds/ThresholdForm'
import type { VehicleRow } from '@/types/database'

interface Props {
  params: Promise<{ vehicleId: string }>
}

export default async function VehicleThresholdsPage({ params }: Props) {
  const { vehicleId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = user.user_metadata?.role as string | undefined

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single()

  if (!vehicle) notFound()
  const v = vehicle as unknown as VehicleRow

  const thresholds = await getThresholdsForVehicle(vehicleId)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
        <Link href="/field/thresholds" className="text-xs text-blue-500">← 차량 목록으로</Link>
        <h1 className="text-lg font-bold text-gray-900 mt-1">{v.name} — 알림 기준</h1>
        <p className="text-xs text-gray-400">{v.plate} · 현재 {v.current_mileage?.toLocaleString() ?? 0} km</p>
      </div>

      <div className="px-4 mt-4">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 leading-relaxed">
          <strong>안내</strong>: 기본값의 50% 미만으로 설정할 수 없습니다.
          기본값과 동일하게 입력하면 커스텀이 삭제되고 기본값으로 복귀합니다.
        </div>
        <ThresholdForm
          vehicleId={vehicleId}
          thresholds={thresholds}
          isAdmin={role === 'admin'}
        />
      </div>
    </div>
  )
}
