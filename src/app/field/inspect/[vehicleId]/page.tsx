import { notFound } from 'next/navigation'
import { getVehicle } from '@/lib/actions/vehicles'
import { getThisWeekInspection } from '@/lib/actions/inspections'
import WeeklyInspectionForm from '@/components/inspections/WeeklyInspectionForm'

interface Props {
  params: Promise<{ vehicleId: string }>
}

export default async function InspectVehiclePage({ params }: Props) {
  const { vehicleId } = await params

  let vehicle
  try {
    vehicle = await getVehicle(vehicleId)
  } catch {
    notFound()
  }

  const existing = await getThisWeekInspection(vehicleId)

  return (
    <div className="px-4 pt-5 pb-4">
      {/* 헤더 */}
      <div className="mb-5">
        <p className="text-xs text-gray-400 mb-1">주간 점검</p>
        <h1 className="text-xl font-bold text-gray-900">{vehicle.name}</h1>
        <p className="text-sm text-gray-500">{vehicle.plate}</p>
      </div>

      {existing ? (
        /* 이번 주 이미 제출함 */
        <div className="rounded-2xl bg-green-50 border border-green-200 p-5 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="font-semibold text-green-700">이번 주 점검이 완료됐습니다.</p>
          <p className="text-sm text-green-600 mt-1">
            제출일: {new Date(existing.submitted_at).toLocaleDateString('ko-KR')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-left">
            <div className="bg-white rounded-xl p-3 border border-green-100">
              <p className="text-gray-400">주행거리</p>
              <p className="font-medium text-gray-800 mt-0.5">{existing.mileage.toLocaleString()} km</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-green-100">
              <p className="text-gray-400">타이어</p>
              <p className="font-medium text-gray-800 mt-0.5">
                {existing.tire_status === 'normal' ? '정상' : existing.tire_status === 'wear' ? '편마모' : '교체필요'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-green-100">
              <p className="text-gray-400">외관</p>
              <p className={`font-medium mt-0.5 ${existing.exterior_ok ? 'text-gray-800' : 'text-red-600'}`}>
                {existing.exterior_ok ? '정상' : '이상'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-green-100">
              <p className="text-gray-400">등화</p>
              <p className={`font-medium mt-0.5 ${existing.lights_ok ? 'text-gray-800' : 'text-red-600'}`}>
                {existing.lights_ok ? '정상' : '이상'}
              </p>
            </div>
          </div>
          {existing.note && (
            <div className="mt-3 text-left bg-white rounded-xl p-3 border border-green-100">
              <p className="text-xs text-gray-400 mb-1">특이사항</p>
              <p className="text-sm text-gray-700">{existing.note}</p>
            </div>
          )}
        </div>
      ) : (
        /* 점검 폼 */
        <WeeklyInspectionForm
          vehicleId={vehicleId}
          vehicleName={vehicle.name}
          currentMileage={vehicle.current_mileage}
        />
      )}
    </div>
  )
}
