import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getVehicle } from '@/lib/actions/vehicles'
import QRCodeDisplay from '@/components/vehicles/QRCodeDisplay'
import DeleteVehicleButton from '@/components/vehicles/DeleteVehicleButton'

const FUEL_LABEL: Record<string, string> = {
  diesel: '디젤', gasoline: '가솔린', electric: '전기', hybrid: '하이브리드',
}

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex py-3 border-b border-gray-50 last:border-0">
      <dt className="w-40 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 font-medium">{value ?? '-'}</dd>
    </div>
  )
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vehicle = await getVehicle(id).catch(() => null)
  if (!vehicle) notFound()

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/admin/vehicles" className="text-xs text-gray-400 hover:text-gray-600 mb-1 block">← 목록으로</Link>
          <h1 className="text-xl font-bold text-gray-900">{vehicle.name}</h1>
          <p className="text-sm text-gray-500">{vehicle.plate}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/vehicles/${id}/edit`}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            수정
          </Link>
          <DeleteVehicleButton id={id} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* 차량 정보 */}
        <div className="col-span-2 space-y-5">
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">기본 정보</h2>
            <dl>
              <Row label="연료" value={vehicle.fuel_type ? FUEL_LABEL[vehicle.fuel_type] : '-'} />
              <Row label="연식" value={vehicle.year ? `${vehicle.year}년` : '-'} />
              <Row label="정원" value={vehicle.capacity ? `${vehicle.capacity}명` : '-'} />
              <Row label="현재 주행거리" value={`${vehicle.current_mileage.toLocaleString()} km`} />
              <Row label="차대번호" value={vehicle.vin} />
              <Row label="주 운행 시간대" value={vehicle.primary_operation_time} />
            </dl>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">보험</h2>
            <dl>
              <Row label="보험사" value={vehicle.insurance_company} />
              <Row label="증권번호" value={vehicle.insurance_policy_no} />
              <Row label="보험 만기일" value={formatDate(vehicle.insurance_expire_date)} />
            </dl>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">법정 항목</h2>
            <dl>
              <Row label="최근 정기검사일" value={formatDate(vehicle.last_inspection_date)} />
              <Row label="다음 정기검사일" value={formatDate(vehicle.next_inspection_date)} />
              <Row label="최근 자동차세 납부일" value={formatDate(vehicle.last_tax_paid_date)} />
            </dl>
          </section>
        </div>

        {/* QR 코드 */}
        <div className="col-span-1">
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">QR 코드</h2>
            <QRCodeDisplay vehicleId={vehicle.id} vehicleName={vehicle.name} />
          </section>
        </div>
      </div>
    </div>
  )
}
